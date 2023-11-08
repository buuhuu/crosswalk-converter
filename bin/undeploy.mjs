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

import 'dotenv/config.js';
import ow from 'openwhisk';

const {
  WSK_AUTH,
  WSK_NAMESPACE,
  WSK_APIHOST = 'adobeioruntime.net',
} = process.env;

if (!WSK_AUTH || !WSK_NAMESPACE) {
  throw new Error('WSK_AUTH or WSK_NAMESPACE not set.');
}

// default older then to 5d
const [, , givenName, olderThenHours = 5 * 24] = process.argv;
const [packageName, actionName] = givenName?.split('/') || [];

if (!packageName) {
  console.log(`package name not set: ${packageName}`);
  console.log();
  console.log('Usage: node bin/deploy.mjs <packageName>(/<actionName>)? (<olderThenInHours>)?');
  process.exit(2);
}

const openwhisk = ow({ api_key: WSK_AUTH, namespace: WSK_NAMESPACE, apihost: WSK_APIHOST });

async function undeploy() {
  const updatedBefore = Date.now() - olderThenHours * 60 * 60 * 1000;
  const actions = (await openwhisk.actions.list({ namespace: `${WSK_NAMESPACE}/${packageName}` }))
    .filter(({ name }) => !actionName || name === actionName)
    // only undeploy main if explicitly asked for
    .filter(({ name }) => name !== 'main' || actionName === 'main')
    .filter(({ updated }) => updated < updatedBefore);

  await Promise.all([actions.map(async (action) => {
    await openwhisk.actions.delete(action);
    console.log(`Undeployed action ${packageName}/${action.name}`);
  })]);
}

undeploy();
