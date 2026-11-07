// Client-only plugin: mounts the selected SortableJS plugins once and provides the global options.
// Registered only when `plugins` or `globalOptions` is set; the server never loads it.
import { defineNuxtPlugin, useRuntimeConfig, type Plugin } from 'nuxt/app';
import { draggableDefaultsKey, mountSortablePlugins } from '@vue-draggable/core/plugins';
import { LOG_PREFIX, parseRuntimeConfig } from './domain/options';

const plugin: Plugin = defineNuxtPlugin({
  name: '@vue-draggable/nuxt',
  setup(nuxtApp) {
    try {
      const options = parseRuntimeConfig(useRuntimeConfig().public['draggable']);
      if (!options) {
        console.error(
          `${LOG_PREFIX} runtimeConfig.public.draggable is invalid; SortableJS plugins and global options are not applied.`,
        );
        return;
      }
      if (options.plugins.length > 0) mountSortablePlugins(...options.plugins);
      if (Object.keys(options.globalOptions).length > 0) {
        nuxtApp.vueApp.provide(draggableDefaultsKey, options.globalOptions);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Setup failed.`, error);
    }
  },
});

export default plugin;
