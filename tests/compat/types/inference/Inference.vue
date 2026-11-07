<!-- @vue-draggable/core only: the #item slot is typed from list / modelValue (compat.md D-4). -->
<script setup lang="ts">
import { ref } from 'vue';
import draggable, { type DraggableChangeEvent } from '@vue-draggable/core';
import { mountSortablePlugins } from '@vue-draggable/core/plugins';

interface Task {
  id: number;
  title: string;
}

const tasks = ref<Task[]>([{ id: 1, title: 'a' }]);
const loose = ref<any[]>([]);
const dragRef = ref<InstanceType<typeof draggable>>();

const isTask = (task: Task): Task => task;
const isNumber = (value: number): number => value;

function onChange(evt: DraggableChangeEvent<Task>): void {
  if ('moved' in evt) isTask(evt.moved.element);
}

mountSortablePlugins('MultiDrag', 'Swap');
// @ts-expect-error unknown plugin name
mountSortablePlugins('Nope');

void dragRef.value?._sortable;
</script>

<template>
  <draggable ref="dragRef" v-model="tasks" item-key="id" @change="onChange">
    <template #item="{ element, index }">
      <li>{{ isTask(element).title }} {{ isNumber(index) }}</li>
      <li>
        <!-- @vue-expect-error Task has no property "nope" -->
        {{ element.nope }}
      </li>
    </template>
  </draggable>
  <draggable :list="tasks" item-key="id">
    <template #item="{ element }">
      <li>
        <!-- @vue-expect-error a Task is not a number -->
        {{ isNumber(element) }}
      </li>
    </template>
  </draggable>
  <draggable :list="loose" item-key="id">
    <template #item="{ element }">
      <li>{{ element.anything }}</li>
    </template>
  </draggable>
</template>
