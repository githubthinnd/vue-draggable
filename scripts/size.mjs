#!/usr/bin/env node
/*
 * Measures the shipped size (roadmap check 8): the ESM entry minified and compressed, without
 * vue and sortablejs, and SortableJS itself for reference. Target: wrapper <= 4 KB min+gzip.
 *   node scripts/size.mjs [--max-gzip 4096]
 */
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const max = args.includes('--max-gzip') ? Number(args[args.indexOf('--max-gzip') + 1]) : undefined;

async function measure(entry, external) {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    external,
    target: 'es2019',
    legalComments: 'none',
    // sortablejs is a dependency of the core package only (pnpm does not hoist it to the root).
    nodePaths: [resolve(root, 'packages/vue-draggable/node_modules')],
  });
  const code = result.outputFiles[0].contents;
  return {
    min: code.length,
    gzip: gzipSync(code, { level: 9 }).length,
    brotli: brotliCompressSync(code).length,
  };
}

const wrapper = await measure(resolve(root, 'packages/vue-draggable/dist/index.mjs'), [
  'vue',
  'sortablejs',
]);
const plugins = await measure(resolve(root, 'packages/vue-draggable/dist/plugins.mjs'), [
  'vue',
  'sortablejs',
]);
const sortable = await measure('sortablejs', ['vue']);
const report = {
  'index.mjs (wrapper only)': wrapper,
  'plugins.mjs': plugins,
  'sortablejs (dependency)': sortable,
};
console.table(report);
if (max !== undefined && wrapper.gzip > max) {
  console.error(`wrapper is ${wrapper.gzip} B min+gzip, over the ${max} B budget`);
  process.exit(1);
}
