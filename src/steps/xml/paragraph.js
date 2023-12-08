import { x } from 'xastscript';
import {
  getComponentName,
  getElementText,
  incrementElementCount,
  isLastSiblingNodeOfSameType
} from './jcr/jcr-utils';

export default function paragraph(node, state) {
  console.log('paragraph found');
  const textNodeName = "text";
  const elementText = getElementText(node);

  // Check if last sibling node is already a text node
  const lastSibling = state.lastSibling;
  /*
  if (isLastSiblingNodeOfSameType(textNodeName, lastSibling)) {
    // If so, append the text to the last text node
    console.log(' - appending to previous text node');
    lastSibling.value += elementText;
    // Do not create a new node, in this case. Return the parent node
    return null;
  }
  */

  // Check if this node's parent is a text node
  if (state.parent && state.parent.name === textNodeName) {
    // If so, append the text to the parent text node
    console.log(' - appending to parent text node');
    state.parent.value += elementText;
    // Do not create a new node, in this case
    return null;
  }

  // Otherwise, add a new text node
  console.log(` - creating a new text node with text: ${elementText}`);
  incrementElementCount(textNodeName, state.elementCount);
  return x(getComponentName(textNodeName, state.elementCount), {
    'jcr:primaryType': 'nt:unstructured',
    'text': elementText,
    'sling:resourceType': 'core/franklin/components/text/v1/text'
  });
}
