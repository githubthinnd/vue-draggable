// Builds the fixture app with every bundler into out/<bundler>/. Each build is independent: a
// failure is recorded in out/build-report.json instead of stopping the others.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const out = resolve(root, 'out');
const define = {
  'process.env.NODE_ENV': '"production"',
  __VUE_OPTIONS_API__: 'true',
  __VUE_PROD_DEVTOOLS__: 'false',
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
};
const report = {};

async function step(name, fn) {
  try {
    await fn();
    report[name] = 'built';
  } catch (error) {
    report[name] = `build failed: ${String(error.message ?? error)
      .split('\n')
      .slice(0, 3)
      .join(' | ')}`;
  }
}

await step('vite', async () => {
  const { build } = await import('vite');
  const vue = (await import('@vitejs/plugin-vue')).default;
  await build({
    root,
    logLevel: 'error',
    configFile: false,
    plugins: [vue()],
    define,
    build: {
      outDir: resolve(out, 'vite'),
      emptyOutDir: true,
      minify: false,
      rollupOptions: {
        input: {
          esm: 'src/esm.js',
          deep: 'src/deep.js',
          transitive: 'src/transitive.js',
          sfc: 'src/sfc.js',
        },
        output: { format: 'es', entryFileNames: '[name].mjs', chunkFileNames: '[name]-[hash].mjs' },
      },
    },
  });
});

await step('esbuild', async () => {
  const esbuild = await import('esbuild');
  for (const [entry, file, format] of [
    ['src/esm.js', 'esm.js', 'iife'],
    ['src/deep.js', 'deep.js', 'iife'],
    ['src/transitive.js', 'transitive.js', 'iife'],
    ['src/cjs.cjs', 'cjs.js', 'iife'],
  ]) {
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      format,
      platform: 'browser',
      outfile: resolve(out, 'esbuild', file),
      define,
      logLevel: 'error',
    });
  }
});

await step('rollup', async () => {
  const { rollup } = await import('rollup');
  const { nodeResolve } = await import('@rollup/plugin-node-resolve');
  const commonjs = (await import('@rollup/plugin-commonjs')).default;
  const replace = (await import('@rollup/plugin-replace')).default;
  for (const [entry, file] of [
    ['src/esm.js', 'esm.js'],
    ['src/deep.js', 'deep.js'],
    ['src/transitive.js', 'transitive.js'],
    ['src/cjs.cjs', 'cjs.js'],
  ]) {
    const bundle = await rollup({
      input: entry,
      onwarn: () => {},
      plugins: [
        replace({ values: define, preventAssignment: true }),
        nodeResolve({ browser: true }),
        commonjs(),
      ],
    });
    await bundle.write({ file: resolve(out, 'rollup', file), format: 'iife' });
  }
});

await step('webpack', async () => {
  const webpack = (await import('webpack')).default;
  const config = (await import(resolve(root, 'webpack.config.cjs'))).default;
  await new Promise((done, fail) => {
    webpack(config, (error, stats) => {
      if (error) fail(error);
      else if (stats.hasErrors()) fail(new Error(stats.toString({ all: false, errors: true })));
      else done();
    });
  });
});

mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'build-report.json'), JSON.stringify(report, null, 2));
console.log(report);
