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

import createForms from '../template/transformers/forms.js';

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

function createMetadata(main, document) {
  const meta = {};
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const href = canonical.getAttribute('href');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = href;
    meta.canonical = a;
  }

  if (Object.keys(meta).length) {
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(block);
  }
}

export default {
  transformDOM: async ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;

    transformBlock1(main, document);
    createMetadata(main, document);
    createForms({ document });

    return main;
  },
};
