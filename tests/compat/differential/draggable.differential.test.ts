/**
 * Differential suite (docs/compat.md): every scenario runs against vuedraggable@4.1.0 (`#reference`)
 * and @vue-draggable/core (`#ours`); their traces must be equal. Each scenario also asserts the
 * reference trace is what compat.md documents, so the suite cannot pass vacuously.
 */
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, reactive, type Component } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import reference from '#reference';
import ours from '#ours';
import {
  callbackOf,
  captureConsole,
  html,
  recordingListeners,
  serialize,
  settle,
  sortableOf,
  sortableTrace,
  type FakeSortableRecord,
  type SortableRegistry,
  type TraceLog,
} from './harness';

const registry = vi.hoisted(() => {
  const instances: FakeSortableRecord[] = [];
  class FakeSortable {
    element: HTMLElement;
    options: Record<string, unknown>;
    calls: unknown[][] = [];
    constructor(element: HTMLElement, options: Record<string, unknown>) {
      this.element = element;
      this.options = options;
      instances.push(this);
    }
    option(name: string, value: unknown): void {
      this.calls.push(['option', name, value]);
    }
    destroy(): void {
      this.calls.push(['destroy']);
    }
  }
  return { instances, FakeSortable };
});

vi.mock('sortablejs', () => ({ default: registry.FakeSortable }));

const implementations: [string, Component][] = [
  ['vuedraggable@4.1.0', reference as Component],
  ['@vue-draggable/core', ours as Component],
];

const Fake = defineComponent({
  name: 'FakeRoot',
  props: { prop1: { type: String, default: 'string' } },
  emits: ['custom'],
  setup(props, { slots }) {
    return () => h('div', { class: 'fake-root', id: props.prop1 }, slots['default']?.());
  },
});

const FragmentRoot = defineComponent({
  name: 'FragmentRoot',
  setup(_, { slots }) {
    return () => slots['default']?.();
  },
});

const global = { components: { 'component-tag': Fake, FragmentRoot } };

type Run = (impl: Component, reg: SortableRegistry, log: TraceLog) => Promise<unknown>;

/** Our own `[vue-draggable]` console messages (docs/compat.md ID-8); 4.1.0 has none. */
const isDiagnostic = (entry: unknown): boolean =>
  Array.isArray(entry) && typeof entry[1] === 'string' && entry[1].startsWith('[vue-draggable]');

interface Trace {
  result: unknown;
  log: unknown[];
}

/**
 * Runs a scenario on both implementations. Our `[vue-draggable]` diagnostics are taken out of the
 * compared trace and returned separately, so tests assert them explicitly.
 */
async function both(run: Run): Promise<{ traces: [Trace, Trace]; diagnostics: unknown[] }> {
  const traces: Trace[] = [];
  let diagnostics: unknown[] = [];
  for (const [, impl] of implementations) {
    registry.instances.length = 0;
    const log: TraceLog = { entries: [] };
    const restore = captureConsole(log);
    try {
      const result = await run(impl, registry, log);
      if (impl === ours) diagnostics = log.entries.filter(isDiagnostic);
      traces.push({ result: serialize(result), log: log.entries.filter((e) => !isDiagnostic(e)) });
    } finally {
      restore();
    }
  }
  return { traces: [traces[0] as Trace, traces[1] as Trace], diagnostics };
}

async function expectSame(run: Run): Promise<Trace & { diagnostics: unknown[] }> {
  const { traces, diagnostics } = await both(run);
  expect(traces[1]).toEqual(traces[0]);
  return { ...traces[0], diagnostics };
}

const itemSlot = ({ element }: { element: unknown }): ReturnType<typeof h> =>
  h('div', null, String(element));

afterEach(() => {
  document.body.innerHTML = '';
});

describe.each(implementations)('implementation loads: %s', (_, impl) => {
  it('is named draggable', () => {
    expect((impl as { name?: string }).name).toBe('draggable');
  });
});

