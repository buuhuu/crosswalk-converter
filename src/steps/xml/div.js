import { x } from 'xastscript';
import { getComponentName, incrementElementCount } from './jcr/jcr-utils';

function handleMetadata(hastNode, state) {
  console.log("metadata div");
  // TODO: handle metadata, including title, description, etc.
  // For now, clear the children of this node, such that further processing is skipped
  hastNode.children = [];
  return null;
}

export default function divTag(node, state) {
  // Check if this is a "metadata" div
  if (node.properties.className && node.properties.className.includes('metadata')) {
    return handleMetadata(node, state);
  }

  const commonAttributes = {
    'jcr:primaryType': 'nt:unstructured'
  };

  if (state.parent.name === 'root') {
    console.log('div found as direct child of the main element -> this must be a section node');
    const name = "section";
    incrementElementCount(name, state.elementCount);
    return x(getComponentName(name, state.elementCount), {
      ...commonAttributes,
      'sling:resourceType': 'core/franklin/components/section/v1/section',
    });
  }

  console.log('div found in section -> this must be a block node');
  const name = "block";
  incrementElementCount(name, state.elementCount);
  return x(getComponentName(name, state.elementCount), {
    ...commonAttributes,
    'sling:resourceType': 'core/franklin/components/block/v1/block',
  });
}
