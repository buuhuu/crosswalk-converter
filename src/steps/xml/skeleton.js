import { u } from 'unist-builder';
import { x } from 'xastscript';

// Construct the base JCR page structure using xastscript
const skeleton = u('root', [
  u('instruction', { name: 'xml' }, 'version="1.0" encoding="UTF-8"'),
  u('text', '\n'),
  x(
    'jcr:root',
    {
      'xmlns:jcr': 'http://www.jcp.org/jcr/1.0',
      'xmlns:nt': 'http://www.jcp.org/jcr/nt/1.0',
      'xmlns:cq': 'http://www.day.com/jcr/cq/1.0',
      'xmlns:sling': 'http://sling.apache.org/jcr/sling/1.0',
      'jcr:primaryType': 'cq:Page',
    },
    [
      u('text', '\n  '),
      x(
        'jcr:content',
        {
          'cq:template': '/libs/core/franklin/templates/page',
          'jcr:primaryType': 'cq:PageContent',
          'jcr:title': 'Sites Franklin Example',
          'sling:resourceType': 'core/franklin/components/page/v1/page',
        }
      ),
      u('text', '\n'),
    ],
  ),
  u('text', '\n'),
]);

export default skeleton;
