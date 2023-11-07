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

import { visit } from 'unist-util-visit';
import { mapOutbound } from './mapping.js';

function rewriteLink(str, origin, liveUrls, mappingCfg) {
  try {
    if (!str || str.startsWith('#')) {
      return str;
    }

    // no scheme, must be relative to origin
    const url = str.indexOf(':') < 0 ? new URL(str, origin) : new URL(str);

    if (url.hostname === origin.hostname
      || liveUrls.some((liveUrl) => url.hostname === liveUrl.hostname)) {
      // map everything relative to origin or the public host
      // make relative
      return mapOutbound(url.pathname, mappingCfg) + url.search + url.hash;
    }

    // return as is
    return str;
  } catch {
    return str;
  }
}

export function rewriteLinks(options = {}) {
  return (tree) => {
    const { mappingCfg, converterCfg } = options;
    let { origin, liveUrls = [] } = converterCfg || {};
    if (!([] instanceof Array)) liveUrls = [liveUrls];
    if (!liveUrls.length) liveUrls.push(origin);
    if (origin) {
      origin = new URL(origin);
      liveUrls = liveUrls.map((url) => new URL(url));
      const identifiers = new Set();
      visit(tree, ['link', 'imageReference', 'definition'], (node) => {
        const { type, identifier, url } = node;
        if (type === 'link' || (type === 'definition' && identifiers.delete(identifier))) {
          node.url = rewriteLink(url, origin, liveUrls, mappingCfg);
        }
        if (type === 'imageReference') {
          identifiers.add(identifier);
        }
      });
    }
  };
}
