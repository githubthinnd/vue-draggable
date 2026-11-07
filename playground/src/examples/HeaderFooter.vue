<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable';

const list = ref([
  { id: 1, name: 'a' },
  { id: 2, name: 'b' },
  { id: 3, name: 'c' },
]);
let next = 4;
const add = (): void => {
  list.value.push({ id: next, name: `item ${next++}` });
};
</script>

<template>
  <draggable
    v-model="list"
    item-key="id"
    tag="ul"
    class="list"
    data-testid="list"
    draggable=".item"
  >
    <template #header>
      <li data-testid="header"><b>Header (not draggable)</b></li>
    </template>
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
    <template #footer>
      <li><button data-testid="add" @click="add">Add</button></li>
    </template>
  </draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
