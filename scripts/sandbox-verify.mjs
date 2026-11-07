#!/usr/bin/env node
/*
 * Verifies the monorepo where `pnpm install` cannot run (the Claude Code sandbox blocks pnpm's
 * store operation lock). Mirrors the repo into a temp directory, rewrites pnpm-only protocols
 * (`catalog:`, `workspace:*`) into plain versions, installs with npm workspaces and runs every
 * check that needs no network port and no browser. Same approach as ../nuxt-modular.
 *
 *   node scripts/sandbox-verify.mjs [--skip-install]
 *
 * Env: VERIFY_DIR (default: $TMPDIR/vue-draggable-verify)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dest = process.env.VERIFY_DIR ?? join(tmpdir(), 'vue-draggable-verify');
const skipInstall = process.argv.includes('--skip-install');
const env = {
  ...process.env,
  npm_config_cache: join(tmpdir(), 'npm-cache'),
  NUXT_TELEMETRY_DISABLED: '1',
};

function run(cmd, args, cwd = dest) {
  console.log(`\n$ ${cmd} ${args.join(' ')}  (${cwd.replace(dest, '<verify>')})`);
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env });
}

// 1. Mirror sources (node_modules in dest is kept between runs).
// prettier-ignore
run('rsync', [
  '-a', '--delete',
  '--exclude', 'node_modules', '--exclude', '.git', '--exclude', 'dist', '--exclude', '.nuxt',
  '--exclude', '.output', '--exclude', 'pnpm-lock.yaml', '--exclude', 'package-lock.json',
  `${root}/`, `${dest}/`,
], root);

// 2. Rewrite pnpm protocols for npm.
const catalog = {};
let inCatalog = false;
for (const line of readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8').split('\n')) {
  if (/^catalog:\s*$/.test(line)) {
    inCatalog = true;
    continue;
  }
  if (inCatalog && /^\S/.test(line)) inCatalog = false;
  const match = inCatalog && line.match(/^\s+["']?([^"':#]+)["']?:\s*([^#\s]+)/);
  if (match) catalog[match[1].trim()] = match[2].trim();
}

const workspaces = [
  'packages/vue-draggable',
  'packages/nuxt-draggable',
  'tests/compat',
  'playground',
  'playground-nuxt',
];
for (const file of ['package.json', ...workspaces.map((w) => `${w}/package.json`)]) {
  const path = join(dest, file);
  if (!existsSync(path)) continue;
  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    for (const [name, spec] of Object.entries(pkg[field] ?? {})) {
      if (spec === 'catalog:') {
        if (!(name in catalog)) throw new Error(`No catalog entry for ${name}`);
        pkg[field][name] = catalog[name];
      } else if (spec.startsWith('workspace:')) pkg[field][name] = '*';
    }
  }
  if (file === 'package.json') {
    pkg.workspaces = workspaces;
    delete pkg.packageManager;
  }
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

// 3. Install.
if (!skipInstall) {
  // prettier-ignore
  run('npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps', '--userconfig=/dev/null']);
}

// 4. Checks (mirror of `pnpm check`).
run('npx', ['prettier', '--check', '.']);
run('npx', ['eslint', '.']);
// playground-nuxt is type-checked after the build (`nuxt prepare` loads the module).
for (const ws of workspaces.filter((w) => w !== 'playground-nuxt'))
  run('npm', ['run', 'typecheck'], join(dest, ws));
for (const ws of workspaces.filter((w) => !w.startsWith('playground')))
  run('npm', ['test'], join(dest, ws));
run('npm', ['run', 'build'], join(dest, 'packages/vue-draggable'));
run('npm', ['run', 'verify:package'], join(dest, 'packages/vue-draggable'));
run('npm', ['run', 'verify:dist'], join(dest, 'packages/vue-draggable'));
run('node', ['scripts/check-docs.mjs']);
run('npx', ['nuxt-module-build', 'build'], join(dest, 'packages/nuxt-draggable'));
run('node', ['scripts/size.mjs', '--max-gzip', '6144']);
run('npm', ['run', 'build'], join(dest, 'playground'));
// Playwright needs browsers and a port: in the sandbox it is only type-checked (above) and listed.
run('npx', ['playwright', 'test', '--list'], join(dest, 'playground'));
// Nuxt: registration with loadNuxt, then a real production build scanned and server-rendered (no port).
run('npm', ['run', 'verify:nuxt'], join(dest, 'packages/nuxt-draggable'));
run('npm', ['run', 'typecheck'], join(dest, 'playground-nuxt'));
run('npx', ['playwright', 'test', '--list'], join(dest, 'playground-nuxt'));

console.log('\n✔ sandbox verification passed');
