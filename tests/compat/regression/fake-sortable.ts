/**
 * Stand-in for the `sortablejs` ES module used by the regression suite (`vi.mock('sortablejs', …)`
 * imports this file, so tests and both implementations share its state). Records every instance
 * and every plugin mount; mounting the same plugin twice throws like SortableJS does.
 */
import type { FakeSortableRecord } from '../differential/harness';

export const instances: FakeSortableRecord[] = [];
export const mountedPlugins: unknown[] = [];

export default class FakeSortable {
  element: HTMLElement;
  options: Record<string, unknown>;
  calls: unknown[][] = [];

  constructor(element: HTMLElement, options: Record<string, unknown>) {
    this.element = element;
    this.options = options;
    instances.push(this);
  }

  static mount(...plugins: unknown[]): void {
    for (const plugin of plugins) {
      const name = (plugin as { pluginName?: string }).pluginName;
      if (mountedPlugins.some((p) => (p as { pluginName?: string }).pluginName === name)) {
        // SortableJS throws a string here.
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw `Sortable: Cannot mount plugin ${String(name)} more than once`;
      }
      mountedPlugins.push(plugin);
    }
  }

  option(name: string, value: unknown): void {
    this.calls.push(['option', name, value]);
  }

  destroy(): void {
    this.calls.push(['destroy']);
  }
}

/** The ESM build of sortablejs exports these plugin factories (`new MultiDrag()` → plugin). */
export function MultiDrag(): { pluginName: string } {
  return { pluginName: 'multiDrag' };
}
export function Swap(): { pluginName: string } {
  return { pluginName: 'swap' };
}

export function reset(): void {
  instances.length = 0;
  mountedPlugins.length = 0;
}
