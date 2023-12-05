/* eslint-disable import/prefer-default-export */
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

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-relative-packages */
/* eslint-disable no-param-reassign */

import 'dotenv/config.js';
import { toRuntime } from './runtime.js';
import { isBinary } from '../util/media-utils.js';
import { toBuffer } from '../steps/blob-encode.js';
import md2xml from '../steps/md2xml.js';

const { AEM_USER, AEM_PASSWORD, AEM_TOKEN } = process.env;
const LOCALHOST = 'http://127.0.0.1';
const CACHE = {};

/**
 * Simplified blobEncode that just returns a Buffer of binary content.
 *
 * @param {*} state
 * @returns
 */
async function blobEncode(state) {
  const { blob, contentType } = state;
  if (blob && isBinary(contentType)) {
    return { ...state, blob: await toBuffer(blob) };
  }
  return state;
}

export function toExpress(pipe, opts = {}) {
  pipe = pipe
    // replace md2html with the one defined for express
    .use(md2xml, (_, params) => !params.md)
    // do not encode blobs
    .use(blobEncode);

  return function (req, res) {
    // eslint-disable-next-line prefer-const
    let { path } = req;
    const params = {};
    const requestHeaders = {
      authorization: req.get('authorization'),
    };

    if (!requestHeaders.authorization) {
      if (AEM_TOKEN) {
        requestHeaders.authorization = `Bearer ${AEM_TOKEN}`;
      } else if (AEM_USER && AEM_PASSWORD) {
        requestHeaders.authorization = `Basic ${Buffer.from(`${AEM_USER}:${AEM_PASSWORD}`).toString('base64')}`;
      }
    }

    if (path.endsWith('.md')) {
      params.md = true;
      path = `${path.substring(0, path.length - 3)}`;
    }

    // remove .plain.html to treat it as html request
    if (path.endsWith('.plain.html')) {
      params.plainHtml = true;
      path = `${path.substring(0, path.length - 11)}`;
    }

    // remove .semantic.html to treat it as html request
    if (path.endsWith('.semantic.html')) {
      params.semanticHtml = true;
      path = `${path.substring(0, path.length - 14)}`;
    }

    // serve everything that is code from the local dev server
    // - using extensions and typical path patterns
    if (path.match(/\.(js|css|json|yaml|html|ico|woff2)$/) || path.match(/^\/(scripts|styles|icons|fonts|blocks|tools)\//)) {
      // request from local dev server
      fetch(`${LOCALHOST}:3000${path}`)
        .then((devResponse) => {
          const [contentType] = devResponse.headers.get('content-type').split(';');
          const cacheControl = devResponse.headers.get('cache-control');

          res.status(devResponse.status);
          res.set('content-type', contentType);
          res.set('cache-control', cacheControl);

          if (devResponse.ok) {
            return devResponse.arrayBuffer();
          }
          return undefined;
        })
        .then((body) => (body ? res.send(Buffer.from(body)) : res.send()))
        .catch((ex) => {
          // send an error response
          res.status(500);
          res.set({ 'content-type': 'text/plain' });
          res.send(ex.stack);
        });
    } else {
      const { originalUrl, protocol } = req;
      const reqUrl = new URL(`${protocol}://${req.get('host')}${originalUrl}`);
      const queryString = reqUrl.search.substring(1);
      const sendRes = ({ statusCode, body, headers }) => {
        res.set({ ...headers, 'cache-control': 'privat, max-age=300' });
        res.status(statusCode);
        res.send(body);
      };

      // check if the file was already served
      if (CACHE[originalUrl] && !queryString) {
        sendRes(CACHE[originalUrl]);
        return;
      }

      // otherwise run the pipeline
      const fn = toRuntime(pipe, { ...opts, originalUrl });
      fn({
        __ow_path: path,
        __ow_headers: { ...requestHeaders },
        __ow_query: queryString,
        ...params,
      }).then((state) => {
        if (state.statusCode === 200) {
          CACHE[originalUrl] = state;
        }
        sendRes(state);
      });
    }
  };
}
