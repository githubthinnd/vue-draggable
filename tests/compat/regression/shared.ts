/** Helpers for regression tests: each runs on both implementations with its own expectation. */
import { nextTick, type Component } from 'vue';
import reference from '#reference';
import ours from '#ours';

export const REFERENCE = 'vuedraggable@4.1.0';
export const OURS = '@stacklogs/vue-draggable';

export const implementations: [typeof REFERENCE | typeof OURS, Component][] = [
  [REFERENCE, reference],
  [OURS, ours],
];

export interface Outcome<T> {
  /** Message of the error the scenario threw, if any. */
  error?: string;
  value?: T;
  /** First argument of every console.error / console.warn call. */
  console: string[];
}

/** Runs a scenario, capturing a thrown error and console output instead of failing. */
export async function outcome<T>(run: () => Promise<T> | T): Promise<Outcome<T>> {
  const messages: string[] = [];
  const { error, warn } = console;
  console.error = (...args: unknown[]): void => {
    messages.push(String(args[0]));
  };
  console.warn = (...args: unknown[]): void => {
    messages.push(String(args[0]));
  };
  try {
    return { value: await run(), console: messages };
  } catch (thrown) {
    return { error: thrown instanceof Error ? thrown.message : String(thrown), console: messages };
  } finally {
    console.error = error;
    console.warn = warn;
  }
}

export async function settle(): Promise<void> {
  for (let i = 0; i < 3; i++) await nextTick();
}

/** Also lets TransitionGroup leave transitions finish (they end on animation frames). */
export async function settleTransitions(): Promise<void> {
  await settle();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await settle();
}

export function textOf(element: Element): string[] {
  return [...element.children].map((child) => child.textContent.trim());
}

export function contextIndexes(element: Element): unknown[] {
  return [...element.children].map(
    (child) =>
      (child as unknown as { __draggable_context?: { index: number } }).__draggable_context?.index,
  );
}
