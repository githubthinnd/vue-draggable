<!-- Touch and pointer devices: SortableJS's fallback mode (no native HTML5 drag and drop). -->
<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable';

const list = ref(['one', 'two', 'three', 'four'].map((name, id) => ({ id, name })));
</script>

<template>
  <draggable
    v-model="list"
    item-key="id"
    class="list"
    data-testid="list"
    :force-fallback="true"
    :animation="0"
  >
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
  </draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
