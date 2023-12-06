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
import { pipe } from '../src/util/pipe.js';
import {
  html2md,
  parseMd,
  transformMdast,
  stringifyMdast,
} from '../src/steps/index.js';
import md2xml from '../src/steps/md2xml.js';

function loadContent(state) {
  const testHtml = `<html>
  <head>
    <title></title>
  </head>
  <body>
    <main>
      <div class="section">
        <div class="block-1">
          <h3>Heading</h3>
          <p><a href="https://aem.live">CTA</a></p>
          <p>This is <u>some</u> <em>formatted</em> <strong>rich text</strong>. With <sup>many</sup> <sub>formats</sub>.</p>
        </div>
      </div>
    </main>
  </body>
</html>`;

  return {
    ...state,
    blob: testHtml,
    contentType: 'text/html',
    originUrl: 'http://localhost',
  };
}

describe('HTML to JCR test suite', () => {
  it('converts a basic HTML file to its JCR representation', async () => {
    const pipeline = pipe()
      .use(loadContent)
      .use(html2md)
      .use(parseMd)
      .use(transformMdast)
      .use(stringifyMdast)
      .use(md2xml);

    const { xml } = await pipeline.run(
      { },
      { },
      { },
    );

    // Check the XML output
    assert.equal(xml, false);
  });
});
