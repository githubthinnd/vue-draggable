<!-- Undo / redo buttons for useDraggableHistory, with the keyboard shortcuts shown. -->
<script setup lang="ts">
import type { DraggableHistory } from '@stacklogs/vue-draggable/history';

defineProps<{ history: DraggableHistory }>();
</script>

<template>
  <div class="history-toolbar">
    <button
      class="btn"
      data-testid="undo"
      :disabled="!history.canUndo.value"
      title="Undo (⌘Z / Ctrl+Z)"
      @click="history.undo()"
    >
      <AppIcon name="undo" :size="14" /> Undo <kbd>⌘Z</kbd>
    </button>
    <button
      class="btn"
      data-testid="redo"
      :disabled="!history.canRedo.value"
      title="Redo (⇧⌘Z / Ctrl+Y)"
      @click="history.redo()"
    >
      <AppIcon name="redo" :size="14" /> Redo <kbd>⇧⌘Z</kbd>
    </button>
  </div>
</template>

<style>
.history-toolbar {
  display: flex;
  gap: 8px;
}
.history-toolbar .btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
kbd {
  padding: 0 5px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-subtle);
  color: var(--text-subtle);
  font-family: var(--font-mono);
  font-size: 10.5px;
}
</style>
