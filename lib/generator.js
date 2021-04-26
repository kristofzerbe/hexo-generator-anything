'use strict';

const _       = require('lodash');
const S       = require('string');
const moment  = require('moment');
const path    = require('path');
const fs      = require('hexo-fs');
const front   = require('hexo-front-matter');
const log     = require('hexo-log')({ debug: false, silent: false });

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
     * @class
     * @classdesc group of posts sorted according to a single front matter variable
     *
     * @constructor
     * @param {String} index
     * @param {String} path
     */
    Anything = function(index, path) {
      this.index = index;
      this.path = path;
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
      if (!_.has(post, that.index)) {
        return;
      }
      // deal with indexes containing multiple values (like tags)
      let values = _.flatten([post[that.index]])
      _.each(values, function(value) {
        value = S(value).slugify().s;
        that.posts[value] = that.posts[value] || [];
        that.posts[value].push(post);
      })
    }

    /**
     * getPath
     * Return a path with or without asset folder
     *
     * @param {String} key the name of this index
     * @return String
     */
    Anything.prototype.getPath = function(key) {
      // if `post_asset_folder` is set, place pages in folders

      let root = S(this.path).slugify().s;

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
     * @param {*} key
     */
    Anything.prototype.getMarkdownData = function(key) {
      let that = this;
      let data;

      const mdSource = path.join(config.source_dir, "_anything", that.index, key + ".md");

      // try to get markdown file for key from /source/_anything/<index>/<key>.md
      if (fs.existsSync(mdSource)) {
        const md = fs.readFileSync(mdSource);
        data = front.parse(md);
        data.content = hexo.render.renderSync({ text: data._content, engine: 'markdown' });
      }

      return data;
    }

    /**
     * getIndexPage
     * Generates the the html page, which would list each of the pages created by
     * this instance. so the list page for an 'authors' index, would list the
     * authors, with links to pages listing their respective articles
     *
     * @return Array
     */
    Anything.prototype.getIndexPage = function() {
      let that = this;

      // map all belonging posts to this index page as 'Posts'
      let ret = _.map(_.keys(that.posts), function(key) {

        let data = {
          key: key,
          path: that.getPath(key),
          date: moment(),
          count: _.size(that.posts[key]),
          content: ""
        };

        // get Markdown data for key
        data = Object.assign(data, that.getMarkdownData(key));

        // if there was no markdown file with a title in the Frontmatter, set title from key
        if (!data.title) data.title = S(key).humanize().titleCase().s;

        log.debug(data.key + " | " + data.path + " | " + data.title + " | " + data.count);

        return data;
      })
      return ret;
    }

    /**
     * getPages
     * return an array of page objects representing
     *   - one index page, containing links to all of keys of this index
     *   - a posts page for each of the keys, belonging to this index
     *
     * @return Array
     */
    Anything.prototype.getPages = function() {
      let that = this;

      log.info("Anything: Processing '" + that.index.toUpperCase() + "'");

      // add index page; filename (path) is going to be 'index'
      that.posts.index = that.getIndexPage();

      let commonIndex = {
        name: that.index,
        caption: "" // will be title of index
      }

      let ret = _.map(that.posts, function(posts, key) {

        let page = {
          data: {
            index: {},
            key: {
              name: key,
              caption: S(key).humanize().titleCase().s
            },
            date: moment(),
            posts: _(posts)
          },
          path: that.getPath(key)
        };

        if (key === 'index') {
          page.layout = config.anything.layout_index || 'index';

          // get Markdown data for index page
          page.data = Object.assign(page.data, that.getMarkdownData(key));

          // if there was no 'index' markdown file with a title in the Frontmatter, set title from key
          if (!page.data.title) page.data.title = S(that.index).humanize().titleCase().s;

          commonIndex.caption = page.data.title;

        } else {
          page.layout = config.anything.layout_posts || 'index';

          // overwrite data with data from index page to get all Frontmatter data
          let indexData = _.find(that.posts.index, function(i) { return i.key === key; });
          page.data = Object.assign(page.data, indexData);

          // reset key attribute
          page.data.key = {
            name: key,
            caption: indexData.title,
          }
        }

        return page;
      })

      // set data.index for all pages
      _.each(ret, function(r) {
        r.data.index = commonIndex;
        log.debug(r.data);
      });

      return ret;
    }

    let indexes = [];

    // create index instances according to config
    _.each(config.anything.index_mappings, function(mapping) {
      indexes.push(new Anything(mapping.variable, mapping.path));
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