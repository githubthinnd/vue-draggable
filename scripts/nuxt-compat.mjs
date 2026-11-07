#!/usr/bin/env node
/*
 * Checks the module's declared minimum (`compatibility.nuxt: '>=3.13.0'`) for real: installs the
 * packed @stacklogs/vue-draggable and @stacklogs/nuxt-draggable into a fresh app per Nuxt version, then runs
 * tests/nuxt-compat/check.mjs (registration, production build, server scan, SSR render).
 *
 *   node scripts/nuxt-compat.mjs [--core <built core dir>] [--module <built module dir>] [versions…]
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name, fallback) =>
  args.includes(name) ? resolve(args[args.indexOf(name) + 1]) : fallback;
const core = flag('--core', join(repo, 'packages/vue-draggable'));
const moduleDir = flag('--module', join(repo, 'packages/nuxt-draggable'));
const versions = args.filter(
  (a, i) => !a.startsWith('--') && !['--core', '--module'].includes(args[i - 1]),
);
const work = join(tmpdir(), 'vd-nuxt-compat');
const env = {
  ...process.env,
  npm_config_cache: join(tmpdir(), 'npm-cache'),
  NUXT_TELEMETRY_DISABLED: '1',
};

rmSync(join(work, 'pack'), { recursive: true, force: true });
mkdirSync(join(work, 'pack'), { recursive: true });
const pack = (dir) => {
  const before = new Set(readdirSync(join(work, 'pack')));
  execFileSync('npm', ['pack', '--pack-destination', join(work, 'pack')], {
    cwd: dir,
    env,
    stdio: 'pipe',
  });
  return join(
    work,
    'pack',
    readdirSync(join(work, 'pack')).find((f) => !before.has(f)),
  );
};
const coreTgz = pack(core);
const moduleTgz = pack(moduleDir);

const results = {};
for (const version of versions.length ? versions : ['3.13.2', '3.21.11', '4.6.4']) {
  const dir = join(work, `nuxt-${version}`);
  rmSync(dir, { recursive: true, force: true });
  cpSync(join(repo, 'tests/nuxt-compat/app'), dir, { recursive: true });
  cpSync(join(repo, 'tests/nuxt-compat/check.mjs'), join(dir, 'check.mjs'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: `nuxt-compat-${version}`,
        private: true,
        type: 'module',
        dependencies: {
          nuxt: version,
          '@stacklogs/nuxt-draggable': `file:${moduleTgz}`,
          '@stacklogs/vue-draggable': `file:${coreTgz}`,
        },
        overrides: { '@stacklogs/vue-draggable': `file:${coreTgz}` },
      },
      null,
      2,
    ),
  );
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--userconfig=/dev/null'], {
    cwd: dir,
    env,
    stdio: 'pipe',
  });
  execFileSync('node', ['check.mjs'], { cwd: dir, env, stdio: 'pipe' });
  results[version] = JSON.parse(readFileSync(join(dir, 'compat-result.json'), 'utf8'));
  console.log(version, JSON.stringify(results[version]));
}
writeFileSync(join(work, 'report.json'), JSON.stringify(results, null, 2));
const ok = (r) =>
  r.registration?.components?.includes('Draggable') &&
  r.registration.clientPlugin &&
  r.build === 'built' &&
  r.sortableFiles?.server === 0 &&
  r.sortableFiles.client > 0 &&
  r.ssr === 'items rendered';
process.exit(Object.values(results).every(ok) ? 0 : 1);
