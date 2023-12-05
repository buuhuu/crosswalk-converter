/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { toHast as mdast2hast, defaultHandlers } from 'mdast-util-to-hast';
import { raw as hastRaw } from 'hast-util-raw';
import { mdast2hastGridTablesHandler, TYPE_TABLE } from '@adobe/mdast-util-gridtables';
import { position } from 'unist-util-position';
import rehypeFormat from 'rehype-format';
import createPageBlocks from '@adobe/helix-html-pipeline/src/steps/create-page-blocks.js';
import { h } from 'hastscript';
import fixSections from '@adobe/helix-html-pipeline/src/steps/fix-sections.js';
import { zwitch } from 'zwitch';
import xmlHandler from './xml/index.js';

function unknown(value) {
  throw new Error('Cannot transform node of type `' + value.type + '`')
}

function invalid(value) {
  throw new Error('Expected node, not `' + value + '`')
}

function patch(origin, node) {
  if (origin.position) node.position = position(origin)
}

function text(node, state) {
  //console.log('text - ignore');
  // TODO this must return a string
  return {};
}

function raw(node, state) {
  console.log('raw element', node.value);
  return node;
}

function element(node, state) {
  console.log('found element', node.tagName);

  const children = [];
  let index = -1;
  const attributes = {};

  const childState = { ...state };
  childState.parent = node.tagName;

  const xml = xmlHandler(node, childState);

  while (++index < node.children.length) {
    const child = node.children[index];
    const result = (toXml(child, childState));
    children[index] = result;
  }
  const result = {
    type: 'element',
    name: node.tagName,
    attributes,
    children,
  };
  patch(node, result);
  return result;
}

const toXml = zwitch('type', {
  handlers: { element, text, raw },
  invalid,
  unknown,
});

export default async function md2xml(state) {
  const { mdast } = state;

  if (mdast) {
    const main = mdast2hast(mdast, {
      handlers: {
        ...defaultHandlers,
        [TYPE_TABLE]: mdast2hastGridTablesHandler(),
      },
      allowDangerousHtml: true,
    });
    const content = { hast: main };

    fixSections({ content });
    createPageBlocks({ content });

    const doc = h('html', [h('body', [h('main', content.hast)])]);

    hastRaw(doc);
    rehypeFormat()(doc);

    const xml = toXml(doc);
    // const xast = toXast(doc);
    // const xml = toXml(xast);

    // return {
    //   ...state,
    //   html: xml,
    //   contentType: 'application/xml',
    // };

    return {
      ...state,
      html: JSON.stringify(xml, null, 2),
      contentType: 'text/plain',
    };
  }

  return state;
}
