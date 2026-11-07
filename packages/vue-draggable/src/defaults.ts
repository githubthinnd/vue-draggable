// ID-11: app-wide default SortableJS options (used by the Nuxt module's `globalOptions`).
//
// Inert unless provided: without `app.provide(draggableDefaultsKey, …)` the component behaves
// exactly like 4.1.0. Provided defaults are merged *under* the attributes, so a list's own
// options always win. `Symbol.for` lets two copies of the package share the key.
import type { InjectionKey } from 'vue';

const draggableDefaultsKey: InjectionKey<Record<string, unknown>> = Symbol.for(
  '@stacklogs/vue-draggable:defaults',
);

export { draggableDefaultsKey };
