/** Apps rendered on the server and hydrated on the client by the SSR tests. */
import { createSSRApp, defineComponent, h, reactive, type App, type Component } from 'vue';
import draggable from '../src/index';

const itemSlot = ({ element }: { element: { id: number; name: string } }): ReturnType<typeof h> =>
  h('li', element.name);

const FakeList = defineComponent({
  name: 'FakeList',
  props: { label: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => h('ol', { 'aria-label': props.label }, slots['default']?.());
  },
});

function app(props: Record<string, unknown>, slots: Record<string, () => unknown> = {}): Component {
  return defineComponent({
    setup() {
      const state = reactive({
        items: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
      });
      return () =>
        h('main', [
          h(
            draggable,
            {
              itemKey: 'id',
              modelValue: state.items,
              'onUpdate:modelValue': (v: typeof state.items) => (state.items = v),
              ...props,
            },
            { item: itemSlot, ...slots },
          ),
        ]);
    },
  });
}

export const scenarios: Record<string, Component> = {
  'default div': app({}),
  'ul with header and footer': app(
    { tag: 'ul' },
    { header: () => h('li', { class: 'h' }, 'H'), footer: () => h('li', 'F') },
  ),
  'empty list': app({ modelValue: [] }),
  'attrs and sortable options': app({
    id: 'list',
    class: 'c',
    'data-x': '1',
    'ghost-class': 'ghost',
    animation: 150,
  }),
  'transition-group with componentData.tag': app({
    tag: 'transition-group',
    componentData: { tag: 'ul', name: 'flip' },
  }),
  'component tag with componentData': app({ tag: 'FakeList', componentData: { label: 'tasks' } }),
};

/**
 * The SSR app for a scenario. `tag` only resolves globally registered components (compat.md R-4),
 * so FakeList is registered on the app.
 */
export function createScenarioApp(root: Component): App {
  const app = createSSRApp(root);
  app.component('FakeList', FakeList);
  return app;
}
