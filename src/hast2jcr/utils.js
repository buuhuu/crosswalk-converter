import { x } from 'xastscript';

export function encodeHTMLEntities(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

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

export function hasSingleChildElement(node) {
  return node.children.filter((child) => {
    if (child.type === 'element') {
      return true;
    } if (child.type === 'text') {
      // Check if this is an empty text node
      return child.value.trim().length > 0;
    }
    // True for other types of nodes (ie. raw)
    return true;
  }).length === 1;
}

/**
 * Pick a handler based on the semantic HTML structure
 *
 * @param node
 * @param parents
 * @param ctx
 * @return {handler|undefined} A handler object that wants to process this node or undefined
 */
export function getHandler(node, parents, ctx) {
  const { handlers } = ctx;
  // Each handler must include its own `use` function to determine
  // if it wants to process the current node.
  const [name, handler] = Object.entries(handlers)
    .find(([, entry]) => entry.use(node, parents, ctx)) || [];
  if (name) {
    return { name, ...handler };
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
