/**
 * Phase 0: pins the facts docs/compat.md §1-§2 states about the published vuedraggable@4.1.0,
 * so the inventory is checked against the real package rather than read off the source.
 * Phase 1 turns this file into the differential suite (same cases against both implementations).
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const pkgPath = require.resolve('vuedraggable-ref/package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>;
// P-2: `require()` returns the component itself (UMD → CommonJS branch, libraryExport 'default').
const reference = require('vuedraggable-ref');

describe('vuedraggable@4.1.0 package surface (compat.md §1)', () => {
  it('has the package.json fields the contract relies on', () => {
    expect(pkg).toMatchObject({
      version: '4.1.0',
      main: 'dist/vuedraggable.umd.min.js',
      module: 'dist/vuedraggable.umd.js',
      types: 'src/vuedraggable.d.ts',
      dependencies: { sortablejs: '1.14.0' },
      peerDependencies: { vue: '^3.0.1' },
    });
    expect(pkg).not.toHaveProperty('exports');
    expect(pkg).not.toHaveProperty('unpkg');
  });

  it('require() returns the component, with no default or named exports (P-2)', () => {
    expect(reference.name).toBe('draggable');
    expect(reference.default).toBeUndefined();
    expect(Object.keys(reference).sort()).toEqual(
      [
        'name',
        'inheritAttrs',
        'props',
        'emits',
        'data',
        'render',
        'created',
        'mounted',
        'updated',
        'beforeUnmount',
        'computed',
        'watch',
        'methods',
      ].sort(),
    );
  });

  it('declares the documented emits in order (C-4)', () => {
    expect(reference.emits).toEqual([
      'update:modelValue',
      'change',
      'start',
      'add',
      'remove',
      'update',
      'end',
      'choose',
      'unchoose',
      'sort',
      'filter',
      'clone',
    ]);
  });

  it('declares the documented props (§2)', () => {
    const { props } = reference;
    expect(Object.keys(props)).toEqual([
      'list',
      'modelValue',
      'itemKey',
      'clone',
      'tag',
      'move',
      'componentData',
    ]);
    expect(props.itemKey).toEqual({ type: [String, Function], required: true });
    expect(props.tag).toEqual({ type: String, default: 'div' });
    const original = {};
    expect(props.clone.default(original)).toBe(original);
  });

  it('keeps the de-facto public methods (I-8)', () => {
    expect(Object.keys(reference.methods)).toEqual([
      'getUnderlyingVm',
      'getUnderlyingPotencialDraggableComponent',
      'emitChanges',
      'alterList',
      'spliceList',
      'updatePosition',
      'getRelatedContextFromMoveEvent',
      'getVmIndexFromDomIndex',
      'onDragStart',
      'onDragAdd',
      'onDragRemove',
      'onDragUpdate',
      'computeFutureIndex',
      'onDragMove',
      'onDragEnd',
    ]);
    expect(Object.keys(reference.computed)).toEqual(['realList', 'getKey']);
  });

  it('server-renders the documented markup (§4.3, R-14)', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          reference,
          { list: ['a', 'b', 'c'], itemKey: (k: string) => k },
          {
            item: ({ element }: { element: string }) => h('div', null, element),
            header: () => h('header'),
            footer: () => h('footer'),
          },
        ),
    });
    expect(await renderToString(app)).toBe(
      '<div><header></header><div data-draggable="true">a</div><div data-draggable="true">b</div><div data-draggable="true">c</div><footer></footer></div>',
    );
  });
});
