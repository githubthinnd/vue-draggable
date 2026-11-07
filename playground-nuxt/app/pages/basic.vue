<script setup lang="ts">
const list = ref([
  { id: 1, name: 'John' },
  { id: 2, name: 'Joao' },
  { id: 3, name: 'Jean' },
]);
</script>

<template>
  <!-- Auto-imported; `animation` and `ghost-class` come from `draggable.globalOptions`. -->
  <Draggable v-model="list" item-key="id" class="list" data-testid="list">
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
  </Draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
