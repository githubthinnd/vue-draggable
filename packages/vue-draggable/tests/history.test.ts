import { nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { useDraggableHistory } from '../src/history';

const tick = async (): Promise<void> => {
  await nextTick();
  await Promise.resolve();
};

describe('useDraggableHistory', () => {
  it('undoes and redoes a v-model style replacement', async () => {
    const list = ref(['a', 'b', 'c']);
    const history = useDraggableHistory(list);
    list.value = ['b', 'a', 'c'];
    await tick();
    expect(history.canUndo.value).toBe(true);
    expect(history.undo()).toBe(true);
    await tick();
    expect(list.value).toEqual(['a', 'b', 'c']);
    expect(history.canRedo.value).toBe(true);
    expect(history.redo()).toBe(true);
    await tick();
    expect(list.value).toEqual(['b', 'a', 'c']);
  });

  it('tracks in-place changes (`:list`) and keeps item identity', async () => {
    const one = { id: 1 };
    const two = { id: 2 };
    const list = ref([one, two]);
    const history = useDraggableHistory(list);
    list.value.splice(0, 1);
    await tick();
    history.undo();
    await tick();
    expect(list.value).toEqual([one, two]);
    expect(list.value[0]).toBe(list.value[0]);
    expect(list.value.map((x) => x.id)).toEqual([1, 2]);
  });

  it('records a move between two lists as one step', async () => {
    const a = ref(['x', 'y']);
    const b = ref(['z']);
    const history = useDraggableHistory([a, b]);
    a.value = ['y'];
    b.value = ['x', 'z'];
    await tick();
    expect(history.size.value).toBe(1);
    history.undo();
    await tick();
    expect([a.value, b.value]).toEqual([['x', 'y'], ['z']]);
  });

  it('a new change clears the redo stack; capacity limits the past', async () => {
    const list = ref([1, 2, 3]);
    const history = useDraggableHistory(list, { capacity: 2 });
    for (const next of [
      [2, 1, 3],
      [2, 3, 1],
      [3, 2, 1],
    ]) {
      list.value = next;
      await tick();
    }
    expect(history.size.value).toBe(2);
    history.undo();
    await tick();
    list.value = [1, 3, 2];
    await tick();
    expect(history.canRedo.value).toBe(false);
    expect(history.undo()).toBe(true);
    expect(history.undo()).toBe(true);
    expect(history.undo()).toBe(false);
  });

  it('keyboard: Ctrl+Z undoes, Ctrl+Shift+Z redoes, typing in inputs is left alone', async () => {
    const list = ref(['a', 'b']);
    useDraggableHistory(list, { keyboard: true });
    list.value = ['b', 'a'];
    await tick();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    await tick();
    expect(list.value).toEqual(['b', 'a']);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    await tick();
    expect(list.value).toEqual(['a', 'b']);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }));
    await tick();
    expect(list.value).toEqual(['b', 'a']);
  });

  it('clear() forgets every step', async () => {
    const list = ref([1, 2]);
    const history = useDraggableHistory(list);
    list.value = [2, 1];
    await tick();
    history.clear();
    expect(history.canUndo.value).toBe(false);
  });
});
