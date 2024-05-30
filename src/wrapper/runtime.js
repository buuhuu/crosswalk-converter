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
/* eslint-disable no-underscore-dangle */

import ow from 'openwhisk';

export function toRuntime(pipe, opts = {}) {
  const { converterCfg = {} } = opts;

  return async function (params) {
    const {
      __OW_API_HOST: owApiHost,
      __OW_API_KEY: owApiKey,
      __OW_NAMESPACE: owNamespace,
      __OW_ACTION_NAME: actionPath,
    } = process.env;
    const queryString = params.__ow_query;
    const authorization = params.__ow_headers ? params.__ow_headers.authorization : '';
    let path = params.__ow_path;

    if (path.endsWith('.md')) {
      params.md = true;
      path = path.substring(0, path.length - 3);
    }

    if (owApiHost && owApiKey && owNamespace && actionPath) {
      // Forward to a branch-action if applicable (on a /branch folder) and available, aka. deployed
      // in the same package. For example consider the following actions, main deployed from the
      // main branch and issue-123 from the issue-123 branch, but both in the same package
      // converter:
      // - converter/main
      // - converter/issue-123
      // Incoming requests to /branch/issue-123/... will be dispached to the converter/issue-123
      // action, instead of being handled by the converter/main action. Any /branch folder that has
      // no matching branch will fall through.

      // '/<actionNamespace>/<actionName>'
      // where actionNamespace is <namespace>(/<packageName>)?
      const [, actionNamespace, actionName] = actionPath.match(/\/(.+)\/([^/]+)$/);
      const branchMatch = path.match(/^\/branch\/([^/]+)(\/.+)$/);
      const openwhisk = ow({ api_key: owApiKey, apihost: owApiHost, namespace: owNamespace });
      // filter for actions only in the same action namespace (namespace & package) and exclude self
      const actions = (await openwhisk.actions.list())
        .filter(({ namespace, name }) => namespace === actionNamespace && name !== actionName);

      if (branchMatch) {
        const [, branchName, subPath] = branchMatch;
        const branchAction = actions.find(({ name }) => name === branchName);
        if (branchAction) {
          if (branchName !== actionName) {
            // forward the request to the branch action only if the branchName is different than
            // the current actionName
            return openwhisk.actions.invoke({
              ...branchAction,
              blocking: true,
              result: true,
              params,
            });
          }
        }

        if (!branchAction || branchName === 'main') {
          // if not continue with the current action but use the subpath as path
          path = subPath;
        }
      }

      const { owner, repo } = converterCfg.multibranch || {};
      if (owner && repo && !branchMatch && actionName === 'main') {
        // the main action, if configured for multi branch, will preview the current path again for
        // every other action in the package
        actions.forEach(({ name }) => {
          const adminUrl = `https://admin.hlx.page/preview/${owner}/${repo}/main/branch/${name}${path}`;
          console.log(`POST ${adminUrl}`);
          fetch(adminUrl, { method: 'POST', headers: { authorization } });
        });
      }
    }

    try {
      throw new Error('test error');
      const {
        error, blob, html, md, contentType,
      } = await pipe.run(
        { path, queryString },
        { ...params, authorization },
        opts,
      );
      const statusCode = error?.code || 200;
      const body = error?.message || html || md || blob;
      const { origin } = converterCfg;
      return {
        statusCode,
        body,
        headers: {
          'content-type': contentType || 'text/plain',
          'x-html2md-img-src': origin,
          'x-converter-action': actionPath,
          'x-converter-path': path,
        },
      };
    } catch (ex) {
      return { error: { statusCode: 500, body: `${ex.stack}`, headers: { 'content-type': 'text/plain' } } };
    }
  };
}
