import { zwitch } from 'zwitch';
import root from './root.js';
import main from './main.js';
import div from './div.js';

// Unknown tag elements end up here
function unknown(value) {
  console.log('tag currently not mapped', value.tagName);
}

function invalid(value) {
  throw new Error(`Expected node, not \`${value}\``);
}

const tag = zwitch('tagName', {
  handlers: { root, main, div }, // Need to add other handlers for title, p, img, h1-6
  invalid,
  unknown,
});

export default function xml(node, state) {
  return tag(node, state);
}
