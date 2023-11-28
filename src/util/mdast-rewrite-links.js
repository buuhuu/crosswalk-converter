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

import { visitParents } from 'unist-util-visit-parents';
import { mapOutbound } from './mapping.js';

function rewriteLink(str, origin, liveUrls, mappingCfg, canonical) {
  try {
    if (!str || str.startsWith('#')) {
      return str;
    }

    // no scheme, must be relative to origin
    const relative = str.indexOf(':') < 0;
    const url = relative ? new URL(str, origin) : new URL(str);

    if (url.hostname === origin.hostname
      || liveUrls.some((liveUrl) => url.hostname === liveUrl.hostname)) {
      // map everything relative to origin or the public host
      // make relative
      const path = mapOutbound(url.pathname, mappingCfg) + url.search + url.hash;
      return canonical && !relative ? new URL(path, url).href : path;
    }

    // return as is
    return str;
  } catch {
    return str;
  }
}

function findFirstText(children) {
  for (let i = 0; i < children.length; i += 1) {
    const child = children[0];
    if (child.type === 'text') {
      return child.value;
    }
    if (child.children) {
      const text = findFirstText(child.children);
      if (text) {
        return text;
      }
    }
  }
  return null;
}

function isCanonical(node, ancestors) {
  if (node.type === 'link') {
    const block = ancestors.find((ancestor) => ancestor.type === 'gridTable');
    if (block) {
      const [header] = block.children;
      if (header && header.type === 'gtHeader') {
        let text = findFirstText(header.children);
        if (text.toLowerCase() === 'metadata') {
          // metadata block
          const reversed = ancestors.reverse();
          const row = reversed.find((ancestor) => ancestor.type === 'gtRow');
          if (row) {
            text = findFirstText(row.children);
            if (text.toLowerCase() === 'canonical') {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

export function rewriteLinks(options = {}) {
  return (tree) => {
    const { mappingCfg, converterCfg } = options;
    let { origin, liveUrls = [] } = converterCfg || {};
    if (!Array.isArray(liveUrls)) liveUrls = [liveUrls];
    if (!liveUrls.length) liveUrls.push(origin);
    if (origin) {
      origin = new URL(origin);
      liveUrls = liveUrls
        .filter((url) => !!url)
        .map((url) => new URL(url));
      const identifiers = new Set();
      // eslint-disable-next-line no-unused-vars
      visitParents(tree, ['link', 'imageReference', 'definition'], (node, ancestors) => {
        const { type, identifier, url } = node;
        if (type === 'link' || (type === 'definition' && identifiers.delete(identifier))) {
          const canonical = isCanonical(node, ancestors);
          const link = rewriteLink(url, origin, liveUrls, mappingCfg, canonical);
          if (canonical) {
            const firstChild = node.children[0];
            if (firstChild && firstChild.type === 'text' && firstChild.value === node.url) {
              firstChild.value = link;
            }
          }
          node.url = link;
        }
        if (type === 'imageReference') {
          identifiers.add(identifier);
        }
      });
    }
  };
}