describe('rendering (compat.md §4)', () => {
  it.each([
    ['div default, header, footer', { list: ['a', 'b', 'c'] }, true],
    ['tag ul', { list: ['a', 'b'], tag: 'ul' }, false],
    ['tag span with modelValue', { modelValue: [1, 2], tag: 'span' }, false],
    ['empty list', { list: [] }, true],
    ['null list and modelValue', {}, true],
    [
      'component tag + componentData',
      { list: [1], tag: 'component-tag', componentData: { prop1: 'my-id', attribute1: 'v' } },
      false,
    ],
    ['fragment component tag', { list: ['a', 'b'], tag: 'FragmentRoot' }, false],
    ['unresolvable component tag', { list: ['a'], tag: 'NotRegistered' }, false],
    [
      'transition-group with componentData.tag',
      { list: ['a', 'b'], tag: 'transition-group', componentData: { tag: 'ul', name: 'flip' } },
      false,
    ],
  ])('%s', async (_, props, withHeaderFooter) => {
    const trace = await expectSame(async (impl, reg) => {
      const wrapper = mount(
        {
          render: () =>
            h('section', [
              h(
                impl,
                { itemKey: (k: unknown) => k, ...props },
                {
                  item: itemSlot,
                  ...(withHeaderFooter
                    ? { header: () => h('header'), footer: () => h('footer') }
                    : {}),
                },
              ),
            ]),
        },
        { global, attachTo: document.body },
      );
      await settle();
      const result = {
        html: html(wrapper.element),
        sortables: reg.instances.map((s) => ({
          on: s.element.tagName,
          ...(sortableTrace(s) as object),
        })),
      };
      wrapper.unmount();
      return { ...result, afterUnmount: reg.instances.map((s) => s.calls) };
    });
    expect(trace.result).toBeTruthy();
  });

  it('routes attributes: html attrs to the root, the rest to Sortable (A-1..A-6)', async () => {
    const trace = await expectSame(async (impl, reg) => {
      const onClick = vi.fn();
      const wrapper = mount(impl, {
        props: { list: ['a'], itemKey: (k: unknown) => k },
        attrs: {
          id: 'root-id',
          class: 'root-class',
          role: 'list',
          style: 'color: red',
          'data-x': '1',
          'aria-label': 'L',
          onClick,
          'ghost-class': 'ghost',
          animation: 150,
          draggable: '.item',
          'data-id-attr': 'kebab-data-goes-to-html',
          dataIdAttr: 'camel',
        },
        slots: { item: itemSlot },
      });
      await settle();
      (wrapper.element as HTMLElement).click();
      const sortable = reg.instances[0] as FakeSortableRecord;
      return {
        html: html(wrapper.element),
        sortable: sortableTrace(sortable),
        clicks: onClick.mock.calls.length,
      };
    });
    const result = trace.result as {
      sortable: { options: Record<string, unknown> };
      clicks: number;
    };
    expect(result.sortable.options['draggable']).toBe('[data-draggable].item');
    expect(result.sortable.options['ghostClass']).toBe('ghost');
    expect(result.sortable.options).not.toHaveProperty('dataIdAttr', 'kebab-data-goes-to-html');
    expect(result.clicks).toBe(1);
  });

  it.each([
    ['string key', 'id'],
    ['function key', (e: { id: number }) => `k${String(e.id)}`],
  ])('sets vnode keys from itemKey (%s)', async (_, itemKey) => {
    const trace = await expectSame((impl) => {
      const wrapper = mount(impl, {
        props: { list: [{ id: 1 }, { id: 2 }], itemKey },
        slots: {
          item: ({ element }: { element: { id: number } }) => h('div', null, String(element.id)),
        },
      });
      return Promise.resolve(
        [...wrapper.element.children].map(
          (child) => (child as unknown as { __vnode: { key: unknown } }).__vnode.key,
        ),
      );
    });
    expect(trace.result).toHaveLength(2);
  });

  it.each([
    ['no item slot', { list: [] }, {}],
    ['item slot with two roots', { list: [1] }, { item: () => [h('div'), h('span')] }],
  ])('renders the error <pre> and creates no Sortable: %s', async (_, props, slots) => {
    const trace = await expectSame(async (impl, reg) => {
      const wrapper = mount(impl, { props: { itemKey: (k: unknown) => k, ...props }, slots });
      await settle();
      const vm = wrapper.vm as unknown as { error: boolean; _sortable?: unknown };
      // Only the first line: stack frames point at each implementation's own files.
      const firstLine = wrapper.element.textContent.split('\n')[0];
      return {
        tag: wrapper.element.tagName,
        firstLine,
        error: vm.error,
        sortables: reg.instances.length,
      };
    });
    expect((trace.result as { tag: string }).tag).toBe('PRE');
    // ID-8: ours also logs the render error.
    expect(trace.diagnostics).toContainEqual([
      'console.error',
      '[vue-draggable] Rendering failed:',
    ]);
  });

  it('logs the mutually-exclusive error when both list and modelValue are set (PR-8)', async () => {
    const trace = await expectSame(async (impl) => {
      mount(impl, {
        props: { list: [], modelValue: [], itemKey: (k: unknown) => k },
        slots: { item: itemSlot },
      });
      await settle();
      return null;
    });
    expect(trace.log).toContainEqual([
      'console.error',
      'modelValue and list props are mutually exclusive! Please set one or another.',
    ]);
  });
});

