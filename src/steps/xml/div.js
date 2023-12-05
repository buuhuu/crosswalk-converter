export default function divTag(node, state) {
  if (state.parent === "main") {
    console.log(
      "div found as direct child of main -> this must be a section node"
    );
  } else {
    console.log("div found in section -> this must be a block node");
  }
}
