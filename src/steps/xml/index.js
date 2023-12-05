import { zwitch } from 'zwitch';
import main from './main.js';
import div from './div.js';

function unknown(value) {
  console.log('tag currently not mapped', value.tagName);
}

function invalid(value) {
  throw new Error(`Expected node, not \`${value}\``);
}

const tag = zwitch('tagName', {
  handlers: { main, div },
  invalid,
  unknown,
});

export default async function xml(node, state) {
  return tag(node, state);
}
