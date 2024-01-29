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

import { getFormDef, getAFDef } from "@aemforms/forms-importer";

/* global WebImporter */
const getFormBlock = (document, formDef, url, id, thankyouMsg, errorMsg) => {
  const cells = [
    ['Form'],
    [`<pre><code>${JSON.stringify(formDef)}</code></pre>`],
    [url || ''],
    [id || ''],
    [thankyouMsg || ''],
    [errorMsg || ''],
  ];
  return WebImporter.DOMUtils.createTable(cells, document);
};

export default async function createForms({ document, url, params }) {
  const forms = document.querySelectorAll('.cmp-adaptiveform-container form');
  await (Promise.all([...forms]?.map(async (formEl) => {
    if (formEl && formEl.tagName === 'FORM') {
      const path = formEl?.dataset?.cmpPath;
      // eslint-disable-next-line no-underscore-dangle
      const formDef = await getAFDef(path, { url, reqHeaders: params?.__ow_headers });
      const table = getFormBlock(document, formDef);
      formEl.replaceWith(table);
    }
  })));

  const siteForms = document.querySelectorAll('.cmp-form');
  siteForms?.forEach((formEl) => {
    if (formEl && formEl.tagName === 'FORM') {
      const successModal = formEl?.closest('.cmp-container-full')?.querySelector('.form-success-modal');
      const errorModal = formEl?.closest('.cmp-container-full')?.querySelector('.form-failure-modal');
      const thankyouMsg = successModal?.querySelector('.modal-body');
      const errorMsg = errorModal?.querySelector('.modal-body');
      const formUrl = formEl.dataset.currentNode;
      const formDef = getFormDef(formEl);
      const table = getFormBlock(document, formDef, formUrl, formEl.id, thankyouMsg, errorMsg);
      formEl.replaceWith(table);

      errorModal?.remove();
      successModal?.remove();
    }
  });
}
