/**
 * ID-11: app-wide default Sortable options. Inert without a provider; provided defaults sit under
 * the list's attributes (attributes win); HTML attributes and callbacks in the defaults are ignored
 * exactly like attributes are (compat.md §3).
 */
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import draggable from '../src/index';
import { draggableDefaultsKey } from '../src/plugins';

const created = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock('sortablejs', () => ({
  default: class {
    constructor(_: HTMLElement, options: Record<string, unknown>) {
      created.push(options);
    }
    option(): void {
      // not exercised
    }
    destroy(): void {
      // not exercised
    }
  },
}));

const slots = { item: ({ element }: { element: string }) => h('div', element) };

function options(
  attrs: Record<string, unknown>,
  provided?: Record<string, unknown>,
): Record<string, unknown> {
  mount(draggable, {
    props: { list: ['a'], itemKey: (k: unknown) => k },
    attrs,
    slots,
    global: provided ? { provide: { [draggableDefaultsKey as symbol]: provided } } : {},
  });
  return created.at(-1) ?? {};
}

beforeEach(() => {
  created.length = 0;
});

describe('ID-11: provided default Sortable options', () => {
  it('changes nothing when no defaults are provided', () => {
    expect(
      Object.keys(options({ animation: 100 }))
        .filter((k) => !k.startsWith('on'))
        .sort(),
    ).toEqual(['animation', 'draggable']);
  });

  it('applies defaults, lets attributes win, keeps the draggable prefix', () => {
    const result = options(
      { animation: 100, 'ghost-class': 'mine' },
      { animation: 150, 'ghost-class': 'default', handle: '.h', draggable: '.item' },
    );
    expect(result).toMatchObject({
      animation: 100,
      ghostClass: 'mine',
      handle: '.h',
      draggable: '[data-draggable].item',
    });
  });

  it('ignores HTML attributes and callbacks in the defaults', () => {
    const onEnd = vi.fn();
    const result = options({}, { class: 'x', id: 'y', 'data-a': '1', onEnd, onMove: onEnd });
    expect(result).not.toHaveProperty('class');
    expect(result).not.toHaveProperty('id');
    expect(result['onEnd']).not.toBe(onEnd);
    expect(result['onMove']).not.toBe(onEnd);
  });
});
