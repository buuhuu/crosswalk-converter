import { h } from 'hastscript';
import { matchStructure } from '../utils.js';

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
  if (getType(node)) {
    const { href } = node.children[0].children[0].properties;
    const text = node.children[0].children[0].children[0].value;
    return { href, text };
  }
  const { href } = node.children[0].properties;
  const text = node.children[0].children[0].value;
  return { href, text };
}

export default function button(node) {
  const type = getType(node);
  const { href, text } = getLink(node);
  return {
    rt: 'core/franklin/components/button/v1/button',
    type,
    href,
    text,
  };
}
