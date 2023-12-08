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
import { select } from 'unist-util-select';
import { toXml } from 'xast-util-to-xml';
import xmlHandler from './xml/index.js';
import skeleton from './xml/skeleton.js';
import { u } from 'unist-builder';
import paragraph from './xml/paragraph';

function unknown(value) {
  throw new Error(`Cannot transform node of type \`${value.type}\``);
}

function invalid(value) {
  throw new Error(`Expected node, not \`${value}\``);
}

function patch(origin, node) {
  if (origin.position) node.position = position(origin);
}

// Handlers for the different types
function text(node, state) {
  console.log('text node');
  // Check if this node is just whitespace
  if (node.value && node.value.trim().length < 1) {
    console.log(' - whitespace');
    // Return as-is
    return node;
  }
  // Otherwise, defer to paragraph to handle
  console.log(` - actual text: ${node.value}`);
  return paragraph(node, state);
}

function raw(node, state) {
  console.log('raw element', node.value);
  state.parent.attributes.text += node.value;
  return null;
}

function element(hastNode, state) {
  console.log('found element', hastNode.tagName);

  const children = [];
  let index = -1;

  const childState = {
    elementCount: {},
    ...state, // Order is important: will overwrite elementCount with value from state
  };

  const currentElement = xmlHandler(hastNode, childState);

  childState.lastSibling = null // Reset this value before we iterate over child nodes

  // Keep a ref to the parent in childState
  if (currentElement) {
    // Only overwrite when currentElement is defined — otherwise keep a ref to the current parent
    childState.parent = currentElement;
  }

  // Process children, if any
  while (++index < hastNode.children.length) {
    const hastChild = hastNode.children[index];

    // Add a reference in state to the previous sibling, if there is one
    childState.lastSibling = children.length < 1 ? null : children[children.length - 1];

    // Call toXast recursively to process child nodes
    const xmlNode = toXast(hastChild, childState);
    // xmlNode can be null, if it's contents was appended to it's lastSibling node (ie. text)
    if (xmlNode) {
      children.push(xmlNode);
    }
  }

  // If currentElement is not defined, this node's contents was appended to another node
  if (currentElement) {
    const result = {
      type: 'element',
      name: hastNode.tagName,
      ...currentElement,
      children,
    };
    patch(hastNode, result); // Patch replaces each node with its XML representation
    return result;
  }
  return null;
}

const toXast = zwitch('type', {
  handlers: { element, text, raw }, // Each handler should return its own node representation
  invalid,
  unknown,
});

function mergeWithSkeleton(rootNodeXast) {
  const mergedDoc = { ...skeleton };
  const pageNode = select('element [name="jcr:content"]', mergedDoc);
  if (pageNode) {
    pageNode.children = [rootNodeXast,
      u('text', '\n')];
  }
  return mergedDoc;
}

export default function md2xml(state) {
  const { mdast } = state;

  // TODO: at this point, all the section divs in our HTML content have been stripped out
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

    // Using hastscript to create virtual hast trees (for HTML)
    const hastDoc = h('html', [h('body', [h('main', content.hast)])]);

    hastRaw(hastDoc);
    rehypeFormat()(hastDoc);

    // Convert hast tree to a JCR compatible xast tree
    let xastJcrDoc = toXast(select('element [tagName=main]', hastDoc));

    // Merge JCR tree with skeleton tree
    xastJcrDoc = mergeWithSkeleton(xastJcrDoc);

    // const xast = toXast(doc);
    // const xml = toXml(xast);

    // return {
    //   ...state,
    //   html: xml,
    //   contentType: 'application/xml',
    // };

    const xmlState = {
      ...state,
      html: toXml(xastJcrDoc, { closeEmptyElements: true }),
      contentType: 'application/xml',
    };

    console.log(xmlState.html);

    return xmlState;
  }

  return state;
}
