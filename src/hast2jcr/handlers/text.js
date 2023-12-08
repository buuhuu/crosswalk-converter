import { toHtml } from 'hast-util-to-html';
import { insertComponent } from '../utils.js';

function encodeHTMLEntities(str) {
  return str.replace(/</g, '&lt;');
}

function isCollapsible({ rt }, elements) {
  const { attributes } = elements.at(-1);
  return rt === attributes['sling:resourceType'];
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
    rt: 'core/franklin/components/text/v1/text',
    text: getRichText(node),
  }),
  insert: (parent, nodeName, component) => {
    const elements = parent.elements || [];
    if (isCollapsible(component, elements)) {
      const lastElement = elements.at(-1);
      lastElement.attributes.text += component.text;
    } else {
      insertComponent(parent, nodeName, component);
    }
  },
};

export default text;
