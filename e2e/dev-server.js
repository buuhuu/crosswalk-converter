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

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-relative-packages */

import express from "express";
import { toExpress } from "../src/wrapper/re-import.js";
import converterCfg from "./converter.yaml";
import mappingCfg from "./paths.yaml";
import transform from "./import.js";
import { pipe } from "../src/util/pipe.js";
import {
  fetchContent,
  html2md,
  parseMd,
  transformMdast,
  stringifyMdast,
  blobEncode,
} from "../src/steps/index.js";

const app = express();
const port = 3030;

const pipeline = pipe()
  .use(fetchContent)
  .use(html2md)
  .use(parseMd)
  .use(transformMdast)
  .use(stringifyMdast)
  .use(blobEncode);

const handler = pipeline.wrap(toExpress, {
  port,
  transform,
  converterCfg,
  mappingCfg,
});

app.get("/**", handler);
// eslint-disable-next-line no-console
app.listen(port, () => console.log(`Converter listening on port ${port}`));
