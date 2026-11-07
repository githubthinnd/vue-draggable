// Runs inside an installed compat app: registration, production build, server scan, SSR render.
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildNuxt, loadNuxt } from '@nuxt/kit';

const cwd = process.cwd();
const result = {
  nuxt: JSON.parse(readFileSync(join(cwd, 'node_modules/nuxt/package.json'), 'utf8')).version,
};
const step = async (name, fn) => {
  try {
    result[name] = await fn();
  } catch (error) {
    result[name] = `FAILED: ${String(error?.message ?? error).split('\n')[0]}`;
  }
};

await step('registration', async () => {
  const nuxt = await loadNuxt({
    cwd,
    dev: false,
    ready: true,
    overrides: { _prepare: true, logLevel: 'silent' },
  });
  try {
    const components = [];
    await nuxt.callHook('components:extend', components);
    const ours = components
      .filter((c) => c.filePath === '@vue-draggable/core')
      .map((c) => c.pascalName);
    const plugin = nuxt.options.plugins.some((p) =>
      String(typeof p === 'string' ? p : p.src).includes('runtime/plugin.client'),
    );
    return { components: ours, clientPlugin: plugin };
  } finally {
    await nuxt.close();
  }
});

const output = mkdtempSync(join(tmpdir(), 'vd-nuxt-compat-out-'));
await step('build', async () => {
  const nuxt = await loadNuxt({
    cwd,
    dev: false,
    ready: true,
    overrides: {
      logLevel: 'silent',
      nitro: { preset: 'node-listener', output: { dir: output }, noExternals: true },
    },
  });
  try {
    await buildNuxt(nuxt);
  } finally {
    await nuxt.close();
  }
  return 'built';
});

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else yield path;
  }
}
const markers = ['`el` must be an HTMLElement', 'Cannot mount plugin'];
const count = (dir) =>
  [...files(dir)].filter(
    (p) => /\.(m?js|cjs)$/.test(p) && markers.some((m) => readFileSync(p, 'utf8').includes(m)),
  ).length;

if (result.build === 'built') {
  await step('sortableFiles', () => ({
    server: count(join(output, 'server')),
    client: count(join(output, 'public')),
  }));
  await step('ssr', async () => {
    const { listener } = await import(pathToFileURL(join(output, 'server/index.mjs')).href);
    const body = await new Promise((done) => {
      const req = new IncomingMessage(new Socket());
      Object.assign(req, {
        url: '/',
        method: 'GET',
        headers: { host: 'localhost', accept: 'text/html' },
      });
      req.push(null);
      const res = new ServerResponse(req);
      const chunks = [];
      res.write = (c) => (chunks.push(Buffer.from(c)), true);
      res.end = (c) => {
        if (c && typeof c !== 'function') chunks.push(Buffer.from(c));
        done(Buffer.concat(chunks).toString());
        return res;
      };
      listener(req, res);
    });
    return /<ul><li data-draggable="true">one<\/li><li data-draggable="true">two<\/li><\/ul>/.test(
      body,
    )
      ? 'items rendered'
      : `unexpected: ${body.slice(0, 200)}`;
  });
}
writeFileSync(join(cwd, 'compat-result.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
