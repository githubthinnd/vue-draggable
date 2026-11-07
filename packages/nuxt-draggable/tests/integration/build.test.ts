/**
 * A real production build of playground/nuxt (Nitro preset `node-listener`, so the server can be
 * called without a port; `noExternals`, so all server code is in the scanned output). Checks that no SortableJS code reaches the server output while the client
 * has it, then server-renders pages through the built listener.
 */
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildNuxt, loadNuxt } from '@nuxt/kit';
import { beforeAll, describe, expect, it } from 'vitest';

const playground = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../playground/nuxt');
const output = mkdtempSync(join(tmpdir(), 'vd-nuxt-build-'));
/** Strings that only occur in SortableJS's own code. */
const SORTABLE_MARKERS = ['`el` must be an HTMLElement', 'Cannot mount plugin'];

function* files(directory: string): Generator<string> {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else yield path;
  }
}

const filesWith = (directory: string, needles: string[]): string[] =>
  [...files(directory)].filter(
    (path) =>
      /\.(m?js|cjs)$/.test(path) && needles.some((n) => readFileSync(path, 'utf8').includes(n)),
  );

type Listener = (req: IncomingMessage, res: ServerResponse) => unknown;

/** Calls the Nitro node listener with an in-memory request (no socket is ever opened). */
function render(listener: Listener, url: string): Promise<{ status: number; body: string }> {
  return new Promise((done) => {
    const req = new IncomingMessage(new Socket());
    req.url = url;
    req.method = 'GET';
    req.headers = { host: 'localhost', accept: 'text/html' };
    req.push(null);
    const res = new ServerResponse(req);
    const chunks: Buffer[] = [];
    res.write = ((chunk: string | Uint8Array) => {
      chunks.push(Buffer.from(chunk));
      return true;
    }) as typeof res.write;
    res.end = ((chunk?: string | Uint8Array | (() => void)) => {
      if (chunk && typeof chunk !== 'function') chunks.push(Buffer.from(chunk));
      done({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') });
      return res;
    }) as typeof res.end;
    void listener(req, res);
  });
}

let listener: Listener;

beforeAll(async () => {
  const nuxt = await loadNuxt({
    cwd: playground,
    dev: false,
    ready: true,
    // Nitro's config types are not loaded in this tsconfig; the shape is Nitro's documented one.
    // `noExternals` inlines every dependency into the server bundle: nothing is left for Node to
    // load from node_modules, so the scan below sees all server code.
    overrides: {
      logLevel: 'silent',
      nitro: { preset: 'node-listener', output: { dir: output }, noExternals: true },
    } as never,
  });
  try {
    await buildNuxt(nuxt);
  } finally {
    await nuxt.close();
  }
  listener = (
    (await import(pathToFileURL(join(output, 'server/index.mjs')).href)) as { listener: Listener }
  ).listener;
}, 300_000);

describe('production build of playground-nuxt', () => {
  it('ships SortableJS to the client only', () => {
    expect(
      filesWith(join(output, 'public'), SORTABLE_MARKERS).length,
      'control: the client has SortableJS',
    ).toBeGreaterThan(0);
    expect(filesWith(join(output, 'server'), SORTABLE_MARKERS)).toEqual([]);
    expect(
      [...files(join(output, 'server'))].filter((p) => p.includes('/node_modules/sortablejs')),
    ).toEqual([]);
  });

  it.each([
    '/basic',
    '/two-lists',
    '/clone',
    '/nested',
    '/transition-group',
    '/multidrag',
    '/header-footer',
    '/trash',
    '/kanban',
    '/ssr-check',
  ])('server-renders %s with draggable items', async (path) => {
    const { status, body } = await render(listener, path);
    expect(status).toBe(200);
    expect(body).toContain('data-draggable="true"');
    expect(body).not.toContain('vue-draggable]');
  });

  it('ssr-check renders header and items in order, with the runtime config for the client plugin', async () => {
    const { body } = await render(listener, '/ssr-check');
    expect(body).toMatch(
      /<ul[^>]*aria-label="ssr list"[^>]*><li data-testid="header">Header<\/li><li class="item" data-draggable="true">server 1<\/li><li class="item" data-draggable="true">server 2<\/li>/,
    );
    expect(body).toContain('MultiDrag');
    expect(body).toContain('emptyInsertThreshold');
  });
});
