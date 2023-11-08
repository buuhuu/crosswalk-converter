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

import remarkGridTable from '@adobe/remark-gridtables';
import formatPlugin from '@adobe/helix-importer/src/importer/mdast-to-md-format-plugin.js';
import remarkGfm from 'remark-gfm';
import stringify from 'remark-stringify';
import { unified } from 'unified';

export default async function stringifyMdast(state) {
  const { mdast } = state;

  if (mdast) {
    const md = await unified()
      .use(stringify, {
        strong: '*',
        emphasis: '_',
        bullet: '-',
        fence: '`',
        fences: true,
        incrementListMarker: true,
        rule: '-',
        ruleRepetition: 3,
        ruleSpaces: false,
      })
      .use(remarkGridTable)
      .use(remarkGfm)
      .use(formatPlugin)
      .stringify(mdast);
    return { ...state, md };
  }
  return state;
}
