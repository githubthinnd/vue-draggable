// Lets tsc type-check imports of the test fixtures (.vue files are compiled by @vitejs/plugin-vue).
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}
