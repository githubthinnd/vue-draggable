/**
 * ID-12: with `remove-on-spill`, dropping an item outside every list removes its element and the
 * engine fires only `spill` and `end`. 4.1.0 never listens to `spill`, so its data keeps the item
 * while the DOM lost it. Ours removes it from the data and emits `change` and `spill`.
 */
import { mount } from '@vue/test-utils';
import { h, reactive } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { implementations, outcome, REFERENCE, settle, textOf } from './shared';

const created = vi.hoisted(() => [] as { options: Record<string, unknown> }[]);
vi.mock('sortablejs', () => ({
  default: class {
    options: Record<string, unknown>;
    constructor(_: HTMLElement, options: Record<string, unknown>) {
      this.options = options;
      created.push(this);
    }
    option(): void {
      // not exercised
    }
    destroy(): void {
      // not exercised
    }
  },
}));

describe('ID-12: remove-on-spill keeps the data in sync', () => {
  it.each(implementations)('%s', async (name, impl) => {
    created.length = 0;
    const result = await outcome(async () => {
      const state = reactive({ items: ['a', 'b', 'c'] });
      const events: unknown[] = [];
      const wrapper = mount(impl, {
        props: {
          modelValue: state.items,
          'onUpdate:modelValue': (v: string[]) => (state.items = v),
          itemKey: (k: string) => k,
          onChange: (c: unknown) => events.push(['change', c]),
          onSpill: () => events.push(['spill']),
        },
        attrs: { removeOnSpill: true },
        slots: { item: ({ element }: { element: string }) => h('li', element) },
        attachTo: document.body,
      });
      await settle();
      const options = (created[0] as { options: Record<string, (e: unknown) => void> }).options;
      const root = wrapper.element as HTMLElement;
      const item = root.children[1] as HTMLElement;
      options['onStart']?.({ item });
      // The engine: dispatch `spill`, then the plugin removes the element, then `end`.
      options['onSpill']?.({ item, oldIndex: 1 });
      item.remove();
      options['onEnd']?.({ item });
      await wrapper.setProps({ modelValue: state.items });
      await settle();
      return { items: [...state.items], dom: textOf(root), events };
    });
    if (name === REFERENCE) {
      expect(result.value?.items).toEqual(['a', 'b', 'c']); // data still has "b"
      expect(result.value?.dom).toEqual(['a', 'c']); // the DOM does not
    } else {
      expect(result.value).toEqual({
        items: ['a', 'c'],
        dom: ['a', 'c'],
        events: [['change', { removed: { element: 'b', oldIndex: 1 } }], ['spill']],
      });
    }
  });
});
