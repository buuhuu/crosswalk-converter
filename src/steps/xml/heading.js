import { x } from 'xastscript';
import { getComponentName, getElementText, incrementElementCount } from './jcr/jcr-utils';

// Heading (h1 to h6) elements
export default function heading(node, state) {
  console.log('heading found', node);

  const name = "title";
  incrementElementCount(name, state.elementCount);
  return x(getComponentName(name, state.elementCount), {
    'jcr:primaryType': 'nt:unstructured',
    'jcr:title': getElementText(node),
    'sling:resourceType': 'core/franklin/components/title/v1/title',
    'type': node.tagName
  });
}
