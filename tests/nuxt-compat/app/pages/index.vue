<script setup lang="ts">
const list = ref([
  { id: 1, name: 'one' },
  { id: 2, name: 'two' },
]);
</script>

<template>
  <Draggable v-model="list" item-key="id" tag="ul">
    <template #item="{ element }">
      <li>{{ element.name }}</li>
    </template>
  </Draggable>
</template>
