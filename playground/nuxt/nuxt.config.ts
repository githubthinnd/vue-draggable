import { fileURLToPath } from 'node:url';

const shared = (path: string): string =>
  fileURLToPath(new URL(`../shared/${path}`, import.meta.url));

// Loads the module from source. The examples are shared with playground/vue and use the
// auto-imported <Draggable> registered by the module.
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  modules: ['../../packages/nuxt-draggable/src/module'],
  devtools: { enabled: false },
  telemetry: false,
  draggable: {
    componentName: ['Draggable', 'VueDraggable'],
    plugins: ['MultiDrag', 'Swap'],
    globalOptions: { animation: 150, emptyInsertThreshold: 12 },
  },
  css: [shared('styles/theme.css')],
  components: [
    { path: shared('components'), pathPrefix: false },
    { path: shared('examples'), pathPrefix: false },
  ],
  app: { head: { title: 'vue-draggable · Nuxt playground' } },
});
