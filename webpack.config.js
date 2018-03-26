'use strict'
module.exports = config
function config(env) {
	const htmlStandards = require('reshape-standard')
	    , cssStandards = require('spike-css-standards')
	    , cssCommentFilter = require('postcss-discard-comments')()
	    , sugarml = require('sugarml')
	    , webpack = require('webpack')
	    , path = require('path')
	    , ManifestPlugin = require('webpack-manifest-plugin')
	    , CleanWebpackPlugin = require('clean-webpack-plugin')
	    , HtmlWebpackPlugin = require('html-webpack-plugin')
	    , CopyWebpackPlugin = require('copy-webpack-plugin')
	    , MiniCssExtractPlugin = require('mini-css-extract-plugin')
	    , ATLoader = require('awesome-typescript-loader')
	    , isProd = env && env.NODE_ENV === 'production'
	    , buildDir = path.resolve(__dirname, 'public')
	    , context = path.resolve(__dirname, 'views')
	    , chunk = [ 'index'
	              , 'powershell-remoting'
	              ]
	return { context
	       , entry: entrySet(chunk)
	       , output:
	         Object.assign
	         ( { path: buildDir }
	         , { filename: osPath('script/[name].[hash].js')
	           , chunkFilename: osPath('script/[id].[chunkhash].chunk.js')
	           }
	         )
	       , module:
	         { rules:
	           [ postcssRule(/\.css$/)
	           , postcssRule(/\.sss$/, 'sugarss')
	           , { test: /\.pug$/
	             , use:
	               [ { loader: 'pug-loader'
	                 , options: {}
	                 }
	               ]
	             }
	           , { test: /\.sgr$/
	             , use:
	               [ { loader: 'reshape-loader'
	                 , options: Object.assign
	                   ( htmlStandards
	                     ({ parser: sugarml
		                    , minify: isProd
	                      })
	                   , { generatorOptions:
	                       { selfClosing: 'slash' }
	                     }
	                   )
	                 }
	               ]
	             }
	           , { test: /\.[jt]sx?$/
	             , use:
	               [ { loader: 'awesome-typescript-loader'
	                 , options:
	                   { useTranspileModule: true
	                   , transpileOnly: true
	                   }
	                 }
	               ]
	             }
	           , { test: /\.svg$/
	             , use: [ fileLoader(undefined, 'image/') ]
	             }
	           ]
	         }
	       , resolve:
	         { extensions:
	           [ '.js'
	           , '.json'
	           , '.ts'
	           , '.tsx'
	           ]
	         }
	       , devtool: 'source-map'
	       , devServer:
	         { contentBase: buildDir
	         , hot: !isProd
	         }
	       , optimization: isProd
	                     ? { splitChunks:
	                         { cacheGroups:
	                           { commons:
	                             { chunks: 'common'
	                             , minChunks: 2
	                             , maxInitialRequests: 5 // The default limit is too small to showcase the effect
	                             , minSize: 0 // This is example is too small to create commons chunks
	                             }
	                           }
	                         }
	                       }
	                     : {}
	       , plugins:
	         [ new CleanWebpackPlugin([buildDir])
	         , new CopyWebpackPlugin
	           ([{ from: { glob: osPath('./image/*') } }])
	         // , new ATLoader.CheckerPlugin
	         , ...hwpArray(chunk)
	         , new MiniCssExtractPlugin
	           ({ filename: osPath('style/[name].[hash].css')
	            , chunkFilename: osPath('style/[name].[chunkhash].chunk.css')
	           })
	         , new ManifestPlugin
	         , new webpack.NamedModulesPlugin
	         , ...( isProd
	              ? []
	              : [ new webpack.HotModuleReplacementPlugin ]
	              )
	         ]
	       }
	// each entry has a file directly under context
	function entrySet(names) {
		let entry = {}
		for (let name of names) {
			entry[name] = osPath(`./${name}`)
		}
		return entry
	}
	// chunk: string[] array of chunk names
	function hwpArray(chunk) {
		let hwpOptions = isProd
		               ? hwpOptionsProd
		               : hwpOptionsDev
		return chunk
		       .map((name) =>
		          new HtmlWebpackPlugin(hwpOptions(name))
		         )
	}
	function hwpOptionsDev(name) {
		return { template: osPath(`./${name}.pug`)
		       , filename: `${name}.html`
		       , xhtml: true
		       , chunks: [name]
		       , locals: require(path.join(context, 'locals', name))
		       }
	}
	function hwpOptionsProd(name) {
		let options = hwpOptionsDev(name)
		options.chunks.unshift('manifest', 'common')
		return options
	}
	function osPath(posixPath) {
		return path.sep === '/'
		     ? posixPath
		     : posixPath.replace(/\//g, path.sep)
	}
	function postcssRule(test, parser) {
		let options = cssStandards({ parser
		                           , minify: isProd
		                           , warnForDuplicates: !isProd
		                           })
		options.plugins.push(cssCommentFilter)
		return { test
		       , use:
		         [ // fileLoader('css', 'style/')
			         // , { loader: 'extract-loader' }
			         // ,
			         { loader: MiniCssExtractPlugin.loader }
			       , { loader: 'css-loader'
			         , options: { importLoaders: 1 }
			         }
			       , { loader: 'postcss-loader'
			         , options
			         }
		         ]
		       }
	}
	function fileLoader(ext = '[ext]', publicPath) {
		let options = { name: `[name].[hash].${ext}`
		              }
		if (publicPath) {
			Object.assign
			( options
			, { outputPath: osPath(publicPath)
			  , publicPath
			  }
			)
		}
		return { loader: 'file-loader'
		       , options
		       }
	}
	function pageId(ctx) {
		let rel = path.relative( ctx.context
		                       , ctx.resourcePath
		                       )
		return path.join( path.dirname(rel)
		                , path.basename(rel).replace(/\..*/g, '')
		                ).replace(/[\\\/]/g, '-')
	}
	// console.dir
	// ( module.exports
	// , { depth: 7
	//   , colors: true
	//   }
	// )
}
