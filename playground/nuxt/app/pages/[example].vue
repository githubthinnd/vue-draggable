<!-- Every shared example, server-rendered. Older route names stay as aliases. -->
<script setup lang="ts">
import type { Component } from 'vue';
import ExampleClone from '../../../shared/examples/ExampleClone.vue';
import ExampleHandle from '../../../shared/examples/ExampleHandle.vue';
import ExampleHeaderFooter from '../../../shared/examples/ExampleHeaderFooter.vue';
import ExampleKanban from '../../../shared/examples/ExampleKanban.vue';
import ExampleMultiSelect from '../../../shared/examples/ExampleMultiSelect.vue';
import ExampleNested from '../../../shared/examples/ExampleNested.vue';
import ExampleSortable from '../../../shared/examples/ExampleSortable.vue';
import ExampleSwap from '../../../shared/examples/ExampleSwap.vue';
import ExampleTouch from '../../../shared/examples/ExampleTouch.vue';
import ExampleTransition from '../../../shared/examples/ExampleTransition.vue';
import ExampleTrash from '../../../shared/examples/ExampleTrash.vue';

const views: Record<string, Component> = {
  sortable: ExampleSortable,
  handle: ExampleHandle,
  'header-footer': ExampleHeaderFooter,
  trash: ExampleTrash,
  kanban: ExampleKanban,
  clone: ExampleClone,
  transition: ExampleTransition,
  nested: ExampleNested,
  'multi-select': ExampleMultiSelect,
  swap: ExampleSwap,
  touch: ExampleTouch,
};
const aliases: Record<string, string> = {
  basic: 'sortable',
  'two-lists': 'kanban',
  'transition-group': 'transition',
  multidrag: 'multi-select',
};

const route = useRoute();
const id = computed(() => {
  const param = String(route.params['example'] ?? '');
  return aliases[param] ?? param;
});
const view = computed(() => views[id.value]);
if (!view.value) {
  throw createError({ statusCode: 404, statusMessage: 'Example not found' });
}
</script>

<template>
  <AppShell :active="id" framework="Nuxt" :href="(target: string) => `/${target}`">
    <div :data-example="id">
      <component :is="view" />
    </div>
  </AppShell>
</template>
