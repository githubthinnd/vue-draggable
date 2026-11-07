<script setup lang="ts">
import { ref } from 'vue';
import { sprintTasks, titles } from '../data';

const tasks = ref(sprintTasks().slice(0, 4));
</script>

<template>
  <DemoLayout>
    <DemoCard title="Settings order" hint="Grab the dotted handle; the text stays selectable.">
      <Draggable
        v-model="tasks"
        item-key="id"
        tag="ul"
        class="list"
        data-testid="list"
        handle=".handle"
        ghost-class="ghost"
        :animation="200"
      >
        <template #item="{ element }">
          <li class="item item--static">
            <span class="handle" data-testid="handle"><AppIcon name="grip" :size="16" /></span>
            <span class="task-title">{{ element.title }}</span>
            <span :class="['pill', `pill-${element.tone}`]">{{ element.tag }}</span>
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
.item--static {
  cursor: default;
}
.handle {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: var(--text-subtle);
  cursor: grab;
}
.handle:hover {
  background: var(--bg-subtle);
  color: var(--text);
}
</style>
