<script setup lang="ts">
import type { Task } from '~/components/TaskTree.vue';

const tasks = ref<Task[]>([
  { name: 'task 1', tasks: [{ name: 'task 2', tasks: [] }] },
  { name: 'task 3', tasks: [{ name: 'task 4', tasks: [] }] },
  { name: 'task 5', tasks: [] },
]);
const flat = (nodes: Task[]): string => nodes.map((n) => `${n.name}[${flat(n.tasks)}]`).join(',');
</script>

<template>
  <TaskTree :tasks="tasks" data-testid="tree" />
  <pre data-testid="state">{{ flat(tasks) }}</pre>
</template>
