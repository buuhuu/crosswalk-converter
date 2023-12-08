import converterCfg from './converter.yaml';
import mappingCfg from './paths.yaml';
import { pipe } from '../src/util/pipe.js';
import {
  blobEncode,
  fetchContent,
  html2md,
  md2xml,
  parseMd,
  stringifyMdast,
  transformMdast,
  xml2package,
} from '../src/steps/index.js';
import toPackage from '../src/wrapper/package.js';
import getArg from '../src/util/process-utils.js';

function getUrl() {
  return new URL(getArg() || 'http://www.aem.live/developer');
}

function pipeline() {
  return pipe()
    .use(fetchContent)
    .use(html2md)
    .use(parseMd)
    .use(transformMdast)
    .use(stringifyMdast)
    .use(md2xml, (_, params) => !params.md)
    .use(blobEncode)
    .use(xml2package);
}

const url = getUrl();
const requestPath = url.pathname;
const packageHandler = pipeline().wrap(toPackage, {
  converterCfg,
  mappingCfg,
  origin: url.origin,
  requestPath,
});

await packageHandler();
