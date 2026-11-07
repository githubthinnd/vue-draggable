<script setup lang="ts">
export interface Task {
  name: string;
  tasks: Task[];
}
defineProps<{ tasks: Task[] }>();
</script>

<template>
  <Draggable :list="tasks" item-key="name" tag="ul" class="list" group="nested">
    <template #item="{ element }">
      <li class="item">
        <p>{{ element.name }}</p>
        <TaskTree :tasks="element.tasks" />
      </li>
    </template>
  </Draggable>
</template>
