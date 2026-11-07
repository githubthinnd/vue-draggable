#!/usr/bin/env node
/*
 * Packs the package and runs @arethetypeswrong/cli on the tarball.
 * One rule is ignored on purpose: under `moduleResolution: node10` the `types` field declares an
 * ESM default export while `main` (the UMD bundle) is `module.exports = component`. That is exactly
 * what vuedraggable@4.1.0 ships, and `import draggable from 'vuedraggable'` must keep type-checking
 * in those projects (compat.md §1.1, ADR-0004). node16 and bundler resolution use exact types.
 * `named-exports` is ignored too: it fires only for the legacy UMD/common bundles imported from
 * Node ESM, because cjs-module-lexer cannot see through a UMD wrapper.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = mkdtempSync(join(tmpdir(), 'vd-pack-'));
const env = {
  ...process.env,
  npm_config_cache: process.env.npm_config_cache ?? join(tmpdir(), 'npm-cache'),
};
execFileSync('npm', ['pack', '--pack-destination', out], { stdio: 'inherit', env });
const tarball = join(out, readdirSync(out).find((f) => f.endsWith('.tgz')) ?? '');
execFileSync('npx', ['attw', tarball, '--ignore-rules', 'false-export-default', 'named-exports'], {
  stdio: 'inherit',
  env,
});
