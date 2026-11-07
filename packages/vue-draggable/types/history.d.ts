import type { ComputedRef, Ref } from 'vue';

export interface DraggableHistoryOptions {
  /** Maximum number of undo steps kept. Default 100. */
  capacity?: number;
  /** Bind Ctrl/⌘+Z (undo) and Ctrl/⌘+Shift+Z or Ctrl+Y (redo) while the component is mounted. */
  keyboard?: boolean;
}

export interface DraggableHistory {
  /** Restores the previous state; returns false when there is nothing to undo. */
  undo: () => boolean;
  /** Re-applies the next state; returns false when there is nothing to redo. */
  redo: () => boolean;
  canUndo: ComputedRef<boolean>;
  canRedo: ComputedRef<boolean>;
  /** Forget every step; the current state becomes the starting point. */
  clear: () => void;
  /** Number of steps that can be undone. */
  size: ComputedRef<number>;
}

/**
 * Undo and redo for draggable lists. Pass the ref bound with `v-model` / `:list`, or an array of
 * refs for several lists (one step per drop, even across lists). Items are kept by reference.
 */
export declare function useDraggableHistory(
  source: Ref<any[]> | Ref<any[]>[],
  options?: DraggableHistoryOptions,
): DraggableHistory;
