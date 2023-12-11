import { getHandler } from '../utils.js';

const block = {
  use: (node, parents, ctx) => {
    if (node.tagName === 'div') {
      if (getHandler(parents[parents.length - 1], [...parents.slice(0, -1)], ctx)?.name === 'section') {
        const blockName = node?.properties?.className[0];
        if (blockName !== 'columns') {
          return true;
        }
      }
    }
    return false;
  },
  getAttributes: () => ({
    rt: 'core/franklin/components/block/v1/block',
  }),
};

export default block;
