import { DEFAULT_CONVERTER_CFG, DEFAULT_MAPPING_CFG } from "./mocha.js";

export default function toPackage(pipe, opts = {}) {
  const {
    mappingCfg = DEFAULT_MAPPING_CFG,
    converterCfg = DEFAULT_CONVERTER_CFG,
    origin,
    requestPath,
  } = opts;

  /* eslint-disable-next-line func-names */
  return async function () {
    await pipe.run(
      {
        origin,
        path: requestPath,
      },
      {},
      { mappingCfg, converterCfg },
    );
  };
}
