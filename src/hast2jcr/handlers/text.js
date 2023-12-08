import { toHtml } from 'hast-util-to-html';
import { insertComponent } from '../utils.js';

const resourceType = 'core/franklin/components/text/v1/text';

function encodeHTMLEntities(str) {
  return str.replace(/</g, '&lt;');
}

function isCollapsible(element) {
  const { attributes = {} } = element;
  return attributes['sling:resourceType'] === resourceType;
}

function getRichText(node) {
  const richText = toHtml(node);
  return encodeHTMLEntities(richText);
  /*
  const textNodes = node.children.filter((child) => child.type === 'text');
  const total = textNodes.map((child) => child.value).join('<br />');
  if (total) {
    return encodeHTMLEntities(`<p>${total}</p>`);
  }
  return '';
   */
}

const text = {
  name: 'text',
  getAttributes: (node) => ({
    rt: resourceType,
    text: getRichText(node),
  }),
  insert: (parent, nodeName, component) => {
    const elements = parent.elements || [];
    const previousSibling = elements.at(-1);
    if (isCollapsible(previousSibling)) {
      previousSibling.attributes.text += component.text;
    } else {
      insertComponent(parent, nodeName, component);
    }
  },
};

export default text;
