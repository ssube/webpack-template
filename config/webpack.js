const {resolve} = require('path');
const {CheckerPlugin, TsConfigPathsPlugin} = require('awesome-typescript-loader');
const instrument = require('istanbul-instrumenter-loader');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

const tsconfig = require('./tsconfig');

const path = {
  root: process.env.ROOT_PATH,
  source: process.env.SOURCE_PATH,
  target: process.env.TARGET_PATH,
  test: process.env.TEST_PATH
};

const modulePath = {
  index: resolve(path.source, 'index'),
  harness: resolve(path.test, 'harness'),
  shim: resolve(path.source, 'shim')
};

// if `make test-check` was run, type check during lint (takes _forever_)
const typeCheck = process.env['TEST_CHECK'] === 'true';

module.exports = {
  devtool: 'inline-source-map',
  entry: {
    main: modulePath.index,
    test: [modulePath.harness, 'sinon', 'chai']
  },
  mode: 'none',
  module: {
    rules: [{
      test: /\.tsx?$/,
      enforce: 'pre',
      loader: 'tslint-loader',
      options: {
        configFile: 'config/tslint.json',
        typeCheck
      }
    }, {
      test: /\.tsx?$/,
      loader: 'awesome-typescript-loader',
      options: {
        configFileName: 'config/tsconfig.json',
        inlineSourceMap: false,
        sourceMap: true
      }
    }, {
      test: /\.tsx?$/,
      enforce: 'post',
      loader: 'istanbul-instrumenter-loader',
      exclude: /node_modules/,
      options: require('./istanbul')
    }]
  },
  output: {
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    filename: '[name]-bundle.js',
    hashDigest: 'base64',
    hashFunction: 'sha256',
    path: path.target
  },
  plugins: [
    new CheckerPlugin(),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      generateStatsFile: true,
      openAnalyzer: false,
      reportFilename: 'bundles.html'
    })
  ],
  resolve: {
    alias: [{
      name: 'dtrace-provider',
      alias: modulePath.shim
    }, {
      name: 'term.js',
      alias: modulePath.shim
    }, {
      name: 'pty.js',
      alias: modulePath.shim
    }, {
      name: 'handlebars',
      alias: 'handlebars/dist/handlebars'
    }, {
      name: 'src',
      alias: path.source,
      onlyModule: false
    }, {
      name: 'test',
      alias: path.test,
      onlyModule: false
    }],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    plugins: [
      new TsConfigPathsPlugin({tsconfig, compiler: 'typescript'})
    ]
  },
  target: 'node'
};