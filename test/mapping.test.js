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

import assert from 'assert';
import { mapInbound, mapOutbound } from '../src/util/mapping.js';

describe('Mapping', () => {
  describe('map inbound', () => {
    [
      ['/content/site/us/en/page:/vanity', '/vanity.html', '/content/site/us/en/page.html'],
      ['/content/site/us/en/page:/vanity', '/vanity-bar.html', '/vanity-bar.html'],
      ['/content/site/ch/en:/en-ch/', '/en-ch/index.html', '/content/site/ch/en.html'],
      // folder to single page is ignored
      ['/content/site/us/en/:/vanity', '/vanity.html', '/vanity.html'],
      // incoming without extension
      ['/site/:/', '/vanity', '/site/vanity'],
      ['/site/:/', '/', '/site/'],
      ['/site/:/', '/nested/page', '/site/nested/page'],
      // incoming with querystring and anchor
      ['/:/', '/page?foobar', '/page?foobar'],
      ['/:/', '/page#foobar', '/page#foobar'],
      ['/:/', '/page?foo#bar', '/page?foo#bar'],
      ['/:/', '/page#foo?bar', '/page#foo?bar'],
      // invalid mapping
      ['foobar', '/path', '/path'],
      // absolute url
      ['/:/', 'https://www.adobe.com/path', 'https://www.adobe.com/path'],
      // extensions other than .html
      ['/content/site/metadata:/metadata.json', '/metadata.json', '/content/site/metadata.json'],
      ['/content/dam/path/to/file.pdf:/file.pdf', '/file.pdf', '/content/dam/path/to/file.pdf'],
      // fallback after ignored mapping
      // 1. the 2nd more specific mapping conflicts with the 1st
      // 2. it will be ignored for reverse mapping though (folder to page)
      ['/global/:/,/global/en:/', '/.html', '/global/en.html'],
      ['/global/:/,/global/en:/', '/de.html', '/global/de.html'],
      ['/global/:/,/global/en:/', '/en/foobar.html', '/global/en/foobar.html'],
      ['/site/header.json:/.helix/headers.json', '/.helix/headers.json', '/site/header.json'],
    ].forEach(([mapping, from, to]) => {
      it(`${mapping} maps ${from} to ${to}`, () => assert.equal(to, mapInbound(from, { mappings: mapping.split(',') })));
    });

    // overlapping mappings
    [
      ['/content/site/', '/'],
      ['/content/dam/site/document.pdf', '/media/document.pdf'],
    ].forEach(([to, from]) => {
      it(`/content/site/:/,/content/dam/site/:/media/ maps ${from} to ${to}`, () => assert.equal(to, mapInbound(from, {
        mappings: [
          '/content/site/:/',
          '/content/dam/site/:/media/',
        ],
      })));
    });
  });

  describe('map outbound', () => {
    [
      ['/content/site/us/en/page:/vanity', '/content/site/us/en/page.html', '/vanity'],
      ['/content/site/us/en/page:/vanity', '/vanity-bar.html', '/vanity-bar'],
      ['/content/site/ch/en:/en-ch/', '/content/site/ch/en.html', '/en-ch/'],
      // folder to single page is ignored
      ['/content/site/us/en/:/vanity', '/vanity.html', '/vanity'],
      // outbound without extension
      ['/site/:/', '/site/vanity', '/vanity'],
      ['/site/:/', '/site/index', '/'],
      ['/site/:/', '/site/metadata.json', '/metadata.json'],
      ['/site/:/', '/site/nested/index', '/nested/'],
      // incoming with querystring and anchor
      ['/:/', '/page.html?foobar', '/page?foobar'],
      ['/:/', '/page.html#foobar', '/page#foobar'],
      ['/:/', '/page.html?foo#bar', '/page?foo#bar'],
      ['/:/', '/page.html#foo?bar', '/page#foo?bar'],
      // invalid mapping
      ['foobar', '/path.html', '/path'],
      // absolute url
      ['/:/', 'https://www.adobe.com/path', 'https://www.adobe.com/path'],
      // extensions other than .html
      ['/content/site/metadata:/metadata.json', '/content/site/metadata.json', '/metadata.json'],
      ['/content/dam/path/to/file.pdf:/file.pdf', '/content/dam/path/to/file.pdf', '/file.pdf'],
      // fallback after ignored mapping:
      // 1. the 2nd more specific mapping conflicts with the 1st
      // 2. for outbound mapping it doesn't matter though
      ['/global/:/,/global/en:/', '/global/en.html', '/'],
      ['/global/:/,/global/en:/', '/global/de.html', '/de'],
      ['/global/:/,/global/en:/', '/global/en/foobar.html', '/en/foobar'],
      ['/site/header.json:/.helix/headers.json', '/site/header.json', '/.helix/headers.json'],
    ].forEach(([mapping, from, to]) => {
      it(`${mapping} maps ${from} to ${to}`, () => assert.equal(to, mapOutbound(from, { mappings: mapping.split(',') })));
    });
  });
});
