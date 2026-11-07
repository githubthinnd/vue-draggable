import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// The examples import `vuedraggable` like a 4.1.0 app; here it resolves to our source, which is
// what `"vuedraggable": "npm:@stacklogs/vue-draggable@^1"` does in a real project.
const core = fileURLToPath(new URL('../packages/vue-draggable/src', import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^vuedraggable$/, replacement: `${core}/index.ts` },
      { find: /^@stacklogs\/vue-draggable\/plugins$/, replacement: `${core}/plugins.ts` },
    ],
  },
});
