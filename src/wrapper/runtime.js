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

/* eslint-disable import/prefer-default-export */
/* eslint-disable no-underscore-dangle */

export function toRuntime(pipe, opts = {}) {
  return async function (params) {
    const queryString = params.__ow_query;
    const authorization = params.__ow_headers ? params.__ow_headers.authorization : '';
    let path = params.__ow_path ? params.__ow_path : '';

    if (path.endsWith('.md')) {
      params.md = true;
      path = path.substring(0, path.length - 3);
    }

    try {
      const {
        error, blob, html, md, contentType,
      } = await pipe.run(
        { path, queryString },
        { ...params, authorization },
        opts,
      );
      const statusCode = error?.code || 200;
      const body = error?.message || html || md || blob;
      const { origin } = opts.converterCfg || {};
      return { statusCode, body, headers: { 'content-type': contentType, 'x-html2md-img-src': origin } };
    } catch (ex) {
      return { statusCode: 500, body: `${ex.stack}`, headers: { 'content-type': 'text/plain' } };
    }
  };
}
