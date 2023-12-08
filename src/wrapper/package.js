import { h } from 'hastscript';

/* eslint-disable-next-line import/prefer-default-export */
export function toPackage(pipe, opts = {}) {
  const {
    mappingCfg,
    converterCfg,
    origin,
    path,
  } = opts;

  pipe = pipe
    .use(html2xml)
    .use(xml2package);
  return async function () {
    const { error, html } = await pipe.run({
      origin,
      path,
    },
    {},
    { mappingCfg, converterCfg },
    );
  }
}
