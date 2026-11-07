#!/usr/bin/env node
/*
 * Keeps the docs honest (Phase 5). Needs the core built (reads dist/index.cjs).
 *  1. Every relative link, `#anchor` and in-repo GitHub link in the Markdown files resolves.
 *  2. The core README names every prop, event and slot of the built component.
 *  3. The Nuxt README names every module option and plugin name.
 *  4. Package LICENSE / THIRD_PARTY_NOTICES copies equal the root files.
 *  5. Both packages are still private at 0.0.0 (no publish or version bump without the owner).
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const REPO = 'https://github.com/githubthinnd/vue-draggable/';
const SKIP =
  /(^|\/)(node_modules|dist|\.nuxt|\.output|upstream|test-results|playwright-report)(\/|$)/;
const problems = [];

function* markdown(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (SKIP.test(relative(root, path))) continue;
    if (statSync(path).isDirectory()) yield* markdown(path);
    else if (name.endsWith('.md')) yield path;
  }
}

const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
const anchors = (file) =>
  new Set(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => /^#{1,6}\s/.test(line))
      .map((line) => slug(line.replace(/^#+\s*/, ''))),
  );

// 1. Links.
let links = 0;
for (const file of markdown(root)) {
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    let path;
    let anchor;
    if (target.startsWith(REPO)) {
      [path, anchor] = target
        .slice(REPO.length)
        .replace(/^(blob|tree)\/(main|master)\//, '')
        .split('#');
      path = join(root, path);
    } else if (/^(https?:|mailto:)/.test(target)) {
      continue;
    } else {
      [path, anchor] = target.split('#');
      path = path ? resolve(dirname(file), path) : file;
    }
    links++;
    const where = `${relative(root, file)} -> ${target}`;
    if (!existsSync(path)) problems.push(`broken link: ${where}`);
    else if (anchor && path.endsWith('.md') && !anchors(path).has(anchor))
      problems.push(`missing anchor: ${where}`);
  }
}

// 2. Core README covers the component's surface.
const component = require(join(root, 'packages/vue-draggable/dist/index.cjs'));
const coreReadme = readFileSync(join(root, 'packages/vue-draggable/README.md'), 'utf8');
for (const name of [
  ...Object.keys(component.props),
  ...component.emits,
  'item',
  'header',
  'footer',
]) {
  if (!coreReadme.includes(`\`${name}\``))
    problems.push(`core README does not mention \`${name}\``);
}

// 3. Nuxt README covers the options.
const options = readFileSync(
  join(root, 'packages/nuxt-draggable/src/runtime/domain/options.ts'),
  'utf8',
);
const list = (name) =>
  [
    ...(new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`).exec(options)?.[1] ?? '').matchAll(
      /'([^']+)'/g,
    ),
  ].map((m) => m[1]);
const nuxtReadme = readFileSync(join(root, 'packages/nuxt-draggable/README.md'), 'utf8');
const optionNames = list('KNOWN');
const pluginNames = list('PLUGIN_NAMES');
if (optionNames.length < 4 || pluginNames.length < 4)
  problems.push('could not read the module options from options.ts');
for (const name of [...optionNames, ...pluginNames]) {
  if (!nuxtReadme.includes(name)) problems.push(`Nuxt README does not mention ${name}`);
}

// 4. License copies.
for (const [copy, original] of [
  ['packages/vue-draggable/LICENSE', 'LICENSE'],
  ['packages/vue-draggable/THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.md'],
  ['packages/nuxt-draggable/LICENSE', 'LICENSE'],
]) {
  if (readFileSync(join(root, copy), 'utf8') !== readFileSync(join(root, original), 'utf8'))
    problems.push(`${copy} differs from ${original}`);
}

// 5. No release without the owner.
for (const pkg of ['packages/vue-draggable', 'packages/nuxt-draggable']) {
  const manifest = JSON.parse(readFileSync(join(root, pkg, 'package.json'), 'utf8'));
  if (manifest.private !== true || manifest.version !== '0.0.0')
    problems.push(`${pkg} must stay private at 0.0.0 until the owner releases it`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(
  `✔ docs: ${links} links, component surface, module options, licence copies, release guard`,
);
