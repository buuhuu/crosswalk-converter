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
import github from '@actions/github';

const {
  WSK_AUTH,
  WSK_NAMESPACE,
  WSK_APIHOST = 'adobeioruntime.net',
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
} = process.env;

if (!WSK_AUTH || !WSK_NAMESPACE) {
  throw new Error('WSK_AUTH or WSK_NAMESPACE not set.');
}

// default older then to 5d
const [, , givenName, filterInput = 5 * 24] = process.argv;
const [packageName, actionName] = givenName?.split('/') || [];

if (!packageName) {
  console.log(`package name not set: ${packageName}`);
  console.log();
  console.log('Usage: node bin/deploy.mjs <packageName>(/<actionName>)? (<olderThenInHours>)?');
  process.exit(2);
}

const openwhisk = ow({ api_key: WSK_AUTH, namespace: WSK_NAMESPACE, apihost: WSK_APIHOST });

async function createFilter() {
  const filterInputInt = parseInt(filterInput, 10);
  if (!Number.isNaN(filterInputInt)) {
    // filter by updated only when the 2nd argument is a number
    return ({ updated }) => updated < (Date.now() - filterInputInt * 60 * 60 * 1000);
  }

  if (filterInput.startsWith('github:')) {
    // filter for github
    if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
      throw new Error('GITHUB_TOKEN or GITHUB_REPOSITORY not set.');
    }
    const gh = github.getOctokit(GITHUB_TOKEN);
    if (filterInput === 'github:open_pull_request') {
      const [owner, repo] = GITHUB_REPOSITORY.split('/');
      const pullRequests = await gh.rest.pulls.list({ owner, repo, state: 'open' });
      if (pullRequests.status === 200) {
        const openBranches = pullRequests.data.map((pr) => pr.head.ref);
        return ({ name }) => !openBranches.some((branchName) => name === branchName);
      }
    }
  }

  // include nothing if no filter;
  console.log(`unkown filter: ${filterInput}`);
  return () => false;
}

async function undeploy() {
  const filter = await createFilter();

  const actions = (await openwhisk.actions.list({ namespace: `${WSK_NAMESPACE}/${packageName}` }))
    .filter(({ name }) => !actionName || name === actionName)
    // only undeploy main if explicitly asked for
    .filter(({ name }) => name !== 'main' || actionName === 'main')
    .filter(filter);

  await Promise.all([actions.map(async (action) => {
    await openwhisk.actions.delete(action);
    console.log(`Undeployed action ${packageName}/${action.name}`);
  })]);
}

undeploy();