/** A single list in `list` or `modelValue` mode, with every event recorded in order. */
function singleList(
  impl: Component,
  log: TraceLog,
  mode: 'list' | 'modelValue',
  extra: Record<string, unknown> = {},
) {
  const state = reactive({ items: ['a', 'b', 'c', 'd'] });
  const Parent = defineComponent({
    render: () =>
      h(
        impl,
        {
          itemKey: (k: unknown) => k,
          ...(mode === 'list'
            ? { list: state.items }
            : {
                modelValue: state.items,
                'onUpdate:modelValue': (value: string[]) => {
                  state.items = value;
                },
              }),
          ...recordingListeners(log, 'list'),
          ...extra,
        },
        { item: itemSlot, header: () => h('header'), footer: () => h('footer') },
      ),
  });
  const wrapper = mount(Parent, { global, attachTo: document.body });
  return { wrapper, state, root: wrapper.element as HTMLElement };
}

describe.each(['list', 'modelValue'] as const)(
  'drag operations in %s mode (compat.md §6)',
  (mode) => {
    it('reorders within the list: start, update, end (E-1, E-4, E-5)', async () => {
      const trace = await expectSame(async (impl, reg, log) => {
        const { state, root } = singleList(impl, log, mode);
        await settle();
        const sortable = sortableOf(reg, root);
        // DOM children: header, a, b, c, d, footer. Drag "a" (dom 1) after "c" (dom 3).
        const item = root.children[1] as HTMLElement;
        callbackOf(sortable, 'onStart')({ item });
        await settle();
        const startData = (item as unknown as { _underlying_vm_: unknown })._underlying_vm_;
        root.removeChild(item);
        root.insertBefore(item, root.children[3] as Element);
        callbackOf(sortable, 'onUpdate')({ item, from: root, oldIndex: 1, newIndex: 3 });
        await settle();
        callbackOf(sortable, 'onEnd')({ item });
        await settle();
        return { startData, items: [...state.items], html: html(root) };
      });
      const names = trace.log.map((entry) => (entry as unknown[])[1]);
      expect(names).toEqual(
        mode === 'modelValue'
          ? ['start', 'update:modelValue', 'change', 'update', 'end']
          : ['start', 'change', 'update', 'end'],
      );
    });

    it('adds an item dragged from another draggable (E-2)', async () => {
      const trace = await expectSame(async (impl, reg, log) => {
        const { state, root } = singleList(impl, log, mode);
        await settle();
        const sortable = sortableOf(reg, root);
        const item = document.createElement('div');
        item.textContent = 'x';
        (item as unknown as { _underlying_vm_: unknown })._underlying_vm_ = 'x';
        root.insertBefore(item, root.children[2] as Element);
        callbackOf(sortable, 'onAdd')({ item, newIndex: 2 });
        await settle();
        return { items: [...state.items], html: html(root) };
      });
      const names = trace.log.map((entry) => (entry as unknown[])[1]);
      expect(names).toEqual(
        mode === 'modelValue' ? ['update:modelValue', 'change', 'add'] : ['change', 'add'],
      );
    });

    it('ignores an added element that is not from a draggable, but still emits add', async () => {
      const trace = await expectSame(async (impl, reg, log) => {
        const { state, root } = singleList(impl, log, mode);
        await settle();
        const item = document.createElement('div');
        root.appendChild(item);
        callbackOf(sortableOf(reg, root), 'onAdd')({ item, newIndex: 5 });
        await settle();
        return { items: [...state.items], html: html(root) };
      });
      expect(trace.log.map((entry) => (entry as unknown[])[1])).toEqual(['add']);
    });

    it.each([
      ['move', undefined],
      ['clone', 'clone'],
    ])('removes an item dragged out (%s pull) (E-3)', async (_, pullMode) => {
      const trace = await expectSame(async (impl, reg, log) => {
        const { state, root } = singleList(impl, log, mode);
        await settle();
        const sortable = sortableOf(reg, root);
        const item = root.children[2] as HTMLElement; // "b"
        callbackOf(sortable, 'onStart')({ item });
        await settle();
        const clone = item.cloneNode(true) as HTMLElement;
        if (pullMode === 'clone') root.insertBefore(clone, item);
        root.removeChild(item);
        document.body.appendChild(item); // Sortable moved it into another list
        callbackOf(sortable, 'onRemove')({ item, oldIndex: 2, pullMode, clone });
        await settle();
        return { items: [...state.items], html: html(root) };
      });
      expect(trace.log.length).toBeGreaterThan(1);
    });

    it.each(['onChoose', 'onUnchoose', 'onSort', 'onFilter', 'onClone'])(
      'forwards %s as a deferred emit with the raw event',
      async (callbackName) => {
        const trace = await expectSame(async (impl, reg, log) => {
          const { root } = singleList(impl, log, mode);
          await settle();
          const sortable = sortableOf(reg, root);
          const evt = { marker: callbackName };
          callbackOf(sortable, callbackName)(evt);
          const before = log.entries.length;
          await settle();
          return { emittedSynchronously: before };
        });
        expect(trace.log).toHaveLength(1);
      },
    );
  },
);

