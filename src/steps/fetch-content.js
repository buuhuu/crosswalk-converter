/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import fetch from 'node-fetch';
import { mapInbound } from '../util/mapping.js';
import { isBinary } from '../util/media-utils.js';

export default async function fetchContent(state, params, opts) {
  const { path, queryString } = state;
  const { authorization, loginToken } = params;
  const { converterCfg, mappingCfg } = opts;
  const { origin, suffix } = converterCfg || {};

  if (!origin) {
    throw new Error('\'origin\' not set in converter.yaml');
  }

  let mappedPath = mapInbound(path, mappingCfg || { mappings: ['/:/'] });
  // if suffix is defined and the mapped path has no extension, add suffix
  if (suffix && !mappedPath.includes('.') && !mappedPath.endsWith('/')) {
    mappedPath += suffix;
  }
  const originUrl = new URL(mappedPath, origin);

  if (queryString) {
    originUrl.search = queryString;
  }

  const requestHeaders = { 'cache-control': 'no-cache' };
  if (authorization) {
    requestHeaders.authorization = authorization;
  } else if (loginToken) {
    requestHeaders.cookie = loginToken;
  }

  const resp = await fetch(originUrl, { headers: { ...requestHeaders } });

  if (!resp.ok) {
    return { ...state, error: { code: resp.status, message: resp.statusText } };
  }

  const [contentType] = (resp.headers.get('content-type') || 'text/html').split(';');
  const contentLength = resp.headers.get('content-length') || -1;
  // for binaries return the readable stream
  const blob = isBinary(contentType) ? resp.body : await resp.text();

  return {
    ...state, originUrl, blob, contentType, contentLength,
  };
}
