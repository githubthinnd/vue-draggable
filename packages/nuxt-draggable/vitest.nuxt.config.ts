import { defineConfig } from 'vitest/config';

// Real Nuxt: registration (loadNuxt) and a production build of playground-nuxt. Needs the core
// built first; run with `npm run verify:nuxt`.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
});
