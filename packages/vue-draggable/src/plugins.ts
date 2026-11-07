// Mounting SortableJS plugins (MultiDrag, Swap, …) on the Sortable copy the component uses (#221).
//
// `Sortable.mount(new MultiDrag())` from the app's own `sortablejs` import only works when that is
// the same copy as ours; with two copies the plugin is mounted on the wrong one and nothing
// happens. This helper always mounts on ours and is idempotent.
import { getSortable, LOG_PREFIX, SortableModule } from './sortable';
import { console } from './util/console';

/** Plugins SortableJS ships. AutoScroll and OnSpill are mounted by every sortablejs build. */
type SortablePluginName = 'MultiDrag' | 'Swap' | 'AutoScroll' | 'OnSpill';

const PLUGIN_NAMES: readonly SortablePluginName[] = ['MultiDrag', 'Swap', 'AutoScroll', 'OnSpill'];

const mounted = new Set<SortablePluginName>();

/**
 * Mounts the given SortableJS plugins once, on the Sortable instance the draggable component uses.
 * Call it before the first draggable mounts, then enable the plugin per list with its option,
 * e.g. `<draggable multi-drag selected-class="selected">` or `<draggable swap swap-class="hl">`.
 * Unknown names and failures are logged with the `[vue-draggable]` prefix, never thrown.
 */
function mountSortablePlugins(...names: SortablePluginName[]): void {
  const Sortable = getSortable();
  if (!Sortable) return;
  for (const name of names) {
    if (mounted.has(name)) continue;
    if (!PLUGIN_NAMES.includes(name)) {
      console.error(`${LOG_PREFIX} Unknown SortableJS plugin "${name}".`);
      continue;
    }
    // `in` first: a strict ES namespace (or a test mock) may throw on reading a missing export.
    const Plugin =
      name in SortableModule ? (SortableModule as Record<string, unknown>)[name] : undefined;
    // The ESM build exports MultiDrag and Swap; the CJS/UMD build mounts every plugin itself and
    // exports none, and AutoScroll/OnSpill are mounted by both. Nothing to do in those cases.
    if (typeof Plugin === 'function') {
      try {
        Sortable.mount?.(new (Plugin as new () => unknown)());
      } catch (error) {
        if (!String(error).includes('more than once')) {
          console.error(`${LOG_PREFIX} Could not mount the SortableJS plugin "${name}".`, error);
          continue;
        }
      }
    }
    mounted.add(name);
  }
}

export { mountSortablePlugins };
export { draggableDefaultsKey } from './defaults';
export type { SortablePluginName };
