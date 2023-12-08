import { toHtml } from 'hast-util-to-html';

function encodeHTMLEntities(str) {
  return str.replace(/</g, '&lt;');
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

export default function text(node) {
  return {
    rt: 'core/franklin/components/text/v1/text',
    text: getRichText(node),
  };
}
