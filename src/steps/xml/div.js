import { x } from 'xastscript';
import { getComponentName, incrementElementCount } from './jcr/jcr-utils';

export default function divTag(node, state) {
  // TODO: handle divs with className containing "metadata"

  const commonAttributes = {
    'jcr:primaryType': 'nt:unstructured'
  };

  if (state.parent === 'main') {
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
