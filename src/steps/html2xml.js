import rehypeParse from 'rehype-parse';
import { unified } from 'unified';
import hast2jcr from '../hast2jcr/index.js';

export default async function html2xml(state, params, opts) {
  const { html } = state;

  if (!html) {
    return state;
  }

  const hast = unified()
    .use(rehypeParse)
    .parse(html);

  const xml = hast2jcr(hast, opts);
  state.xml = xml;
  return state;
}
