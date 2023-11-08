# Crosswalk Converter

This package implements a conveter serverless function, that can be used to transform html served from an origin service to semantic html that can be imported to Edge Delivery Services using [helix-html2md](https://github.com/adobe/helix-html2md).

## Installation

The converter must be installed in a project created from the [aem-boilerplate](https://github.com/adobe/aem-boilerplate), before it can be build and deployed.

Run the following in the root of the project.

```
npm install --save https://github.com/buuhuu/crosswalk-converter
```

During the installation a few files will be copied into your project, some of them may be changed and others not.

After the installation it is required to configure the origin from which the content to be converted should be fetched. This can be done by changing the `converter.yaml` file installed in the root of the project.

| File | Description | Save to change? |
|------|-------------|-----------------|
| converter.yaml | The converter configuration file. | :+1: | 
| paths.yaml | The path mapping and filtering configuration file. | :+1: | 
| tools/actions/converter/src/index.js | The entrypoint for the serverless function, deployable to Adobe IO Runtime. | depends |
| tools/actions/converter/src/dev-server.js | The local development server built with [Express JS](https://expressjs.com/). | depends |
| tools/actions/converter/webpack.config.js | The webpack configuration used to build for development, testing and production. | :-1: |
| tools/actions/converter/test/converter.test.js | A test suite for the converter comparing input html with converted html. | :+1: |
| tools/actions/converter/test/setup-env.esm.mjs | A script to setup the mocha test environment. | :+1: |
| tools/actions/converter/test/fixtures/** | Fixtures for the converter test test suite. | :+1: |
| tools/importer/import.js | A default import.js for the [@adobe/helix-importer](https://github.com/adobe/helix-importer). | :+1: |

## Run

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

The converter will start to listen on http://localhost:3030

Live reload from the AEM Simulartor is supported, so changing any stylesheet or script will just work as usual.


## Build, Test & Deploy

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

## Implementation Details 

The service is implemented as a pipeline of named pipeline steps. The arguments given to each step are:

- `state`: the state of the pipeline, enriched with each step of the pipeline
- `params`: an object of parameters passed to the pipeline for each request
- `opts`: an object of options passed to the pipeline at instantiation time

Each step returns a mutated `state` object that is the input for the next step. 

The table blow shows the named steps of the default pipeline. Input and Output only relate the fields of `state` that are relevant.


| Step | Description | Input | Output |
|------|-------------|-------|--------|
| fetchContent | Fetches the content from the origin service. | `{ path, queryString }` | `{ blob, contentType, originUrl }` |
| html2md | Parses html and applies `import.js` transformations and transfroms to markdown. | `{ blob, contentType, originUrl }` | `{ md, contentType }` |
| parseMd | Parses markdown into an mdast. | `{ md }` | `{ mdast }` |
| transformMdast | Applies transformations on the mdast. | `{ mdast }` | `{ mdast }` |
| stringifyMdast | Renders the mdast again ast markdown. | `{ mdast }` | `{ md }` |
| md2html | Renders the mdast as html. | `{ mdast }` | `{ html, contentType }` |

After the pipeline is instantiated it can be wrapped for a target platform. There are two wrappers implemented

- [Adobe IO Runtime](src/wrapper/runtime.js)
- [Express JS](src/wrapper/express.js)
- [Mocha](src/wrapper/mocha.js)
