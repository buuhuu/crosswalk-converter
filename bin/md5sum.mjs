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

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const [, , filePath] = process.argv;

const resolvedFilePath = path.resolve(filePath);
const fileExists = fs.existsSync(resolvedFilePath);

if (!fileExists) {
  console.log(`file not found: ${resolvedFilePath}`);

  console.log();
  console.log('Usage: node bin/md5sum.mjs <file>');
  process.exit(2);
}

function md5sum(str) {
  return crypto.createHash('md5').update(str, 'utf-8').digest('hex');
}

const str = fs.readFileSync(resolvedFilePath, { encoding: 'utf-8' });

console.log(`${filePath}: ${md5sum(str)}`);
