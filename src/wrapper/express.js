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
import { PipelineRequest, PipelineState, htmlPipe } from '@adobe/helix-html-pipeline';
import { PipelineResponse } from '@adobe/helix-html-pipeline/src/PipelineResponse.js';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { visit, SKIP } from 'unist-util-visit';
import { selectAll } from 'hast-util-select';
import { h } from 'hastscript';
import fetch from 'node-fetch';
import { toRuntime } from './runtime.js';
import { isBinary } from '../util/media-utils.js';
import { toBuffer } from '../steps/blob-encode.js';
import originalMd2Html from '../steps/md2html.js';

const {
  AEM_USER, AEM_PASSWORD, AEM_TOKEN, AEM_LOGIN_TOKEN,
} = process.env;
const LOCALHOST = 'http://127.0.0.1';
const CACHE = {};

/**
 * Alternative implementation of m2html that uses the helix-html-pipeline to render the document.
 * TODO: inject head.html
 * TODO: mdast transform
 *
 * @param {URL} url
 * @returns
 */
export async function md2html(state, params, opts) {
  if (params.semanticHtml) {
    return originalMd2Html(state, params, opts);
  }

  const { md } = state;

  if (!md) {
    return state;
  }

  const { port, originalUrl, headHtml } = opts;
  const url = new URL(`${LOCALHOST}:${port}${originalUrl}`);
  const req = new PipelineRequest(url, { headers: { host: url.host }, body: '' });
  const contentBusId = 'in-memory';
  const folder = 'live';
  const prefix = `${contentBusId}/${folder}`;
  let { path } = state;

  if (path.endsWith('/')) path += 'index';

  const s3Loader = {
    async getObject(_bucketId, key) {
      if (key === `${prefix}${path}.md`) {
        return new PipelineResponse(md);
      }
      if (key === 'owner/repo/ref/helix-config.json') {
        return new PipelineResponse(JSON.stringify({
          version: 2,
          head: {
            data: {
              html: headHtml,
            },
          },
          content: {
            data: {
              '/': { contentBusId },
            },
          },
        }));
      }

      // not found
      return new PipelineResponse('', { status: 404 });
    },

    // eslint-disable-next-line no-unused-vars
    async headObject(_bucketId, _key) {
      return new PipelineResponse('', { status: 404 });
    },
  };

  const log = { ...console, info: () => false };
  const pipelineState = new PipelineState({
    log,
    s3Loader,
    owner: 'owner',
    repo: 'repo',
    ref: 'ref',
    partition: 'live',
    path: url.pathname,
    timer: {
      update: () => { },
    },
  });

  const { status, body } = await htmlPipe(pipelineState, req);

  if (status !== 200) {
    throw new Error(`failed to render html: ${status}`);
  }

  return { ...state, html: body, contentType: 'text/html' };
}

/**
 * The helix-html-pipeline has a few issues. we address them here to achieve a almost 100%
 * compareable output
 */
async function fixHtml(state, params) {
  const { html } = state;

  if (!html) {
    return state;
  }

  const hast = fromHtml(html);
  let content;

  // 1. images that are not (yet) in media bus are not wrapped in <picture> elements
  visit(hast, { tagName: 'img' }, (node, index, parent) => {
    // set loading=lazy
    node.properties.loading = 'lazy';

    if (parent.tagName !== 'picture') {
      const picture = h('picture', node);
      parent.children.splice(index, 1, picture);

      return [SKIP, index];
    }

    return undefined;
  });

  // 2. inject live reload
  if (!params.plainHtml) {
    visit(hast, { tagName: 'head' }, (node) => {
      node.children.push(h(
        'script',
        'window.LiveReloadOptions={port:3000,host:location.hostname,https:false};',
      ));
      node.children.push(h(
        'script',
        { src: '/__internal__/livereload.js' },
      ));
    });
    content = hast;
  } else {
    content = selectAll('body > *', hast);
  }

  return { ...state, html: toHtml(content) };
}

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
    .use(md2html, (_, params) => !params.md)
    // apply html fixes if not rendering md
    .use(fixHtml, (_, params) => !params.md && !params.semanticHtml)
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
      } else if (AEM_LOGIN_TOKEN) {
        params.loginToken = `login-token=${AEM_LOGIN_TOKEN}`;
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
      const sendRes = (state) => {
        // Handling in case of nested error object
        if (Object.hasOwn(state,'error') && Object.keys(state).length === 1)
          state = state.error;
        res.set({ ...state.headers, 'cache-control': 'privat, max-age=300' });
        res.status(state.statusCode);
        res.send(state.body);
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
