import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    // tests/package needs a build first: `npm run verify:dist`.
    exclude: ['tests/package/**', '**/node_modules/**'],
  },
});
