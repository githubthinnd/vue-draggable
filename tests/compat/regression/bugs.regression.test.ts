/**
 * Regression tests for the upstream bugs fixed in @stacklogs/vue-draggable (docs/compat.md §10).
 * Every test runs on both implementations: it must show the bug on vuedraggable@4.1.0 and the fix
 * on ours, which is the "red on 4.1.0, green on ours" proof the roadmap asks for.
 */
import { mount } from '@vue/test-utils';
import { defineComponent, h, reactive, type Component } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fake from './fake-sortable';
import TransitionSetup from './fixtures/TransitionSetup.vue';
import {
  contextIndexes,
  implementations,
  OURS,
  outcome,
  REFERENCE,
  settle,
  settleTransitions,
  textOf,
} from './shared';
import { callbackOf, sortableOf } from '../differential/harness';
import { mountSortablePlugins } from '#ours/plugins';

vi.mock('sortablejs', () => import('./fake-sortable'));

const NULL_CONTEXT_CRASH = "Cannot set properties of null (setting '__draggable_context')";
const registry = { instances: fake.instances };
const unstubbed = { stubs: { 'transition-group': false } };

const FragmentRoot = defineComponent({
  name: 'FragmentRoot',
  setup(_, { slots }) {
    return () => slots['default']?.();
  },
});

interface Named {
  id: number;
  n: string;
}
const named = (...names: string[]): Named[] => names.map((n, id) => ({ id, n }));
const itemSlot = ({ element }: { element: Named }): ReturnType<typeof h> => h('li', element.n);

beforeEach(() => {
  fake.reset();
  document.body.innerHTML = '';
});

/** Sort "a" to the end of a list rendered through a real TransitionGroup. */
async function sortInTransitionGroup(
  impl: Component,
  options: { mode: 'list' | 'modelValue'; header: boolean; itemKey: unknown },
): Promise<{ items: string[]; dom: string[]; contexts: unknown[] }> {
  const state = reactive({ items: named('a', 'b', 'c') });
  const Parent = defineComponent({
    render: () =>
      h(
        impl,
        {
          tag: 'transition-group',
          componentData: { tag: 'ul', name: 'flip' },
          itemKey: options.itemKey,
          ...(options.mode === 'list'
            ? { list: state.items }
            : {
                modelValue: state.items,
                'onUpdate:modelValue': (v: Named[]) => (state.items = v),
              }),
        },
        {
          item: itemSlot,
          ...(options.header ? { header: () => h('h3', { key: 'header' }, 'H') } : {}),
        },
      ),
  });
  const wrapper = mount(Parent, { global: unstubbed, attachTo: document.body });
  await settle();
  const root = wrapper.find('ul').element as HTMLElement;
  const sortable = sortableOf(registry, root);
  const offset = options.header ? 1 : 0;
  const item = root.children[offset] as HTMLElement;
  callbackOf(sortable, 'onStart')({ item });
  root.appendChild(item); // Sortable moved "a" to the end
  callbackOf(sortable, 'onUpdate')({ item, from: root, oldIndex: offset, newIndex: offset + 2 });
  await settle();
  return { items: state.items.map((i) => i.n), dom: textOf(root), contexts: contextIndexes(root) };
}

