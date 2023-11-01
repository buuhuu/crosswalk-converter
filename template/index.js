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

/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-relative-packages */

import { pipeline, toRuntime } from 'crosswalk-converter';
import transform from '../../../importer/import.js';
import converterCfg from '../../../../converter.yaml';
import mappingCfg from '../../../../paths.yaml';

export function main(...args) {
  return pipeline()
    .wrap(toRuntime, { transform, converterCfg, mappingCfg })
    .apply(this, args);
}
