/**
 * Differential harness: runs one scenario against vuedraggable@4.1.0 and @stacklogs/vue-draggable and
 * returns a serialisable trace (markup, events in emission order, data, Sortable calls, console
 * output). Tests assert the two traces are equal; any accepted difference must be listed in
 * docs/compat.md §10 "Intentional differences".
 *
 * `sortablejs` is replaced by FakeSortable (see the vi.mock in each test file): happy-dom cannot
 * drag, so scenarios call the captured Sortable callbacks with synthetic events, like upstream.
 */
import { nextTick } from 'vue';

export interface FakeSortableRecord {
  element: HTMLElement;
  options: Record<string, unknown>;
  calls: unknown[][];
}

/** Shape shared with the vi.hoisted fake in the test files. */
export interface SortableRegistry {
  instances: FakeSortableRecord[];
}

export interface TraceLog {
  entries: unknown[];
}

/** Recursively turns DOM nodes, component instances and functions into stable strings. */
export function serialize(value: unknown, seen = new WeakSet()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'function') return '[function]';
  if (typeof value !== 'object') return value;
  if (typeof Node !== 'undefined' && value instanceof Node) {
    return value instanceof Element ? `<el ${value.outerHTML}>` : `<node ${value.nodeName}>`;
  }
  if ('$options' in value || '__v_skip' in value) return '[component]';
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => serialize(item, seen));
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    out[key] = serialize((value as Record<string, unknown>)[key], seen);
  }
  return out;
}

export const EVENTS = [
  'update:modelValue',
  'change',
  'start',
  'add',
  'remove',
  'update',
  'end',
  'choose',
  'unchoose',
  'sort',
  'filter',
  'clone',
] as const;

/** `on<Event>` listener props that append `[label, event, payload]` to the log, in emission order. */
export function recordingListeners(log: TraceLog, label: string): Record<string, unknown> {
  const listeners: Record<string, unknown> = {};
  for (const event of EVENTS) {
    const prop = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
    listeners[prop] = (payload: unknown): void => {
      log.entries.push([label, event, serialize(payload)]);
    };
  }
  return listeners;
}

/** Captures console.error / console.warn first arguments (Vue warnings and upstream messages). */
export function captureConsole(log: TraceLog): () => void {
  const { error, warn } = console;
  console.error = (...args: unknown[]): void => {
    log.entries.push(['console.error', String(args[0])]);
  };
  console.warn = (...args: unknown[]): void => {
    log.entries.push(['console.warn', String(args[0])]);
  };
  return () => {
    console.error = error;
    console.warn = warn;
  };
}

export function sortableOf(registry: SortableRegistry, element: Element): FakeSortableRecord {
  const found = registry.instances.filter((instance) => instance.element === element);
  if (found.length !== 1)
    throw new Error(`expected one Sortable on element, found ${String(found.length)}`);
  return found[0] as FakeSortableRecord;
}

export function callbackOf(
  sortable: FakeSortableRecord,
  name: string,
): (...args: unknown[]) => unknown {
  const callback = sortable.options[name];
  if (typeof callback !== 'function') throw new Error(`no Sortable callback ${name}`);
  return callback as (...args: unknown[]) => unknown;
}

/** Serialised Sortable constructor options and later calls, for the trace. */
export function sortableTrace(sortable: FakeSortableRecord): unknown {
  return { options: serialize(sortable.options), calls: serialize(sortable.calls) };
}

/** Lets nextTick-deferred emits and v-model re-renders settle. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 3; i++) await nextTick();
}

/** Normalises markup the way upstream's tests do (no whitespace between tags). */
export function html(element: Element): string {
  return element.outerHTML.replace(/(\r\n|\n)/gm, '').replace(/>(\s)+</gm, '><');
}