describe('ID-1: tag="transition-group" with a real TransitionGroup (#140, #180, #138, #188, #228)', () => {
  it.each([
    ['list', false, 'id'],
    ['modelValue', false, 'id'],
    ['modelValue', true, 'id'],
    ['list', false, (e: Named) => `key-${String(e.id)}`],
    ['list', false, (e: Named) => e.id], // numeric keys, including 0 (#159)
  ] as const)('%s mode, header %s, itemKey %s', async (mode, header, itemKey) => {
    for (const [name, impl] of implementations) {
      const result = await outcome(() => sortInTransitionGroup(impl, { mode, header, itemKey }));
      if (name === REFERENCE) {
        expect(result.error, name).toBe(NULL_CONTEXT_CRASH);
      } else {
        expect(result.error, name).toBeUndefined();
        const offset = header ? 1 : 0;
        expect(result.value?.items, name).toEqual(['b', 'c', 'a']);
        expect(result.value?.dom.slice(offset), name).toEqual(['b', 'c', 'a']);
        expect(result.value?.contexts.slice(offset), name).toEqual([0, 1, 2]);
      }
    }
  });

  it('the <script setup> reproduction from #188 mounts and sorts', async () => {
    for (const [name, impl] of implementations) {
      const result = await outcome(async () => {
        const wrapper = mount(TransitionSetup, {
          props: { impl },
          global: unstubbed,
          attachTo: document.body,
        });
        await settle();
        const root = wrapper.find('ul').element as HTMLElement;
        const sortable = sortableOf(registry, root);
        const item = root.children[3] as HTMLElement; // "Chris"
        callbackOf(sortable, 'onStart')({ item });
        root.insertBefore(item, root.children[0] as Element);
        callbackOf(sortable, 'onUpdate')({ item, from: root, oldIndex: 3, newIndex: 0 });
        await settle();
        const list = (wrapper.vm as unknown as { exampleValues: { name: string }[] }).exampleValues;
        return { names: list.map((v) => v.name), dom: textOf(root) };
      });
      if (name === REFERENCE) {
        expect(result.error, name).toBe(NULL_CONTEXT_CRASH);
      } else {
        expect(result.value, name).toEqual({
          names: ['Chris', 'John', 'Emily', 'Rachel'],
          dom: ['Chris', 'John', 'Emily', 'Rachel'],
        });
      }
    }
  });

  it('starting a drag on an element that is not an item does not throw', async () => {
    for (const [name, impl] of implementations) {
      const result = await outcome(async () => {
        const items = named('a', 'b');
        const wrapper = mount(impl, {
          props: { list: items, itemKey: 'id' },
          slots: { item: itemSlot, header: () => h('h3', 'H') },
          attachTo: document.body,
        });
        await settle();
        const root = wrapper.element as HTMLElement;
        const sortable = sortableOf(registry, root);
        const header = root.children[0] as HTMLElement;
        callbackOf(sortable, 'onStart')({ item: header });
        callbackOf(sortable, 'onUpdate')({ item: header, from: root, oldIndex: 0, newIndex: 1 });
        await settle();
        return items.map((i) => i.n);
      });
      if (name === REFERENCE) {
        expect(result.error, name).toMatch(/Cannot read properties of null/);
      } else {
        expect(result.error, name).toBeUndefined();
        expect(result.value, name).toEqual(['a', 'b']);
        expect(result.console, name).toContain(
          '[vue-draggable] The dragged element is not a rendered item of this list.',
        );
      }
    }
  });
});

describe('ID-6: fragment root, dragging to another list (#34)', () => {
  it.each([
    ['tag is a fragment component', { tag: 'FragmentRoot' }],
    [
      'transition-group without componentData.tag',
      { tag: 'transition-group', componentData: { name: 'fade' } },
    ],
  ])('%s', async (_, rootProps) => {
    for (const [name, impl] of implementations) {
      const result = await outcome(async () => {
        const a = reactive({ items: named('a1', 'a2', 'a3') });
        const b = reactive({ items: named('b1', 'b2') });
        const list = (state: { items: Named[] }, cls: string): ReturnType<typeof h> =>
          h('div', { class: cls }, [
            h(
              impl,
              {
                ...rootProps,
                modelValue: state.items,
                'onUpdate:modelValue': (v: Named[]) => (state.items = v),
                itemKey: 'id',
                group: 'g',
              },
              { item: itemSlot },
            ),
          ]);
        const wrapper = mount(
          defineComponent({ render: () => h('main', [list(a, 'A'), list(b, 'B')]) }),
          { global: { components: { FragmentRoot }, ...unstubbed }, attachTo: document.body },
        );
        await settle();
        const rootA = wrapper.find('.A').element as HTMLElement;
        const rootB = wrapper.find('.B').element as HTMLElement;
        const item = rootA.children[0] as HTMLElement;
        callbackOf(sortableOf(registry, rootA), 'onStart')({ item });
        rootB.insertBefore(item, rootB.children[1] as Element);
        callbackOf(sortableOf(registry, rootB), 'onAdd')({ item, newIndex: 1 });
        callbackOf(sortableOf(registry, rootA), 'onRemove')({ item, oldIndex: 0 });
        callbackOf(sortableOf(registry, rootA), 'onEnd')({ item });
        await settleTransitions();
        return {
          a: a.items.map((i) => i.n),
          b: b.items.map((i) => i.n),
          domA: textOf(rootA),
          domB: textOf(rootB),
        };
      });
      if (name === REFERENCE) {
        expect(result.error, name).toBeDefined();
      } else {
        expect(result.error, name).toBeUndefined();
        expect(result.value, name).toEqual({
          a: ['a2', 'a3'],
          b: ['b1', 'a1', 'b2'],
          domA: ['a2', 'a3'],
          domB: ['b1', 'a1', 'b2'],
        });
      }
    }
  });
});

