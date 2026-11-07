// Undo / redo for draggable lists (`@stacklogs/vue-draggable/history`).
//
// Records the order and membership of one or several arrays after every change (one entry per
// tick, so a move between two lists is a single step) and restores them on undo/redo. Items are
// kept by reference: keys, selection and object identity survive an undo.
import {
  computed,
  getCurrentScope,
  onScopeDispose,
  ref,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue';

interface DraggableHistoryOptions {
  /** Maximum number of undo steps kept. Default 100. */
  capacity?: number;
  /** Bind Ctrl/⌘+Z (undo) and Ctrl/⌘+Shift+Z or Ctrl+Y (redo) while the scope is alive. */
  keyboard?: boolean;
}

interface DraggableHistory {
  undo: () => boolean;
  redo: () => boolean;
  canUndo: ComputedRef<boolean>;
  canRedo: ComputedRef<boolean>;
  /** Forget every step; the current state becomes the starting point. */
  clear: () => void;
  /** Number of steps that can be undone. */
  size: ComputedRef<number>;
}

type Snapshot = unknown[][];

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return false;
  return Boolean(
    el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'),
  );
}

/**
 * Tracks the arrays bound to one or more draggable lists. Pass the same refs you bind with
 * `v-model` or `:list` (an array of refs for several lists, e.g. kanban columns).
 */
function useDraggableHistory(
  source: Ref<unknown[]> | Ref<unknown[]>[],
  options: DraggableHistoryOptions = {},
): DraggableHistory {
  const sources = Array.isArray(source) ? source : [source];
  const capacity = Math.max(1, options.capacity ?? 100);
  const read = (): Snapshot => sources.map((list) => [...list.value]);
  const past = shallowRef<Snapshot[]>([]);
  const future = shallowRef<Snapshot[]>([]);
  const present = ref<Snapshot>(read()) as Ref<Snapshot>;
  let restoring = false;

  const restore = (snapshot: Snapshot): void => {
    restoring = true;
    sources.forEach((list, i) => {
      const items = snapshot[i] ?? [];
      // In place, so lists bound with `:list` (mutated in place) and `v-model` both update.
      list.value.splice(0, list.value.length, ...items);
    });
    present.value = snapshot;
    // The watcher below runs before the next render: let it see the restore, then re-arm.
    queueMicrotask(() => {
      restoring = false;
    });
  };

  watch(
    () => read(),
    (next) => {
      if (restoring) return;
      past.value = [...past.value, present.value].slice(-capacity);
      future.value = [];
      present.value = next;
    },
    { deep: false },
  );

  const undo = (): boolean => {
    const previous = past.value[past.value.length - 1];
    if (!previous) return false;
    past.value = past.value.slice(0, -1);
    future.value = [present.value, ...future.value];
    restore(previous);
    return true;
  };

  const redo = (): boolean => {
    const next = future.value[0];
    if (!next) return false;
    future.value = future.value.slice(1);
    past.value = [...past.value, present.value].slice(-capacity);
    restore(next);
    return true;
  };

  const clear = (): void => {
    past.value = [];
    future.value = [];
    present.value = read();
  };

  if (options.keyboard && typeof window !== 'undefined') {
    const onKey = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey) || isEditable(event.target)) return;
      const key = event.key.toLowerCase();
      const isRedo = (key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey);
      const isUndo = key === 'z' && !event.shiftKey;
      if ((isUndo && undo()) || (isRedo && redo())) event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    if (getCurrentScope()) {
      onScopeDispose(() => {
        window.removeEventListener('keydown', onKey);
      });
    }
  }

  return {
    undo,
    redo,
    clear,
    canUndo: computed(() => past.value.length > 0),
    canRedo: computed(() => future.value.length > 0),
    size: computed(() => past.value.length),
  };
}

export { useDraggableHistory };
export type { DraggableHistory, DraggableHistoryOptions };
