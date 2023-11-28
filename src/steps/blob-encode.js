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

import { isBinary } from '../util/media-utils.js';

export async function toBuffer(stream) {
  return new Promise((resolve, reject) => {
    const bufs = [];
    stream.on('data', (data) => { bufs.push(data); });
    stream.on('end', () => resolve(Buffer.concat(bufs)));
    stream.on('error', (e) => reject(e));
  });
}

export default async function blobEncode(state) {
  const { contentType, contentLength } = state;
  let { blob } = state;

  if (blob && isBinary(contentType)) {
    if (contentLength > (1024 * 1024) / 1.34) {
      throw new Error(`binary to big: ${contentLength} bytes`);
    }
    if (contentLength < 0) {
      throw new Error('unknown content length');
    }
    blob = await toBuffer(blob);
    blob = blob.toString('base64');
  }

  return { ...state, blob };
}
