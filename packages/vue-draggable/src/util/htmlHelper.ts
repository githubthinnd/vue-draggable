// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md. Phase 1 port: behaviour intentionally identical, bugs included.

function removeNode(node: Element): void {
  if (node.parentElement !== null) {
    node.parentElement.removeChild(node);
  }
}

function insertNodeAt(fatherNode: Element, node: Element, position: number): void {
  // Upstream throws a TypeError when `children[position - 1]` does not exist; the cast keeps that.
  const refNode =
    position === 0
      ? (fatherNode.children[0] ?? null)
      : (fatherNode.children[position - 1] as Element).nextSibling;
  fatherNode.insertBefore(node, refNode);
}

export { insertNodeAt, removeNode };
