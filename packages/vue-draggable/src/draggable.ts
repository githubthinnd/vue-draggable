// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md. Behaviour is identical to 4.1.0 except the fixes listed in
// docs/compat.md §10 "Intentional differences" (each marked `ID-n` below).
//
// Kept as an Options API component on purpose (ADR-0001): user code reaches `_sortable`,
// `targetDomElement`, computed values and methods through template refs.
import {
  getSortable,
  LOG_PREFIX,
  type DraggableItemElement,
  type SortableEvent,
  type SortableInstance,
} from './sortable';
import { insertNodeAt, removeNode } from './util/htmlHelper';
import { console } from './util/console';
import {
  getComponentAttributes,
  createSortableOption,
  getValidSortableEntries,
} from './core/componentBuilderHelper';
import { computeComponentStructure, type KeyFunction } from './core/renderHelper';
import { type ComponentStructure, type DraggableContext } from './core/componentStructure';
import { events } from './core/sortableEvents';
import { draggableDefaultsKey } from './defaults';
import {
  h,
  defineComponent,
  nextTick,
  type ConcreteComponent,
  type PropType,
  type VNode,
} from 'vue';

/**
 * Non-reactive members upstream assigns directly on `this` (they live on the instance context,
 * not in `data`, so Sortable and DOM nodes never become reactive proxies).
 */
interface DraggableInternals {
  _sortable?: SortableInstance;
  targetDomElement: HTMLElement;
  componentStructure: ComponentStructure;
  context: DraggableContext;
  /** ID-5: contexts of every element selected with MultiDrag, set on start. */
  multiContexts?: DraggableContext[] | undefined;
  /** ID-5: child nodes of `targetDomElement` at drag start, to undo plugin DOM moves. */
  domSnapshot?: ChildNode[] | undefined;
  /** ID-1: the missing-element warning is logged once per instance. */
  missingElementWarned?: boolean;
}

interface RelatedContext {
  component?: DraggableComponentInstance | undefined;
  list?: unknown[] | null;
  element?: unknown;
  index?: number;
}

/** The instance shape the module-level helpers below rely on. */
interface DraggableComponentInstance extends DraggableInternals {
  realList: unknown[] | null;
  getUnderlyingVm(domElement: unknown): DraggableContext | null;
  getVmIndexFromDomIndex(domIndex: number): number;
  $emit(event: string, ...args: unknown[]): void;
}

type DragHandler = (evtData: unknown, originalElement: unknown) => unknown;

const internals = (vm: object): DraggableInternals => vm as DraggableInternals;

/** ID-5: MultiDrag delivers every selected element in `items`; one element is a plain drag. */
const multiDragItems = (evt: SortableEvent): DraggableItemElement[] | undefined =>
  Array.isArray(evt.items) && evt.items.length > 1 ? evt.items : undefined;

const contextOf = (element: unknown): DraggableContext | undefined =>
  (element as { __draggable_context?: DraggableContext } | null)?.__draggable_context;

/** Puts the container's children back in the order recorded at drag start (ID-5). */
function restoreSnapshot(container: HTMLElement, snapshot: ChildNode[]): void {
  const keep = new Set<Node>(snapshot);
  for (const node of [...container.childNodes]) {
    if (!keep.has(node)) node.remove();
  }
  for (const node of snapshot) container.appendChild(node);
}

/** ID-1: writes the item contexts and warns once when an item has no element. */
function refreshContexts(vm: object & { $: { subTree: VNode; type: ConcreteComponent } }): void {
  const self = internals(vm);
  const missing = self.componentStructure.updated(vm.$.subTree, vm.$.type);
  if (missing > 0 && !self.missingElementWarned) {
    self.missingElementWarned = true;
    console.warn(
      `${LOG_PREFIX} ${String(missing)} item(s) have no DOM element, so they cannot be dragged. ` +
        'Each item slot must render exactly one element or a component with a single root element.',
    );
  }
}
const asInstance = (vm: object): DraggableComponentInstance => vm as DraggableComponentInstance;

function emit(this: DraggableComponentInstance, evtName: string, evtData: unknown): void {
  void nextTick(() => {
    this.$emit(evtName.toLowerCase(), evtData);
  });
}

