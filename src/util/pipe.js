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

/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
/* eslint-disable import/prefer-default-export */

/**
 * A simple implementation of a pipeline that allows to use processors, wrap into a function and
 * be run.
 *
 * @returns a pipeline object
 */
export function pipe() {
  const processors = {};
  const self = {
    use,
    run,
    wrap,
    logger: console,
  };

  /**
   * Add a processor to the pipeline.
   *
   * @param {(state, params, opts) => state} processor
   * @param {{}} opts
   * @returns
   */
  function use(processor, condition, opts) {
    if (typeof condition !== 'function') {
      opts = condition;
      condition = () => true;
    }
    if (!opts) {
      opts = {};
    }

    const { name } = processor;
    const fn = (s, p, o) => {
      if (condition(s, p, o)) {
        const { path = '???' } = s || {};
        const label = `${name}: ${path}`;
        const start = Date.now();
        try {
          return processor(s, p, { ...o, ...opts });
        } finally {
          self.logger.log(`${label}: ${Date.now() - start}ms`);
        }
      }
      return s;
    };
    processors[name] = fn;
    return self;
  }

  /**
   * Run the pipeline with the given parameters.
   *
   * @param {{}} state
   * @param {{}} params
   * @param {{}} opts
   * @returns
   */
  async function run(state, params, opts) {
    // eslint-disable-next-line no-restricted-syntax
    for (const processor of Object.values(processors)) {
      // eslint-disable-next-line no-await-in-loop
      state = await processor(state, params, opts);
    }
    return state;
  }

  /**
   * Wrap the pipeline in an executor function.
   *
   * @param {(pipe, ...args) => any} fn the executor function
   * @param {*} opts
   * @returns
   */
  function wrap(fn, opts = {}) {
    fn = fn(self, opts);
    /* eslint-disable-next-line func-names */
    return function (...args) {
      return fn.apply(this, args);
    };
  }

  return self;
}
