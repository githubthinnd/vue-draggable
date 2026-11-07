<script setup lang="ts">
const list = ref(['a', 'b', 'c', 'd', 'e'].map((name, id) => ({ id, name })));
</script>

<template>
  <!-- MultiDrag is mounted by the module (`draggable.plugins`). -->
  <Draggable
    v-model="list"
    item-key="id"
    class="list"
    data-testid="list"
    multi-drag
    selected-class="selected"
  >
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
  </Draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
