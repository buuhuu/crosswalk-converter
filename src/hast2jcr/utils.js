import { h } from 'hastscript';
import { x } from 'xastscript';

export function matchStructure(node, template) {
  if (node.tagName !== template.tagName) {
    return false;
  }
  const childElements = node.children.filter((child) => child.type === 'element');
  if (childElements.length !== template.children.length) {
    return false;
  }
  if (childElements === 0) {
    return true;
  }
  return childElements.every((child, index) => matchStructure(child, template.children[index]));
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function findMatchingPath(obj, path) {
  const keys = path.split('/');

  const isMatchingPath = (currentKeys, targetKeys) => currentKeys.length === targetKeys.length
    && currentKeys.every((key, index) => key === targetKeys[index]);

  const search = (parentObj, currentPath) => {
    const newPath = currentPath ? `${currentPath}/${parentObj.name}` : `/${parentObj.name}`;
    const childrenObj = parentObj.children || [];
    let matchingChild = childrenObj.find((child) => isMatchingPath([...newPath.split('/'), child.name], keys));
    if (matchingChild) {
      return matchingChild;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const child of childrenObj) {
      matchingChild = search(child, newPath);
      if (matchingChild) {
        return matchingChild;
      }
    }
    return undefined;
  };

  return search(obj, '');
}

export function insertComponent(parent, nodeName, component) {
  const elements = parent.children || [];
  const {
    rt, nt, children, ...rest
  } = component;

  const compNode = x(nodeName, {
    'sling:resourceType': rt,
    'jcr:primaryType': nt || 'nt:unstructured',
    ...rest,
  }, children);

  parent.children = [
    ...elements,
    compNode,
  ];
}

/**
 * Pick a handler based on the semantic HTML structure
 *
 * @param node
 * @param parents
 * @param ctx
 * @return {ScrollLogicalPosition|undefined|*|number|string}
 */
export function getHandler(node, parents, ctx) {
  // TODO: each handler should implement its own 'use' logic
  const { handlers } = ctx;
  if (node.tagName === 'div') {
    if (parents[parents.length - 1]?.tagName === 'main') {
      return handlers.section;
    }
    if (getHandler(parents[parents.length - 1], [...parents.slice(0, -1)], ctx)?.name === 'section') {
      const blockName = node?.properties?.className[0];
      if (blockName === 'columns') {
        return handlers.columns;
      }
      return handlers.block;
    }
  }
  if (node.tagName === 'p') {
    if (node.children.filter((child) => child.type === 'element').length === 1) {
      if (matchStructure(node, h('p', [h('strong', [h('a')])]))
        || matchStructure(node, h('p', [h('a')]))
        || matchStructure(node, h('p', [h('em', [h('a')])]))) {
        return handlers.button;
      }
      if (matchStructure(node, h('p', [h('picture', [h('img')])]))
        || matchStructure(node, h('p', [h('img')]))) {
        return handlers.image;
      }
    }

    return handlers.text;
  }
  if (node.tagName.match(/h[1-6]/)) {
    return handlers.title;
  }
  return undefined;
}

export function createComponentTree() {
  const tree = {};

  return function updateTree(treePath) {
    const path = treePath.split('/');

    function updateNestedTree(obj, props) {
      const component = props[0];
      if (!obj[component]) {
        obj[component] = {};
      }

      if (props.length > 1) {
        return updateNestedTree(obj[component], props.slice(1));
      }
      obj[component].counter = hasOwnProperty(obj[component], 'counter')
        ? obj[component].counter + 1
        : 0;
      return obj[component].counter;
    }

    return updateNestedTree(tree, path);
  };
}
