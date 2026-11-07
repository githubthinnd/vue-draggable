# Changelog

All notable changes to `@stacklogs/vue-draggable` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

First release, planned as 1.0.0.

### Added

- `draggable` component for Vue 3 sortable lists: `v-model` or `list`, `item-key`, typed `item`
  slot, `header` and `footer` slots, `tag` (including `transition-group`), `component-data`,
  `clone` and `move`.
- Drag between lists with `group`, cloning, handles, filters, delays, animations, auto-scroll and
  every drag option as an attribute, updated at runtime.
- Events: `update:modelValue`, `change` (`added`, `removed`, `moved`), `start`, `end`, `add`,
  `remove`, `update`, `choose`, `unchoose`, `sort`, `filter`, `clone`.
- Multi-select drag and swap through `@stacklogs/vue-draggable/plugins` (`mountSortablePlugins`),
  with the list kept in sync.
- App-wide default drag options with `draggableDefaultsKey`.
- TypeScript types with item inference for the `item` slot.
- Server-side rendering without hydration mismatch; safe to import in Web Workers and edge runtimes.
- ES module, CommonJS and UMD builds (ES2019).
- `[vue-draggable]` console diagnostics for a missing `itemKey` and render errors.
