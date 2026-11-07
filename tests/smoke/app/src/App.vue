<script setup>
import { onMounted, ref } from 'vue';
import draggable from 'vuedraggable';

const list = ref([
  { id: 1, name: 'John' },
  { id: 2, name: 'Emily' },
]);
const dragRef = ref();
onMounted(() => {
  const vm = dragRef.value;
  globalThis.__sfc = {
    sortable: Boolean(vm && vm._sortable && vm._sortable.el === vm.targetDomElement),
  };
});
</script>

<template>
  <draggable
    ref="dragRef"
    v-model="list"
    item-key="id"
    tag="transition-group"
    :component-data="{ tag: 'ul', name: 'flip' }"
  >
    <template #item="{ element }">
      <li>{{ element.name }}</li>
    </template>
  </draggable>
</template>
