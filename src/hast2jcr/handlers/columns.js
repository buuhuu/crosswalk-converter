import { getHandler } from '../utils.js';

function getRows(node, ctx) {
  const elements = [];
  const { pathMap, path } = ctx;
  const rows = node.children.filter((child) => child.type === 'element' && child.tagName === 'div');
  for (let i = 0; i < rows.length; i += 1) {
    pathMap.set(rows[i], `${path}/row${i + 1}`);
    const cols = rows[i].children.filter((child) => child.type === 'element' && child.tagName === 'div');
    const columnElements = [];
    for (let j = 0; j < cols.length; j += 1) {
      pathMap.set(cols[j], `${path}/row${i + 1}/col${j + 1}`);
      columnElements.push({
        type: 'element',
        name: `col${j + 1}`,
        attributes: {
          'jcr:primaryType': 'nt:unstructured',
        },
      });
    }
    elements.push({
      type: 'element',
      name: `row${i + 1}`,
      attributes: {
        'jcr:primaryType': 'nt:unstructured',
      },
      elements: columnElements,
    });
  }
  return elements;
}

const columns = {
  use: (node, parents, ctx) => {
    if (node.tagName === 'div') {
      if (getHandler(parents[parents.length - 1], [...parents.slice(0, -1)], ctx)?.name === 'section') {
        const blockName = node?.properties?.className[0];
        if (blockName === 'columns') {
          return true;
        }
      }
    }
    return false;
  },
  getAttributes: (node, ctx) => {
    const children = getRows(node, ctx);
    return {
      rt: 'core/franklin/components/columns/v1/columns',
      children,
      columns: children.length,
      rows: children[0].elements.length,
    };
  },
};

export default columns;
