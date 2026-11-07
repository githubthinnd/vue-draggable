<!-- The bare-bones reproduction from upstream issue #188 (Composition API, <script setup>),
     with the implementation passed in so the same file runs against 4.1.0 and ours. -->
<script setup lang="ts">
import { ref, type Component } from 'vue';

defineProps<{ impl: Component }>();

const exampleValues = ref([
  { id: 1, name: 'John' },
  { id: 2, name: 'Emily' },
  { id: 3, name: 'Rachel' },
  { id: 4, name: 'Chris' },
]);

defineExpose({ exampleValues });
</script>

<template>
  <component
    :is="impl"
    tag="transition-group"
    :component-data="{ tag: 'ul', name: 'flip-list' }"
    :list="exampleValues"
    item-key="id"
  >
    <template #item="{ element }">
      <li>{{ element.name }}</li>
    </template>
  </component>
</template>
