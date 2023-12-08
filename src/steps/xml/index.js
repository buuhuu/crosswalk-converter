import { zwitch } from 'zwitch';
import root from './root.js';
import main from './main.js';
import div from './div.js';
import heading from './heading';
import p from './paragraph.js';
import a from './anchor.js';

// Unknown tag elements end up here
function unknown(value) {
  console.log('tag currently not mapped', value.tagName);
}

function invalid(value) {
  throw new Error(`Expected node, not \`${value}\``);
}

const tag = zwitch('tagName', {
  handlers: {
    root,
    main,
    div,
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    h5: heading,
    h6: heading,
    p,
    a
  }, // Need to add other handlers for title, p, img
  invalid,
  unknown,
});

export default function xml(node, state) {
  return tag(node, state);
}
