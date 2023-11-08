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

const cwd = process.cwd();
const match = cwd.match(/\/node_modules\//);

if (!match) {
  // not installed as a node_module;
  process.exit(0);
}

const projectRoot = cwd.substring(0, match.index);
const converterPath = 'tools/actions/convert';
const importerPath = 'tools/importer';
const fileOpts = { encoding: 'utf-8' };

function md5sum(str) {
  return crypto.createHash('md5').update(str, 'utf-8').digest('hex');
}

async function copyFile(from, to, checksums) {
  const toPath = path.resolve(projectRoot, to);
  const fromPath = path.resolve(cwd, from);

  // if toPath exists, compare if it matches any of the given checksums to veriy that it was not
  // modified
  if (fs.existsSync(toPath)) {
    const toStr = await fs.promises.readFile(toPath, fileOpts);
    const toChecksum = md5sum(toStr);
    const unchanged = checksums.some((checksum) => checksum === toChecksum);
    if (!unchanged) {
      console.log(`Not overwriting changed project file ${to} (${toChecksum})`);
      return;
    }
  }

  const fromStr = await fs.promises.readFile(fromPath, fileOpts);
  const toDirPath = path.dirname(toPath);
  if (!fs.existsSync(toDirPath)) {
    await fs.promises.mkdir(toDirPath, { recursive: true });
  }
  await fs.promises.writeFile(toPath, fromStr, fileOpts);
  console.log(`Copied ${from} to ${to} (${md5sum(fromStr)})`);
}

async function copyFiles() {
  // 1. stage, copy files
  // Each file has a list of checksums of all the former versions of the same file. Files are only
  // copied over existing files, if the existing file has one onf the checksums listed. This means
  // the file was previously copied and not changed by the project.
  const files = [
    {
      from: 'template/index.js',
      to: `${converterPath}/src/index.js`,
      checksums: ['ab9db67a2f1bf04b05d73437c8885c4d'],
    },
    {
      from: 'template/dev-server.js',
      to: `${converterPath}/src/dev-server.js`,
      checksums: ['dd7329d2ffc23702b809c3d484fde5c0'],
    },
    {
      from: 'webpack.config.js',
      to: `${converterPath}/webpack.config.js`,
      checksums: [
        '36c91744646fcb80b83fb6e6c9928c1a',
        '562dbe7dfb28c580d71cb7fa38422aad',
        'd6a32f5e1f01c3a5e9e950c5c1c6e0ab',
      ],
    },
    {
      from: 'template/import.js',
      to: `${importerPath}/import.js`,
      checksums: ['f71fc2a923f5463e10ed6c7e4596ba9e'],
    },
    {
      from: 'template/paths.yaml',
      to: `${projectRoot}/paths.yaml`,
      checksums: ['693fa775878eddff2d1ccdfdf6ff931b'],
    },
    {
      from: 'template/converter.yaml',
      to: `${projectRoot}/converter.yaml`,
      checksums: ['5c8eb41ea456f4933c564cfd060fc14b'],
    },
    {
      from: 'template/converter.test.js',
      to: `${converterPath}/test/converter.test.js`,
      checksums: [
        'c2fcf3c7f759e27ed3e9c39659484e0a',
        '19172e89f964caba268061814d754eca',
      ],
    },
    {
      from: 'test/setup-env.esm.mjs',
      to: `${converterPath}/test/setup-env.esm.mjs`,
      checksums: ['4b71db6f8b27fbcdccfca3b31ba718d0'],
    },
    {
      from: 'test/fixtures/empty.html',
      to: `${converterPath}/test/fixtures/empty.html`,
      checksums: ['73da522e5c5abf9665663d9940c68a71'],
    },
    {
      from: 'test/fixtures/empty-converted.html',
      to: `${converterPath}/test/fixtures/empty-converted.html`,
      checksums: ['216171ec68a8d6fbc037fed3318d45c0'],
    },
    {
      from: 'template/eslintrc.js',
      to: `${converterPath}/.eslintrc.js`,
      checksums: ['70d00a37ccf790f46074ca75972ed7e7'],
    },
    {
      from: 'template/deploy-converter.yaml',
      to: `${projectRoot}/.github/workflows/deploy-converter.yaml`,
      checksums: ['154249ad3371e7acbf661e3f68985650'],
    },
    {
      from: 'template/undeploy-converter.yaml',
      to: `${projectRoot}/.github/workflows/undeploy-converter.yaml`,
      checksums: ['914d0956e0d54482be536e6f0249b993'],
    },
  ];

  await Promise.all(files.map(({ from, to, checksums }) => copyFile(from, to, checksums)));
}

// 2. add scripts to packageJson

async function updatePackageJson() {
  const packageJsonPath = path.resolve(projectRoot, 'package.json');
  const packageJsonStr = await fs.promises.readFile(packageJsonPath, fileOpts);
  const packageJson = JSON.parse(packageJsonStr);

  const scripts = {
    'converter:build': `cd ${converterPath} && rimraf dist/ && webpack`,
    'converter:build:prod': `cd ${converterPath} && rimraf dist/ && webpack -- --env=mode=production`,
    'converter:test': `cd ${converterPath} && instant-mocha --spec test/**/*.test.js --require test/setup-env.esm.mjs --timeout 10000`,
    'converter:serve': 'npm-run-all converter:build --parallel converter:serve:*',
    'converter:serve:build': `cd ${converterPath} && webpack ./src/dev-server.js --watch`,
    'converter:serve:server': `cd ${converterPath} && nodemon --inspect ./dist/index.js --watch ./dist`,
    'converter:deploy': `node node_modules/crosswalk-converter/bin/deploy.mjs ${converterPath}/dist/index.js.zip`,
    'converter:undeploy': 'node node_modules/crosswalk-converter/bin/undeploy.mjs',
  };

  packageJson.scripts = { ...packageJson.scripts, ...scripts };

  await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), fileOpts);
  console.log('Updates package.json');
}

async function postinstall() {
  await copyFiles();
  await updatePackageJson();
}

postinstall();
