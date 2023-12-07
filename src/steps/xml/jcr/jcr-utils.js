// Helpers for dealing with JCR nodes
function incrementElementCount(componentName, elementCount) {
  elementCount[componentName] = (elementCount[componentName] || 0) + 1;
}

function getComponentName(componentName, elementCount) {
  const componentCount = elementCount[componentName] || 0;
  return `${componentName}${componentCount > 1 ? `_${componentCount - 2}` : ''}`;
}

function getElementText(node) {
  const textContent = node.children.reduce((acc, child) => {
    if (child.type === 'text') {
      return acc + child.value;
    }
    return acc;
  }, '');

  // Remove all child text nodes, as they were processed above
  node.children = node.children.filter((child) => child.type !== 'text');

  return textContent;
}

export {
  incrementElementCount,
  getComponentName,
  getElementText
}

