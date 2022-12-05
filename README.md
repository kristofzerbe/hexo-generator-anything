[![GitHub package.json version](https://img.shields.io/github/package-json/v/kristofzerbe/hexo-generator-anything?label=version&style=flat-square)](https://github.com/kristofzerbe/hexo-generator-anything/blob/main/package.json)
[![issues](https://img.shields.io/github/issues/kristofzerbe/hexo-generator-anything?label=github%20issues&style=flat-square)](https://github.com/kristofzerbe/hexo-generator-anything/issues)
[![npm](https://img.shields.io/npm/dm/hexo-generator-anything?label=npm%20downloads&style=flat-square)](https://www.npmjs.com/package/hexo-generator-anything)

# hexo-generator-anything

**Hexo plugin to generate index pages from custom front matter variables.**

> :information_source: This project is a fork from [hexo-index-anything](https://github.com/leviwheatcroft/hexo-index-anything) by Levi Wheatcroft, who is no longer maintaining the project. I have refactored the code and introduced some new features ... see below.

## Introduction

Suppose you have an **author** variable in your front matter, this plugin will generate an **overview page** of all authors (called INDEX) and for each author, a listing page with all posts by that author (POSTS).

You can define multiple indexes to be created, by configuring several ``index-mappings`` out of your Frontmatter variables (see Configuration).

### Example

The Frontmatter data of the following two posts...

**../source/_posts/post-1.md**
``` md 
---
title: First Post
author: Maria
---
```

**../source/_posts/post-2.md**

``` md
---
title: Second Post
author: Jonas
---
```

**../source/_posts/post-3.md**

``` md
---
title: Third Post
author: Jonas
---
```

... will lead to:
- ``../output/author/index.html``  
INDEX file with a link list of all authors

- ``../output/author/maria.html``  
POSTS file with list of all posts from Maria, here 'First Post' only

- ``../output/author/jonas.html``  
POSTS file with list of all posts from Jonas, here 'Second Post' and 'Third Post'

If you have activated the Hexo configuration attribute [``post_asset_folder``](https://hexo.io/docs/asset-folders.html), then the output will be:

- ``../output/author/index.html``
- ``../output/author/maria/index.html``
- ``../output/author/jonas/index.html``

## Installation

``npm install hexo-generator-anything --save``

## Configuration

### _config.yml

To configure the plugin, add following section to your Hexo's root ``_config.yml``:

```yml
anything:
  layout_index: anything-index
  layout_posts: anything-posts
  index_mappings:
    - variable: author
      path: author
    - variable: my-other-variable
      path: others

```

The settings in depth:

| Settings | Description |
|---------|------------|
| layout_index | EJS template for processing INDEX file<br>(if not set, Hexo's default ``index.ejs`` will be used) |
| layout_posts | EJS template for processing POSTS file<br>(if not set, Hexo's default ``index.ejs`` will be used) |
| index_mappings | List of Anything mappings |
| ... variable | Frontmatter variable in your posts to generate an index of |
| ... path | Part of the path of the output files, which represents the index |

You can find examples for ``layout_index.ejs`` and ``layout_posts.ejs`` in the package ``samples`` folder under ``/node_modules/hexo-generator-anything/`` after installation. Place the files in your Hexo's layout folder.

### Additional Markdown Files

For generating the INDEX page, you can enrich the information about each author (variable value = key), by providing a Markdown file in in your sources folder: ``../source/anything/{index}/{key}``.

To stay with the example above, we have in index called ``authors`` and two keys: ``maria`` and ``jonas``:

``` txt
|- source
|  |- _anything
|  |  |- authors
|  |  |  |-> maria.md
|  |  |  |-> jonas.md 
```

Each of these files has to have at least one Frontmatter variable called ``title``, where you can overwrite the default key string (value of the index variable in the posts). You can extend the Frontmatter with as many variables as you want and use it in your INDEX EJS template.

The content of the MD file will also be available in the data for generating the INDEX page.

Example:

```md
---
title: Marias Posts
avatar: ./photos/maria.jpg
email: maria@my-domain.com
---

Maria is writer of the month. Don't miss her tweets on [https://twitter.com/maria](https://twitter.com/maria)
```

The INDEX page itself, may have a linked Markdown file too, to provide content or additional data:

```txt
|- source
|  |- _anything
|  |  |- authors
|  |  |  |-> index.md
|  |  |  |-> ...
```


## Usage

Install, configure, then run `hexo generate` as usual.

## Contributing

Yes, please ... fork the project, make your changes and submit pull requests against the main branch.

## Demo

I have created this project for my blog and I use it to group some posts into series. You can see the result at: [**https://kiko.io/series**](https://kiko.io/series)

## More Information
I have a section for this project on my blog with posts regarding this project (automatically generated by this plugin ;) at [**http://kiko.io/projects/hexo-generator-anything**](http://kiko.io/projects/hexo-generator-anything)

## History
**1.0.5**
- Path fix (Lowercase)

**1.0.4**
- Replaced vulnerable string.js library

**1.0.3**
- Refactorings
- Introducing Markdown file for INDEX page
- ``titleSeparator`` setting removed
- Updated samples

**1.0.1/2**
- Markdown data fix

**1.0.0**
- Initial version

## License

**MIT** : http://opensource.org/licenses/MIT

## Codebase Vizualization
For an inactive diagram, please visit [Repo Visualization App](https://octo-repo-visualization.vercel.app/?repo=kristofzerbe%2Fhexo-generator-anything)...
![Visualization of the codebase](./DIAGRAM.svg)
