# @vue-draggable/nuxt

Nuxt 3 and 4 module for [`@vue-draggable/core`](https://github.com/githubthinnd/vue-draggable/tree/master/packages/vue-draggable),
the drop-in, vuedraggable-compatible list component. It auto-imports `<Draggable>`, keeps
SortableJS out of the server bundle, mounts SortableJS plugins once and applies default options.

## Install

```bash
npm install @vue-draggable/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vue-draggable/nuxt'],
});
```

```vue
<script setup lang="ts">
const tasks = ref([
  { id: 1, title: 'Write' },
  { id: 2, title: 'Review' },
]);
</script>

<template>
  <Draggable v-model="tasks" item-key="id">
    <template #item="{ element }">
      <li>{{ element.title }}</li>
    </template>
  </Draggable>
</template>
```

`<Draggable>` is the core component itself (not a wrapper): same props, slots, events and
template-ref members as `vuedraggable@4`, fully typed in templates (`element` is a `Task` here).
Only pages that use it load SortableJS.

## Options

```ts
export default defineNuxtConfig({
  modules: ['@vue-draggable/nuxt'],
  draggable: {
    componentName: ['Draggable', 'VueDraggable'],
    plugins: ['MultiDrag', 'Swap'],
    globalOptions: { animation: 150, ghostClass: 'ghost' },
    clientOnly: false,
  },
});
```

| Option          | Type                                                     | Default       |                                                                                                                                                                                      |
| --------------- | -------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `componentName` | `string \| string[]`                                     | `'Draggable'` | Auto-import name(s), PascalCase or kebab-case. Extra names are aliases of the same component.                                                                                        |
| `plugins`       | `('MultiDrag' \| 'Swap' \| 'AutoScroll' \| 'OnSpill')[]` | `[]`          | SortableJS plugins mounted once on the client. Enable them per list (`multi-drag`, `swap`). AutoScroll and OnSpill are always mounted by SortableJS.                                 |
| `globalOptions` | `Record<string, JSON>`                                   | `{}`          | Default SortableJS options for every list; a list's own attributes win. JSON values only (they travel through the public runtime config); callbacks (`on…`) belong on the component. |
| `clientOnly`    | `boolean`                                                | `false`       | Register the component as a Nuxt client component (nothing rendered on the server).                                                                                                  |

An unknown option or a wrong value stops Nuxt with a message naming it, for example
`Invalid option "draggable.plugins[1]": expected one of MultiDrag, Swap, AutoScroll, OnSpill`.

## SSR

Lists are rendered on the server and hydrate without mismatch. On the server `sortablejs`
resolves to an empty module, so the server bundle contains no SortableJS code; SortableJS starts
in the browser when the component mounts. In development `sortablejs` is pre-bundled by Vite.

## Compatibility

Nuxt `>=3.13` — checked with Nuxt 3.13.2, 3.21.11 and 4.6.4 (registration, production build,
server-side rendering).

## License

MIT.
