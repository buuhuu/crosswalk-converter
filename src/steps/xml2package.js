import fs from 'fs';
import archiver from 'archiver';
import getArg from '../util/process-utils.js';

function getUrl(state) {
  const { originUrl } = state;
  if (originUrl) {
    return originUrl;
  }
  const { origin, path } = state;
  return new URL(`${origin}${path}`);
}

function removeExtension(pathname) {
  const extension = pathname.split('.').pop();
  return pathname.replace(`.${extension}`, '');
}

function prependContent(pathname) {
  return pathname.startsWith('/content') ? pathname : `/content${pathname}`;
}

function getPath(url) {
  const { pathname } = url;
  return prependContent(removeExtension(pathname));
}

function getFileName(pageName) {
  const filename = getArg('filename') || pageName;
  return removeExtension(filename);
}

export default async function xml2package(state) {
  const url = getUrl(state);
  const path = getPath(url);
  const pageName = path.split('/').pop();
  const filename = getFileName(pageName);
  const author = 'anonymous';
  const now = new Date().toISOString();
  const output = fs.createWriteStream(`${filename}.zip`);
  const archive = archiver('zip');

  output.on('close', () => {
    /* eslint-disable-next-line no-console */
    console.log('AEM Package created successfully!');
  });

  archive.pipe(output);
  // TODO: use the xml output from the previous step
  const contentXML = await state.xml;
  archive.append(contentXML, { name: `jcr_root${path}/.content.xml` });

  const propertiesXML = `<?xml version='1.0' encoding='UTF-8'?>
<!DOCTYPE properties SYSTEM 'http://java.sun.com/dtd/properties.dtd'>
<properties>
<comment>FileVault Package Properties</comment>
<entry key='description'></entry>
<entry key='generator'>org.apache.jackrabbit.vault:3.7.1-T20231005151103-335689a8</entry>
<entry key='packageType'>content</entry>
<entry key='lastWrappedBy'>${author}</entry>
<entry key='packageFormatVersion'>2</entry>
<entry key='group'>my_packages</entry>
<entry key='created'>${now}</entry>
<entry key='lastModifiedBy'>${author}</entry>
<entry key='buildCount'>1</entry>
<entry key='lastWrapped'>${now}</entry>
<entry key='version'></entry>
<entry key='dependencies'></entry>
<entry key='createdBy'>${author}</entry>
<entry key='name'>${pageName}</entry>
<entry key='lastModified'>${now}</entry>
</properties>`;
  archive.append(propertiesXML, { name: 'META-INF/vault/properties.xml' });
  // we assume that the URL path maps to a JCR path
  const filterXML = `<?xml version='1.0' encoding='UTF-8'?>
<workspaceFilter version='1.0'>
    <filter root='${path}'/>
</workspaceFilter>`;
  archive.append(filterXML, { name: 'META-INF/vault/filter.xml' });
  archive.finalize();
  return state;
}
