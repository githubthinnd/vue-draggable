/**
 * The built package, loaded like a consumer would (compat.md §1.2): CJS `require` returns the
 * component itself, ESM has a default export, the UMD bundle defines the global `vuedraggable`
 * and declares its AMD dependencies, and every file parses as ES2019 (webpack 4 / Vue CLI).
 */
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { parse } from 'acorn';
import * as Vue from 'vue';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '../../dist');
const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(resolve(here, '../../package.json'), 'utf8')) as {
  main: string;
  module: string;
};

interface ComponentLike {
  name?: string;
  default?: unknown;
  emits?: string[];
}

describe('dist', () => {
  it('index.cjs is `module.exports = component` (P-2)', () => {
    const component = require(resolve(dist, 'index.cjs')) as ComponentLike;
    expect(component.name).toBe('draggable');
    expect(component.default).toBeUndefined();
    expect(component.emits).toHaveLength(12);
  });

  it('vuedraggable.common.js has the same shape', () => {
    const component = require(resolve(dist, 'vuedraggable.common.js')) as ComponentLike;
    expect(component.name).toBe('draggable');
    expect(component.default).toBeUndefined();
  });

  it('index.mjs has a default export only', async () => {
    const module = (await import(resolve(dist, 'index.mjs'))) as Record<string, unknown>;
    expect(Object.keys(module)).toEqual(['default']);
    expect((module['default'] as ComponentLike).name).toBe('draggable');
  });

  it('plugins entries export mountSortablePlugins', async () => {
    const esm = (await import(resolve(dist, 'plugins.mjs'))) as Record<string, unknown>;
    const cjs = require(resolve(dist, 'plugins.cjs')) as Record<string, unknown>;
    expect(typeof esm['mountSortablePlugins']).toBe('function');
    expect(typeof cjs['mountSortablePlugins']).toBe('function');
  });

  it('main and module point at the UMD and ESM files', () => {
    expect(pkg.main).toBe('./dist/vuedraggable.umd.min.js');
    expect(pkg.module).toBe('./dist/index.mjs');
  });

  it.each(['vuedraggable.umd.js', 'vuedraggable.umd.min.js'])(
    '%s defines the global vuedraggable',
    (file) => {
      function Sortable(): void {
        // only identity matters
      }
      const sandbox: Record<string, unknown> = { Vue, Sortable };
      runInNewContext(readFileSync(resolve(dist, file), 'utf8'), sandbox);
      expect((sandbox['vuedraggable'] as ComponentLike).name).toBe('draggable');
    },
  );

  it('the UMD AMD branch declares both dependencies (ID-7)', () => {
    let deps: unknown;
    const define = (d: unknown): void => {
      deps = d;
    };
    (define as unknown as { amd: object }).amd = {};
    runInNewContext(readFileSync(resolve(dist, 'vuedraggable.umd.js'), 'utf8'), { define });
    expect(deps).toEqual(['sortablejs', 'vue']);
  });

  it('every JavaScript file parses as ES2019', () => {
    const files = [
      ...readdirSync(dist).filter((f) => /\.(m|c)?js$/.test(f)),
      ...readdirSync(resolve(dist, 'shared'))
        .map((f) => `shared/${f}`)
        .filter((f) => /\.(m|c)?js$/.test(f)),
    ];
    expect(files.length).toBeGreaterThan(8);
    for (const file of files) {
      const sourceType = file.endsWith('.mjs') ? 'module' : 'script';
      expect(
        () => parse(readFileSync(resolve(dist, file), 'utf8'), { ecmaVersion: 2019, sourceType }),
        file,
      ).not.toThrow();
    }
  });

  it('src/vuedraggable.js re-exports the ESM build (webpack 4 deep import)', () => {
    const text = readFileSync(resolve(here, '../../src/vuedraggable.js'), 'utf8');
    expect(text).toContain("export { default } from '../dist/index.mjs';");
  });
});
