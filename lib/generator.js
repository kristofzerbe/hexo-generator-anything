/** hexo-generator-anything v2.0.0 */

'use strict';

const _       = require('lodash');
const moment  = require('moment');
const path    = require('path');
const fs      = require('hexo-fs');
const front   = require('hexo-front-matter');
const log     = require('hexo-log')({ debug: false, silent: false });
const utils   = require('hexo-util');
const human   = require('humanize-string');
const { magenta } = require("chalk");

module.exports = function(locals) {

    var hexo = this;
    var config = hexo.config;

    let Anything

    /**
     * Index Constructor
     * An index is a group of posts sorted according to the value of a single front
     * matter variable. For example, if you add an `author` variable to all your
     * posts, then an `author` index contains all posts with that variable, grouped
     * according to the value of the `author` variable.
     * 
     * A 'mapping' object in the config has to have at least:
     * - variable = name of the Frontmatter attribute to use
     * - path = name of the folder the pages are rendered to
     * 
     * Optional attributes of the object:
     * - skip_main = supressing the generation of the main index
     * - layout.main = alternative layout for main index
     * - layout.posts = alternative layout for posts index
     *
     * @class
     * @classdesc group of posts sorted according to a single Frontmatter variable
     *
     * @constructor
     * @param {Object} mapping
     */
    Anything = function(mapping) {
      this.mapping = mapping;
      this.posts = {};
    }

    /**
     * push
     * add a post to this index. Only posts with this index set will be added,
     * others will be discarded
     *
     * @param {hexoPost} post - a post as created by hexo generator
     */
    Anything.prototype.push = function(post) {
      let that = this;

      // discard posts where the index is not set
      if (!_.has(post, that.mapping.variable)) {
        return;
      }
      // deal with indexes containing multiple values (like tags)
      let values = _.flatten([post[that.mapping.variable]])
      _.each(values, function(value) {
        value = utils.slugize(value);
        that.posts[value] = that.posts[value] || [];
        that.posts[value].push(post);
      })
    }

    /**
     * getPath
     * Return a path with or without asset folder
     *
     * @param {String} key name of this index (value of post variable or 'index')
     * @return String
     */
    Anything.prototype.getPath = function(key) {
      // if `post_asset_folder` is set, place pages in folders

      let root = (this.mapping.skip_main) ? "" : utils.slugize(this.mapping.path);

      if (config.post_asset_folder && key !== "index") {
        return path.join(root, key, 'index.html').replace(/\\/g,"/");
      } else {
        // otherwise make the file name match the index name
        return path.join(root, key + '.html').replace(/\\/g,"/");
      }
    }

    /**
     * getMarkdownData
     * Gets the linked Markdown file and return data and content
     *
     * @param {*} key name of this index (value of post variable)
     */
    Anything.prototype.getMarkdownData = function(key) {
      let that = this;
      let data;

      const mdSource = path.join(
        config.source_dir, "_anything",
        that.mapping.variable.toLowerCase(), 
        key.toLowerCase() + ".md");

      // try to get markdown file for key from /source/_anything/<index>/<key>.md
      if (fs.existsSync(mdSource)) {
        const md = fs.readFileSync(mdSource);
        data = front.parse(md);
        data.content = hexo.render.renderSync({ text: data._content, engine: 'markdown' });
      }

      return data;
    }

    /**
     * getPostsIndex
     * Get all post index data, belonging to this index mapping
     *
     * @return Array
     */
    Anything.prototype.getPostsIndex = function() {
      let that = this;

      // map all belonging posts to this index page as 'Posts' by variable value
      let ret = _.map(_.keys(that.posts), function(key) {

        let data = {
          key: key,
          path: that.getPath(key.toLowerCase()),
          date: moment(),
          count: _.size(that.posts[key]),
          content: ""
        };

        // get Markdown data for post index
        data = Object.assign(data, that.getMarkdownData(key));

        // if there was no markdown file with a title in the Frontmatter, set title from key
        if (!data.title) data.title = _.startCase(human(key));

        return data;
      })

      return ret;
    }

    /**
     * getPages
     * return an array of page objects representing
     *   - one main index page, containing links to all of keys of this index mapping
     *   - posts index pages for all keys, belonging to this index mapping
     *
     * @return Array
     */
    Anything.prototype.getPages = function() {
      let that = this;

      log.info("Generating Anything Page " + magenta(that.mapping.variable.toUpperCase()));

      // add posts index; filename (path) is going to be 'index'
      that.posts.index = that.getPostsIndex();

      let commonIndex = {
        name: that.mapping.variable,
        caption: "" // will be title of index
      }

      let ret = _.map(that.posts, function(posts, key) {

        let page = {
          data: {
            index: {},
            key: {
              name: key,
              caption: _.startCase(human(key))
            },
            date: moment(),
            posts: _(posts)
          },
          path: that.getPath(key.toLowerCase())
        };

        if (key === 'index') {
          page.layout = that.mapping.layout?.main || config.anything.defaults.layout.main || 'index';

          // get Markdown data for main index
          page.data = Object.assign(page.data, that.getMarkdownData(key));

          // if there was no 'index' markdown file with a title in the Frontmatter, set title from key
          if (!page.data.title) page.data.title = _.startCase(human(that.mapping.variable));

          commonIndex.caption = page.data.title;

        } else {
          page.layout = that.mapping.layout?.posts || config.anything.defaults.layout.posts || 'index';
         
          // merge data with data from posts index to get all Frontmatter data
          let postsIndexData = _.find(that.posts.index, function(i) { return i.key === key; });
          page.data = Object.assign(page.data, postsIndexData);

          // set key attribute
          page.data.key = {
            name: key,
            caption: postsIndexData.title,
          }
        }

        if (key === 'index' && that.mapping.skip_main) {
          page = null;
        }

        return page;
      });

      // filter out empty pages
      ret = ret.filter(page => page != null);

      // set data.index for all pages
      _.each(ret, function(r) {
        r.data.index = commonIndex;
      });

      return ret;
    }

    let indexes = [];

    // create index instances according to config
    _.each(config.anything.index_mappings, function(mapping) {
      indexes.push(new Anything(mapping));
    })

    var posts = locals.posts.sort(config.index_generator.order_by);

    // push each post to each index
    _.each(posts.data, function(post) {
      _.each(indexes, function(index) {
        index.push(post);
      })
    })

    // hexo generator expects an array of posts
    return _.flatten(_.map(indexes, function(index) {
      return index.getPages();
    }))

};