#!/usr/bin/env node
/*
 * Builds @stacklogs/vue-draggable (docs/compat.md §1, ADR-0004):
 *   dist/index.mjs, dist/plugins.mjs       ESM (`module`, exports "import")
 *   dist/index.cjs, dist/plugins.cjs       CJS (exports "require"); index.cjs is `module.exports = component`
 *   dist/vuedraggable.umd.js / .umd.min.js UMD, global `vuedraggable` (needs globals `Vue`, `Sortable`)
 *   dist/vuedraggable.common.js            single-file CJS, same path as 4.1.0
 * Types are hand-written in types/ (generic, a superset of 4.1.0's; see tests/types).
 * Target ES2019 so webpack 4 / Vue CLI (acorn without `?.` and `??`) can parse every file.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import { rollup } from 'rollup';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const TARGET = 'es2019';
const external = ['vue', 'sortablejs'];
const banner = `/*! @stacklogs/vue-draggable | MIT | includes MIT-licensed code (c) 2016-2019 David Desmaisons, see THIRD_PARTY_NOTICES.md */`;

/** Resolves extensionless relative imports to .ts and strips types with esbuild. */
const typescript = {
  name: 'typescript',
  resolveId(source, importer) {
    if (!importer || !source.startsWith('.')) return null;
    const base = resolve(dirname(importer), source);
    for (const candidate of [`${base}.ts`, resolve(base, 'index.ts')]) {
      if (existsSync(candidate)) return candidate;
    }
    return null;
  },
  async transform(code, id) {
    if (!id.endsWith('.ts')) return null;
    const result = await transform(code, {
      loader: 'ts',
      target: TARGET,
      sourcemap: true,
      sourcefile: id,
    });
    return { code: result.code, map: result.map };
  },
};

async function bundle(input, outputs) {
  const build = await rollup({
    input,
    external,
    plugins: [typescript],
    treeshake: { moduleSideEffects: false },
  });
  for (const output of outputs) await build.write({ banner, sourcemap: true, ...output });
  await build.close();
}

rmSync(dist, { recursive: true, force: true });

// 1. ESM + CJS with a shared chunk, so index and plugins use one resolved Sortable.
const entries = { index: resolve(root, 'src/index.ts'), plugins: resolve(root, 'src/plugins.ts') };
await bundle(entries, [
  {
    dir: dist,
    format: 'es',
    entryFileNames: '[name].mjs',
    chunkFileNames: 'shared/[name]-[hash].mjs',
  },
  {
    dir: dist,
    format: 'cjs',
    entryFileNames: '[name].cjs',
    chunkFileNames: 'shared/[name]-[hash].cjs',
    exports: 'auto',
    interop: 'compat',
  },
]);

// 2. Single-file bundles with 4.1.0's file names.
const umdGlobals = { vue: 'Vue', sortablejs: 'Sortable' };
await bundle(resolve(root, 'src/index.ts'), [
  {
    file: resolve(dist, 'vuedraggable.umd.js'),
    format: 'umd',
    name: 'vuedraggable',
    exports: 'default',
    globals: umdGlobals,
  },
  {
    file: resolve(dist, 'vuedraggable.common.js'),
    format: 'cjs',
    exports: 'default',
    interop: 'compat',
  },
]);

// 3. Minified UMD (what `main` and the CDNs serve, like 4.1.0's umd.min.js).
const umd = readFileSync(resolve(dist, 'vuedraggable.umd.js'), 'utf8');
const min = await transform(umd, {
  minify: true,
  target: TARGET,
  legalComments: 'inline',
  sourcemap: true,
});
writeFileSync(
  resolve(dist, 'vuedraggable.umd.min.js'),
  `${min.code}//# sourceMappingURL=vuedraggable.umd.min.js.map\n`,
);
writeFileSync(resolve(dist, 'vuedraggable.umd.min.js.map'), min.map);

console.log(
  'built',
  [
    'index.mjs',
    'index.cjs',
    'plugins.mjs',
    'plugins.cjs',
    'vuedraggable.umd.js',
    'vuedraggable.umd.min.js',
    'vuedraggable.common.js',
  ].join(', '),
);
