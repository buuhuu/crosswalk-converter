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
/* eslint-disable no-param-reassign */

import { visit } from 'unist-util-visit';

function rewriteImage(url, origin) {
  if (url && url.startsWith('/')) {
    url = new URL(url, origin).toString();
  }
  return url;
}

export function rewriteImages(options = {}) {
  return (tree) => {
    const { converterCfg } = options;
    let { origin } = converterCfg || {};
    if (origin) {
      origin = new URL(origin);
      const identifiers = new Set();
      visit(tree, ['imageReference', 'definition'], (node) => {
        const { type, identifier, url } = node;
        if (type === 'definition' && identifiers.delete(identifier)) {
          node.url = rewriteImage(url, origin);
        }
        if (type === 'imageReference') {
          identifiers.add(identifier);
        }
      });
    }
  };
}
