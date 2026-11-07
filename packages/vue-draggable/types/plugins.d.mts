import type { InjectionKey } from 'vue';

/** Plugins SortableJS ships. AutoScroll and OnSpill are mounted by every sortablejs build. */
export type SortablePluginName = 'MultiDrag' | 'Swap' | 'AutoScroll' | 'OnSpill';

/**
 * Mounts SortableJS plugins once, on the Sortable instance the draggable component uses (#221).
 * Call it before the first draggable mounts, then enable the plugin per list with its option.
 */
export declare function mountSortablePlugins(...names: SortablePluginName[]): void;

/**
 * Provide app-wide default SortableJS options (merged under each list's own attributes):
 * `app.provide(draggableDefaultsKey, { animation: 150 })`. Used by the Nuxt module's `globalOptions`.
 */
export declare const draggableDefaultsKey: InjectionKey<Record<string, any>>;
