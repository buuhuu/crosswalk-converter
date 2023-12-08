import { visitParents } from 'unist-util-visit-parents';
import convert from 'xml-js';
import skeleton from './skeleton.js';
import { createComponentTree, getHandler, insertComponent } from './utils.js';
import handlers from './handlers/index.js';

export default async function hast2jcr(hast, opts = {}) {
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
    let path = '/jcr:root/jcr:content/root';
    const handler = getHandler(node, parents, ctx);
    if (handler) {
      for (let i = parents.length - 1; i >= 0; i -= 1) {
        if (pathMap.has(parents[i])) {
          path = pathMap.get(parents[i]);
          break;
        }
      }
      const index = componentTree(`${path}/${handler.name}`);
      const nodeName = (index === 0) ? handler.name : `${handler.name}_${index - 1}`;
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
