// create a content package based on a content.xml file
import fs from 'fs';
import archiver from 'archiver';

const packageName = 'myPackage';
const packageVersion = '1.0.0';

const output = fs.createWriteStream(`${packageName}-${packageVersion}.zip`);
const archive = archiver('zip');

output.on('close', () => {
  console.log('AEM Package created successfully!');
});

archive.pipe(output);

const contentXML = fs.readFileSync('./src/wrapper/jcr/content.xml', 'utf8');
archive.append(contentXML, { name: 'jcr_root/content/site/page/.content.xml' });

const propertiesXML = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" jcr:primaryType="sling:OsgiConfig">
    <!-- Add your package properties here -->
</jcr:root>`;
archive.append(propertiesXML, { name: 'META-INF/vault/properties.xml' });

const filterXML = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
    <!-- Add your filter rules here -->
</workspaceFilter>`;
archive.append(filterXML, { name: 'META-INF/vault/filter.xml' });

archive.finalize();
