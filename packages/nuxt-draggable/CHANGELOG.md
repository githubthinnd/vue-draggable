# Changelog

All notable changes to `@stacklogs/nuxt-draggable` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

First release, planned as 1.0.0.

### Added

- Nuxt 3 and Nuxt 4 module (`draggable` config key, Nuxt `>=3.13`) with an auto-imported,
  typed `<Draggable>` component and optional aliases (`componentName`).
- `plugins` (MultiDrag, Swap, AutoScroll, OnSpill) mounted once in the browser.
- `globalOptions`: default drag options for every list.
- `clientOnly`: render lists in the browser only.
- Option validation with the failing option path in the error.
- Server bundle without drag-and-drop code; engine pre-bundled by Vite in development.
