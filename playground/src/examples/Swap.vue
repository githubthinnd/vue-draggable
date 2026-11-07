<!-- #192: Swap (mounted in main.ts with mountSortablePlugins). -->
<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable';

const list = ref(['a', 'b', 'c', 'd'].map((name, id) => ({ id, name })));
</script>

<template>
  <draggable
    v-model="list"
    item-key="id"
    class="list"
    data-testid="list"
    swap
    swap-class="swap-highlight"
  >
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
  </draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
