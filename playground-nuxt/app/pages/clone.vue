<script setup lang="ts">
let next = 100;
const source = ref([
  { id: 1, name: 'dog' },
  { id: 2, name: 'cat' },
]);
const target = ref([{ id: 3, name: 'cow' }]);
const cloneAnimal = ({ name }: { name: string }) => ({ id: next++, name });
</script>

<template>
  <div class="lists">
    <Draggable
      :list="source"
      :group="{ name: 'animals', pull: 'clone', put: false }"
      :clone="cloneAnimal"
      item-key="id"
      class="list"
      data-testid="source"
    >
      <template #item="{ element }">
        <li class="item">{{ element.name }}</li>
      </template>
    </Draggable>
    <Draggable :list="target" group="animals" item-key="id" class="list" data-testid="target">
      <template #item="{ element }">
        <li class="item">{{ element.name }}</li>
      </template>
    </Draggable>
  </div>
  <pre data-testid="state"
    >{{ source.map((a) => a.name).join(',') }}|{{ target.map((a) => a.name).join(',') }}</pre>
</template>
