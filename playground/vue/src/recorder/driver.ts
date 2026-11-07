/**
 * Drives a demo with synthetic pointer events (the lists use the pointer mode in recording mode),
 * moves a visible cursor, and captures a PNG frame after each step. Frames are posted to the dev
 * server (see vite.config.ts), which writes them to .recordings/<scene>/.
 */
import { toPng } from 'html-to-image';

const CURSOR =
  '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l15 10.5-6.5 1.4 3.9 7.2-2.7 1.4-3.9-7.3L4 20z" fill="#111827" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const GRAB =
  '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V10m0-.5V5a1.5 1.5 0 0 1 3 0v5m0-1.5a1.5 1.5 0 0 1 3 0V10m0 0a1.5 1.5 0 0 1 3 0v4a7 7 0 0 1-7 7h-1.5a6 6 0 0 1-5-2.7L3.4 14a1.5 1.5 0 0 1 2.4-1.8L8 14" fill="#fff" stroke="#111827" stroke-width="1.5" stroke-linejoin="round"/></svg>';

interface Point {
  x: number;
  y: number;
}

export class Recorder {
  private index = 0;
  private readonly cursor: HTMLDivElement;
  private position: Point = { x: innerWidth * 0.62, y: innerHeight * 0.82 };
  private readonly scene: string;
  private readonly run = String(Date.now());

  constructor(scene: string) {
    this.scene = scene;
    this.cursor = document.createElement('div');
    this.cursor.className = 'record-cursor';
    document.body.appendChild(this.cursor);
    this.place(this.position);
  }

  private place(p: Point, grabbing = false): void {
    this.position = p;
    this.cursor.innerHTML = grabbing ? GRAB : CURSOR;
    const offset = grabbing ? 12 : 3;
    this.cursor.style.transform = `translate(${String(p.x - offset)}px, ${String(p.y - offset)}px)`;
  }

  async frame(repeat = 1): Promise<void> {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    const data = await toPng(document.body, {
      pixelRatio: 1,
      width: innerWidth,
      height: innerHeight,
      skipFonts: true,
      cacheBust: false,
    });
    for (let i = 0; i < repeat; i++) {
      await fetch(
        `/__record/frame?scene=${this.scene}&run=${this.run}&index=${String(this.index++)}`,
        {
          method: 'POST',
          body: data,
        },
      );
    }
  }

  async wait(ms: number, frames = Math.max(1, Math.round(ms / 70))): Promise<void> {
    for (let i = 0; i < frames; i++) {
      await new Promise((resolve) => setTimeout(resolve, ms / frames));
      await this.frame();
    }
  }

  private pointer(type: string, p: Point, target: EventTarget): void {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX: p.x,
        clientY: p.y,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
      }),
    );
  }

  async moveTo(to: Point, steps = 10, grabbing = false): Promise<void> {
    const from = this.position;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const p = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
      this.place(p, grabbing);
      if (grabbing) this.pointer('pointermove', p, document);
      await this.frame();
    }
  }

  async click(el: Element): Promise<void> {
    const p = centre(el);
    await this.moveTo(p, 8);
    this.pointer('pointerdown', p, el);
    this.pointer('pointerup', p, el);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: p.x, clientY: p.y }));
    await this.wait(200, 2);
  }

  /** Drags `from` onto `to`: `after` drops below the middle of `to`, otherwise above it. */
  async drag(from: Element, to: Element, after = true, steps = 22): Promise<void> {
    const start = centre(from);
    await this.moveTo(start, 9);
    this.place(start, true);
    this.pointer('pointerdown', start, from);
    await this.wait(150, 2);
    const box = to.getBoundingClientRect();
    const end = {
      x: box.left + Math.min(box.width / 2, 120),
      y: after ? box.bottom - box.height * 0.2 : box.top + box.height * 0.2,
    };
    await this.moveTo(end, steps, true);
    await this.wait(160, 2);
    this.pointer('pointerup', end, document);
    this.place(end);
    await this.wait(420, 6);
  }

  /** Starts dragging `from` towards `to`, then presses Escape: the item snaps back. */
  async dragAndCancel(from: Element, to: Element, steps = 18): Promise<void> {
    const start = centre(from);
    await this.moveTo(start, 9);
    this.place(start, true);
    this.pointer('pointerdown', start, from);
    await this.wait(150, 2);
    const box = to.getBoundingClientRect();
    await this.moveTo(
      { x: box.left + Math.min(box.width / 2, 120), y: box.bottom - box.height * 0.2 },
      steps,
      true,
    );
    await this.wait(300, 4);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    this.place(start);
    await this.wait(500, 7);
  }

  /** Drags `from` to an arbitrary point (e.g. outside every list). */
  async dragTo(from: Element, to: Point, steps = 22): Promise<void> {
    const start = centre(from);
    await this.moveTo(start, 9);
    this.place(start, true);
    this.pointer('pointerdown', start, from);
    await this.wait(150, 2);
    await this.moveTo(to, steps, true);
    await this.wait(160, 2);
    this.pointer('pointerup', to, document);
    this.place(to);
    await this.wait(420, 6);
  }

  async done(): Promise<void> {
    await this.frame(8);
    await fetch(`/__record/done?scene=${this.scene}&run=${this.run}&frames=${String(this.index)}`, {
      method: 'POST',
    });
    document.title = `recorded ${this.scene}: ${String(this.index)} frames`;
  }
}

function centre(el: Element): Point {
  const box = el.getBoundingClientRect();
  return { x: box.left + Math.min(box.width / 2, 120), y: box.top + box.height / 2 };
}

export const q = (selector: string): Element => {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`recorder: no element for ${selector}`);
  return el;
};

export const items = (selector: string): Element[] => [
  ...document.querySelectorAll(`${selector} > .item`),
];
