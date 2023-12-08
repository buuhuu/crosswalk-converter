import converterCfg from './converter.yaml';
import mappingCfg from './paths.yaml';
import { pipe } from '../src/util/pipe.js';
import {
  blobEncode,
  fetchContent,
  html2md,
  md2html,
  parseMd,
  stringifyMdast,
  transformMdast,
  html2xml,
  xml2package,
} from '../src/steps/index.js';
import toPackage from '../src/wrapper/package.js';

function getUrl() {
  if (process.argv.length > 2) {
    return new URL(process.argv[2]);
  }
  return new URL('http://www.aem.live/developer');
}

function pipeline() {
  return pipe()
    .use(fetchContent)
    .use(html2md)
    .use(parseMd)
    .use(transformMdast)
    .use(stringifyMdast)
    .use(md2html, (_, params) => !params.md)
    .use(blobEncode)
    .use(html2xml)
    .use(xml2package);
}

const url = getUrl();
const { origin = 'http://www.aem.live', pathname = '/developer' } = url;
const requestPath = pathname;
const packageHandler = pipeline().wrap(toPackage, {
  converterCfg,
  mappingCfg,
  origin,
  requestPath,
});

await packageHandler();
