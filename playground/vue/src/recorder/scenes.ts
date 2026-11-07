// Scripted demos recorded into the README GIFs (open the playground with ?record=<scene>).
import { Recorder, items, q } from './driver';

const pick = (list: Element[], i: number): Element => {
  const el = list[i];
  if (!el) throw new Error(`recorder: no item ${String(i)}`);
  return el;
};
const column = (id: string): Element[] => items(`[data-testid="col-${id}"]`);
const list = (): Element[] => items('[data-testid="list"]');

const scenes: Record<string, (r: Recorder) => Promise<void>> = {
  async trash(r) {
    await r.wait(400);
    // Drop a row on the trash.
    await r.drag(pick(list(), 1), q('[data-testid="trash"]'));
    // Delete one with its button.
    await r.click(q('[data-testid="list"] > .item [data-testid="delete-4"]'));
    // Drag one outside the card: removed on spill.
    await r.dragTo(pick(list(), 0), { x: innerWidth * 0.5, y: innerHeight - 30 });
    // Start a drag and cancel it with Escape.
    await r.dragAndCancel(pick(list(), 0), pick(list(), 1));
    // Undo three times, redo once.
    await r.click(q('[data-testid="undo"]'));
    await r.click(q('[data-testid="undo"]'));
    await r.click(q('[data-testid="undo"]'));
    await r.wait(300, 3);
    await r.click(q('[data-testid="redo"]'));
    await r.wait(400, 5);
  },
  async kanban(r) {
    await r.wait(500);
    await r.drag(pick(column('todo'), 0), pick(column('doing'), 1));
    await r.drag(pick(column('doing'), 0), pick(column('done'), 0), false);
    await r.drag(pick(column('todo'), 1), pick(column('todo'), 0), false);
    // Undo the last two moves, redo one.
    await r.click(q('[data-testid="undo"]'));
    await r.click(q('[data-testid="undo"]'));
    await r.wait(300, 4);
    await r.click(q('[data-testid="redo"]'));
    await r.wait(400, 5);
  },
  async sortable(r) {
    await r.wait(500);
    await r.drag(pick(list(), 4), pick(list(), 0), false);
    await r.drag(pick(list(), 1), pick(list(), 3));
  },
  async 'multi-select'(r) {
    await r.wait(400);
    await r.click(pick(list(), 0));
    await r.click(pick(list(), 2));
    await r.drag(pick(list(), 0), pick(list(), 4));
  },
  async transition(r) {
    await r.wait(400);
    await r.drag(pick(list(), 0), pick(list(), 3));
    await r.click(q('[data-testid="sort"]'));
    await r.wait(700, 9);
    await r.click(q('[data-testid="shuffle"]'));
    await r.wait(700, 9);
  },
  async nested(r) {
    await r.wait(400);
    const node = (name: string): Element => {
      const row = [...document.querySelectorAll('[data-testid="tree"] .tree-row')].find(
        (el) => el.textContent.trim() === name,
      );
      if (!row) throw new Error(`recorder: no row ${name}`);
      return row.closest('.tree-node') ?? row;
    };
    await r.drag(node('README.md'), node('main.ts'));
    await r.drag(node('favicon.svg'), node('Card.vue'));
  },
};

export async function runScene(name: string): Promise<void> {
  const scene = scenes[name];
  if (!scene) return;
  const recorder = new Recorder(name);
  try {
    await scene(recorder);
  } finally {
    await recorder.done();
  }
}
