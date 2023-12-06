import { x } from 'xastscript';

export default function divTag(node, state) {
  const commonAttributes = {
    'jcr:primaryType': 'nt:unstructured'
  };

  if (state.parent === 'root') { // "root" in this case is analogous to "main" in the Edge Delivery DOM
    console.log('div found as direct child of the root -> this must be a section node');
    return x(`section${state.nameSuffix}`, {
      ...commonAttributes,
      'sling:resourceType': 'core/franklin/components/section/v1/section',
    });
  }

  console.log('div found in section -> this must be a block node');
  return x(`block${state.nameSuffix}`, {
    ...commonAttributes,
    'sling:resourceType': 'core/franklin/components/block/v1/block',
  });
}