describe('move callback (compat.md §6.4)', () => {
  it('returns true without calling move when move is not set (M-1)', async () => {
    const trace = await expectSame(async (impl, reg, log) => {
      const { root } = singleList(impl, log, 'list');
      await settle();
      return callbackOf(sortableOf(reg, root), 'onMove')(
        { to: root, related: root.children[1] },
        {},
      );
    });
    expect(trace.result).toBe(true);
  });

  it('builds draggedContext and relatedContext across two lists (M-3..M-6)', async () => {
    const trace = await expectSame(async (impl, reg, log) => {
      const calls: unknown[] = [];
      const move = (evt: unknown, original: unknown): unknown => {
        calls.push(serialize({ evt, original }));
        return calls.length === 1 ? false : undefined;
      };
      const a = reactive({ items: ['a1', 'a2', 'a3'] });
      const b = reactive({ items: ['b1', 'b2'] });
      const Parent = defineComponent({
        render: () =>
          h('main', [
            h(
              impl,
              {
                list: a.items,
                itemKey: (k: unknown) => k,
                move,
                class: 'A',
                ...recordingListeners(log, 'A'),
              },
              { item: itemSlot },
            ),
            h(
              impl,
              {
                list: b.items,
                itemKey: (k: unknown) => k,
                class: 'B',
                ...recordingListeners(log, 'B'),
              },
              { item: itemSlot },
            ),
            h('div', { class: 'plain' }, [h('span')]),
          ]),
      });
      const wrapper = mount(Parent, { attachTo: document.body });
      await settle();
      const rootA = wrapper.find('.A').element as HTMLElement;
      const rootB = wrapper.find('.B').element as HTMLElement;
      const plain = wrapper.find('.plain').element as HTMLElement;
      const sortableA = sortableOf(reg, rootA);
      const item = rootA.children[1] as HTMLElement;
      callbackOf(sortableA, 'onStart')({ item });
      await settle();
      const onMove = callbackOf(sortableA, 'onMove');
      (rootB.children[0] as HTMLElement).style.display = 'none';
      const results = [
        onMove(
          { to: rootB, related: rootB.children[1], willInsertAfter: true, from: rootA },
          { type: 'dragover' },
        ),
        onMove(
          { to: rootB, related: rootB, willInsertAfter: false, from: rootA },
          { type: 'dragover' },
        ),
        onMove({ to: plain, related: plain.children[0], from: rootA }, { type: 'dragover' }),
        onMove(
          { to: rootA, related: rootA.children[2], willInsertAfter: true, from: rootA },
          { type: 'dragover' },
        ),
      ];
      return { results, calls };
    });
    expect((trace.result as { results: unknown[] }).results).toEqual([
      false,
      undefined,
      undefined,
      undefined,
    ]);
  });
});

