const path = require('path');

const src = path.resolve(__dirname, 'src');
const lib = path.resolve(__dirname, 'lib');

const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const common = {
  entry: [
    path.resolve(src, 'server.js'),
  ],
  output: {
    filename: '[name].js',
    path: lib,
  },
  module: {
    rules: [
      {
        test: /\.json$/,
        use: 'json-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      { test: /\.ts?$/, loader: 'ts-loader' },
      {
        test: /\.js$/,
        use: ['babel-loader'],
      },
    ],
  },
  target: 'node',
  node: {
    fs: 'empty',
    child_process: 'empty',
    net: 'empty',
    crypto: 'empty',
  },
};

if (process.env.NODE_ENV === 'production') {
  module.exports = merge(common, {
    plugins: [
      new UglifyJSPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    ],
  });
} else {
  module.exports = merge(common, {
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: 'pre',
          loader: 'source-map-loader',
        },
      ],
    },
  });
}
