// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md. Phase 1 port: behaviour intentionally identical, bugs included.

import { isVNode, type Component, type ConcreteComponent, type VNode, type h as H } from 'vue';

interface DraggableContext {
  element: unknown;
  index: number;
}

interface ContextHolder {
  __draggable_context?: DraggableContext;
}

interface ComponentNodes {
  header: VNode[];
  default: VNode[];
  footer: VNode[];
}

interface RootInformation {
  transition: boolean;
  externalComponent: boolean;
  tag: string | Component;
}

const getHtmlElementFromNode = ({ el }: VNode): VNode['el'] => el;
const addContext = (domElement: object, context: DraggableContext): DraggableContext =>
  ((domElement as ContextHolder).__draggable_context = context);

/**
 * Item vnodes that were actually mounted, found by walking the rendered tree from `root`.
 *
 * Fix for #140/#180/#159/#188/#228 (docs/compat.md ID-1): since Vue 3.2.32 `TransitionGroup`
 * mounts `cloneVNode` copies of its keyed children, so the vnodes the draggable created keep
 * `el === null` and upstream threw "Cannot set properties of null (setting '__draggable_context')".
 * The mounted copies keep the key and the `data-draggable` prop. The walk stops at item vnodes and
 * at nested draggables (`ownType`), so it never collects another list's items.
 */
function collectMountedItems(root: VNode, ownType: ConcreteComponent | undefined): VNode[] {
  const found: VNode[] = [];
  const visit = (vnode: VNode, isRoot: boolean): void => {
    if (!isRoot && ownType !== undefined && vnode.type === ownType) return;
    const { props } = vnode;
    if (props?.['data-draggable'] === true && vnode.el) {
      found.push(vnode);
      return;
    }
    if (vnode.component) {
      visit(vnode.component.subTree, false);
      return;
    }
    if (Array.isArray(vnode.children)) {
      for (const child of vnode.children) {
        if (isVNode(child)) visit(child, false);
      }
    }
  };
  visit(root, true);
  return found;
}

/** For each item vnode, its own element or the element of its mounted copy (same key). */
function resolveElements(
  defaultNodes: VNode[],
  root: VNode | null | undefined,
  ownType: ConcreteComponent | undefined,
): (object | null)[] {
  if (!root || defaultNodes.every((node) => node.el)) {
    return defaultNodes.map((node) => node.el as object | null);
  }
  const byKey = new Map<unknown, VNode[]>();
  for (const vnode of collectMountedItems(root, ownType)) {
    const list = byKey.get(vnode.key) ?? [];
    list.push(vnode);
    byKey.set(vnode.key, list);
  }
  return defaultNodes.map((node) => {
    if (node.el) return node.el;
    const copy = byKey.get(node.key)?.shift();
    return (copy?.el as object | null | undefined) ?? null;
  });
}
const getContext = (domElement: unknown): DraggableContext | undefined =>
  (domElement as ContextHolder).__draggable_context;

class ComponentStructure {
  defaultNodes: VNode[];
  children: VNode[];
  externalComponent: boolean;
  rootTransition: boolean;
  tag: string | Component;
  realList: unknown[] | null;
  /** Mounted element of each item (index-aligned with `defaultNodes`), set by `updated()`. */
  elements: (object | null)[] = [];

  constructor({
    nodes: { header, default: defaultNodes, footer },
    root,
    realList,
  }: {
    nodes: ComponentNodes;
    root: RootInformation;
    realList: unknown[] | null;
  }) {
    this.defaultNodes = defaultNodes;
    this.children = [...header, ...defaultNodes, ...footer];
    this.externalComponent = root.externalComponent;
    this.rootTransition = root.transition;
    this.tag = root.tag;
    this.realList = realList;
  }

  get _isRootComponent(): boolean {
    return this.externalComponent || this.rootTransition;
  }

  render(h: typeof H, attributes: Record<string, unknown>): VNode {
    const { tag, children, _isRootComponent } = this;
    const option = !_isRootComponent ? children : { default: () => children };
    return h(tag as string, attributes, option);
  }

  /**
   * Writes `__draggable_context` on every item element. `root` is the draggable's rendered subtree
   * and `ownType` its component definition (both optional, for callers of the 4.1.0 signature).
   * Returns how many items have no element; those are skipped instead of throwing.
   */
  updated(root?: VNode | null, ownType?: ConcreteComponent): number {
    const { defaultNodes, realList } = this;
    this.elements = resolveElements(defaultNodes, root, ownType);
    let missing = 0;
    defaultNodes.forEach((_, index) => {
      const element = this.elements[index];
      if (!element) {
        missing++;
        return;
      }
      addContext(element, {
        // Upstream indexes `realList` without a null check; the cast keeps that.
        element: (realList as unknown[])[index],
        index,
      });
    });
    return missing;
  }

  getUnderlyingVm(domElement: unknown): DraggableContext | undefined {
    return getContext(domElement);
  }

  getVmIndexFromDomIndex(domIndex: number, element: Element): number {
    const { defaultNodes } = this;
    const { length } = defaultNodes;
    const domChildren = element.children;
    const domElement = domChildren.item(domIndex);

    if (domElement === null) {
      return length;
    }
    const context = getContext(domElement);
    if (context) {
      return context.index;
    }

    if (length === 0) {
      return 0;
    }
    const firstDomListElement =
      this.elements[0] ?? getHtmlElementFromNode(defaultNodes[0] as VNode);
    const indexFirstDomListElement = [...domChildren].findIndex(
      (child) => child === firstDomListElement,
    );
    return domIndex < indexFirstDomListElement ? 0 : length;
  }
}

export { ComponentStructure };
export type { ComponentNodes, DraggableContext, RootInformation };
