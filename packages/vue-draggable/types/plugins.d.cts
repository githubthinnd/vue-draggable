import type { InjectionKey } from 'vue';

/** Drag-and-drop plugins. AutoScroll and OnSpill are always available. */
export type SortablePluginName = 'MultiDrag' | 'Swap' | 'AutoScroll' | 'OnSpill';

/**
 * Mounts drag-and-drop plugins once, on the engine the draggable component uses. Call it before
 * the first list mounts, then enable the plugin per list (`multi-drag`, `swap`).
 */
export declare function mountSortablePlugins(...names: SortablePluginName[]): void;

/**
 * Provide app-wide default drag options (merged under each list's own attributes):
 * `app.provide(draggableDefaultsKey, { animation: 150 })`. Used by the Nuxt module's `globalOptions`.
 */
export declare const draggableDefaultsKey: InjectionKey<Record<string, any>>;
