import { x } from 'xastscript';

export default function mainTag() {
  console.log('main found -> this will become the root node in JCR');
  return x('root', {
    'jcr:primaryType': 'nt:unstructured',
    'sling:resourceType': 'core/franklin/components/root/v1/root',
  });
}
