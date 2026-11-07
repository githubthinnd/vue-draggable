import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type TestProjectInlineConfiguration } from 'vitest/config';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Raw ES source published in the 4.1.0 tarball (same runtime code as its dist bundles). */
const referenceSrc = resolve(dirname(require.resolve('vuedraggable-ref/package.json')), 'src');
const oursSrc = resolve(here, '../../packages/vue-draggable/src');
/**
 * One path for every `sortablejs` import (ours, the reference's own nested 1.14.0 copy and the
 * tests'), so `vi.mock('sortablejs')` replaces the same module for both implementations.
 */
const sortablePath = require.resolve('sortablejs');

type Implementation = 'reference' | 'ours';
const implementations: Record<Implementation, { label: string; src: string; entry: string }> = {
  reference: {
    label: 'vuedraggable@4.1.0',
    src: referenceSrc,
    entry: resolve(referenceSrc, 'vuedraggable.js'),
  },
  ours: { label: '@vue-draggable/core', src: oursSrc, entry: resolve(oursSrc, 'index.ts') },
};

function project(
  name: string,
  include: string[],
  alias: { find: string | RegExp; replacement: string }[],
  impl?: Implementation,
): TestProjectInlineConfiguration {
  return {
    plugins: [vue()],
    // Which implementation a shared upstream spec runs against, for the rows that document an
    // intentional difference (docs/compat.md §10).
    define: { __VD_IMPL__: JSON.stringify(impl ?? 'both') },
    resolve: {
      alias: [{ find: /^sortablejs$/, replacement: sortablePath }, ...alias],
      // Upstream's Jest config resolved extensionless `.vue` imports (moduleFileExtensions).
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    test: {
      name,
      include,
      environment: 'happy-dom',
      globals: true,
      // The reference is ES source inside node_modules: let Vite transform it (extensionless
      // imports, aliases, mocks) instead of handing it to Node.
      server: { deps: { inline: [/vuedraggable-ref/] } },
    },
  };
}

/** The upstream suite, `@/` pointing at one implementation's source tree. */
function upstreamProject(impl: Implementation): TestProjectInlineConfiguration {
  const { label, src, entry } = implementations[impl];
  return project(
    `upstream ${label}`,
    ['upstream/**/*.spec.js'],
    [
      { find: /^@\/vuedraggable$/, replacement: entry },
      { find: /^@\//, replacement: `${src}/` },
    ],
    impl,
  );
}

export default defineConfig({
  test: {
    projects: [
      upstreamProject('reference'),
      upstreamProject('ours'),
      project(
        'differential',
        ['differential/**/*.test.ts'],
        [
          { find: /^#reference$/, replacement: implementations.reference.entry },
          { find: /^#ours$/, replacement: implementations.ours.entry },
        ],
      ),
      project(
        'regression',
        ['regression/**/*.test.ts'],
        [
          { find: /^#reference$/, replacement: implementations.reference.entry },
          { find: /^#ours$/, replacement: implementations.ours.entry },
          { find: /^#ours\/(.*)$/, replacement: `${oursSrc}/$1` },
        ],
      ),
      project('reference-surface', ['reference-surface.test.ts'], []),
    ],
  },
});
