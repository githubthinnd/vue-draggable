# vue-draggable

Drop-in, **vuedraggable-compatible** drag-and-drop lists for Vue 3 and Nuxt, based on
[vue.draggable.next](https://github.com/SortableJS/vue.draggable.next) (MIT).

`vuedraggable@4.1.0` gets about 1.9 million downloads a week but has had no release since August
2021, and its most upvoted bugs (crashes with `transition-group`, Vite interop, MultiDrag) are
still open. This repository keeps its exact API and behaviour, fixes those bugs, and adds an ES
module build, TypeScript inference and a Nuxt module.

| Package                                          |                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| [`@vue-draggable/core`](packages/vue-draggable)  | The component. Replaces `vuedraggable@4` with one line in `package.json`.       |
| [`@vue-draggable/nuxt`](packages/nuxt-draggable) | Nuxt 3/4 module: auto-import, SSR-safe, SortableJS plugins and default options. |

## Switch from vuedraggable@4

```jsonc
// package.json
{ "dependencies": { "vuedraggable": "npm:@vue-draggable/core@^1" } }
```

No code changes: `import draggable from 'vuedraggable'` keeps working. If another library you
depend on pulls in `vuedraggable`, add the same spec to `overrides` (npm), `pnpm.overrides` or
`resolutions` (yarn). Details: [docs/migration.md](docs/migration.md).

## Compatibility

|                   | Supported                                                                              | Checked by                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| API and behaviour | vuedraggable@4.1.0 (props, slots, events, refs, DOM, console messages)                 | upstream test suite on both implementations, differential suite ([docs/compat.md](docs/compat.md)) |
| Vue               | `^3.0.1` (peer, same as 4.1.0)                                                         | tests on 3.2.47, 3.3.13, 3.4.38, 3.5.45                                                            |
| Nuxt              | `>=3.13`                                                                               | builds and SSR on 3.13.2, 3.21.11, 4.6.4                                                           |
| Bundlers          | Vite, webpack 5, Rollup, esbuild; webpack 4 syntax (ES2019)                            | a vuedraggable@4.1.0 app switched by one line, built with each                                     |
| Imports           | `import`, `require()`, `vuedraggable/src/vuedraggable`, UMD/CDN, global `vuedraggable` | built-package tests, publint, attw                                                                 |
| SSR               | no `window`/`document` on import; no hydration mismatch                                | SSR and hydration tests, Nuxt production build                                                     |
| Browsers          | those SortableJS supports                                                              | Playwright suite for Chromium, Firefox, WebKit and mobile (written; runs in CI, not yet run)       |

Intentional differences from 4.1.0 (bug fixes, MultiDrag/Swap, diagnostics, typed slots) are listed
in [docs/compat.md §10](docs/compat.md#10-intentional-differences).

## Size

|                                                       | min+gzip |
| ----------------------------------------------------- | -------- |
| `@vue-draggable/core` (component)                     | 4.9 KB   |
| `@vue-draggable/core` + SortableJS                    | 20.2 KB  |
| `vuedraggable@4.1.0` as bundlers load it + SortableJS | 34.2 KB  |

Method and more numbers: [docs/size.md](docs/size.md).

## Development

pnpm workspace. Commands, conventions and the sandbox notes are in [CLAUDE.md](CLAUDE.md).

```bash
pnpm install
pnpm check        # format, lint, types, tests, build, package checks, Nuxt build test
pnpm smoke        # drop-in smoke apps (network)
pnpm vue-matrix   # Vue 3.2 → 3.5 (network)
pnpm nuxt-compat  # Nuxt 3.13 / 3.21 / 4.6 (network)
pnpm test:e2e     # Playwright (needs browsers)
```

Docs: [compat.md](docs/compat.md) (the contract), [migration.md](docs/migration.md),
[architecture.md](docs/architecture.md), [size.md](docs/size.md), [ADRs](docs/adr/README.md).

## License

MIT. Contains code ported from vue.draggable.next (© 2016-2019 David Desmaisons, MIT), see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Not affiliated with the vue.draggable.next
authors; "vuedraggable" names are used only to describe compatibility.
