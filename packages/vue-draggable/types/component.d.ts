/**
 * Public types of @stacklogs/vue-draggable.
 *
 * Props, events and template refs are deliberately permissive (`any` payloads, `Function` props)
 * so existing code keeps type-checking. The item type `T` is inferred from `list` / `modelValue`
 * and types the `item` slot. Only long-standing Vue 3 type exports are used.
 */
import type {
  AllowedComponentProps,
  ComponentCustomProps,
  ComponentPublicInstance,
  VNode,
  VNodeProps,
} from 'vue';

/** `{ element, index }` of an item, as stored on its element (`__draggable_context`). */
export interface DraggableContext<T = any> {
  element: T;
  index: number;
}

/** Payload of the `change` event (the change event). */
export type DraggableChangeEvent<T = any> =
  | { added: { element: T; newIndex: number } }
  | { removed: { element: T; oldIndex: number } }
  | { moved: { element: T; oldIndex: number; newIndex: number } };

/** First argument of the `move` callback: the drag move event plus the list contexts. */
export interface DraggableMoveEvent<T = any> {
  [key: string]: any;
  draggedContext: DraggableContext<T> & { futureIndex: number };
  relatedContext: {
    component?: any;
    list?: any[] | null;
    element?: any;
    index?: number;
  };
  from: HTMLElement;
  to: HTMLElement;
  dragged: HTMLElement;
  related: HTMLElement;
  willInsertAfter?: boolean;
}

/** Slots: `item` renders one root element per list element; `header`/`footer` are not draggable. */
export interface DraggableSlots<T = any> {
  item?: (props: { element: T; index: number }) => VNode[];
  header?: () => VNode[];
  footer?: () => VNode[];
}

/**
 * Drag options are passed as attributes (kebab-case or camelCase). They are listed with `any`
 * for editor completion only; any value is accepted.
 */
export interface SortableOptionAttrs {
  animation?: any;
  chosenClass?: any;
  dataIdAttr?: any;
  delay?: any;
  delayOnTouchOnly?: any;
  direction?: any;
  disabled?: any;
  dragClass?: any;
  draggable?: any;
  dragoverBubble?: any;
  dropBubble?: any;
  easing?: any;
  emptyInsertThreshold?: any;
  fallbackClass?: any;
  fallbackOnBody?: any;
  fallbackTolerance?: any;
  filter?: any;
  forceFallback?: any;
  ghostClass?: any;
  group?: any;
  handle?: any;
  ignore?: any;
  invertSwap?: any;
  invertedSwapThreshold?: any;
  preventOnFilter?: any;
  removeCloneOnHide?: any;
  sort?: any;
  swapThreshold?: any;
  touchStartThreshold?: any;
  /** MultiDrag plugin (mount it with `mountSortablePlugins('MultiDrag')`). */
  multiDrag?: any;
  selectedClass?: any;
  multiDragKey?: any;
  avoidImplicitDeselect?: any;
  /** Swap plugin (mount it with `mountSortablePlugins('Swap')`). */
  swap?: any;
  swapClass?: any;
  /** AutoScroll plugin (mounted by default). */
  scroll?: any;
  scrollSensitivity?: any;
  scrollSpeed?: any;
  bubbleScroll?: any;
}

/** Listener props. Payloads are `any` like in 4.1.0; annotate with the exported event types. */
export interface DraggableListeners<T = any> {
  'onUpdate:modelValue'?: (value: T[]) => any;
  onChange?: (evt: any) => any;
  onStart?: (evt: any) => any;
  onAdd?: (evt: any) => any;
  onRemove?: (evt: any) => any;
  onUpdate?: (evt: any) => any;
  onEnd?: (evt: any) => any;
  onChoose?: (evt: any) => any;
  onUnchoose?: (evt: any) => any;
  onSort?: (evt: any) => any;
  onFilter?: (evt: any) => any;
  onClone?: (evt: any) => any;
}

/** Props . Function props also accept `Function`, as 4.1.0's types did. */
export interface DraggableProps<T = any> extends SortableOptionAttrs, DraggableListeners<T> {
  list?: T[] | null;
  modelValue?: T[] | null;
  /** Required at runtime; optional in the types because 4.1.0's types made it optional. */
  itemKey?: string | ((element: T) => any) | Function;
  clone?: ((original: T) => any) | Function;
  tag?: string;
  move?: ((evt: DraggableMoveEvent<T>, originalEvent: any) => any) | Function | null;
  componentData?: Record<string, any> | null;
}

/** What a template ref to the component exposes . */
export interface DraggableInstanceMembers<T = any> {
  list: T[] | null;
  modelValue: T[] | null;
  itemKey: string | Function;
  clone: Function;
  tag: string;
  move: Function | null;
  componentData: Record<string, any> | null;
  error: boolean;
  realList: T[] | null;
  getKey: (element: T) => any;
  /** The drag-and-drop instance of this list (after mount). */
  _sortable?: any;
  targetDomElement?: HTMLElement;
  componentStructure?: any;
  context?: DraggableContext<T>;
  getUnderlyingVm(domElement: any): any;
  getUnderlyingPotencialDraggableComponent(htmElement: any): any;
  emitChanges(evt: any): void;
  alterList(onList: any): void;
  spliceList(...args: any[]): void;
  updatePosition(oldIndex: any, newIndex: any): void;
  getRelatedContextFromMoveEvent(evt: { to: any; related: any }): any;
  getVmIndexFromDomIndex(domIndex: any): any;
  onDragStart(evt: any): void;
  onDragAdd(evt: any): void;
  onDragRemove(evt: any): void;
  onDragUpdate(evt: any): void;
  computeFutureIndex(relatedContext: any, evt: any): any;
  onDragMove(evt: any, originalEvent: any): any;
  onDragEnd(): void;
}

export type DraggableInstance<T = any> = Omit<
  ComponentPublicInstance,
  '$props' | '$slots' | '$emit'
> &
  DraggableInstanceMembers<T> & {
    $props: DraggableProps<T> & VNodeProps & AllowedComponentProps & ComponentCustomProps;
    $slots: DraggableSlots<T>;
    $emit: (event: string, ...args: any[]) => void;
  };

/**
 * The component. A generic construct signature: Volar (vue-tsc) instantiates it with the props
 * written in the template, so `T` is inferred from `list` / `modelValue`; `InstanceType<typeof
 * draggable>` still works (`T` defaults to `any`).
 */
export interface DraggableComponent {
  new <T = any>(
    props?: DraggableProps<T> & VNodeProps & AllowedComponentProps & ComponentCustomProps,
  ): DraggableInstance<T>;
  /** Component options as seen at runtime (registration with `components` / `app.component`). */
  name: string;
  inheritAttrs: boolean;
  props: Record<string, any>;
  emits: string[];
  [option: string]: any;
}
