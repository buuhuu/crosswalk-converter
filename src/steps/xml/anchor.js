import { x } from 'xastscript';
import { getComponentName, getElementText, incrementElementCount } from './jcr/jcr-utils';
import { toHtml } from 'hast-util-to-html'

// Anchor elements
export default function anchor(node, state) {
  console.log('anchor found');
  const anchorValue = toHtml(node);

  // Append to parent text node
  if (state.parent && state.parent.name === 'text') {
    state.parent.attributes.text += anchorValue;
    // TODO: we've serialized the node to HTML, so we won't iterate it's children.
    // TODO: Unsure about this approach
    node.children = [];
    return null;
  }

  const name = "text";
  incrementElementCount(name, state.elementCount);
  return x(getComponentName(name, state.elementCount), {
    'jcr:primaryType': 'nt:unstructured',
    'sling:resourceType': 'core/franklin/components/title/v1/text',
    'text': anchorValue,
  });
}
