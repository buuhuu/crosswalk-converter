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
/* eslint-disable no-restricted-syntax */

const HTML_EXTENSION = '.html';

/*
 * This file essentially is an implementation of the Mapping class implemented in AEM with some
 * minor changes. For the inbound mapping extensions are not appened, meaning if the incoming
 * path has no extension the inbound-mapped path neither. The converter must be called with an
 * extension if the origin expects one.
 */

function appendExtensionInbound(path, extension) {
  // append the extension only if the path does not already end with it
  if (!path.endsWith(extension)) {
    path += extension;
  }
  return path;
}

function appendExtensionOutbound(path, extension) {
  // append the extension only if the path does not already end with it
  if (extension !== HTML_EXTENSION && !path.endsWith(extension)) {
    path += extension;
  }
  // special handling for the /index pages
  if (path.endsWith('/index')) {
    path = path.substring(0, path.length - 5);
  }
  return path;
}

function withoutQueryStringAndAnchor(path, fn) {
  const queryStart = path.indexOf('?');
  const anchorStart = path.indexOf('#');
  let start = -1;

  if (queryStart > 0 && anchorStart > 0) {
    start = Math.min(anchorStart, queryStart);
  } else if (queryStart > 0) {
    start = queryStart;
  } else {
    start = anchorStart;
  }

  if (start > 0) {
    const part = path.substring(start);
    path = path.substring(0, start);
    return fn(path) + part;
  }
  return fn(path);
}

export function mapInbound(franklinPath, cfg) {
  if (!cfg.mappings || !franklinPath.startsWith('/')) {
    return franklinPath;
  }

  return withoutQueryStringAndAnchor(franklinPath, (originalPath) => {
    let path = originalPath;
    let extension = '';
    const extensionStart = path.indexOf('.');
    if (extensionStart >= 0) {
      extension = path.substring(extensionStart);
      path = path.substring(0, path.length - extension.length);
    }

    // test the path without extension, and the original path
    const candidates = [path, originalPath];
    const reversedMappings = cfg.mappings.reverse();

    for (const mapping of reversedMappings) {
      const [aemBasePath, franklinBasePath] = mapping.split(':', 2);
      for (const candidate of candidates) {
        if (candidate.startsWith(franklinBasePath)) {
          // mapping from folder or single page?
          if (aemBasePath.endsWith('/')) {
            // folder, e.g. /content/site/us/en/:/us/en/
            // mapping to folder
            if (franklinBasePath.endsWith('/')) {
              return appendExtensionInbound(
                aemBasePath + candidate.substring(franklinBasePath.length),
                extension,
              );
            }
            // else, ignore folder => single page as this is not reversible
          } else {
            // single page
            // mapping to a folder aka. /index, e.g. /content/site/us/en:/
            // mapping to a single page, aka. exact match, /content/site/us/en/page:/vanity
            // eslint-disable-next-line no-lonely-if
            if ((franklinBasePath.endsWith('/') && candidate.endsWith('/index')) || franklinBasePath === candidate) {
              return appendExtensionInbound(aemBasePath, extension);
            }
          }
        }
      }
    }
    // restore extension
    return appendExtensionInbound(path, extension);
  });
}

export function mapOutbound(aemPath, cfg) {
  if (!aemPath.startsWith(aemPath, '/') || !cfg.mappings) {
    return aemPath;
  }
  return withoutQueryStringAndAnchor(aemPath, (originalPath) => {
    // remove extension, if any
    let path = originalPath;
    let extension = '';
    const extensionStart = path.indexOf('.');
    if (extensionStart >= 0) {
      extension = path.substring(extensionStart);
      path = path.substring(0, path.length - extension.length);
    }

    // test the path without extension, and the original path
    const candidates = [path, originalPath];
    const reversedMappings = cfg.mappings.reverse();

    for (const mapping of reversedMappings) {
      const [from, to] = mapping.split(':', 2);

      for (const candidate of candidates) {
        if (candidate.startsWith(from)) {
          // mapping from folder or single page?
          if (from.endsWith('/')) {
            // folder, e.g. /content/site/us/en/:/us/en/
            // mapping to folder
            if (to.endsWith('/')) {
              return appendExtensionOutbound(to + candidate.substring(from.length), extension);
            }
            // else, ignore folder => single page as this is not reversible
          } else {
            // single page
            // mapping to folder or single page, exact match only
            // eslint-disable-next-line no-lonely-if
            if (candidate === from) {
              return appendExtensionOutbound(to, extension);
            }
          }
        }
      }
    }
    return appendExtensionOutbound(path, extension);
  });
}
