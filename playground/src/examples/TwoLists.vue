<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable';

const list1 = ref([
  { id: 1, name: 'John' },
  { id: 2, name: 'Joao' },
]);
const list2 = ref([
  { id: 3, name: 'Juan' },
  { id: 4, name: 'Edgard' },
]);
</script>

<template>
  <div class="lists">
    <draggable :list="list1" group="people" item-key="id" class="list" data-testid="list1">
      <template #item="{ element }">
        <li class="item">{{ element.name }}</li>
      </template>
    </draggable>
    <draggable :list="list2" group="people" item-key="id" class="list" data-testid="list2">
      <template #item="{ element }">
        <li class="item">{{ element.name }}</li>
      </template>
    </draggable>
  </div>
  <pre data-testid="state"
    >{{ list1.map((p) => p.name).join(',') }}|{{ list2.map((p) => p.name).join(',') }}</pre>
</template>
