// CommonJS entry: `require('@vue-draggable/core')` returns the component itself (compat.md P-2).
import type * as T from './component.js';

declare const draggable: T.DraggableComponent;

declare namespace draggable {
  export type DraggableChangeEvent<E = any> = T.DraggableChangeEvent<E>;
  export type DraggableComponent = T.DraggableComponent;
  export type DraggableContext<E = any> = T.DraggableContext<E>;
  export type DraggableInstance<E = any> = T.DraggableInstance<E>;
  export type DraggableInstanceMembers<E = any> = T.DraggableInstanceMembers<E>;
  export type DraggableListeners<E = any> = T.DraggableListeners<E>;
  export type DraggableMoveEvent<E = any> = T.DraggableMoveEvent<E>;
  export type DraggableProps<E = any> = T.DraggableProps<E>;
  export type DraggableSlots<E = any> = T.DraggableSlots<E>;
  export type SortableOptionAttrs = T.SortableOptionAttrs;
}

export = draggable;
