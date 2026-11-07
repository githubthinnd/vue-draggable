<!-- vuedraggable@4.1.0 usage with <script setup> and a template ref (issues #120, #188, #221). -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import draggable from 'vuedraggable';

const items = ref([
  { id: 1, name: 'John' },
  { id: 2, name: 'Emily' },
]);
const untyped = ref<any[]>([]);
const dragRef = ref<InstanceType<typeof draggable>>();

function onMove(evt: any, originalEvent: any): boolean {
  return evt.draggedContext.futureIndex !== 0 && originalEvent !== null;
}

function onChange(evt: { added?: { element: unknown; newIndex: number } }): void {
  void evt;
}

onMounted(() => {
  const vm = dragRef.value;
  if (vm) {
    void vm.realList;
    void vm.error;
    vm.getUnderlyingVm(document.body);
  }
});
</script>

<template>
  <draggable
    ref="dragRef"
    v-model="items"
    item-key="id"
    :move="onMove"
    :animation="150"
    :disabled="false"
    ghost-class="ghost"
    @change="onChange"
    @update:model-value="(value: any[]) => (untyped = value)"
  >
    <template #item="{ element }">
      <div>{{ element.name }}</div>
    </template>
  </draggable>
  <draggable :list="untyped" item-key="id" tag="ul">
    <template #item="{ element }">
      <li>{{ element.anything.goes }}</li>
    </template>
  </draggable>
  <draggable :list="items">
    <template #item="{ element }">
      <li>{{ element.name }}</li>
    </template>
  </draggable>
</template>
