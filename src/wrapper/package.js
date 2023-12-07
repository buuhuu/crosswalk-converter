import {DEFAULT_CONVERTER_CFG, DEFAULT_MAPPING_CFG} from "./mocha.js";

export function toPackage(pipe, opts = {}) {
  const {
    mappingCfg = DEFAULT_MAPPING_CFG,
    converterCfg = DEFAULT_CONVERTER_CFG,
    origin,
    requestPath,
  } = opts;
  
  return async function () {
    const { error, html } = await pipe.run(
      { origin,
        path: requestPath
      },
      {},
      { mappingCfg, converterCfg },
    );
    
  }
}