/** A `list`-mode draggable with the given plugin attributes. */
async function pluginList(impl: Component, names: string[], attrs: Record<string, unknown>) {
  const items = named(...names);
  const wrapper = mount(impl, {
    props: { list: items, itemKey: 'id' },
    attrs,
    slots: { item: itemSlot },
    attachTo: document.body,
  });
  await settle();
  const root = wrapper.element as HTMLElement;
  return { items, root, sortable: sortableOf(registry, root) };
}

describe('ID-5: MultiDrag and Swap (#221, #163, #192)', () => {
  it('MultiDrag: sorting two selected items inside one list moves both', async () => {
    for (const [name, impl] of implementations) {
      const result = await outcome(async () => {
        const { items, root, sortable } = await pluginList(impl, ['a', 'b', 'c', 'd'], {
          multiDrag: true,
        });
        const [a, , c] = [...root.children] as HTMLElement[];
        const selected = [a, c] as HTMLElement[];
        callbackOf(sortable, 'onStart')({ item: a, items: selected });
        root.appendChild(a as HTMLElement);
        root.appendChild(c as HTMLElement); // Sortable moved the selection after "d"
        callbackOf(
          sortable,
          'onUpdate',
        )({
          item: a,
          items: selected,
          from: root,
          oldIndex: 0,
          newIndex: 2,
          oldIndicies: [
            { multiDragElement: a, index: 0 },
            { multiDragElement: c, index: 2 },
          ],
          newIndicies: [
            { multiDragElement: a, index: 2 },
            { multiDragElement: c, index: 3 },
          ],
        });
        await settle();
        return { items: items.map((i) => i.n), dom: textOf(root) };
      });
      const expected = { items: ['b', 'd', 'a', 'c'], dom: ['b', 'd', 'a', 'c'] };
      if (name === REFERENCE) expect(result.value, name).not.toEqual(expected);
      else expect(result.value, name).toEqual(expected);
    }
  });

  it('MultiDrag: dragging two selected items to another list moves both', async () => {
    for (const [name, impl] of implementations) {
      const result = await outcome(async () => {
        const a = await pluginList(impl, ['a1', 'a2', 'a3'], { multiDrag: true, group: 'g' });
        const b = await pluginList(impl, ['b1', 'b2'], { multiDrag: true, group: 'g' });
        const [a1, , a3] = [...a.root.children] as HTMLElement[];
        const selected = [a1, a3] as HTMLElement[];
        callbackOf(a.sortable, 'onStart')({ item: a1, items: selected });
        b.root.insertBefore(a1 as HTMLElement, b.root.children[1] as Element);
        b.root.insertBefore(a3 as HTMLElement, b.root.children[2] as Element);
        callbackOf(
          b.sortable,
          'onAdd',
        )({
          item: a1,
          items: selected,
          newIndex: 1,
          newIndicies: [
            { multiDragElement: a1, index: 1 },
            { multiDragElement: a3, index: 2 },
          ],
        });
        callbackOf(a.sortable, 'onRemove')({ item: a1, items: selected, oldIndex: 0 });
        callbackOf(a.sortable, 'onEnd')({ item: a1, items: selected });
        await settle();
        return {
          a: a.items.map((i) => i.n),
          b: b.items.map((i) => i.n),
          domA: textOf(a.root),
          domB: textOf(b.root),
        };
      });
      const expected = {
        a: ['a2'],
        b: ['b1', 'a1', 'a3', 'b2'],
        domA: ['a2'],
        domB: ['b1', 'a1', 'a3', 'b2'],
      };
      if (name === REFERENCE) expect(result.value, name).not.toEqual(expected);
      else expect(result.value, name).toEqual(expected);
    }
  });

  it('Swap: dropping on an item of the same list swaps the two', async () => {
    for (const [name, impl] of implementations) {
      const result = await outcome(async () => {
        const { items, root, sortable } = await pluginList(impl, ['a', 'b', 'c', 'd'], {
          swap: true,
        });
        const [a, , c] = [...root.children] as HTMLElement[];
        callbackOf(sortable, 'onStart')({ item: a, swapItem: null });
        // Sortable's swapNodes(a, c)
        root.insertBefore(c as HTMLElement, root.children[0] as Element);
        root.insertBefore(a as HTMLElement, root.children[3] as Element);
        callbackOf(
          sortable,
          'onUpdate',
        )({ item: a, swapItem: c, from: root, oldIndex: 0, newIndex: 2 });
        await settle();
        return { items: items.map((i) => i.n), dom: textOf(root) };
      });
      const expected = { items: ['c', 'b', 'a', 'd'], dom: ['c', 'b', 'a', 'd'] };
      if (name === REFERENCE) expect(result.value, name).not.toEqual(expected);
      else expect(result.value, name).toEqual(expected);
    }
  });

  it('Swap: dropping on an item of another list makes them trade places', async () => {
    for (const [name, impl] of implementations) {
      const result = await outcome(async () => {
        const a = await pluginList(impl, ['a1', 'a2'], { swap: true, group: 'g' });
        const b = await pluginList(impl, ['b1', 'b2'], { swap: true, group: 'g' });
        const a1 = a.root.children[0] as HTMLElement;
        const b2 = b.root.children[1] as HTMLElement;
        callbackOf(a.sortable, 'onStart')({ item: a1, swapItem: null });
        a.root.insertBefore(b2, a1); // swapNodes(a1, b2)
        b.root.appendChild(a1);
        callbackOf(b.sortable, 'onAdd')({ item: a1, swapItem: b2, newIndex: 1 });
        callbackOf(a.sortable, 'onRemove')({ item: a1, swapItem: b2, oldIndex: 0 });
        callbackOf(a.sortable, 'onEnd')({ item: a1 });
        await settle();
        return {
          a: a.items.map((i) => i.n),
          b: b.items.map((i) => i.n),
          domA: textOf(a.root),
          domB: textOf(b.root),
        };
      });
      const expected = { a: ['b2', 'a2'], b: ['b1', 'a1'], domA: ['b2', 'a2'], domB: ['b1', 'a1'] };
      if (name === REFERENCE) expect(result.value, name).not.toEqual(expected);
      else expect(result.value, name).toEqual(expected);
    }
  });

  it('mountSortablePlugins mounts on our Sortable once, and reports unknown names', async () => {
    const result = await outcome(() => {
      mountSortablePlugins('MultiDrag', 'Swap');
      mountSortablePlugins('MultiDrag'); // idempotent
      mountSortablePlugins('AutoScroll', 'OnSpill'); // mounted by every sortablejs build
      // Plain JavaScript callers can pass anything.
      (mountSortablePlugins as (...names: string[]) => void)('Nope');
    });
    expect(result.error).toBeUndefined();
    expect(fake.mountedPlugins).toEqual([{ pluginName: 'multiDrag' }, { pluginName: 'swap' }]);
    expect(result.console).toEqual(['[vue-draggable] Unknown SortableJS plugin "Nope".']);
  });
});

describe('ID-8: diagnostics with the [vue-draggable] prefix (owner decision D-3)', () => {
  it('a missing itemKey is reported in every build', async () => {
    for (const [name, impl] of implementations) {
      const result = await outcome(async () => {
        mount(impl, { props: { list: named('a') }, slots: { item: itemSlot } });
        await settle();
      });
      const ours = result.console.filter((m) => m.startsWith('[vue-draggable]'));
      if (name === OURS)
        expect(ours, name).toEqual([expect.stringContaining('"itemKey" prop is required')]);
      else expect(ours, name).toEqual([]);
    }
  });
});
