import { zwitch } from 'zwitch';
import html from './html.js';
import main from './main.js';
import div from './div.js';

function unknown(value) {
  console.log('tag currently not mapped', value.tagName);
}

function invalid(value) {
  throw new Error(`Expected node, not \`${value}\``);
}

const tag = zwitch('tagName', {
  handlers: { html, main, div }, //img, p, h1-6,
  invalid,
  unknown,
});

export default function xml(node, state) {
  return tag(node, state);
}
