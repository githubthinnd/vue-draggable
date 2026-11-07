<script setup lang="ts">
import { ref } from 'vue';
import { sprintTasks, titles } from '../data';

const tasks = ref(sprintTasks());
const dragging = ref(false);
const sortByTitle = (): void => {
  tasks.value = [...tasks.value].sort((a, b) => a.title.localeCompare(b.title));
};
const shuffle = (): void => {
  const copy = [...tasks.value];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  tasks.value = copy;
};
</script>

<template>
  <DemoLayout>
    <DemoCard title="Release checklist" hint="Drag, sort or shuffle: every move is animated.">
      <template #actions>
        <button class="btn" data-testid="shuffle" @click="shuffle">
          <AppIcon name="shuffle" :size="14" /> Shuffle
        </button>
        <button class="btn btn-primary" data-testid="sort" @click="sortByTitle">
          <AppIcon name="sort" :size="14" /> Sort A–Z
        </button>
      </template>
      <Draggable
        v-model="tasks"
        item-key="id"
        tag="transition-group"
        :component-data="{ tag: 'ul', name: !dragging ? 'flip-list' : null, type: 'transition' }"
        class="list"
        data-testid="list"
        ghost-class="ghost"
        :animation="200"
        @start="dragging = true"
        @end="dragging = false"
      >
        <template #item="{ element }">
          <li class="item"><TaskCard :task="element" /></li>
        </template>
      </Draggable>
    </DemoCard>
    <template #side>
      <StatePanel label="v-model" :value="tasks.map((t) => t.title)" :summary="titles(tasks)" />
    </template>
  </DemoLayout>
</template>