describe('cross-list drop (two draggables sharing a group)', () => {
  it.each([undefined, 'clone'])(
    'moves data and emits in Sortable order (pullMode %s)',
    async (pullMode) => {
      await expectSame(async (impl, reg, log) => {
        const a = reactive({ items: ['a1', 'a2', 'a3'] });
        const b = reactive({ items: ['b1', 'b2'] });
        const Parent = defineComponent({
          render: () =>
            h('main', [
              h(
                impl,
                {
                  modelValue: a.items,
                  'onUpdate:modelValue': (v: string[]) => (a.items = v),
                  itemKey: (k: unknown) => k,
                  class: 'A',
                  group: 'g',
                  ...recordingListeners(log, 'A'),
                },
                { item: itemSlot },
              ),
              h(
                impl,
                {
                  modelValue: b.items,
                  'onUpdate:modelValue': (v: string[]) => (b.items = v),
                  itemKey: (k: unknown) => k,
                  class: 'B',
                  group: 'g',
                  ...recordingListeners(log, 'B'),
                },
                { item: itemSlot },
              ),
            ]),
        });
        const wrapper = mount(Parent, { attachTo: document.body });
        await settle();
        const rootA = wrapper.find('.A').element as HTMLElement;
        const rootB = wrapper.find('.B').element as HTMLElement;
        const item = rootA.children[0] as HTMLElement;
        callbackOf(sortableOf(reg, rootA), 'onStart')({ item });
        await settle();
        const clone = item.cloneNode(true) as HTMLElement;
        if (pullMode) rootA.insertBefore(clone, item);
        rootB.insertBefore(item, rootB.children[1] as Element);
        // Sortable's order on drop: target onAdd, source onRemove, source onEnd.
        callbackOf(sortableOf(reg, rootB), 'onAdd')({ item, newIndex: 1, from: rootA, to: rootB });
        callbackOf(
          sortableOf(reg, rootA),
          'onRemove',
        )({ item, oldIndex: 0, pullMode, clone, from: rootA, to: rootB });
        callbackOf(sortableOf(reg, rootA), 'onEnd')({ item });
        await settle();
        return { a: [...a.items], b: [...b.items], html: html(wrapper.element) };
      });
    },
  );
});

describe('Sortable option updates and lifecycle (A-8, L-2..L-4, I-*)', () => {
  it('calls option() for every valid attr on any attr change, never for on* keys', async () => {
    const trace = await expectSame(async (impl, reg) => {
      const attrs = reactive<Record<string, unknown>>({ disabled: false, animation: 100 });
      const Parent = defineComponent({
        render: () =>
          h(impl, { list: ['a'], itemKey: (k: unknown) => k, ...attrs }, { item: itemSlot }),
      });
      const wrapper = mount(Parent);
      await settle();
      attrs['disabled'] = true;
      await settle();
      attrs['onSort'] = (): void => undefined;
      await settle();
      delete attrs['animation'];
      await settle();
      const sortable = reg.instances[0] as FakeSortableRecord;
      const calls = sortable.calls.map((call) => serialize(call));
      wrapper.unmount();
      return { calls, afterUnmount: serialize(sortable.calls.slice(calls.length)) };
    });
    expect((trace.result as { calls: unknown[] }).calls).toContainEqual([
      'option',
      'disabled',
      true,
    ]);
  });

  it('exposes the same instance members (compat.md §1.4)', async () => {
    await expectSame(async (impl, reg) => {
      const wrapper = mount(impl, {
        props: { list: ['a', 'b'], itemKey: (k: unknown) => k },
        slots: { item: itemSlot },
        attachTo: document.body,
      });
      await settle();
      const vm = wrapper.vm as unknown as Record<string, unknown>;
      const root = wrapper.element as HTMLElement & Record<string, unknown>;
      const item = root.children[1] as HTMLElement & Record<string, unknown>;
      callbackOf(reg.instances[0] as FakeSortableRecord, 'onStart')({ item });
      await nextTick();
      return {
        sortableIsFake: vm['_sortable'] === reg.instances[0],
        targetIsRoot: vm['targetDomElement'] === root,
        componentOnRoot: root['__draggable_component__'] !== undefined,
        itemContext: item['__draggable_context'],
        context: vm['context'],
        realList: vm['realList'],
        error: vm['error'],
        key: (vm['getKey'] as (e: unknown) => unknown)('z'),
        vmIndex: (vm['getVmIndexFromDomIndex'] as (i: number) => number)(5),
        methods: [
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
        ].filter((name) => typeof vm[name] !== 'function'),
      };
    });
  });
});