function manage(this: DraggableComponentInstance, evtName: string): DragHandler {
  return (evtData, originalElement) => {
    if (this.realList !== null) {
      // Called as a method, like upstream's `this[`onDrag${evtName}`](...)`.
      const handler = (this as unknown as Record<string, DragHandler>)[`onDrag${evtName}`];
      return (handler as DragHandler).call(this, evtData, originalElement);
    }
    return undefined;
  };
}

function manageAndEmit(this: DraggableComponentInstance, evtName: string): DragHandler {
  const delegateCallBack = manage.call(this, evtName);
  return (evtData, originalElement) => {
    delegateCallBack.call(this, evtData, originalElement);
    emit.call(this, evtName, evtData);
  };
}

let draggingElement: HTMLElement | null = null;

// ID-13: Escape cancels the drag in progress (only one drag can be active at a time).
let escapeCancelled = false;
let stopEscape: (() => void) | undefined;
function stopEscapeWatch(): void {
  stopEscape?.();
  stopEscape = undefined;
}

const props = {
  list: {
    type: Array as PropType<unknown[] | null>,
    required: false,
    default: null,
  },
  modelValue: {
    type: Array as PropType<unknown[] | null>,
    required: false,
    default: null,
  },
  itemKey: {
    type: [String, Function] as PropType<string | KeyFunction>,
    required: true,
  },
  clone: {
    type: Function as PropType<(original: unknown) => unknown>,
    default: (original: unknown): unknown => {
      return original;
    },
  },
  tag: {
    type: String,
    default: 'div',
  },
  move: {
    type: Function as PropType<((evt: unknown, originalEvent: unknown) => unknown) | null>,
    default: null,
  },
  componentData: {
    type: Object as PropType<Record<string, unknown> | null>,
    required: false,
    default: null,
  },
} as const;

const emits = [
  'update:modelValue',
  'change',
  ...[...events.manageAndEmit, ...events.emit, ...events.manageAndEmitExtra].map((evt) =>
    evt.toLowerCase(),
  ),
];

