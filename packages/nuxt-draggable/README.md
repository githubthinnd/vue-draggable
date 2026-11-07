# @stacklogs/nuxt-draggable

**Nuxt drag and drop module for sortable lists.** Adds an auto-imported `<Draggable>` component
to Nuxt 3 and Nuxt 4 apps: reorder items, drag between lists, nested trees, kanban boards,
multi-select drag and swap — server-side rendered, hydration-safe and fully typed.

```bash
npm install @stacklogs/nuxt-draggable
```

## Features

- **Auto-imported `<Draggable>`** — no import, typed templates, loaded only on pages that use it.
- **Delete, undo and redo** — `useDraggableHistory` is auto-imported; drop outside to delete, Esc to cancel.
- **SSR-ready** — lists render on the server and hydrate without mismatch.
- **Lean server bundle** — no drag-and-drop code is shipped to the server.
- **Plugins from `nuxt.config`** — multi-select drag and swap, mounted once.
- **Global defaults** — set `animation`, `ghostClass` and other drag options for every list.
- **Validated options** — a typo in `nuxt.config` stops the build with a clear message.
- **Nuxt 3.13+ and Nuxt 4** — tested on Nuxt 3.13, 3.21 and 4.6.

## Installation

```bash
npm install @stacklogs/nuxt-draggable
# or: pnpm add / yarn add / bun add @stacklogs/nuxt-draggable
```

Then add it to `modules`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@stacklogs/nuxt-draggable'],
});
```

## Usage

```vue
<script setup lang="ts">
const columns = ref({
  todo: [
    { id: 1, title: 'Write the brief' },
    { id: 2, title: 'Design the board' },
  ],
  done: [{ id: 3, title: 'Set up Nuxt' }],
});
</script>

<template>
  <div class="board">
    <Draggable v-model="columns.todo" group="board" item-key="id" :animation="150">
      <template #item="{ element }">
        <article class="card">{{ element.title }}</article>
      </template>
    </Draggable>
    <Draggable v-model="columns.done" group="board" item-key="id" :animation="150">
      <template #item="{ element }">
        <article class="card">{{ element.title }}</article>
      </template>
    </Draggable>
  </div>
</template>
```

`<Draggable>` is [`@stacklogs/vue-draggable`](https://www.npmjs.com/package/@stacklogs/vue-draggable):
all its props, slots, events, drag options and examples apply.

### Delete, undo and redo

`useDraggableHistory` is auto-imported as well:

```vue
<script setup lang="ts">
const tasks = ref(await loadTasks());
const history = useDraggableHistory(tasks, { keyboard: true }); // ⌘Z / ⇧⌘Z
</script>

<template>
  <button :disabled="!history.canUndo.value" @click="history.undo()">Undo</button>
  <Draggable v-model="tasks" item-key="id" :remove-on-spill="true" :cancel-on-escape="true">
    <template #item="{ element }"
      ><li>{{ element.title }}</li></template
    >
  </Draggable>
</template>
```

Dropping a row outside the list deletes it, Escape cancels a drag, and every change can be undone.

## Configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@stacklogs/nuxt-draggable'],
  draggable: {
    componentName: ['Draggable', 'SortableList'],
    plugins: ['MultiDrag', 'Swap'],
    globalOptions: { animation: 150, ghostClass: 'ghost' },
    clientOnly: false,
  },
});
```

| Option          | Type                                                     | Default       | Description                                                                                                                                           |
| --------------- | -------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `componentName` | `string \| string[]`                                     | `'Draggable'` | Name(s) of the auto-imported component, PascalCase or kebab-case. Extra names are aliases.                                                            |
| `plugins`       | `('MultiDrag' \| 'Swap' \| 'AutoScroll' \| 'OnSpill')[]` | `[]`          | Drag-and-drop plugins mounted once in the browser. Enable them per list with `multi-drag` or `swap`. `AutoScroll` and `OnSpill` are always available. |
| `globalOptions` | `Record<string, JSON>`                                   | `{}`          | Default drag options for every list; a list's own attributes win. Values must be JSON; put event handlers on the component.                           |
| `clientOnly`    | `boolean`                                                | `false`       | Render lists in the browser only.                                                                                                                     |

Unknown options and wrong values stop Nuxt with the option path, for example:
`Invalid option "draggable.plugins[1]": expected one of MultiDrag, Swap, AutoScroll, OnSpill`.

## Multi-select drag and swap

```ts
export default defineNuxtConfig({
  modules: ['@stacklogs/nuxt-draggable'],
  draggable: { plugins: ['MultiDrag', 'Swap'] },
});
```

```vue
<Draggable v-model="files" item-key="id" :multi-drag="true" selected-class="selected">…</Draggable>
<Draggable v-model="seats" item-key="id" :swap="true" swap-class="highlight">…</Draggable>
```

## Server-side rendering

Lists are rendered on the server, so content is visible and indexable before JavaScript runs, and
they hydrate without mismatch. The drag-and-drop engine starts in the browser when the component
mounts; the server bundle does not contain it. In development the engine is pre-bundled by Vite.

## Compatibility

Nuxt `>=3.13`, tested on Nuxt 3.13.2, 3.21.11 and 4.6.4 (module registration, production build
and server-side rendering).

## License

MIT.
