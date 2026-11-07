// Loads the module from source (like ../nuxt-hydration-doctor's playground).
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  modules: ['../packages/nuxt-draggable/src/module'],
  devtools: { enabled: false },
  telemetry: false,
  draggable: {
    componentName: ['Draggable', 'VueDraggable'],
    plugins: ['MultiDrag', 'Swap'],
    globalOptions: { animation: 150, ghostClass: 'ghost' },
  },
  css: ['~/assets/style.css'],
});
