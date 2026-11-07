<script setup lang="ts">
import draggable from 'vuedraggable';

export interface Node {
  name: string;
  tasks: Node[];
}
defineOptions({ name: 'NestedList' });
defineProps<{ tasks: Node[] }>();
</script>

<template>
  <draggable :list="tasks" item-key="name" tag="ul" class="list" :group="{ name: 'nested' }">
    <template #item="{ element }">
      <li class="item">
        <p>{{ element.name }}</p>
        <NestedList :tasks="element.tasks" />
      </li>
    </template>
  </draggable>
</template>
