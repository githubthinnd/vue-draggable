/**
 * Loads a real Nuxt (no build) with the module and records what it registered for each option set.
 * Needs the core package built (its `exports` point at dist/), so it is not part of `npm test`.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadNuxt } from '@nuxt/kit';
import { describe, expect, it } from 'vitest';

const fixture = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures/minimal');

interface ComponentEntry {
  pascalName?: string;
  kebabName?: string;
  mode?: string;
  filePath: string;
  export?: string;
}

async function observe(draggable?: Record<string, unknown>) {
  const nuxt = await loadNuxt({
    cwd: fixture,
    dev: false,
    ready: true,
    overrides: { _prepare: true, logLevel: 'silent', ...(draggable ? { draggable } : {}) },
  });
  try {
    const components: ComponentEntry[] = [];
    await nuxt.callHook('components:extend', components as never);
    return {
      // Nuxt registers its own components through the same hook; keep ours.
      components: components
        .filter((c) => c.filePath === '@vue-draggable/core')
        .map((c) => ({
          name: c.pascalName,
          mode: c.mode,
          filePath: c.filePath,
          export: c.export,
        })),
      plugins: nuxt.options.plugins.map((p) => (typeof p === 'string' ? p : p.src)),
      transpile: nuxt.options.build.transpile,
      publicConfig: nuxt.options.runtimeConfig.public['draggable'],
    };
  } finally {
    await nuxt.close();
  }
}

const clientPlugin = (plugins: string[]): boolean =>
  plugins.some((p) => /runtime\/plugin\.client(\.\w+)?$/.test(p));

describe('module registration (real Nuxt)', () => {
  it('defaults: one auto-imported <Draggable>, no client plugin, core transpiled', async () => {
    const seen = await observe();
    expect(seen.components).toEqual([
      { name: 'Draggable', mode: 'all', filePath: '@vue-draggable/core', export: 'default' },
    ]);
    expect(clientPlugin(seen.plugins)).toBe(false);
    expect(seen.transpile).toContain('@vue-draggable/core');
    expect(seen.publicConfig).toEqual({ plugins: [], globalOptions: {} });
  });

  it('aliases, clientOnly, plugins and global options', async () => {
    const seen = await observe({
      componentName: ['Draggable', 'VueDraggable'],
      clientOnly: true,
      plugins: ['MultiDrag'],
      globalOptions: { animation: 150 },
    });
    expect(seen.components.map((c) => [c.name, c.mode])).toEqual([
      ['Draggable', 'client'],
      ['VueDraggable', 'client'],
    ]);
    expect(clientPlugin(seen.plugins)).toBe(true);
    expect(seen.publicConfig).toEqual({
      plugins: ['MultiDrag'],
      globalOptions: { animation: 150 },
    });
  });

  it('global options alone also register the client plugin', async () => {
    expect(clientPlugin((await observe({ globalOptions: { animation: 100 } })).plugins)).toBe(true);
  });

  it('an invalid option stops Nuxt with the option path', async () => {
    await expect(observe({ plugins: ['Nope'] })).rejects.toThrow('"draggable.plugins[0]"');
    await expect(observe({ animation: 150 })).rejects.toThrow('"draggable.animation"');
  });
});
