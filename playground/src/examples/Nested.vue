<script setup lang="ts">
import { ref } from 'vue';
import NestedList, { type Node } from './NestedList.vue';

const tasks = ref<Node[]>([
  { name: 'task 1', tasks: [{ name: 'task 2', tasks: [] }] },
  { name: 'task 3', tasks: [{ name: 'task 4', tasks: [] }] },
  { name: 'task 5', tasks: [] },
]);
const flat = (nodes: Node[]): string => nodes.map((n) => `${n.name}[${flat(n.tasks)}]`).join(',');
</script>

<template>
  <NestedList :tasks="tasks" data-testid="tree" />
  <pre data-testid="state">{{ flat(tasks) }}</pre>
</template>
