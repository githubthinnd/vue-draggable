<script setup lang="ts">
import { ref } from 'vue';
import { sprintTasks, titles } from '../data';

const tasks = ref(sprintTasks().slice(0, 4));
</script>

<template>
  <DemoLayout>
    <DemoCard
      title="Touch-friendly list"
      hint="Pointer-based dragging with a floating preview, ideal for phones and tablets."
    >
      <Draggable
        v-model="tasks"
        item-key="id"
        tag="ul"
        class="list"
        data-testid="list"
        :force-fallback="true"
        :fallback-tolerance="3"
        :delay-on-touch-only="true"
        :delay="120"
        ghost-class="ghost"
        :animation="200"
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
