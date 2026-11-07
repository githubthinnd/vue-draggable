/**
 * ID-2: when `sortablejs` cannot be resolved to a constructor at all, 4.1.0 throws from its
 * `mounted` hook (an error in the host app). Ours logs a `[vue-draggable]` error and keeps the
 * list rendered without drag and drop.
 */
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { implementations, outcome, REFERENCE, settle } from './shared';

vi.mock('sortablejs', () => ({ default: { notAConstructor: true } }));

describe('ID-2: sortablejs is not a constructor', () => {
  it.each(implementations)('%s', async (name, impl) => {
    const result = await outcome(async () => {
      const wrapper = mount(impl, {
        props: { list: ['a', 'b'], itemKey: (k: string) => k },
        slots: { item: ({ element }: { element: string }) => h('div', element) },
      });
      await settle();
      return wrapper.html();
    });
    if (name === REFERENCE) {
      expect(result.error).toMatch(/is not a constructor/);
    } else {
      expect(result.error).toBeUndefined();
      expect(result.value).toBe(
        '<div>\n  <div data-draggable="true">a</div>\n  <div data-draggable="true">b</div>\n</div>',
      );
      expect(result.console).toContainEqual(
        expect.stringContaining('[vue-draggable] Could not load SortableJS'),
      );
    }
  });
});
