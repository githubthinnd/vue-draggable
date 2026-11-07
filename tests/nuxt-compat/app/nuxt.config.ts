// A user's Nuxt app with the module installed from its packed tarball (scripts/nuxt-compat.mjs).
export default defineNuxtConfig({
  modules: ['@vue-draggable/nuxt'],
  telemetry: false,
  devtools: { enabled: false },
  draggable: { plugins: ['MultiDrag'], globalOptions: { animation: 150 } },
});
