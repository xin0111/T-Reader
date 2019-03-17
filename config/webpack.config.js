const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const cssNano = require('cssnano');
const OptimizeCssAssetsPlugin
    = require('optimize-css-assets-webpack-plugin');
const isProduction = process.env.NODE_ENV === 'production';

const config = {
    entry : {
        options : './js/options.js',
        treader : './js/treader.js',
        tselection : './js/tselection.js',
        background : './js/background.js',
        popup : './js/popup.js'
    },
    output : {
        path : path.resolve(__dirname, '../output'),
        filename : '[name].js'
    },
    resolve : {
        alias : {
            'vue' : 'vue/dist/vue.js',
            'tjsBrowser' : '../js/dictionaries/tjs.browser.common.js',
            'd3plusText' : '../js/d3plus-text.full.js'
        }
    },
    module : {
        rules : [
            {
                test : /\.html$/,
                use : [ 'html-loader' ]
            },
            {
                test : /\.js$/,
                exclude : /node_modules/,
                use : [ 'babel-loader' ]
            },
            {
                test : /\.css$/,
                use : [ 'style-loader', 'css-loader' ]
            },
            {
                test : /\.scss$/,
                use : ExtractTextPlugin.extract({
                    fallback : 'style-loader',
                    use : [ 'css-loader', 'sass-loader' ]
                })
            },
            { //字体文件
                test : /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
                loader : 'file-loader'
            }
        ]
    },
    plugins : [
        new webpack.optimize.ModuleConcatenationPlugin(),
        //Generate an HTML5 file that includes all webpack bundles(includes css & js) in the body using script tags
        /*HtmlWebpackPlugin 
		 CopyWebpackPlugin 
		 ExtractTextPlugin 
         webpack.optimize.CommonsChunkPlugin
         webpack.optimize.ModuleConcatenationPlugin
		 ImageminPlugin*/
        new HtmlWebpackPlugin({
            title : 'T-Reader - Options',
            template : './options.html',
            filename : 'options.html',
            chunks : [ 'manifest', 'vendor', 'options' ]
        }),
        new HtmlWebpackPlugin({
            title : 'T-Reader - TSelection',
            template : './tselection.html',
            filename : 'tselection.html',
            chunks : [ 'manifest', 'vendor', 'tselection' ]
        }),
        new HtmlWebpackPlugin({
            title : 'T-Reader - Background',
            template : './background.html',
            filename : 'background.html',
            chunks : [ 'manifest', 'vendor', 'background' ]
        }),
        new HtmlWebpackPlugin({
            title : 'T-Reader - Popup',
            template : './popup.html',
            filename : 'popup.html',
            chunks : [ 'manifest', 'vendor', 'popup' ]
        }),
        new CopyWebpackPlugin([ { from : 'img', to : 'img' },
            { from : 'css', to : 'css' },
            { from : '_locales', to : '_locales' },
            { from : 'js/d3plus-text.full.js' },
            { from : 'manifest.json' } ]),
        // split vendor js into its own file
        new webpack.optimize.CommonsChunkPlugin({
            name : 'vendor',
            minChunks(module) {
                // any required modules inside node_modules are extracted to vendor
                return (
                    module.resource && /\.js$/.test(module.resource) && module.resource.indexOf(path.join(__dirname, '../node_modules')) === 0)
            }
        }),
        // extract webpack runtime and module manifest to its own file in order to
        // prevent vendor hash from being updated whenever app bundle is updated
        new webpack.optimize.CommonsChunkPlugin({
            name : 'manifest',
            minChunks : Infinity
        }),
        // This instance extracts shared chunks from code splitted chunks and bundles them
        // in a separate chunk, similar to the vendor chunk
        // see: https://webpack.js.org/plugins/commons-chunk-plugin/#extra-async-commons-chunk
        new webpack.optimize.CommonsChunkPlugin({
            name : 'app',
            async : 'vendor-async',
            children : true,
            minChunks : 3
        })
    ]
}

if (isProduction)
{
    config.plugins.push(
        new UglifyJSPlugin({
            sourceMap : false,
            uglifyOptions : {
                mangle : true,
                compress : {
                    dead_code : true,
                    drop_console : true,
                    conditionals : true,
                    booleans : true,
                    unused : true,
                    if_return : true,
                    join_vars : true
                }
            }
        }),
        new OptimizeCssAssetsPlugin({
            assetNameRegExp : /\.css$/,
            cssProcessor : cssNano,
            cssProcessorOptions : { discardComments : { removeAll : true }, safe : true },
            canPrint : true
        }))
}

module.exports = config
