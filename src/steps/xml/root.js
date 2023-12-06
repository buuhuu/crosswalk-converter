import { x } from 'xastscript';

export default function root(node, state) {
  console.log('root found -> core/franklin/components/root/v1/root');
  return x(
    'root',
    {
      'jcr:primaryType': 'nt:unstructured',
      'sling:resourceType': 'core/franklin/components/root/v1/root',
    },
  );
}
