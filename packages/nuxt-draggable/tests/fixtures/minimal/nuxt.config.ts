// Bare app with only the module, so registration tests control every option (no defu merge with a
// playground config).
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  modules: ['../../../src/module'],
  devtools: { enabled: false },
  telemetry: false,
});
