<script setup lang="ts">
import { ref } from 'vue';
import { useDraggableHistory } from '@stacklogs/vue-draggable/history';
import { sprintTasks, titles, type Task } from '../data';

const tasks = ref(sprintTasks());
const trash = ref<Task[]>([]);
const history = useDraggableHistory(tasks, { keyboard: true });

const remove = (task: Task): void => {
  tasks.value = tasks.value.filter((t) => t !== task);
};
// Items dropped on the trash leave the list (one history step) and disappear from the trash.
const emptyTrash = (): void => {
  trash.value = [];
};
</script>

<template>
  <DemoLayout>
    <DemoCard
      title="Sprint backlog"
      hint="Drop a row on the trash or outside the card, or use its delete button. Esc cancels a drag."
    >
      <template #actions>
        <HistoryToolbar :history="history" />
      </template>
      <Draggable
        v-model="tasks"
        item-key="id"
        tag="ul"
        class="list"
        data-testid="list"
        group="tasks"
        filter=".row-delete"
        :prevent-on-filter="false"
        :remove-on-spill="true"
        :cancel-on-escape="true"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="dragging"
        :animation="200"
      >
        <template #item="{ element }">
          <li class="item">
            <TaskCard :task="element" />
            <button
              class="row-delete"
              :data-testid="`delete-${element.id}`"
              title="Delete"
              @click="remove(element)"
            >
              <AppIcon name="x" :size="14" />
            </button>
          </li>
        </template>
      </Draggable>
      <Draggable
        v-model="trash"
        item-key="id"
        class="trash-zone"
        data-testid="trash"
        :group="{ name: 'tasks', pull: false, put: true }"
        ghost-class="trash-ghost"
        @add="emptyTrash"
      >
        <template #header>
          <div class="trash-zone__label">
            <AppIcon name="trash" :size="16" /> Drop here to delete
          </div>
        </template>
        <template #item="{ element }">
          <div class="trash-zone__item">{{ element.title }}</div>
        </template>
      </Draggable>
      <p class="hint-row">
        <AppIcon name="keyboard" :size="14" /> <kbd>⌘Z</kbd> undo · <kbd>⇧⌘Z</kbd> redo ·
        <kbd>Esc</kbd> cancel a drag · {{ history.size.value }}
        {{ history.size.value === 1 ? 'change' : 'changes' }}
      </p>
    </DemoCard>
    <template #side>
      <StatePanel label="v-model" :value="tasks.map((t) => t.title)" :summary="titles(tasks)" />
    </template>
  </DemoLayout>
</template>

<style>
.row-delete {
  display: grid;
  flex: none;
  place-items: center;
  width: 26px;
  height: 26px;
  margin-left: 2px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-subtle);
  cursor: pointer;
}
.row-delete:hover {
  background: var(--red-soft);
  color: var(--red);
}
.trash-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  margin-top: 14px;
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius);
  color: var(--text-subtle);
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}
.trash-zone:has(.trash-ghost) {
  border-color: var(--red);
  background: var(--red-soft);
  color: var(--red);
}
.trash-zone__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
.trash-ghost {
  display: none;
}
.trash-zone__item {
  display: none;
}
.hint-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 14px 0 0;
  color: var(--text-subtle);
  font-size: 12px;
}
</style>
