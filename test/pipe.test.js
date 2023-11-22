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

/* eslint-disable no-unused-vars */

import { pipe } from '../src/utill/pipe.js';
import assert from 'assert';

describe('Pipe', () => {
  it('runs each step after another', async () => {
    const step1 = (state) => ({ ...state, step1: true });
    const step2 = (state) => ({ ...state, step2: true });
    const step3 = (state) => ({ ...state, step3: true });

    const p = pipe().use(step1).use(step2).use(step3);
    p.logger = { log: () => { } };

    const result = await p.run();

    assert.deepEqual(result, { step1: true, step2: true, step3: true });
  });

  it('runs steps conditionally', async () => {
    const step1 = (state) => ({ ...state, step1: true });
    const step2 = (state) => ({ ...state, step2: true });

    const p = pipe()
      .use(step1, (_, params) => !params.test)
      .use(step2, (_, params) => params.test);
    p.logger = { log: () => { } };

    const result = await p.run({}, { test: true });

    assert.deepEqual(result, { step2: true });
  });

  it('passes options to each step', async () => {
    const step1 = (state, params, opts) => ({ ...state, ...opts });
    const step2 = (state, params, opts) => ({ ...state, ...opts });
    const step3 = (state, params, opts) => ({ ...state, ...opts });

    const p = pipe()
      .use(step1, { new: 'step1' })
      .use(step2, { new: 'step2' })
      .use(step3, { initial: 'bar' });
    p.logger = { log: () => { } };

    const result = await p.run({}, {}, { preserved: 'initial', initial: 'foo' });

    assert.deepEqual(result, { preserved: 'initial', new: 'step2', initial: 'bar' });
  });

  it('supports overwriting steps by function name', async () => {
    const step1 = (state, params, opts) => ({ ...state, ...opts });

    const p = pipe()
      .use(step1, { one: 'step1' })
      .use(step1, { other: 'step2' });
    p.logger = { log: () => { } };

    const result = await p.run();

    assert.deepEqual(result, { other: 'step2' });
  });
});
