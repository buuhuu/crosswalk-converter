// Helpers for dealing with JCR nodes
import { toHtml } from 'hast-util-to-html';

function incrementElementCount(componentName, elementCount) {
  elementCount[componentName] = (elementCount[componentName] || 0) + 1;
}

function getComponentName(componentName, elementCount) {
  const componentCount = elementCount[componentName] || 0;
  return `${componentName}${componentCount > 1 ? `_${componentCount - 2}` : ''}`;
}

function isTypeIncluded(type) {
  // TODO: in some cases, 'element' types should "break out" of the text node
  return type === 'text' || type === 'raw';
}

function isElementType(type) {
  return type === 'element';
}

function getElementText(node) {
  let textContent = '';

  if (node && node.children) {
    textContent = node.children.reduce((acc, child) => {
      if (isTypeIncluded(child.type)) {
        return acc + child.value;
      }
      if (isElementType(child.type)) {
        return acc + toHtml(child);
      }
      return acc;
    }, '');

    // Filter out all child nodes that were processed above
    node.children = node.children.filter((child) => !(isTypeIncluded(child.type) || isElementType(child.type)));
  }
  else if (node && node.value){
    textContent = node.value;
  }

  return textContent;
}

function isLastSiblingNodeOfSameType(type, lastSibling) {
  // TODO: whitespace is not being handled correctly
  return lastSibling && lastSibling.type && lastSibling.type === type;
}

export {
  incrementElementCount,
  getComponentName,
  getElementText,
  isLastSiblingNodeOfSameType
}
