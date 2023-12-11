import { x } from 'xastscript';

const jcrRoot = x('jcr:root', {
  'xmlns:jcr': 'http://www.jcp.org/jcr/1.0',
  'xmlns:nt': 'http://www.jcp.org/jcr/nt/1.0',
  'xmlns:cq': 'http://www.day.com/jcr/cq/1.0',
  'xmlns:sling': 'http://sling.apache.org/jcr/sling/1.0',
  'jcr:primaryType': 'cq:Page',
}, [x('jcr:content', {
  'cq:template': '/libs/core/franklin/templates/page',
  'jcr:primaryType': 'cq:PageContent',
  'jcr:title': 'Sites Franklin Example',
  'sling:resourceType': 'core/franklin/components/page/v1/page',
}, [x('root', {
  'jcr:primaryType': 'nt:unstructured',
  'sling:resourceType': 'core/franklin/components/root/v1/root',
})])]);

const skeleton = {
  declaration: {
    attributes: {
      version: '1.0',
      encoding: 'UTF-8',
    },
  },
  children: [jcrRoot],
};

export default skeleton;
