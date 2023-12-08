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
  // This needs to use the OUTPUT of import.js
  const testHtml = `<html>
  <head>
    <title>Site title</title>
  </head>
  <body>
    <div>
      <table><tr><th colspan="2">Testimonial</th></tr><tr><td><img src="/content/dam/danaher/system/quote.png"></td><td>The ability to develop organoids from patient-specific induced pluripotent stem cells (iPSCs) allows for capturing human diversity in preclinical drug development and opens the door to personalised medicine.</td></tr></table>

      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <p><a href="https://aem.live">CTA</a></p>
      <p>This is <u>some</u> <em>formatted</em> <strong>rich text</strong>. With <sup>many</sup> <sub>formats</sub>.</p>

      <table>
        <tr><th colspan="2">Columns</th></tr>
        <tr>
          <td>
            <div class="featureimage">
              <div data-v-3bc57c87="" class="featureimg-content-visibility mx-auto my-2 max-w-7xl">
                <div data-v-3bc57c87="" class="relative grid items-center grid-cols-1 py-4 mx-auto gap-x-6">
                  <div data-v-3bc57c87="" class="_self">
                    <h2 data-v-3bc57c87="" class="inline-flex leading-10 text-danahergray-900" style="font-size: 40px; font-family: Fort; font-weight: 500;">Our scientists are leading the thinking.</h2>
                    <p data-v-3bc57c87="" class="mt-3 leading-7 href-text text-danahergray-700" style="font-family: fort; font-size: 18px;"></p>
                    <p style="font-family: fort; font-size: 18px;">The future of therapeutic development requires the integration of science and industrial engineering to bend the time curve and deliver novel, high-value drugs—faster than ever before. </p>
                    <p></p>
                  </div>
                </div>
              </div>
            </div>
          </td>
          <td>
            <img src="https://s7d9.scene7.com/is/image/danaherstage/scientist-tablet">
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;

  return {
    ...state,
    blob: testHtml,
    contentType: 'text/html',
    originUrl: 'http://localhost',
  };
}
function loadBasicContent(state) {
  // This needs to use the OUTPUT of import.js
  const testHtml = `<html>
  <head>
    <title>Site title</title>
  </head>
  <body>
    <div>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <p><a href="https://aem.live">CTA</a></p>
      <p>This is <u>some</u> <em>formatted</em> <strong>rich text</strong>. With <sup>many</sup> <sub>formats</sub>.</p>
    </div>
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
      .use(loadBasicContent)
      .use(html2md) // Symantic, correct Markdown after this point
      .use(parseMd)
      .use(transformMdast)
      .use(stringifyMdast)
      .use(md2xml);

    const { html } = await pipeline.run(
      { },
      { },
      { },
    );

    // Check the XML output
    assert.equal(html, false);
  });

});
