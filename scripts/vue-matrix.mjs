#!/usr/bin/env node
/*
 * Runs the core tests and the whole compat suite (upstream specs on both implementations,
 * differential, regression) against several Vue versions (owner decision D-2: peer `^3.0.1`, CI
 * covers 3.2 to 3.5). Works on a copy of the sandbox verification tree so the main tree keeps its
 * Vue version. Needs `node scripts/sandbox-verify.mjs` first.
 *
 *   node scripts/vue-matrix.mjs [3.2.47 3.3.13 ...]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const versions = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['3.2.47', '3.3.13', '3.4.38', '3.5.45'];
const workspaces = ['packages/vue-draggable', 'packages/nuxt-draggable', 'tests/compat'];
const source = process.env.VERIFY_DIR ?? join(tmpdir(), 'vue-draggable-verify');
const dest = join(tmpdir(), 'vue-draggable-matrix');
const env = { ...process.env, npm_config_cache: join(tmpdir(), 'npm-cache') };
if (!existsSync(join(source, 'node_modules')))
  throw new Error(`run scripts/sandbox-verify.mjs first (${source})`);

const results = {};
for (const version of versions) {
  // Fresh copy per version: manifests and node_modules start from the verified 3.5 tree.
  execFileSync('rsync', ['-a', '--delete', `${source}/`, `${dest}/`], { stdio: 'inherit' });
  const pkgs = [
    'vue',
    '@vue/server-renderer',
    '@vue/compiler-sfc',
    '@vue/runtime-dom',
    '@vue/runtime-core',
    '@vue/reactivity',
    '@vue/shared',
    '@vue/compiler-dom',
    '@vue/compiler-core',
    '@vue/compiler-ssr',
  ];
  // Pin `vue` in every manifest (workspaces depend on it directly, and npm refuses an override that
  // differs from a direct dependency) and every @vue/* package through `overrides`.
  for (const file of [
    'package.json',
    'packages/vue-draggable/package.json',
    'packages/nuxt-draggable/package.json',
    'tests/compat/package.json',
  ]) {
    const manifest = JSON.parse(readFileSync(join(dest, file), 'utf8'));
    for (const field of ['dependencies', 'devDependencies']) {
      if (manifest[field]?.vue) manifest[field].vue = version;
      // @vue/test-utils 2.5 calls app.onUnmount (Vue 3.5+); 2.4.6 supports older Vue.
      if (manifest[field]?.['@vue/test-utils'] && !version.startsWith('3.5'))
        manifest[field]['@vue/test-utils'] = '2.4.6';
    }
    if (file === 'package.json') {
      manifest.devDependencies = { ...manifest.devDependencies, vue: version };
      manifest.overrides = Object.fromEntries(pkgs.map((p) => [p, version]));
    }
    writeFileSync(join(dest, file), JSON.stringify(manifest, null, 2));
  }
  execFileSync(
    'npm',
    ['install', '--no-audit', '--no-fund', '--legacy-peer-deps', '--userconfig=/dev/null'],
    { cwd: dest, env, stdio: 'pipe' },
  );
  const installed = JSON.parse(
    readFileSync(join(dest, 'node_modules/vue/package.json'), 'utf8'),
  ).version;
  const run = (cwd) => {
    try {
      const out = execFileSync('npx', ['vitest', 'run'], { cwd, env, stdio: 'pipe' }).toString();
      return /Tests\s+(.*)/.exec(out)?.[1]?.trim() ?? 'passed';
    } catch (error) {
      const out = `${error.stdout ?? ''}`;
      const failed = [...out.matchAll(/FAIL\s+(.*)/g)].map((m) => m[1]).slice(0, 8);
      return { summary: /Tests\s+(.*)/.exec(out)?.[1]?.trim(), failed };
    }
  };
  void workspaces;
  results[version] = {
    installed,
    core: run(join(dest, 'packages/vue-draggable')),
    compat: run(join(dest, 'tests/compat')),
  };
  console.log(version, JSON.stringify(results[version]));
}
writeFileSync(join(dest, 'matrix-report.json'), JSON.stringify(results, null, 2));
const failed = Object.values(results).some(
  (r) => typeof r.core !== 'string' || typeof r.compat !== 'string',
);
process.exit(failed ? 1 : 0);
