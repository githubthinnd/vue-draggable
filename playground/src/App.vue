<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue';
import Simple from './examples/Simple.vue';
import TwoLists from './examples/TwoLists.vue';
import Clone from './examples/Clone.vue';
import Handle from './examples/Handle.vue';
import TransitionGroup from './examples/TransitionGroup.vue';
import HeaderFooter from './examples/HeaderFooter.vue';
import Nested from './examples/Nested.vue';
import MultiDrag from './examples/MultiDrag.vue';
import Swap from './examples/Swap.vue';
import Touch from './examples/Touch.vue';

const examples: Record<string, Component> = {
  simple: Simple,
  'two-lists': TwoLists,
  clone: Clone,
  handle: Handle,
  'transition-group': TransitionGroup,
  'header-footer': HeaderFooter,
  nested: Nested,
  multidrag: MultiDrag,
  swap: Swap,
  touch: Touch,
};
const current = ref('simple');
const read = (): void => {
  const name = location.hash.slice(1);
  current.value = name in examples ? name : 'simple';
};
onMounted(() => {
  read();
  window.addEventListener('hashchange', read);
});
const view = computed(() => examples[current.value]);
</script>

<template>
  <nav>
    <a
      v-for="(_, name) in examples"
      :key="name"
      :href="`#${name}`"
      :class="{ active: name === current }"
      >{{ name }}</a
    >
  </nav>
  <main :data-example="current">
    <component :is="view" />
  </main>
</template>
