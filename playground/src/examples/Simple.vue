<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable';

const list = ref([
  { id: 1, name: 'John' },
  { id: 2, name: 'Joao' },
  { id: 3, name: 'Jean' },
  { id: 4, name: 'Gerard' },
]);
</script>

<template>
  <draggable v-model="list" item-key="id" class="list" data-testid="list" ghost-class="ghost">
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
  </draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
