// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md.
//
// The single place that imports sortablejs. Upstream used `import Sortable from "sortablejs"`,
// which bundlers sometimes hand over as `{ default: Sortable }` or deeper (#49: "… .a is not a
// constructor"). We take the namespace and unwrap `default` until we find the constructor, and we
// do it lazily so a broken environment logs an error instead of crashing the host on import.
import * as SortableModule from 'sortablejs';
import { console } from './util/console';

/** Prefix of every message this package logs itself (docs/compat.md D-3). */
const LOG_PREFIX = '[vue-draggable]';

/** The subset of a Sortable instance the component uses. */
interface SortableInstance {
  option(name: string, value?: unknown): unknown;
  destroy(): void;
  /** Current options (read without calling `option()`, which tests record as a call). */
  options?: Record<string, unknown>;
}

type SortableConstructor = (new (
  element: HTMLElement,
  options: Record<string, unknown>,
) => SortableInstance) & { mount?: (...plugins: unknown[]) => void };

/** An element Sortable hands to callbacks, with the expandos the component writes on it. */
type DraggableItemElement = HTMLElement & {
  _underlying_vm_?: unknown;
};

/** MultiDrag adds `{ multiDragElement, index }` entries for every selected element. */
interface MultiDragIndex {
  multiDragElement: DraggableItemElement;
  index: number;
}

/** The fields of a Sortable event the component reads. */
interface SortableEvent {
  item: DraggableItemElement;
  clone: HTMLElement;
  from: HTMLElement;
  to: HTMLElement;
  related: HTMLElement;
  oldIndex: number;
  newIndex: number;
  pullMode?: unknown;
  willInsertAfter?: boolean;
  /** MultiDrag plugin (`multi-drag` option): every selected element, in DOM order. */
  items?: DraggableItemElement[];
  oldIndicies?: MultiDragIndex[];
  newIndicies?: MultiDragIndex[];
  /** Swap plugin (`swap` option): the element the dragged one was swapped with, if any. */
  swapItem?: DraggableItemElement | null;
}

/**
 * Finds the Sortable constructor in whatever a bundler handed us: the function itself (CJS/UMD),
 * an ES namespace `{ default }`, or a CJS-in-ESM wrapper `{ default: { default } }`.
 */
function resolveSortable(module: unknown): SortableConstructor | undefined {
  let candidate = module;
  for (let depth = 0; depth < 4; depth++) {
    if (typeof candidate === 'function') return candidate as SortableConstructor;
    if (candidate === null || typeof candidate !== 'object') return undefined;
    candidate = (candidate as { default?: unknown }).default;
  }
  return undefined;
}

let cached: SortableConstructor | undefined;

/** The Sortable constructor, or `undefined` (after logging why) when it cannot be loaded. */
function getSortable(): SortableConstructor | undefined {
  if (cached) return cached;
  cached = resolveSortable(SortableModule);
  if (!cached) {
    console.error(
      `${LOG_PREFIX} Could not load SortableJS: the "sortablejs" import is not a constructor. ` +
        'Check that a single copy of sortablejs is installed and that your bundler resolves it.',
    );
  }
  return cached;
}

export { getSortable, LOG_PREFIX, resolveSortable, SortableModule };
export type {
  DraggableItemElement,
  MultiDragIndex,
  SortableConstructor,
  SortableEvent,
  SortableInstance,
};
