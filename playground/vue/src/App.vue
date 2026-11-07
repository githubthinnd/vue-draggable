<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue';
import { examples } from '@shared/data';
import ExampleClone from '@shared/examples/ExampleClone.vue';
import ExampleHandle from '@shared/examples/ExampleHandle.vue';
import ExampleHeaderFooter from '@shared/examples/ExampleHeaderFooter.vue';
import ExampleKanban from '@shared/examples/ExampleKanban.vue';
import ExampleMultiSelect from '@shared/examples/ExampleMultiSelect.vue';
import ExampleNested from '@shared/examples/ExampleNested.vue';
import ExampleSortable from '@shared/examples/ExampleSortable.vue';
import ExampleSwap from '@shared/examples/ExampleSwap.vue';
import ExampleTouch from '@shared/examples/ExampleTouch.vue';
import ExampleTransition from '@shared/examples/ExampleTransition.vue';
import ExampleTrash from '@shared/examples/ExampleTrash.vue';
import RecordStage from './recorder/RecordStage.vue';

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

const record = new URLSearchParams(location.search).get('record');
const active = ref('sortable');
const read = (): void => {
  const id = location.hash.slice(1);
  active.value = id in views ? id : 'sortable';
};
onMounted(() => {
  read();
  window.addEventListener('hashchange', read);
});
const view = computed(() => views[active.value]);
const meta = computed(() => examples.find((e) => e.id === active.value));
</script>

<template>
  <RecordStage v-if="record" :scene="record" :view="views[record] ?? ExampleSortable" />
  <AppShell v-else :active="active" framework="Vue" :href="(id: string) => `#${id}`">
    <div :data-example="active" :aria-label="meta?.title">
      <component :is="view" :key="active" />
    </div>
  </AppShell>
</template>
