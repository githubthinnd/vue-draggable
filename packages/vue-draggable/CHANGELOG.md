# Changelog

All notable changes to `@stacklogs/vue-draggable` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-11-07

First release.

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

### Delete, undo and redo

- `remove-on-spill`: dropping an item outside every list removes it from the bound array too
  (`change` with `removed`), not only from the page.
- `spill` event when an item is dropped outside every list (`remove-on-spill` / `revert-on-spill`).
- `cancel-on-escape`: Escape during a drag puts the item back and leaves the data unchanged.
- `@stacklogs/vue-draggable/history`: `useDraggableHistory` for undo and redo over one or several
  lists, with optional ⌘Z / Ctrl+Z and ⇧⌘Z / Ctrl+Y shortcuts.

### Fixed

- In pointer mode, cancelling a drag with multi-select or swap enabled no longer leaves a copy of
  the dragged item on the page.
