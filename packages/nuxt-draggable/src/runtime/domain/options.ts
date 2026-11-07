/**
 * Options of @vue-draggable/nuxt (`draggable` in nuxt.config). Pure and dependency-free: the module
 * (Node, build time) validates with `resolveOptions`, which throws naming the option path; the
 * client plugin re-checks the runtime config with `parseRuntimeConfig`, which logs and never throws.
 */

export const LOG_PREFIX = '[@vue-draggable/nuxt]';

export const PLUGIN_NAMES = ['MultiDrag', 'Swap', 'AutoScroll', 'OnSpill'] as const;
export type SortablePluginName = (typeof PLUGIN_NAMES)[number];

/** JSON values only: global options travel to the browser through the public runtime config. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ModuleOptions {
  /** Name(s) the component is auto-imported under. The first is the main one. Default `'Draggable'`. */
  componentName?: string | string[];
  /** SortableJS plugins mounted once on the client, e.g. `['MultiDrag', 'Swap']`. Default `[]`. */
  plugins?: SortablePluginName[];
  /** Render lists on the client only (Nuxt client component). Default `false`. */
  clientOnly?: boolean;
  /** Default SortableJS options for every list, e.g. `{ animation: 150 }`; a list's own attributes win. */
  globalOptions?: Record<string, JsonValue>;
}

export interface ResolvedOptions {
  componentNames: string[];
  plugins: SortablePluginName[];
  clientOnly: boolean;
  globalOptions: Record<string, JsonValue>;
}

/** What the client plugin reads from `runtimeConfig.public.draggable`. */
export interface RuntimeOptions {
  plugins: SortablePluginName[];
  globalOptions: Record<string, JsonValue>;
}

export class DraggableModuleError extends Error {
  override name = 'DraggableModuleError';
}

const KNOWN: readonly string[] = ['componentName', 'plugins', 'clientOnly', 'globalOptions'];
const COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$|^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;

function fail(path: string, message: string): never {
  throw new DraggableModuleError(`${LOG_PREFIX} Invalid option "draggable.${path}": ${message}`);
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

function checkJson(value: unknown, path: string): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(path, 'numbers must be finite');
    return value;
  }
  if (Array.isArray(value)) return value.map((item, i) => checkJson(item, `${path}[${String(i)}]`));
  if (isPlainObject(value)) {
    const out: Record<string, JsonValue> = {};
    for (const [key, item] of Object.entries(value)) out[key] = checkJson(item, `${path}.${key}`);
    return out;
  }
  return fail(
    path,
    `expected a JSON value (string, number, boolean, null, array or object), got ${typeof value}. Functions cannot be sent to the browser; set callbacks on the component.`,
  );
}

/** Validates the module options (after Nuxt merged the defaults). Throws on anything unexpected. */
export function resolveOptions(input: unknown): ResolvedOptions {
  if (!isPlainObject(input))
    throw new DraggableModuleError(`${LOG_PREFIX} The "draggable" option must be an object.`);
  for (const key of Object.keys(input)) {
    if (!KNOWN.includes(key)) fail(key, `unknown option. Known options: ${KNOWN.join(', ')}.`);
  }

  const rawNames = input['componentName'] ?? 'Draggable';
  const names = Array.isArray(rawNames) ? rawNames : [rawNames];
  if (names.length === 0) fail('componentName', 'expected at least one name.');
  const componentNames = names.map((name, i) => {
    const path = Array.isArray(rawNames) ? `componentName[${String(i)}]` : 'componentName';
    if (typeof name !== 'string' || !COMPONENT_NAME.test(name)) {
      fail(
        path,
        `expected a PascalCase or kebab-case component name, got ${JSON.stringify(name)}.`,
      );
    }
    return name;
  });
  const duplicate = componentNames.find((name, i) => componentNames.indexOf(name) !== i);
  if (duplicate !== undefined) fail('componentName', `"${duplicate}" is listed twice.`);

  const rawPlugins = input['plugins'] ?? [];
  if (!Array.isArray(rawPlugins)) fail('plugins', 'expected an array.');
  const plugins = rawPlugins.map((plugin, i) => {
    if (!(PLUGIN_NAMES as readonly unknown[]).includes(plugin)) {
      fail(
        `plugins[${String(i)}]`,
        `expected one of ${PLUGIN_NAMES.join(', ')}, got ${JSON.stringify(plugin)}.`,
      );
    }
    return plugin as SortablePluginName;
  });

  const clientOnly = input['clientOnly'] ?? false;
  if (typeof clientOnly !== 'boolean')
    fail('clientOnly', `expected a boolean, got ${typeof clientOnly}.`);

  const rawGlobal = input['globalOptions'] ?? {};
  if (!isPlainObject(rawGlobal)) fail('globalOptions', 'expected an object of SortableJS options.');
  for (const key of Object.keys(rawGlobal)) {
    if (/^on[A-Z]/.test(key))
      fail(
        `globalOptions.${key}`,
        'callbacks cannot be global options; listen to the event on the component.',
      );
  }
  const globalOptions = checkJson(rawGlobal, 'globalOptions') as Record<string, JsonValue>;

  return { componentNames, plugins: [...new Set(plugins)], clientOnly, globalOptions };
}

/** Re-checks the public runtime config in the browser (it can be changed with env variables). */
export function parseRuntimeConfig(value: unknown): RuntimeOptions | null {
  if (!isPlainObject(value)) return null;
  const { plugins, globalOptions } = value;
  if (
    !Array.isArray(plugins) ||
    !plugins.every((p) => (PLUGIN_NAMES as readonly unknown[]).includes(p))
  )
    return null;
  if (!isPlainObject(globalOptions)) return null;
  return {
    plugins: plugins as SortablePluginName[],
    globalOptions: globalOptions as Record<string, JsonValue>,
  };
}
