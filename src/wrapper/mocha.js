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

import fs from 'fs/promises';
import path from 'path';
import nock from 'nock';
import assert from 'assert';
import { mapInbound } from '../utill/mapping.js';

export const DEFAULT_ORIGIN = 'http://www.test.run';
export const DEFAULT_MAPPING_CFG = { mappings: ['/:/'] };
export const DEFAULT_CONVERTER_CFG = { origin: DEFAULT_ORIGIN };

export function toMocha(pipe, opts = {}) {
  const {
    fixturesFolder = __dirname,
    indivdualTest = it,
    mappingCfg = DEFAULT_MAPPING_CFG,
    converterCfg = DEFAULT_CONVERTER_CFG,
    silent = true,
    ...rest
  } = opts;

  if (silent) {
    pipe.logger = { log: () => {} };
  }

  return async function (fixtures) {
    fixtures.forEach(([given, expected]) => {
      if (!expected) {
        const extensionPos = given.lastIndexOf('.');
        // eslint-disable-next-line no-param-reassign
        expected = `${given.substring(0, extensionPos)}-converted${given.substring(extensionPos)}`;
      }
      indivdualTest(`conversts ${given} to ${expected}`, async () => {
        const givenHtml = await fs.readFile(path.resolve(fixturesFolder, given), { encoding: 'utf-8' });
        const expectedHtml = await fs.readFile(path.resolve(fixturesFolder, expected), { encoding: 'utf-8' });
        const requestPath = `/${given}`;

        nock(converterCfg.origin).get(mapInbound(requestPath, mappingCfg)).reply(200, givenHtml);

        const { error, html } = await pipe.run(
          { path: requestPath },
          {},
          { mappingCfg, converterCfg, ...rest },
        );

        assert(!error, 'no error expected');
        assert.equal(html, expectedHtml.trim());
      });
    });
  };
}
