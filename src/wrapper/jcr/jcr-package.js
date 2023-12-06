// create a content package based on a content.xml file
import fs from 'fs';
import archiver from 'archiver';

const packageName = 'magazine1';
const path = '/content/test-jck-xwalk/us/en/magazine';
const author = 'jkautzma@adobe.com';
const now = new Date().toISOString();

const output = fs.createWriteStream(`${packageName}.zip`);
const archive = archiver('zip');

output.on('close', () => {
  console.log('AEM Package created successfully!');
});

archive.pipe(output);

const contentXML = fs.readFileSync('./src/wrapper/jcr/content.xml', 'utf8');
archive.append(contentXML, { name: `jcr_root${path}/.content.xml` });

const propertiesXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
<comment>FileVault Package Properties</comment>
<entry key="description"></entry>
<entry key="generator">org.apache.jackrabbit.vault:3.7.1-T20231005151103-335689a8</entry>
<entry key="packageType">content</entry>
<entry key="lastWrappedBy">${author}</entry>
<entry key="packageFormatVersion">2</entry>
<entry key="group">my_packages</entry>
<entry key="created">${now}</entry>
<entry key="lastModifiedBy">${author}</entry>
<entry key="buildCount">1</entry>
<entry key="lastWrapped">${now}</entry>
<entry key="version"></entry>
<entry key="dependencies"></entry>
<entry key="createdBy">${author}</entry>
<entry key="name">${packageName}</entry>
<entry key="lastModified">${now}</entry>
</properties>`;
archive.append(propertiesXML, { name: 'META-INF/vault/properties.xml' });

const filterXML = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
    <filter root="${path}"/>
</workspaceFilter>`;
archive.append(filterXML, { name: 'META-INF/vault/filter.xml' });

archive.finalize();
