import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.nuxt/**',
      '**/.output/**',
      // The playground is type-checked by vue-tsc (and its e2e by tsc); Nuxt playground: Phase 4.
      'playground/**',
      // Upstream Jest suite ported nearly verbatim (kept diffable with vue.draggable.next).
      'tests/compat/upstream/**',
      // Type-test fixtures: checked by vue-tsc against 4.1.0's and our types, not linted.
      'tests/compat/types/**',
      // Stands for a user's 4.1.0 app (plain JS, require(), browser globals): built, not linted.
      'tests/smoke/app/**',
      // Nuxt app fixture, loaded by the module's integration tests.
      'packages/nuxt-draggable/tests/fixtures/**',
      'tests/nuxt-compat/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Every .ts file (configs included) belongs to a package tsconfig.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      // Contradicts no-non-null-assertion above: we narrow with an explicit `as T` instead of `!`.
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    },
  },
  {
    // Ported from vuedraggable@4.1.0 (ADR-0001). These rules would change behaviour, not style:
    // `||` vs `??` differ on '' / 0 / false, `indexOf` vs `includes` on NaN. The port keeps
    // upstream's operators; Phase 2 changes behaviour only through documented differences.
    files: ['packages/vue-draggable/src/**/*.ts'],
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-includes': 'off',
    },
  },
  {
    // Differential tests drive the untyped 4.1.0 reference bundle: `any` is the honest type there.
    files: ['tests/compat/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  ...pluginVue.configs['flat/essential'],
  {
    // Hand-written public types: `any` and `Function` mirror vuedraggable@4.1.0's own types on
    // purpose, so nothing that type-checked against 4.1.0 stops type-checking (compat.md D-4).
    files: ['packages/vue-draggable/types/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
  {
    // The component must be named "draggable", exactly like vuedraggable@4.1.0 (compat.md C-1).
    files: ['packages/vue-draggable/src/draggable.ts'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  {
    // Type-aware rules for single-file components are left to vue-tsc.
    files: ['**/*.vue'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
        projectService: false,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/scripts/**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
);
