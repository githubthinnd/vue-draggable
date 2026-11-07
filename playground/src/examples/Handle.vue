<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable';

const list = ref([
  { id: 1, name: 'one' },
  { id: 2, name: 'two' },
  { id: 3, name: 'three' },
]);
</script>

<template>
  <draggable v-model="list" item-key="id" tag="ul" handle=".handle" class="list" data-testid="list">
    <template #item="{ element }">
      <li class="item"><span class="handle" data-testid="handle">::</span>{{ element.name }}</li>
    </template>
  </draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
