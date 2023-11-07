/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

const DEFAULT_CONFIG = {
  target: 'node',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'main',
      type: 'umd',
    },
  },
  externals: [
    'import node-fetch',
    'openwhisk',
    'express',
  ],
  resolve: {
    modules: [
      'node_modules',
      // fallback to resolution within an absolute path to support require of files outside of the
      // actions path.
      path.resolve(__dirname, 'node_modules'),
    ],
    alias: {
      // alias for helix-m2docx as it has a dependency to adobe/fetch which did not build well
      // with webpack: https://github.com/webpack/webpack/issues/16724. Even though its closed,
      // still a problem with 5.88.2, but we don't need it anyway.
      '@adobe/helix-md2docx': false,
    },
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
    // Provide dependencies/context for import.js
    new webpack.ProvidePlugin({
      WebImporter: '@adobe/helix-importer',
      decodeHtmlEntities: ['html-entities', 'decode'],
      fetch: ['node-fetch', 'default'],
    }),
    new webpack.DefinePlugin({ window: null }),
    // for those jsdom dependencies we want to throw a missing module error if they would be used
    // on the execution path
    new webpack.IgnorePlugin({ resourceRegExp: /^canvas/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /bufferutil/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /utf-8-validate/ }),
  ],
  module: {
    rules: [
      {
        test: /\.ya?ml$/,
        use: 'yaml-loader',
      },
      {
        test: /\.html?$/,
        use: 'raw-loader',
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          mangle: {
            reserved: [
              'fetchContent',
              'html2md',
              'parseMd',
              'transformMdast',
              'stringifyMdast',
              'md2html',
            ],
          },
        },
      }),
    ],
  },
};

module.exports = (env) => {
  const { mode = 'development' } = env;

  let plugins = [...DEFAULT_CONFIG.plugins];
  let devtool = 'source-map';

  if (mode === 'production') {
    // to zip the action
    plugins = [
      ...plugins,
      new ZipPlugin({ include: [/\.js$/] }),
    ];
    devtool = false;
  }

  return {
    ...DEFAULT_CONFIG,
    plugins,
    mode,
    devtool,
  };
};
