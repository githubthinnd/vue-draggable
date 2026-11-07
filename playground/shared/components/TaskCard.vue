<!-- Presentational content of a task item (the draggable element itself is the parent). -->
<script setup lang="ts">
export interface Task {
  id: number;
  title: string;
  tag: string;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'gray';
  assignee: string;
  points?: number;
}
defineProps<{ task: Task; handle?: boolean }>();
</script>

<template>
  <AppIcon name="grip" :class="['grip', { handle }]" :size="16" />
  <span class="task-title">{{ task.title }}</span>
  <span :class="['pill', `pill-${task.tone}`]">{{ task.tag }}</span>
  <span v-if="task.points" class="points">{{ task.points }}</span>
  <AppAvatar :name="task.assignee" />
</template>

<style>
.task-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.points {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 20px;
  border-radius: 6px;
  background: var(--bg-subtle);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}
</style>
