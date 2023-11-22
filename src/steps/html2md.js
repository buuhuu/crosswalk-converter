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

/* eslint-disable no-param-reassign */

import * as WebImporter from '@adobe/helix-importer';
import { JSDOM } from 'jsdom';

function domParser(html, url) {
  return new JSDOM(html, { url }).window.document;
}

export default async function html2md(state, params, opts) {
  const { origin, transform } = opts;
  const { blob, contentType, originUrl } = state;

  if (contentType === 'text/html') {
    // using a different dom parser requires helix-importer to not serialize and reparse the
    // document see https://github.com/adobe/helix-importer/issues/258
    const document = domParser(blob, originUrl);
    const md = await WebImporter.html2md(
      originUrl,
      document,
      transform,
      { ...params },
      { cache: false, host: origin },
    );
    state = { ...state, md: md?.md, contentType: 'text/plain' };
  }

  return state;
}
