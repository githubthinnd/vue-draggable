// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md. Phase 1 port: behaviour intentionally identical, bugs included.

import {
  ComponentStructure,
  type ComponentNodes,
  type RootInformation,
} from './componentStructure';
import { isHtmlTag, isTransition } from '../util/tags';
import { resolveComponent, TransitionGroup, type Slots, type VNode } from 'vue';

type KeyFunction = (element: unknown) => unknown;

function getSlot(slots: Slots, key: string): VNode[] {
  const slotValue = slots[key];
  return slotValue ? slotValue() : [];
}

function computeNodes({
  $slots,
  realList,
  getKey,
}: {
  $slots: Slots;
  realList: unknown[] | null;
  getKey: KeyFunction;
}): ComponentNodes {
  const normalizedList = realList || [];
  // Same call order as upstream's `["header", "footer"].map(...)`.
  const header = getSlot($slots, 'header');
  const footer = getSlot($slots, 'footer');
  const { item } = $slots;
  if (!item) {
    throw new Error('draggable element must have an item slot');
  }
  const defaultNodes = normalizedList.flatMap((element, index) =>
    item({ element, index }).map((node) => {
      node.key = getKey(element) as VNode['key'];
      node.props = { ...(node.props || {}), 'data-draggable': true };
      return node;
    }),
  );
  if (defaultNodes.length !== normalizedList.length) {
    throw new Error('Item slot must have only one child');
  }
  return {
    header,
    footer,
    default: defaultNodes,
  };
}

function getRootInformation(tag: string): RootInformation {
  const transition = isTransition(tag);
  const externalComponent = !isHtmlTag(tag) && !transition;
  return {
    transition,
    externalComponent,
    tag: externalComponent ? resolveComponent(tag) : transition ? TransitionGroup : tag,
  };
}

function computeComponentStructure({
  $slots,
  tag,
  realList,
  getKey,
}: {
  $slots: Slots;
  tag: string;
  realList: unknown[] | null;
  getKey: KeyFunction;
}): ComponentStructure {
  const nodes = computeNodes({ $slots, realList, getKey });
  const root = getRootInformation(tag);
  return new ComponentStructure({ nodes, root, realList });
}

export { computeComponentStructure };
export type { KeyFunction };
