<!-- Recording mode (?record=<scene>): the example alone on a fixed-size stage, then a scripted demo. -->
<script setup lang="ts">
import { nextTick, onMounted, type Component } from 'vue';
import { examples } from '@shared/data';
import { runScene } from './scenes';

const props = defineProps<{ scene: string; view: Component }>();
const meta = examples.find((e) => e.id === props.scene);

onMounted(async () => {
  const dark = new URLSearchParams(location.search).get('theme') === 'dark';
  document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
  await nextTick();
  await runScene(props.scene);
});
</script>

<template>
  <div class="record-stage">
    <PageHeader v-if="meta" :title="meta.title" :description="meta.description" :tags="meta.tags" />
    <component :is="view" />
  </div>
</template>

<style>
.record-stage {
  width: 100vw;
  height: 100vh;
  padding: 28px 32px;
  overflow: hidden;
  background: var(--bg);
}
.record-stage .demo-layout__side {
  position: static;
}
.record-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  pointer-events: none;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
}
</style>
