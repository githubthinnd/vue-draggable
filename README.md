# vue-draggable

**Drag and drop for Vue 3 and Nuxt.** Sortable lists, drag between lists, nested trees, kanban
boards, animated reordering, multi-select drag and swap — typed, server-side rendered and small.

| Package                                                | Description                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| [`@stacklogs/vue-draggable`](packages/vue-draggable)   | Vue 3 drag and drop component for sortable lists.             |
| [`@stacklogs/nuxt-draggable`](packages/nuxt-draggable) | Nuxt 3 and Nuxt 4 module with an auto-imported `<Draggable>`. |

## Quick start

```bash
npm install @stacklogs/vue-draggable
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import draggable from '@stacklogs/vue-draggable';

const tasks = ref([
  { id: 1, title: 'Design the board' },
  { id: 2, title: 'Write the API' },
]);
</script>

<template>
  <draggable v-model="tasks" item-key="id" :animation="150">
    <template #item="{ element }">
      <div>{{ element.title }}</div>
    </template>
  </draggable>
</template>
```

Nuxt:

```bash
npm install @stacklogs/nuxt-draggable
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({ modules: ['@stacklogs/nuxt-draggable'] });
```

## Features

- Reorder a list with `v-model`, render items with a typed slot.
- Move or clone items between lists with `group`.
- Nested drag and drop for trees and kanban boards.
- Smooth reordering with `transition-group`.
- Multi-select drag and swap.
- Handles, filters, delays, touch support, auto-scroll.
- TypeScript: the item slot is inferred from your list.
- Server-side rendering without hydration mismatch; Nuxt module with a lean server bundle.
- 4.9 KB min+gzip for the component; ES module, CommonJS and UMD builds.

## Compatibility

|                | Supported                      | Tested                                                      |
| -------------- | ------------------------------ | ----------------------------------------------------------- |
| Vue            | `^3.0.1`                       | 3.2, 3.3, 3.4, 3.5                                          |
| Nuxt           | `>=3.13`                       | 3.13, 3.21, 4.6                                             |
| Bundlers       | Vite, webpack, Rollup, esbuild | production builds of a sample app with each                 |
| Module formats | ESM, CommonJS, UMD (ES2019)    | built-package tests, publint, attw                          |
| Rendering      | client and server (SSR)        | server rendering and hydration tests, Nuxt production build |

## Development

pnpm workspace.

```bash
pnpm install
pnpm check        # format, lint, types, tests, build, package checks, Nuxt build test
pnpm smoke        # sample app built with Vite, esbuild, Rollup and webpack (network)
pnpm vue-matrix   # tests on Vue 3.2 → 3.5 (network)
pnpm nuxt-compat  # Nuxt 3.13 / 3.21 / 4.6 (network)
pnpm test:e2e     # Playwright, real drag and drop in Chromium, Firefox and WebKit
```

## License

MIT. Includes MIT-licensed code; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
