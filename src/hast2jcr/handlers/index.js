import block from './block.js';
import button from './button.js';
import columns from './columns.js';
import image from './image.js';
import section from './section.js';
import text from './text.js';
import title from './title.js';

/**
 * All handler objects must implement the Handler type.
 *
 * type Handler = {
 *   use: (node, parents?, ctx?) => boolean,
 *   getAttributes: (node, ctx?) => Record(string, string),
 *   insert?: (parentNode, nodeName, attributes) => void,
 * }
 *
 */
export default {
  block,
  button,
  columns,
  image,
  section,
  text,
  title,
};
