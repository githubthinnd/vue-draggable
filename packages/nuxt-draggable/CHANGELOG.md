# Changelog

All notable changes to `@vue-draggable/nuxt`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

First release candidate, planned as 1.0.0 (not published).

### Added

- Nuxt module (`draggable` config key, Nuxt `>=3.13`): auto-imported `<Draggable>` (plus aliases
  through `componentName`), `plugins` (MultiDrag, Swap, AutoScroll, OnSpill), `globalOptions`,
  `clientOnly`.
- Option validation that names the offending option path.
- Server builds resolve `sortablejs` to an empty module: no SortableJS code on the server.
- Vite pre-bundles `sortablejs` in development.
