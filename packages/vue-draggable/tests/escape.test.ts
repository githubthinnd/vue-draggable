/**
 * ID-13: `cancel-on-escape` cancels the drag in progress. Opt-in: without the option a drop is
 * applied exactly as before. Pointer mode: Escape during the drag; native mode: the browser ends
 * a cancelled drag with a `dragend` whose drop effect is "none".
 */
import { mount } from '@vue/test-utils';
import { h, nextTick, reactive } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import draggable from '../src/index';

const sortables = vi.hoisted(
  () => [] as { el: HTMLElement; options: Record<string, unknown>; nativeDraggable: boolean }[],
);
vi.mock('sortablejs', () => ({
  default: class {
    el: HTMLElement;
    options: Record<string, unknown>;
    nativeDraggable = false;
    constructor(el: HTMLElement, options: Record<string, unknown>) {
      this.el = el;
      this.options = options;
      sortables.push(this);
    }
    option(): void {
      // not exercised
    }
    destroy(): void {
      // not exercised
    }
  },
}));

afterEach(() => {
  sortables.length = 0;
  document.body.innerHTML = '';
});

async function setup(attrs: Record<string, unknown>) {
  const state = reactive({ items: ['a', 'b', 'c'] });
  const changes: unknown[] = [];
  const wrapper = mount(draggable, {
    props: {
      list: state.items,
      itemKey: (k: unknown) => k,
      onChange: (c: unknown) => changes.push(c),
    },
    attrs,
    slots: { item: ({ element }: { element: string }) => h('div', element) },
    attachTo: document.body,
  });
  await nextTick();
  const root = wrapper.element as HTMLElement;
  const sortable = sortables[0];
  if (!sortable) throw new Error('no sortable');
  const call = (name: string, evt: unknown): void => {
    (sortable.options[name] as (e: unknown) => void)(evt);
  };
  return { state, changes, root, sortable, call };
}

/** Moves "a" to the end like the engine does, then fires onUpdate. */
function dropAtEnd(
  root: HTMLElement,
  call: (n: string, e: unknown) => void,
  originalEvent?: unknown,
): void {
  const item = root.children[0] as HTMLElement;
  root.appendChild(item);
  call('onUpdate', { item, from: root, oldIndex: 0, newIndex: 2, originalEvent });
}

describe('cancel-on-escape', () => {
  it('is off by default: the drop is applied as before', async () => {
    const { state, root, call } = await setup({});
    call('onStart', { item: root.children[0] });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    dropAtEnd(root, call);
    await nextTick();
    expect(state.items).toEqual(['b', 'c', 'a']);
  });

  it('pointer mode: Escape ends the drag and keeps list and DOM unchanged', async () => {
    const { state, changes, root, call } = await setup({ cancelOnEscape: true });
    const pointerups: unknown[] = [];
    document.addEventListener('pointerup', (e) => pointerups.push(e), { once: true });
    call('onStart', { item: root.children[0] });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(pointerups).toHaveLength(1); // the drag is ended right away
    dropAtEnd(root, call);
    call('onEnd', {});
    await nextTick();
    expect(state.items).toEqual(['a', 'b', 'c']);
    expect([...root.children].map((c) => c.textContent)).toEqual(['a', 'b', 'c']);
    expect(changes).toEqual([]);
  });

  it('native mode: a dragend with dropEffect "none" is a cancel', async () => {
    const { state, root, call, sortable } = await setup({ 'cancel-on-escape': true });
    sortable.nativeDraggable = true;
    call('onStart', { item: root.children[0] });
    dropAtEnd(root, call, { type: 'dragend', dataTransfer: { dropEffect: 'none' } });
    await nextTick();
    expect(state.items).toEqual(['a', 'b', 'c']);
  });

  it('a normal drop after a cancelled one is applied', async () => {
    const { state, root, call } = await setup({ cancelOnEscape: true });
    call('onStart', { item: root.children[0] });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    dropAtEnd(root, call);
    call('onEnd', {});
    await nextTick();
    call('onStart', { item: root.children[0] });
    dropAtEnd(root, call, { type: 'drop' });
    call('onEnd', {});
    await nextTick();
    expect(state.items).toEqual(['b', 'c', 'a']);
  });

  it('pointer mode: the drag preview present at start is not put back when the drop is undone', async () => {
    const { state, root, call } = await setup({ cancelOnEscape: true });
    const item = root.children[0] as HTMLElement;
    // The engine has already appended its floating preview when `start` fires.
    const preview = item.cloneNode(true) as HTMLElement;
    preview.className = 'sortable-fallback';
    root.appendChild(preview);
    call('onStart', { item, swapItem: null });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    preview.remove(); // the engine removes it on drop
    root.appendChild(item);
    call('onUpdate', { item, from: root, oldIndex: 0, newIndex: 2, swapItem: null });
    call('onEnd', {});
    await nextTick();
    expect(root.querySelector('.sortable-fallback')).toBeNull();
    expect([...root.children].map((c) => c.textContent)).toEqual(['a', 'b', 'c']);
    expect(state.items).toEqual(['a', 'b', 'c']);
  });
});
