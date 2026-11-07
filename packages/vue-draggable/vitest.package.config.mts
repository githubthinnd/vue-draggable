import { defineConfig } from 'vitest/config';

// Tests the built files the way a consumer loads them (`npm run build` first). Not part of `test`.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/package/**/*.test.ts'],
  },
});
