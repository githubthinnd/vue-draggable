/**
 * ID-2 (#49): a bundler hands the `sortablejs` import over wrapped twice (`{ default: { default:
 * Sortable } }`, the CommonJS-in-ESM shape behind "… .a is not a constructor"). 4.1.0 calls
 * `new` on the wrapper and crashes; ours unwraps it.
 */
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { implementations, outcome, REFERENCE, settle } from './shared';
import { resolveSortable } from '#ours/sortable';

const created = vi.hoisted(() => [] as HTMLElement[]);

vi.mock('sortablejs', () => {
  class WrappedSortable {
    constructor(element: HTMLElement) {
      created.push(element);
    }
    option(): void {
      // not exercised
    }
    destroy(): void {
      // not exercised
    }
  }
  return { default: { default: WrappedSortable } };
});

describe('ID-2: the sortablejs import arrives wrapped in { default: { default } }', () => {
  it.each(implementations)('%s', async (name, impl) => {
    created.length = 0;
    const result = await outcome(async () => {
      mount(impl, {
        props: { list: ['a'], itemKey: (k: string) => k },
        slots: { item: ({ element }: { element: string }) => h('div', element) },
      });
      await settle();
    });
    if (name === REFERENCE) {
      expect(result.error).toMatch(/is not a constructor/);
      expect(created).toHaveLength(0);
    } else {
      expect(result.error).toBeUndefined();
      expect(created).toHaveLength(1);
    }
  });
});

describe('resolveSortable', () => {
  function Sortable(): void {
    // only its identity matters
  }
  it.each([
    ['the constructor itself (CJS/UMD)', Sortable],
    ['an ES namespace { default }', { default: Sortable }],
    ['CJS in ESM { default: { default } }', { default: { default: Sortable } }],
    ['three levels deep', { default: { default: { default: Sortable } } }],
  ])('finds the constructor in %s', (_, shape) => {
    expect(resolveSortable(shape)).toBe(Sortable);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty object', {}],
    ['a string', 'Sortable'],
  ])('returns undefined for %s', (_, shape) => {
    expect(resolveSortable(shape)).toBeUndefined();
  });
});
