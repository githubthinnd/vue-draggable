<!-- #140 / #188 / #228: the official transition example, which crashes on 4.1.0 with Vue >= 3.2.32. -->
<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable';

const list = ref(['Vue', 'Sortable', 'Draggable', 'Transition'].map((name, id) => ({ id, name })));
const drag = ref(false);
const sort = (): void => {
  list.value = [...list.value].sort((a, b) => a.name.localeCompare(b.name));
};
</script>

<template>
  <button data-testid="sort" @click="sort">Sort</button>
  <draggable
    v-model="list"
    item-key="id"
    tag="transition-group"
    :component-data="{ tag: 'ul', name: !drag ? 'flip-list' : null, type: 'transition' }"
    :animation="200"
    class="list"
    data-testid="list"
    @start="drag = true"
    @end="drag = false"
  >
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
  </draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
