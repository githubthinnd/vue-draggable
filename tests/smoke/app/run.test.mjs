// Executes every built bundle in happy-dom with the real SortableJS and records what mounted.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'vitest';

const out = resolve(process.cwd(), 'out');

it('runs every bundle', async () => {
  const results = {
    builds: JSON.parse(readFileSync(resolve(out, 'build-report.json'), 'utf8')),
    runs: {},
  };
  for (const bundler of ['vite', 'esbuild', 'rollup', 'webpack']) {
    const dir = resolve(out, bundler);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => /^(esm|deep|transitive|cjs|sfc)\.m?js$/.test(f));
    for (const file of files) {
      globalThis.__smoke = [];
      document.body.innerHTML = '';
      const errors = [];
      const { error } = console;
      console.error = (...args) => errors.push(String(args[0]).slice(0, 200));
      try {
        if (file.endsWith('.mjs')) await import(resolve(dir, file));
        else new Function(readFileSync(resolve(dir, file), 'utf8'))();
        await new Promise((r) => setTimeout(r, 20));
        results.runs[`${bundler}/${file}`] = globalThis.__smoke
          .map((r) => ({ name: r.name, ok: r.ok, error: r.error }))
          .concat(errors.length ? [{ consoleErrors: errors }] : []);
      } catch (e) {
        results.runs[`${bundler}/${file}`] = [
          { ok: false, error: String(e.message ?? e).slice(0, 200) },
        ];
      } finally {
        console.error = error;
      }
    }
  }
  writeFileSync(resolve(out, 'run-report.json'), JSON.stringify(results, null, 2));
});
