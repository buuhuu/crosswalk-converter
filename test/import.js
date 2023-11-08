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
/* global WebImporter */
/* eslint-disable class-methods-use-this */

function transformBlock1(main, document) {
  const block = main.querySelector('.block-1');

  if (block) {
    const heading = block.querySelector('h1,h2,h3');
    const cta = block.querySelector('a');
    const richtext = block.querySelector('p:last-child');

    const table = WebImporter.DOMUtils.createTable([
      ['Block'],
      [[heading.textContent.trim()]],
      [[cta]],
      [[richtext]],
    ], document);

    block.replaceWith(table);
  }
}

export default {
  transformDOM: async ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;

    transformBlock1(main, document);

    return main;
  },
};
