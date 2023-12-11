import { h } from 'hastscript';
import { hasSingleChildElement, matchStructure } from '../utils.js';

function getType(node) {
  if (matchStructure(node, h('p', [h('strong', [h('a')])]))) {
    return 'primary';
  }
  if (matchStructure(node, h('p', [h('em', [h('a')])]))) {
    return 'secondary';
  }
  return undefined;
}

function getLink(node) {
  const [buttonNode] = node.children;
  if (!buttonNode || !buttonNode.properties) {
    return { href: '', text: '' };
  }
  if (getType(node)) {
    const { href } = buttonNode.children[0].properties;
    const text = buttonNode.children[0].children[0].value;
    return { href, text };
  }
  const { href } = buttonNode.properties;
  const text = buttonNode.children[0].value;
  return { href, text };
}

const button = {
  use: (node) => {
    if (node.tagName === 'p') {
      if (hasSingleChildElement(node)) {
        if (matchStructure(node, h('p', [h('strong', [h('a')])]))
          || matchStructure(node, h('p', [h('a')]))
          || matchStructure(node, h('p', [h('em', [h('a')])]))) {
          return true;
        }
      }
    }
    return false;
  },
  getAttributes: (node) => {
    const type = getType(node);
    const { href, text } = getLink(node);
    return {
      rt: 'core/franklin/components/button/v1/button',
      type,
      href,
      text,
    };
  },
};

export default button;
