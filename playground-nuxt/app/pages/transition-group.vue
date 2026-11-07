<script setup lang="ts">
const list = ref(['Vue', 'Sortable', 'Draggable', 'Transition'].map((name, id) => ({ id, name })));
const drag = ref(false);
const sort = (): void => {
  list.value = [...list.value].sort((a, b) => a.name.localeCompare(b.name));
};
</script>

<template>
  <button data-testid="sort" @click="sort">Sort</button>
  <Draggable
    v-model="list"
    item-key="id"
    tag="transition-group"
    :component-data="{ tag: 'ul', name: !drag ? 'flip-list' : null, type: 'transition' }"
    class="list"
    data-testid="list"
    @start="drag = true"
    @end="drag = false"
  >
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
  </Draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
