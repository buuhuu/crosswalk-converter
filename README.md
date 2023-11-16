# Crosswalk Converter

This package implements a serverless function, that can be used to transform html served from an origin service to semantic html that can be imported to Edge Delivery Services using [helix-html2md](https://github.com/adobe/helix-html2md).

It is easy to setup and fun use.

## Geting started

### Installation

The converter must be installed in a project created from the [aem-boilerplate](https://github.com/adobe/aem-boilerplate), before it can be build and deployed.

Run the following in the root of the project.

```
npm install --save github:buuhuu/crosswalk-converter
```

During the installation a few files will be copied into your project, some of them may be changed and others not. It is recommended to keep the files unchanged so that they can be automatically updated when updating the crosswalk-converter package. 

After the installation it is required to configure the origin from which the content should be fetched. This can be done by changing the `converter.yaml` file installed in the root of the project.

### converter.yaml

| Field | Description | Example |
|-------|-------------|---------|
| origin | The url of the origin to fetch the content from. | `origin: https://aem.live` |
| suffix<sup>1</sup> | A suffix to append on origin urls, when there is no extension yet. This may be used if the origin requires an extension like `.html` to render. | `suffix: .html` |
| liveUrls<sup>1</sup> | A list of public urls used by the origin. Absolute links with any of these urls will be made domain-relative during the conversion. | `liveUrls:`<br>`  - https://www.aem.live`<br>`  - https://www-stage.aem.live` |
| multibranch<sup>1</sup> | Configuration for multi branch support, see below. | `multibranch`<br>`  - owner: <owner>`<br>`  - repo: <repo>` |

(1) optional

### Run

The pipeline has a wrapper to run it locally using [Express JS](https://expressjs.com/).

It uses the [helix-html-pipeline](https://github.com/adobe/helix-html-pipeline) to render the html in way that mataches almost exactly what would be rendered on hlx.page or hlx.live. 

It also takes care of proxying any non-html requests to the local AEM Simulator running at http://localhost:3000. 

To run the converter locally, first run the local development server in the root of this repository

```
aem up
```

then run the converter using in the current folder

```
npm run converter:serve
```

The converter will start to listen on http://localhost:3030 and will rebuild and restart with every code change.

Live reload from the AEM Simulartor is supported, so changing any stylesheet or script will just work as usual.


### Build, Test & Deploy

To build the module run

```
npm run converter:build
```

or to build for production run

```
npm run converter:build:prod
```

To run the tests use

```
npm run converter:test
```

To deploy use after building for production

```
npm run converter:deploy -- <packageName>/<actionName>
```

This requires setting the environment variables for `wsk`

- `WSK_AUTH`: the Adobe IO Runtime secret
- `WSK_NAMESPACE`: the Adobe IO Runtime namespace
- `WSK_APIHOST`: the Adobe IO Runtime API host

## Usage

There are multiple ways to use the converter. The intented development flow is to either run the converter locally and implement the conversion rules, styles and blocks in one go branch.

### Conversion rules

The converter uses the [@adobe/helix-importer](https://github.com/adobe/helix-importer) framework to convert the html served from the origin. The conversion rules are implemented in the `tools/importer/import.js` file. A boilerplate of that file will be installed automatically and is save to be changed. 

The file is compatible with the [@adobe/helix-importer-ui](https://github.com/adobe/helix-importer-ui), which can be used to efficiently develop the conversion rules. More details on how to use the the [@adobe/helix-importer-ui](https://github.com/adobe/helix-importer-ui) can be found on in the [Importing Content](https://www.aem.live/developer/importer) documentation.


### Regression tests

After a set of conversion rules have been implemented, it is recommended to add regession tests to prevent future changes or dependency updates to break existing conversions. The package installs a test suite for the conversion in `tools/actions/convert/tests/converter.test.js`. Per default it lists the files in the `tools/actions/convert/tests/fixtures` folder and executes a test for each of them.

To add a regression tests, add a new html file `my-component.html` and one with the expected output `my-component-converted.html` in that folder.

The converter users [instant-mocha](https://github.com/privatenumber/instant-mocha/) to run build and and run the tests. 

### Degugging

When devloping conversion rules with the [@adobe/helix-importer-ui](https://github.com/adobe/helix-importer-ui) it is straight forward to debug them in the browser. 

When running the converter locally it will listen for inspector connections per default and a developer tool can be used to connect and debug the converter code.

To debug the test cases, use

```
node --inspect node_modules/.bin/instant-mocha
```

This allows your to break on any source file in your project, but not to step into the code of any dependencies.

### Authorization

For use case where the origin requires authorization it is possible to specify the credentials for the local converter in various ways:

1.  Add a `Authorization` header to the request using a browser extension. The header will be passed through to the origin.
2. Set `AEM_USER` and `AEM_PASSWORD` environment variables to add a basic `Authorization` header to the origin request.
3. Set a `AEM_TOKEN` environment variable to add a bearer `Authorization` header to the origin request.

For (2) and (3) it is possible to create a `.env` file in the project root with the environment variables which will be read with using [dotenv/config](https://github.com/motdotla/dotenv) when starting the converter.

## Implementation Details 

The service is implemented as a pipeline of named pipeline steps. The arguments given to each step are:

- `state`: the state of the pipeline, enriched with each step of the pipeline
- `params`: an object of parameters passed to the pipeline for each request
- `opts`: an object of options passed to the pipeline at instantiation time

Each step returns a mutated `state` object that is the input for the next step. 

The table blow shows the named steps of the default pipeline. Input and Output only relate the fields of `state` that are relevant.

| Step | Description | Input | Output |
|------|-------------|-------|--------|
| fetchContent | Fetches the content from the origin service. | `{ path, queryString }` | `{ blob, contentType, contentLength, originUrl }` |
| html2md | Parses html and applies `import.js` transformations and transfroms to markdown. | `{ blob, contentType, originUrl }` | `{ md, contentType }` |
| parseMd | Parses markdown into an mdast. | `{ md }` | `{ mdast }` |
| transformMdast | Applies transformations on the mdast. | `{ mdast }` | `{ mdast }` |
| stringifyMdast | Renders the mdast again ast markdown. | `{ mdast }` | `{ md }` |
| md2html | Renders the mdast as html. | `{ mdast }` | `{ html, contentType }` |
| blobEncode | If the content is a binary stream and smaller than 764KB, it is based64 encoded as Adobe IO Runtime only supports responses up to 1MB and requires binaries to be returned as base64 encoded strings. | `{ blob }` | `{ blob }` |

After the pipeline is instantiated it can be wrapped for a target platform. There are two wrappers implemented

- [Adobe IO Runtime](src/wrapper/runtime.js)
- [Express JS](src/wrapper/express.js)
- [Mocha](src/wrapper/mocha.js)
