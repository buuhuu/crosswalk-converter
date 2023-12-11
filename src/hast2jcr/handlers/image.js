import { select } from 'unist-util-select';
import { encodeHTMLEntities } from '../utils';

function getImage(node) {
  const $image = select('element[tagName=img]', node);
  const { alt, src } = $image.properties;
  return {
    alt: encodeHTMLEntities(alt),
    src: encodeHTMLEntities(src)
  };
}

export default function image(node) {
  const { alt, src: fileReference } = getImage(node);
  return {
    rt: 'core/franklin/components/image/v1/image',
    alt,
    fileReference,
  };
}
