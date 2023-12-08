function getText(node) {
  return node.children.map((child) => child.value).join('');
}

export default function title(node) {
  return {
    rt: 'core/franklin/components/title/v1/title',
    'jcr:title': getText(node),
    type: node.tagName,
  };
}