const draggableComponent = defineComponent({
  name: 'draggable',

  inheritAttrs: false,

  props,

  emits,

  // ID-11: default SortableJS options provided by the app (null when nothing is provided).
  inject: {
    draggableDefaults: { from: draggableDefaultsKey, default: null },
  },

  data() {
    return {
      error: false,
    };
  },

  render() {
    try {
      this.error = false;
      const { $slots, $attrs, tag, componentData, realList, getKey } = this;
      const componentStructure = computeComponentStructure({
        $slots,
        tag,
        realList,
        getKey,
      });
      internals(this).componentStructure = componentStructure;
      const attributes = getComponentAttributes({ $attrs, componentData });
      return componentStructure.render(h, attributes);
    } catch (err) {
      this.error = true;
      // ID-8: also log it; upstream only rendered the <pre>.
      console.error(`${LOG_PREFIX} Rendering failed:`, err);
      return h('pre', { style: { color: 'red' } }, (err as Error).stack);
    }
  },

  created() {
    if (this.list !== null && this.modelValue !== null) {
      console.error('modelValue and list props are mutually exclusive! Please set one or another.');
    }
    // ID-8: upstream relied on Vue's dev-only "Missing required prop" warning.
    if ((this.itemKey as unknown) === undefined || (this.itemKey as unknown) === null) {
      console.error(
        `${LOG_PREFIX} The "itemKey" prop is required: pass a property name (item-key="id") ` +
          'or a function (:item-key="(element) => element.id").',
      );
    }
  },

  mounted() {
    if (this.error) {
      return;
    }

    const $attrs: Record<string, unknown> = this.$attrs;
    const $el: unknown = this.$el;
    refreshContexts(this);

    // ID-11: provided defaults go under the attributes, so the list's own options win.
    const defaults = this.draggableDefaults as Record<string, unknown> | null;
    const sortableOptions = createSortableOption({
      $attrs: defaults ? { ...defaults, ...$attrs } : $attrs,
      callBackBuilder: {
        manageAndEmit: (event) => manageAndEmit.call(asInstance(this), event),
        emit: (event) => emit.bind(asInstance(this), event),
        manage: (event) => manage.call(asInstance(this), event),
        manageAndEmitExtra: (event) => manageAndEmit.call(asInstance(this), event),
      },
    });
    const element = $el as HTMLElement;
    const targetDomElement =
      element.nodeType === 1 ? element : (element.parentElement as HTMLElement);
    // ID-2: resolved lazily; when SortableJS cannot be loaded the error is logged and the list
    // stays static instead of the mounted hook throwing.
    const Sortable = getSortable();
    if (Sortable) internals(this)._sortable = new Sortable(targetDomElement, sortableOptions);
    internals(this).targetDomElement = targetDomElement;
    (
      targetDomElement as HTMLElement & { __draggable_component__?: unknown }
    ).__draggable_component__ = this;
  },

  updated() {
    refreshContexts(this);
  },

  beforeUnmount() {
    const { _sortable } = internals(this);
    if (_sortable !== undefined) _sortable.destroy();
  },

  computed: {
    realList(): unknown[] | null {
      const { list } = this;
      return list ? list : this.modelValue;
    },

    getKey(): KeyFunction {
      const { itemKey } = this;
      if (typeof itemKey === 'function') {
        return itemKey;
      }
      return (element) => (element as Record<string, unknown>)[itemKey];
    },
  },

  watch: {
    $attrs: {
      handler(newOptionValue: Record<string, unknown>) {
        const { _sortable } = internals(this);
        if (!_sortable) return;
        getValidSortableEntries(newOptionValue).forEach(([key, value]) => {
          _sortable.option(key, value);
        });
      },
      deep: true,
    },
  },

  methods: {
    getUnderlyingVm(domElement: unknown): DraggableContext | null {
      return internals(this).componentStructure.getUnderlyingVm(domElement) || null;
    },

    getUnderlyingPotencialDraggableComponent(
      htmElement: unknown,
    ): DraggableComponentInstance | undefined {
      //TODO check case where you need to see component children
      return (htmElement as { __draggable_component__?: DraggableComponentInstance })
        .__draggable_component__;
    },

    emitChanges(evt: unknown): void {
      void nextTick(() => {
        this.$emit('change', evt);
      });
    },

    alterList(onList: (list: unknown[]) => void): void {
      if (this.list) {
        onList(this.list);
        return;
      }
      // Upstream spreads `modelValue` without a null check; the cast keeps that.
      const newList = [...(this.modelValue as unknown[])];
      onList(newList);
      this.$emit('update:modelValue', newList);
    },

    spliceList(...args: [start: number, deleteCount: number, ...items: unknown[]]): void {
      const spliceList = (list: unknown[]): unknown[] => list.splice(...args);
      this.alterList(spliceList);
    },

    updatePosition(oldIndex: number, newIndex: number): void {
      const updatePosition = (list: unknown[]): unknown[] =>
        list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]);
      this.alterList(updatePosition);
    },

    getRelatedContextFromMoveEvent({
      to,
      related,
    }: {
      to: HTMLElement;
      related: HTMLElement;
    }): RelatedContext {
      const component = this.getUnderlyingPotencialDraggableComponent(to);
      if (!component) {
        return { component };
      }
      const list = component.realList;
      const context = { list, component };
      if (to !== related && list) {
        const destination = component.getUnderlyingVm(related) || {};
        return { ...destination, ...context };
      }
      return context;
    },

    getVmIndexFromDomIndex(domIndex: number): number {
      const { componentStructure, targetDomElement } = internals(this);
      return componentStructure.getVmIndexFromDomIndex(domIndex, targetDomElement);
    },

    onDragStart(evt: SortableEvent): void {
      const self = internals(this);
      const context = this.getUnderlyingVm(evt.item);
      draggingElement = evt.item;
      this.watchEscape(evt);
      if (!context) {
        // ID-1: upstream threw "Cannot read properties of null" here.
        console.error(`${LOG_PREFIX} The dragged element is not a rendered item of this list.`);
        return;
      }
      self.context = context;
      evt.item._underlying_vm_ = this.clone(context.element);
      // ID-5: MultiDrag selection and Swap need the DOM order at start to undo their moves.
      const items = multiDragItems(evt);
      self.multiContexts = undefined;
      self.domSnapshot = undefined;
      if (items || 'swapItem' in evt) {
        // Leave out the engine's temporary nodes: in pointer mode the drag preview already exists
        // when `start` fires, and restoring it would leave a stray copy in the list.
        const engine = getSortable() as { ghost?: unknown; clone?: unknown } | undefined;
        const configured = self._sortable?.options?.['fallbackClass'];
        const fallbackClass = typeof configured === 'string' ? configured : 'sortable-fallback';
        self.domSnapshot = [...self.targetDomElement.childNodes].filter(
          (node) =>
            node !== engine?.ghost &&
            node !== engine?.clone &&
            !(node instanceof Element && node.classList.contains(fallbackClass)),
        );
      }
      if (items) {
        const contexts = items.map((item) => this.getUnderlyingVm(item));
        if (contexts.every((c): c is DraggableContext => c !== null)) {
          self.multiContexts = contexts;
          items.forEach((item, i) => {
            item._underlying_vm_ = this.clone((contexts[i] as DraggableContext).element);
          });
        }
      }
    },

    onDragAdd(evt: SortableEvent): void {
      const items = multiDragItems(evt);
      if (this.isCancelled(evt)) {
        // ID-13: a cancelled drag adds nothing; take the foreign node(s) back out of this list.
        for (const item of items ?? [evt.item]) removeNode(item);
        return;
      }
      if (items) {
        this.onMultiDragAdd(evt, items);
        return;
      }
      if (evt.swapItem && evt.swapItem !== evt.item) {
        this.onSwapAdd(evt, evt.swapItem);
        return;
      }
      const element = evt.item._underlying_vm_;
      if (element === undefined) {
        return;
      }
      removeNode(evt.item);
      const newIndex = this.getVmIndexFromDomIndex(evt.newIndex);
      this.spliceList(newIndex, 0, element);
      const added = { element, newIndex };
      this.emitChanges({ added });
    },

    onDragRemove(evt: SortableEvent): void {
      const self = internals(this);
      const items = multiDragItems(evt);
      if (this.isCancelled(evt)) {
        // ID-13: put the node(s) back and keep the data as it was.
        if (self.domSnapshot) restoreSnapshot(self.targetDomElement, self.domSnapshot);
        else insertNodeAt(self.targetDomElement, evt.item, evt.oldIndex);
        if (evt.pullMode === 'clone') removeNode(evt.clone);
        return;
      }
      if (items && self.domSnapshot) {
        this.onMultiDragRemove(evt, self.domSnapshot);
        return;
      }
      // ID-6 (#34): upstream used `this.$el`, which is a text anchor when the root is a fragment
      // (e.g. tag="transition-group" without componentData.tag) and crashed in insertNodeAt.
      insertNodeAt(self.targetDomElement, evt.item, evt.oldIndex);
      if (evt.pullMode === 'clone') {
        removeNode(evt.clone);
        return;
      }
      if (evt.swapItem && evt.swapItem !== evt.item) {
        this.onSwapRemove(evt.swapItem);
        return;
      }
      if (!(self.context as DraggableContext | undefined)) return; // ID-1: start had no context
      const { index: oldIndex, element } = self.context;
      this.spliceList(oldIndex, 1);
      const removed = { element, oldIndex };
      this.emitChanges({ removed });
    },

    onDragUpdate(evt: SortableEvent): void {
      const self = internals(this);
      if (this.isCancelled(evt)) {
        // ID-13: undo the engine's DOM move and keep the data as it was.
        if (self.domSnapshot) {
          restoreSnapshot(self.targetDomElement, self.domSnapshot);
        } else {
          removeNode(evt.item);
          insertNodeAt(evt.from, evt.item, evt.oldIndex);
        }
        return;
      }
      if (multiDragItems(evt) && self.multiContexts && self.domSnapshot) {
        this.onMultiDragUpdate(self.multiContexts, self.domSnapshot);
        return;
      }
      if (evt.swapItem && evt.swapItem !== evt.item && self.domSnapshot) {
        this.onSwapUpdate(evt.swapItem, self.domSnapshot);
        return;
      }
      removeNode(evt.item);
      insertNodeAt(evt.from, evt.item, evt.oldIndex);
      const { context } = self;
      if (!(context as DraggableContext | undefined)) return; // ID-1: start had no context
      const oldIndex = context.index;
      const newIndex = this.getVmIndexFromDomIndex(evt.newIndex);
      this.updatePosition(oldIndex, newIndex);
      const moved = { element: context.element, oldIndex, newIndex };
      this.emitChanges({ moved });
    },

    computeFutureIndex(relatedContext: RelatedContext, evt: SortableEvent): number {
      if (!relatedContext.element) {
        return 0;
      }
      const domChildren = [...evt.to.children].filter(
        (el) => (el as HTMLElement).style.display !== 'none',
      );
      const currentDomIndex = domChildren.indexOf(evt.related);
      // Upstream assumes a component when `element` is set; the cast keeps that.
      const currentIndex = (
        relatedContext.component as DraggableComponentInstance
      ).getVmIndexFromDomIndex(currentDomIndex);
      const draggedInList = domChildren.indexOf(draggingElement as Element) !== -1;
      return draggedInList || !evt.willInsertAfter ? currentIndex : currentIndex + 1;
    },

    onDragMove(evt: SortableEvent, originalEvent: unknown): unknown {
      const { move, realList } = this;
      if (!move || !realList) {
        return true;
      }

      const relatedContext = this.getRelatedContextFromMoveEvent(evt);
      const futureIndex = this.computeFutureIndex(relatedContext, evt);
      const draggedContext = {
        ...internals(this).context,
        futureIndex,
      };
      const sendEvent = {
        ...evt,
        relatedContext,
        draggedContext,
      };
      return move(sendEvent, originalEvent);
    },

    onDragEnd(): void {
      draggingElement = null;
      const self = internals(this);
      self.multiContexts = undefined;
      self.domSnapshot = undefined;
      stopEscapeWatch();
    },

    /**
     * ID-12: the item was dropped outside every list. With `remove-on-spill` the engine removes the
     * element from the DOM and fires nothing else, so remove it from the data here as well.
     */
    onDragSpill(evt: SortableEvent): void {
      const self = internals(this);
      if (!self._sortable?.options?.['removeOnSpill']) return;
      if (this.isCancelled(evt)) {
        // The engine removes the node right after this event: put it back once it has.
        queueMicrotask(() => {
          if (!evt.item.parentNode) insertNodeAt(self.targetDomElement, evt.item, evt.oldIndex);
        });
        return;
      }
      if (!(self.context as DraggableContext | undefined)) return;
      const { index: oldIndex, element } = self.context;
      this.spliceList(oldIndex, 1);
      this.emitChanges({ removed: { element, oldIndex } });
    },

    /** ID-13: with the `cancel-on-escape` option, Escape cancels the drag in progress. */
    watchEscape(evt: SortableEvent): void {
      stopEscapeWatch();
      escapeCancelled = false;
      const sortable = internals(this)._sortable;
      if (!sortable?.options?.['cancelOnEscape']) return;
      const box = evt.item.getBoundingClientRect();
      const start = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
      const native = (sortable as unknown as { nativeDraggable?: boolean }).nativeDraggable;
      const onKey = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') return;
        escapeCancelled = true;
        // Pointer mode: end the drag where it started (native drags end on Escape by themselves).
        if (!native) {
          document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, ...start }));
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, ...start }));
        }
      };
      document.addEventListener('keydown', onKey, true);
      stopEscape = (): void => {
        document.removeEventListener('keydown', onKey, true);
      };
    },

    /** ID-13: true when this drop belongs to a drag cancelled with Escape. */
    isCancelled(evt: SortableEvent): boolean {
      const sortable = internals(this)._sortable;
      if (!sortable?.options?.['cancelOnEscape']) return false;
      if (escapeCancelled) return true;
      // Native drag and drop ends a cancelled drag with a `dragend` whose drop effect is "none".
      const original = (
        evt as { originalEvent?: { type?: string; dataTransfer?: { dropEffect?: string } } }
      ).originalEvent;
      return original?.type === 'dragend' && original.dataTransfer?.dropEffect === 'none';
    },

    /**
     * ID-5 (#221): MultiDrag sort inside one list. Sortable moved every selected element; read the
     * new order from the DOM, undo the moves, then apply the order to the data in one change.
     */
    onMultiDragUpdate(contexts: DraggableContext[], snapshot: ChildNode[]): void {
      const target = internals(this).targetDomElement;
      const order = [...target.children]
        .map((child) => contextOf(child))
        .filter((c): c is DraggableContext => c !== undefined);
      restoreSnapshot(target, snapshot);
      const list = this.realList ?? [];
      if (order.length !== list.length) {
        console.error(
          `${LOG_PREFIX} MultiDrag: could not read the new order; the list is unchanged.`,
        );
        return;
      }
      const newList = order.map((c) => c.element);
      this.alterList((l) => l.splice(0, l.length, ...newList));
      [...contexts]
        .sort((a, b) => a.index - b.index)
        .forEach((c) => {
          this.emitChanges({
            moved: { element: c.element, oldIndex: c.index, newIndex: order.indexOf(c) },
          });
        });
    },

    /** ID-5: MultiDrag drop from another list: insert every selected element as a block. */
    onMultiDragAdd(evt: SortableEvent, items: DraggableItemElement[]): void {
      const elements = items.map((item) => item._underlying_vm_);
      const firstIndex = Math.min(...(evt.newIndicies ?? []).map((i) => i.index), evt.newIndex);
      items.forEach((item) => {
        removeNode(item);
      });
      if (elements.some((element) => element === undefined)) return;
      const newIndex = this.getVmIndexFromDomIndex(firstIndex);
      this.spliceList(newIndex, 0, ...elements);
      elements.forEach((element, i) => {
        this.emitChanges({ added: { element, newIndex: newIndex + i } });
      });
    },

    /** ID-5: MultiDrag drag out to another list: put the nodes back, remove the elements. */
    onMultiDragRemove(evt: SortableEvent, snapshot: ChildNode[]): void {
      const self = internals(this);
      restoreSnapshot(self.targetDomElement, snapshot);
      const contexts = self.multiContexts;
      if (evt.pullMode === 'clone' || !contexts) return;
      const sorted = [...contexts].sort((a, b) => a.index - b.index);
      this.alterList((list) => {
        for (let i = sorted.length - 1; i >= 0; i--)
          list.splice((sorted[i] as DraggableContext).index, 1);
      });
      sorted.forEach((c) => {
        this.emitChanges({ removed: { element: c.element, oldIndex: c.index } });
      });
    },

    /** ID-5 (#221): Swap inside one list: undo the DOM swap, swap the two elements in the data. */
    onSwapUpdate(swapItem: DraggableItemElement, snapshot: ChildNode[]): void {
      const self = internals(this);
      const swapped = contextOf(swapItem);
      restoreSnapshot(self.targetDomElement, snapshot);
      if (!swapped) return;
      const { element, index: oldIndex } = self.context;
      const newIndex = swapped.index;
      this.alterList((list) => {
        list.splice(newIndex, 1, element);
        list.splice(oldIndex, 1, swapped.element);
      });
      this.emitChanges({ moved: { element, oldIndex, newIndex } });
      this.emitChanges({
        moved: { element: swapped.element, oldIndex: newIndex, newIndex: oldIndex },
      });
    },

    /** ID-5: Swap with an element of this list from another list: the two elements trade places. */
    onSwapAdd(evt: SortableEvent, swapItem: DraggableItemElement): void {
      const element = evt.item._underlying_vm_;
      const swapped = contextOf(swapItem);
      // Undo: the swap item comes back where the dragged element landed, which leaves this list.
      evt.item.parentElement?.insertBefore(swapItem, evt.item);
      removeNode(evt.item);
      if (element === undefined || !swapped) return;
      const index = swapped.index;
      this.alterList((list) => list.splice(index, 1, element));
      this.emitChanges({ removed: { element: swapped.element, oldIndex: index } });
      this.emitChanges({ added: { element, newIndex: index } });
    },

    /** ID-5: the other side of `onSwapAdd`: the dragged element is replaced by the swapped one. */
    onSwapRemove(swapItem: DraggableItemElement): void {
      const self = internals(this);
      const swapped = contextOf(swapItem);
      if (!swapped) return;
      const { element, index } = self.context;
      const incoming = this.clone(swapped.element);
      this.alterList((list) => list.splice(index, 1, incoming));
      this.emitChanges({ removed: { element, oldIndex: index } });
      this.emitChanges({ added: { element: incoming, newIndex: index } });
    },
  },
});

export default draggableComponent;
