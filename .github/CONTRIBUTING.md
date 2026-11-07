# Contributing

Thanks for helping. `@stacklogs/vue-draggable` is a drag-and-drop list component for Vue 3 and
`@stacklogs/nuxt-draggable` its Nuxt module. Changes are judged on compatibility, correctness and
maintenance cost.

## Setup

```bash
pnpm install
pnpm check
```

This is a pnpm workspace:

- `packages/vue-draggable`: the component (`@stacklogs/vue-draggable`).
- `packages/nuxt-draggable`: the Nuxt module (`@stacklogs/nuxt-draggable`).
- `tests/compat`: the compatibility contract, the same suite run against the reference version and
  this one.
- `playground/vue`, `playground/nuxt`, `playground/shared`: the demo apps (`pnpm --filter
@stacklogs/playground-vue dev`).

Requires Node.js 22.22+ or 24 for development. `pnpm check` runs formatting, lint, type checks, all
tests, the build, the package checks (publint, type resolution, size budget), the docs check, the
playground build and a real Nuxt production build. `pnpm test:e2e` runs Playwright in real browsers.

## Ground rules

- **Existing behaviour does not change.** Props, events, slots, markup and the bound data behave as
  they do today; `tests/compat` must stay green. New behaviour is opt-in (a new option, event or
  entry point).
- **A bug fix comes with a test that fails without it.** Back the fix out once and watch the test go
  red before trusting it.
- **Never skip, weaken or delete a test to get a green build.** If a test is wrong, fix it and say why
  in the pull request.
- **One runtime dependency, the drag engine.** No new runtime or peer dependency, no install scripts.
- **Server-side rendering stays safe:** importing the package must not touch `window` or `document`.
- **Size budget:** the component stays under 6 KB min+gzip (`pnpm verify`).
- Public API changes need a changelog entry in the package's `CHANGELOG.md` and a README update.

## Pull requests

1. Open an issue first for anything beyond a small fix.
2. Keep the change focused; add or update tests and documentation.
3. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
   (`feat(core): …`, `fix(nuxt): …`, `docs: …`).
4. Make sure `pnpm check` passes.

## Reporting security problems

See [SECURITY.md](SECURITY.md). Do not file public issues for vulnerabilities.
