# Changelog

All notable changes to `@vue-draggable/core`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [SemVer](https://semver.org/). Compatibility baseline: `vuedraggable@4.1.0`.

## [Unreleased]

First release candidate, planned as 1.0.0 (not published).

### Compatibility with vuedraggable@4.1.0

- Same component (`name: 'draggable'`, Options API), props, defaults, slots, events and emission
  order, template-ref members, DOM expandos and console messages.
- Same entry points: default ESM export, `require()` returning the component, UMD global
  `vuedraggable`, and the paths `src/vuedraggable`, `dist/vuedraggable.umd(.min).js`,
  `dist/vuedraggable.common.js`.

### Fixed

- `Cannot set properties of null (setting '__draggable_context')` with `tag="transition-group"` on
  Vue ≥ 3.2.32, including `<script setup>` (#140, #180, #138, #159, #188, #228).
- Crash when an item leaves a list whose root is a fragment (#34).
- MultiDrag and Swap moved one element and desynchronised DOM and data (#221, #163, #192).
- `… is not a constructor` when the `sortablejs` import arrives wrapped (#49); an unusable import is
  logged instead of throwing.
- `ReferenceError: global is not defined` on load in Web Workers and edge/worker SSR runtimes.
- UMD AMD branch did not declare its `vue` dependency.

### Added

- Real ES module build (`module`, `exports`), CommonJS build, ES2019 output.
- Generic TypeScript types: the `#item` slot infers the item type; props, events and refs accept
  everything 4.1.0's types did.
- `@vue-draggable/core/plugins`: `mountSortablePlugins()` and `draggableDefaultsKey` (app-wide
  default SortableJS options).
- `[vue-draggable]` diagnostics for a missing `itemKey`, render errors and unusable drags.

### Changed

- `sortablejs` dependency `1.14.0` → `^1.15.7`.
