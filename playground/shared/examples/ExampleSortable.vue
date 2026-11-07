<script setup lang="ts">
import { ref } from 'vue';
import { sprintTasks, titles } from '../data';

const tasks = ref(sprintTasks());
</script>

<template>
  <DemoLayout>
    <DemoCard title="Sprint backlog" hint="Drag rows to change their priority.">
      <Draggable
        v-model="tasks"
        item-key="id"
        tag="ul"
        class="list"
        data-testid="list"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="dragging"
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
