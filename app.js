'use strict'
const htmlStandards = require('reshape-standard')
    , cssStandards = require('spike-css-standards')
    , jsStandards = require('spike-js-standards')
    , pageId = require('spike-page-id')
    , sugarml = require('sugarml')
    , sugarss = require('sugarss')
    , env = process.env.SPIKE_ENV

module.exports =
	{ devtool: 'source-map'
	, matchers:
	  { html: '*(**/)*.sgr'
	  , css: '*(**/)*.sss'
	  }
	, ignore:
	  [ '**/layout.sgr'
	  , '**/_*'
	  , '**/.*'
	  , 'readme.md'
	  , 'yarn.lock'
	  , 'package-lock.json'
	  ]
	, reshape: htmlStandards
	  ({ parser: sugarml
	   , locals: function locals(ctx) {
		   const pId = pageId(ctx)
		   return { pageId: pId
		          , title: pId
		          , foo: 'bar'
		          }
	   }
	   , minify: env === 'production'
	   })
	, postcss: cssStandards
	  ({ parser: sugarss
	   , minify: env === 'production'
	   , warnForDuplicates: env !== 'production'
	   })
	, babel: jsStandards()
	}
