export default function htmlTag(node, state) {
  console.log("html found -> this must be the cq:page node");
  return {
    name: "jcr:content",
    attributes: {
      "jcr:primaryType": "cq:PageContent",
      "cq:template": "/libs/core/franklin/templates/page",
      "sling:resourceType": "core/franklin/components/page/v1/page"
    }
  }
}
