import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';

const core = fileURLToPath(new URL('../../packages/vue-draggable/src', import.meta.url));
const shared = fileURLToPath(new URL('../shared', import.meta.url));
const recordings = fileURLToPath(new URL('./.recordings', import.meta.url));

/** Dev-only endpoint for recording mode: stores the PNG frames posted by src/recorder/driver.ts. */
function recorder(): Plugin {
  return {
    name: 'playground:recorder',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__record', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const scene = (url.searchParams.get('scene') ?? 'scene').replace(/[^a-z0-9-]/gi, '');
        // One folder per run, so two tabs recording the same scene never overwrite each other.
        const run = (url.searchParams.get('run') ?? '0').replace(/[^0-9]/g, '');
        const dir = `${recordings}/${scene}/${run}`;
        if (url.pathname === '/done') {
          writeFileSync(
            `${dir}/done.json`,
            JSON.stringify({ frames: Number(url.searchParams.get('frames')) }),
          );
          res.end('ok');
          return;
        }
        const index = Number(url.searchParams.get('index') ?? 0);
        mkdirSync(dir, { recursive: true });
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const base64 = Buffer.concat(chunks)
            .toString()
            .replace(/^data:image\/png;base64,/, '');
          writeFileSync(
            `${dir}/frame-${String(index).padStart(4, '0')}.png`,
            Buffer.from(base64, 'base64'),
          );
          res.end('ok');
        });
      });
    },
  };
}

// `@stacklogs/vue-draggable` resolves to the package source, so changes show up immediately.
export default defineConfig({
  plugins: [vue(), recorder()],
  resolve: {
    alias: [
      { find: /^@stacklogs\/vue-draggable$/, replacement: `${core}/index.ts` },
      { find: /^@stacklogs\/vue-draggable\/plugins$/, replacement: `${core}/plugins.ts` },
      { find: /^@stacklogs\/vue-draggable\/history$/, replacement: `${core}/history.ts` },
      { find: /^@shared\//, replacement: `${shared}/` },
    ],
  },
});
