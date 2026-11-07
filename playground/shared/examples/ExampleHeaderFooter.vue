<script setup lang="ts">
import { ref } from 'vue';
import { sprintTasks, titles, type Task } from '../data';

const tasks = ref(sprintTasks().slice(0, 3));
let next = 100;
const add = (): void => {
  const task: Task = {
    id: next,
    title: `New task #${next++}`,
    tag: 'Todo',
    tone: 'gray',
    assignee: 'You',
  };
  tasks.value.push(task);
};
</script>

<template>
  <DemoLayout>
    <DemoCard title="Backlog" hint="Header and footer are rendered by slots and never move.">
      <Draggable
        v-model="tasks"
        item-key="id"
        tag="ul"
        class="list"
        data-testid="list"
        draggable=".item"
        ghost-class="ghost"
        :animation="200"
      >
        <template #header>
          <li class="list-header" data-testid="header">
            <span>Backlog</span><span class="pill pill-gray">{{ tasks.length }}</span>
          </li>
        </template>
        <template #item="{ element }">
          <li class="item"><TaskCard :task="element" /></li>
        </template>
        <template #footer>
          <li>
            <button class="add-row" data-testid="add" @click="add">
              <AppIcon name="plus" :size="14" /> Add task
            </button>
          </li>
        </template>
      </Draggable>
    </DemoCard>
    <template #side>
      <StatePanel label="v-model" :value="tasks.map((t) => t.title)" :summary="titles(tasks)" />
    </template>
  </DemoLayout>
</template>

<style>
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 6px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.add-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 40px;
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.add-row:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
