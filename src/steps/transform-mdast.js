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

import { unified } from 'unified';
import { rewriteLinks } from '../utill/mdast-rewrite-links.js';
import { rewriteImages } from '../utill/mdast-rewrite-images.js';

export const DEFAULT_TRANSFORMERS = [rewriteLinks, rewriteImages];

export default async function transformMdast(state, _params, opts) {
  let { mdast } = state;
  const transformers = opts.transformers || DEFAULT_TRANSFORMERS;

  let processor = unified();
  // eslint-disable-next-line no-restricted-syntax
  for (const transformer of transformers) {
    processor = processor.use(transformer, opts);
  }

  mdast = await processor.run(mdast);

  return { ...state, mdast };
}
