/**
 * Client side: hydrate server-rendered HTML with createSSRApp in happy-dom and the real
 * SortableJS. No hydration warning may appear, Sortable must be created on the hydrated root
 * (only after mount) and the items must carry their context.
 */
import { nextTick, type ComponentPublicInstance } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Sortable from 'sortablejs';
import { describe, expect, it, vi } from 'vitest';
import { createScenarioApp, scenarios } from './ssr-scenarios';

describe.each(Object.entries(scenarios))('hydration: %s', (_, app) => {
  it('matches the server markup and starts Sortable on the client', async () => {
    // Server render with the browser globals hidden, so client-only output cannot leak into it.
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    let html: string;
    try {
      html = await renderToString(createScenarioApp(app));
    } finally {
      vi.unstubAllGlobals();
    }
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const warnings: string[] = [];
    const errors: string[] = [];
    const { warn, error } = console;
    console.warn = (...args: unknown[]): void => {
      warnings.push(String(args[0]));
    };
    console.error = (...args: unknown[]): void => {
      errors.push(String(args[0]));
    };
    try {
      const client = createScenarioApp(app);
      client.config.warnHandler = (message) => {
        warnings.push(message);
      };
      client.mount(container);
      await nextTick();
    } finally {
      console.warn = warn;
      console.error = error;
    }

    expect(warnings.filter((w) => /hydrat|mismatch/i.test(w))).toEqual([]);
    expect(errors).toEqual([]);
    expect(container.innerHTML).toBe(html);

    const items = [...container.querySelectorAll('[data-draggable]')];
    const root = items[0]?.parentElement ?? container.querySelector('main > *');
    expect(root).not.toBeNull();
    // `sortablejs` is untyped here (ADR-0002); `Sortable.get` returns the instance bound to an element.
    const instance = (Sortable as { get(element: HTMLElement): unknown }).get(root as HTMLElement);
    expect(instance, 'a real Sortable instance on the list root').toBeDefined();
    const component = (
      root as unknown as {
        __draggable_component__?: ComponentPublicInstance & { _sortable?: unknown };
      }
    ).__draggable_component__;
    expect(component?._sortable).toBe(instance);
    expect(
      items.map(
        (item) =>
          (item as unknown as { __draggable_context?: { index: number } }).__draggable_context
            ?.index,
      ),
    ).toEqual(items.map((_, index) => index));
  });
});
