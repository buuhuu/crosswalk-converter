import { visitParents } from 'unist-util-visit-parents';
import convert from 'xml-js';
import skeleton from './skeleton.js';
import { createComponentTree, getHandler, insertComponent } from './utils.js';
import handlers from './handlers/index.js';

function buildPath(parents, { pathMap = new Map() }) {
  let path = '/jcr:root/jcr:content/root';
  for (let i = parents.length - 1; i >= 0; i -= 1) {
    if (pathMap.has(parents[i])) {
      path = pathMap.get(parents[i]);
      break;
    }
  }
  return path;
}

function getNodeName(name, path, { componentTree }) {
  const index = componentTree(`${path}/${name}`);
  return (index === 0) ? name : `${name}_${index - 1}`;
}

export default function hast2jcr(hast, opts = {}) {
  const json = {
    ...skeleton,
  };

  const componentTree = createComponentTree();
  const pathMap = new Map();

  const ctx = {
    handlers,
    json,
    componentTree,
    pathMap,
    ...opts,
  };

  visitParents(hast, 'element', (node, parents) => {
    const handler = getHandler(node, parents, ctx);
    if (handler) {
      const path = buildPath(parents, ctx);
      const nodeName = getNodeName(handler.name, path, ctx);

      const attributes = handler(node, {
        path: `${path}/${nodeName}`,
        ...ctx,
      });

      insertComponent(json.elements[0], path, nodeName, attributes);
      pathMap.set(node, `${path}/${nodeName}`);
    }
  });

  const options = {
    compact: false,
    ignoreComment: true,
    spaces: 4,
  };

  return convert.json2xml(json, options);
}
