<script setup lang="ts">
const list = ref([
  { id: 1, name: 'a' },
  { id: 2, name: 'b' },
]);
let next = 3;
const add = (): void => {
  list.value.push({ id: next, name: `item ${next++}` });
};
</script>

<template>
  <Draggable
    v-model="list"
    item-key="id"
    tag="ul"
    class="list"
    data-testid="list"
    draggable=".item"
  >
    <template #header>
      <li data-testid="header"><b>Header</b></li>
    </template>
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
    <template #footer>
      <li><button data-testid="add" @click="add">Add</button></li>
    </template>
  </Draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
