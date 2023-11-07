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

import fs from 'fs';
import path from 'path';
import nock from 'nock';
import assert from 'assert';
import { pipeline } from '../src/pipeline.js';

const origin = 'http://www.test.run';
const converterCfg = { origin };

describe('Pipeline', () => {
  const pipe = pipeline();
  pipe.logger = { log: () => { } };

  it('serves small binaries base64 encoded', async () => {
    // eslint-disable-next-line no-undef
    const binary = await fs.promises.readFile(path.resolve(__testdir, 'fixtures/test.png'));
    nock(origin).get('/test.png').reply(200, binary, { 'content-type': 'image/png', 'content-length': binary.length });

    const {
      contentType, blob, html, md, error,
    } = await pipe.run({ path: '/test.png' }, {}, { converterCfg });

    assert.notEqual(!!error, true);
    assert.equal(html, undefined);
    assert.equal(md, undefined);
    assert.equal(blob, binary.toString('base64'));
    assert.equal(contentType, 'image/png');
  });
});
