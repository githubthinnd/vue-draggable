import {
  addComponent,
  addImports,
  addPlugin,
  addVitePlugin,
  createResolver,
  defineNuxtModule,
  extendViteConfig,
} from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';
import { resolveOptions, type ModuleOptions } from './runtime/domain/options';

export type { JsonValue, ModuleOptions, SortablePluginName } from './runtime/domain/options';

const CORE = '@stacklogs/vue-draggable';

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@stacklogs/nuxt-draggable',
    configKey: 'draggable',
    compatibility: { nuxt: '>=3.13.0' },
  },
  defaults: {
    componentName: 'Draggable',
    plugins: [],
    clientOnly: false,
    globalOptions: {},
  },
  setup(rawOptions, nuxt) {
    // Throws DraggableModuleError naming the option path; nothing is registered before this line.
    const options = resolveOptions(rawOptions);
    const resolver = createResolver(import.meta.url);

    // Auto-import: only pages that use the component pull in the core and SortableJS.
    for (const name of options.componentNames) {
      addComponent({
        name,
        export: 'default',
        filePath: CORE,
        mode: options.clientOnly ? 'client' : 'all',
      });
    }

    // Undo / redo for lists, auto-imported like the component.
    addImports({ name: 'useDraggableHistory', from: `${CORE}/history` });

    nuxt.options.runtimeConfig.public['draggable'] = {
      plugins: options.plugins,
      globalOptions: options.globalOptions,
    };
    if (options.plugins.length > 0 || Object.keys(options.globalOptions).length > 0) {
      addPlugin({ src: resolver.resolve('./runtime/plugin.client'), mode: 'client' });
    }

    // Compile the core with the app, so the server build below applies to it (it is not left as
    // an external that Node would load with its own `sortablejs`).
    nuxt.options.build.transpile.push(CORE);

    // Client dev: pre-bundle SortableJS so Vite serves one ESM copy (the #49 interop trap).
    extendViteConfig(
      (config) => {
        config.optimizeDeps ??= {};
        config.optimizeDeps.include = [...(config.optimizeDeps.include ?? []), 'sortablejs'];
      },
      { server: false },
    );

    // Server: `sortablejs` resolves to an empty module. SSR never runs `mounted`, where Sortable is
    // created, so the server bundle carries no SortableJS code and never touches the DOM.
    const serverStub = resolver.resolve('./runtime/sortable-server');
    addVitePlugin(
      {
        name: '@stacklogs/nuxt-draggable:sortable-server-stub',
        enforce: 'pre',
        resolveId(source) {
          return source === 'sortablejs'
            ? this.resolve(serverStub, undefined, { skipSelf: true })
            : null;
        },
      },
      { client: false },
    );
  },
});

export default module;
