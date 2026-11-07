#!/usr/bin/env node
/*
 * Drop-in smoke test (roadmap check 6). Installs the fixture app in tests/smoke/app twice under
 * $TMPDIR/vd-smoke: `reference` keeps vuedraggable@4.1.0, `ours` switches it to the packed
 * @stacklogs/vue-draggable with the one-line change (dependency spec, plus `overrides` for the copy
 * pulled in by `ui-lib`). Both are built with Vite, esbuild, Rollup and webpack 5 without touching
 * the app's code, then every bundle runs in happy-dom with the real SortableJS. Writes
 * $TMPDIR/vd-smoke/report.json and fails if any `ours` bundle did not mount with Sortable.
 *
 *   node scripts/smoke.mjs [--core <built package dir>]   (needs network access to the npm registry)
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const core = resolve(
  args.includes('--core') ? args[args.indexOf('--core') + 1] : join(repo, 'packages/vue-draggable'),
);
const work = join(process.env.SMOKE_DIR ?? tmpdir(), 'vd-smoke');
const env = {
  ...process.env,
  npm_config_cache: process.env.npm_config_cache ?? join(tmpdir(), 'npm-cache'),
};
const npm = (cwd, ...a) =>
  execFileSync('npm', [...a, '--no-audit', '--no-fund', '--userconfig=/dev/null'], {
    cwd,
    env,
    stdio: 'pipe',
  }).toString();

rmSync(join(work, 'ours'), { recursive: true, force: true });
rmSync(join(work, 'reference'), { recursive: true, force: true });
mkdirSync(join(work, 'pack'), { recursive: true });

// 1. Bundler tools, shared by both variants (installed once in the parent directory).
const tools = {
  '@rollup/plugin-commonjs': '^29.0.3',
  '@rollup/plugin-node-resolve': '^16.0.3',
  '@rollup/plugin-replace': '^6.0.3',
  '@vitejs/plugin-vue': '^6.0.10',
  esbuild: '^0.25.12',
  'happy-dom': '^21.0.4',
  rollup: '^4.68.0',
  vite: '^8.3.6',
  vitest: '^5.1.0',
  vue: '^3.5.45',
  webpack: '^5.112.2',
};
writeFileSync(
  join(work, 'package.json'),
  JSON.stringify({ name: 'vd-smoke-tools', private: true, devDependencies: tools }, null, 2),
);
npm(work, 'install', '--legacy-peer-deps');

// 2. Pack the built package.
for (const f of readdirSync(join(work, 'pack'))) rmSync(join(work, 'pack', f));
execFileSync('npm', ['pack', '--pack-destination', join(work, 'pack')], {
  cwd: core,
  env,
  stdio: 'pipe',
});
const tarball = join(
  work,
  'pack',
  readdirSync(join(work, 'pack')).find((f) => f.endsWith('.tgz')),
);
// `ui-lib` stands for a third-party library from the registry, so it is installed from a tarball:
// npm installs a `file:` folder as a symlink whose own dependencies ignore `overrides`.
execFileSync('npm', ['pack', '--pack-destination', join(work, 'pack')], {
  cwd: join(repo, 'tests/smoke/app/ui-lib'),
  env,
  stdio: 'pipe',
});
const uiLib = `file:${join(work, 'pack', 'ui-lib-1.0.0.tgz')}`;

// 3. The app, twice. The only difference is the dependency line (and the override).
const variants = {
  reference: { dependencies: { vue: '^3.5.45', vuedraggable: '4.1.0', 'ui-lib': uiLib } },
  ours: {
    dependencies: { vue: '^3.5.45', vuedraggable: `file:${tarball}`, 'ui-lib': uiLib },
    overrides: { vuedraggable: `file:${tarball}` },
  },
};
const report = { tarball, variants: {} };
for (const [name, manifest] of Object.entries(variants)) {
  const dir = join(work, name);
  cpSync(join(repo, 'tests/smoke/app'), dir, { recursive: true });
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: `smoke-${name}`, private: true, type: 'module', ...manifest }, null, 2),
  );
  npm(dir, 'install');
  const installed = JSON.parse(
    readFileSync(join(dir, 'node_modules/vuedraggable/package.json'), 'utf8'),
  );
  const viaLib = JSON.parse(
    readFileSync(
      [
        join(dir, 'node_modules/ui-lib/node_modules/vuedraggable/package.json'),
        join(dir, 'node_modules/vuedraggable/package.json'),
      ].find((p) => {
        try {
          readFileSync(p);
          return true;
        } catch {
          return false;
        }
      }),
      'utf8',
    ),
  );
  execFileSync('node', ['build.mjs'], { cwd: dir, env, stdio: 'pipe' });
  execFileSync('node', [join(work, 'node_modules/vitest/vitest.mjs'), 'run', '--root', dir], {
    cwd: dir,
    env,
    stdio: 'pipe',
  });
  report.variants[name] = {
    installed: `${installed.name}@${installed.version}`,
    viaUiLib: `${viaLib.name}@${viaLib.version}`,
    ...JSON.parse(readFileSync(join(dir, 'out/run-report.json'), 'utf8')),
  };
}

// 4. npm refuses an override that differs from a direct dependency's spec (EOVERRIDE): users who
// depend on vuedraggable directly change that line instead (docs/migration.md).
const probe = join(work, 'override-probe');
rmSync(probe, { recursive: true, force: true });
mkdirSync(probe);
writeFileSync(
  join(probe, 'package.json'),
  JSON.stringify({
    name: 'probe',
    private: true,
    dependencies: { vuedraggable: '^4.1.0' },
    overrides: { vuedraggable: `file:${tarball}` },
  }),
);
try {
  npm(probe, 'install', '--package-lock-only');
  report.npmOverrideOfDirectDependency = 'accepted';
} catch (error) {
  report.npmOverrideOfDirectDependency = /EOVERRIDE/.test(String(error.stderr ?? error))
    ? 'EOVERRIDE (refused)'
    : `failed: ${String(error.stderr ?? error).slice(0, 200)}`;
}

writeFileSync(join(work, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

const ours = report.variants.ours;
const failures = Object.entries(ours.runs).flatMap(([bundle, runs]) =>
  runs.filter((r) => 'ok' in r && !r.ok).map((r) => `${bundle}: ${r.name ?? ''} ${r.error ?? ''}`),
);
const unbuilt = Object.entries(ours.builds).filter(([, v]) => v !== 'built');
if (
  failures.length ||
  unbuilt.length ||
  !ours.installed.startsWith('@stacklogs/vue-draggable') ||
  !ours.viaUiLib.startsWith('@stacklogs/vue-draggable')
) {
  console.error('smoke test failed', {
    failures,
    unbuilt,
    installed: ours.installed,
    viaUiLib: ours.viaUiLib,
  });
  process.exit(1);
}
console.log('\n✔ drop-in smoke test passed');
