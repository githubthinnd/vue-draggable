# @vue-draggable/core

A **drop-in replacement for `vuedraggable@4`** (vue.draggable.next): the same component, props,
slots, events and template-ref members, for Vue 3, built on [SortableJS](https://github.com/SortableJS/Sortable).
Switch with one line in `package.json` and no code changes. Based on
[vue.draggable.next](https://github.com/SortableJS/vue.draggable.next) (MIT).

`vuedraggable@4.1.0` has had no release since August 2021. This package keeps its behaviour, fixes
its most reported crashes, ships a real ES module build and adds TypeScript inference:

| Fixed                                                                                                                                                                          | Upstream issues                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `TypeError: Cannot set properties of null (setting '__draggable_context')` with `tag="transition-group"` on Vue ≥ 3.2.32, including the official examples and `<script setup>` | #140, #180, #138, #159, #188, #228 |
| Crash when dragging to another list from a fragment root (`transition-group` without `componentData.tag`, fragment components)                                                 | #34                                |
| SortableJS **MultiDrag** and **Swap** plugins update the data                                                                                                                  | #221, #163, #192                   |
| `… is not a constructor` when a bundler wraps the `sortablejs` import; real ESM build instead of a UMD file under `module`                                                     | #49, #132, #170                    |
| `ReferenceError: global is not defined` in Web Workers and edge/worker SSR runtimes                                                                                            | —                                  |
| Typed `#item` slot (`element` inferred from `list` / `modelValue`)                                                                                                             | #144, #150, #14, #85, #220         |

Every other behaviour is the one of 4.1.0, checked by running vue.draggable.next's own test suite
and a differential suite against both implementations. The full contract is in
[docs/compat.md](https://github.com/githubthinnd/vue-draggable/blob/master/docs/compat.md).

## Install

New project:

```bash
npm install @vue-draggable/core
```

Existing `vuedraggable@4` project: change the dependency line, nothing else
([migration guide](https://github.com/githubthinnd/vue-draggable/blob/master/docs/migration.md)):

```jsonc
// package.json
{ "dependencies": { "vuedraggable": "npm:@vue-draggable/core@^1" } }
```

Requires `vue` 3 (peer range `^3.0.1`, tested on 3.2, 3.3, 3.4 and 3.5). `sortablejs` is a regular
dependency: there is nothing else to install.

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable'; // or '@vue-draggable/core'

const people = ref([
  { id: 1, name: 'John' },
  { id: 2, name: 'Joao' },
]);
</script>

<template>
  <draggable v-model="people" item-key="id" group="people" ghost-class="ghost" :animation="150">
    <template #item="{ element, index }">
      <div>{{ index }}. {{ element.name }}</div>
    </template>
  </draggable>
</template>
```

### Props

| Prop            | Type                                      | Default  |                                                                                                                                                     |
| --------------- | ----------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `Array`                                   | `null`   | Use with `v-model`. Never mutated: emits `update:modelValue` with a new array.                                                                      |
| `list`          | `Array`                                   | `null`   | Alternative to `v-model`: mutated in place with `splice`. Do not use both.                                                                          |
| `itemKey`       | `string \| (element) => key`              | required | Property name or function giving each item's key.                                                                                                   |
| `tag`           | `string`                                  | `'div'`  | Root element, `'transition-group'`, or the name of a **globally registered** component.                                                             |
| `componentData` | `Object`                                  | `null`   | Props, attributes and listeners for the root (`tag`), as one flat object.                                                                           |
| `clone`         | `(original) => copy`                      | identity | Copy used when an item is cloned to another list (`group: { pull: 'clone' }`).                                                                      |
| `move`          | `(evt, originalEvent) => boolean \| void` | `null`   | Return `false` to cancel. `evt.draggedContext` = `{ element, index, futureIndex }`, `evt.relatedContext` = `{ list, component, element?, index? }`. |

Any other attribute is a [SortableJS option](https://github.com/SortableJS/Sortable#options), in
kebab-case or camelCase: `group`, `handle`, `disabled`, `animation`, `ghost-class`, `filter`,
`sort`, `force-fallback`… Changing one at runtime updates Sortable. `id`, `class`, `role`, `style`,
`data-*`, `aria-*` and listeners go to the root element instead.

### Slots

- `item` (required) — `{ element, index }`. Must render exactly one element per item.
- `header`, `footer` — rendered before and after the items, not draggable.

### Events

- `start`, `add`, `remove`, `update`, `end`, `choose`, `unchoose`, `sort`, `filter`, `clone` — the
  SortableJS event, emitted on the next tick.
- `change` — `{ added: { element, newIndex } }`, `{ removed: { element, oldIndex } }` or
  `{ moved: { element, oldIndex, newIndex } }`.
- `update:modelValue` — the new array (synchronously, before `change`).

### Template ref

A ref to the component exposes the same members as 4.1.0, for example `_sortable` (the SortableJS
instance), `targetDomElement`, `realList` and `getUnderlyingVm(element)`.

## SortableJS plugins

MultiDrag and Swap work and keep the data in sync. Mount them once, on the Sortable copy this
package uses, then enable them per list:

```ts
import { mountSortablePlugins } from '@vue-draggable/core/plugins';

mountSortablePlugins('MultiDrag', 'Swap');
```

```vue
<draggable v-model="list" item-key="id" multi-drag selected-class="selected">…</draggable>
<draggable v-model="list" item-key="id" swap swap-class="highlight">…</draggable>
```

A MultiDrag drop emits one `change` per moved element; a swap emits two `moved` changes.

## Default options for every list

```ts
import { draggableDefaultsKey } from '@vue-draggable/core/plugins';

app.provide(draggableDefaultsKey, { animation: 150, ghostClass: 'ghost' });
```

A list's own attributes always win. (The Nuxt module sets this from `nuxt.config`.)

## TypeScript

Types ship with the package. The `#item` slot is typed from `list` / `modelValue`:

```vue
<draggable v-model="tasks" item-key="id">
  <!-- element: Task -->
  <template #item="{ element }">{{ element.title }}</template>
</draggable>
```

Props, events and template refs accept everything vuedraggable@4.1.0's types accepted. With an
`any[]` list nothing changes; with a typed list, reading a property the item type does not have
is now a type error. Exported types: `DraggableChangeEvent`, `DraggableMoveEvent`,
`DraggableContext`, `DraggableProps`, `DraggableSlots`, `DraggableInstance`.

## SSR

Importing the package on the server does not touch `window` or `document`. Lists render on the
server exactly as on the client's first render and hydrate without mismatch; SortableJS starts in
`mounted`. For Nuxt, use [`@vue-draggable/nuxt`](https://github.com/githubthinnd/vue-draggable/tree/master/packages/nuxt-draggable).

## CDN

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://unpkg.com/sortablejs@1.15/Sortable.min.js"></script>
<script src="https://unpkg.com/@vue-draggable/core@1/dist/vuedraggable.umd.min.js"></script>
<script>
  Vue.createApp({ components: { draggable: window.vuedraggable } /* … */ }).mount('#app');
</script>
```

## Entry points

`import`, `require()` (returns the component itself, like 4.1.0), `@vue-draggable/core/plugins`,
and the 4.1.0 paths `src/vuedraggable`, `dist/vuedraggable.umd.js`, `dist/vuedraggable.umd.min.js`,
`dist/vuedraggable.common.js`. All files are ES2019, so webpack 4 / Vue CLI can parse them.

## Size

4.9 KB min+gzip for the component, plus SortableJS (15.5 KB). Measured with
`scripts/size.mjs`; see [docs/size.md](https://github.com/githubthinnd/vue-draggable/blob/master/docs/size.md).

## License

MIT. Contains code ported from vue.draggable.next, © 2016-2019 David Desmaisons, MIT
(see `THIRD_PARTY_NOTICES.md`). Not affiliated with the vue.draggable.next authors;
"vuedraggable" is used only to describe compatibility.
