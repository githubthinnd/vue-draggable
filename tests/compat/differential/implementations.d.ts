/* eslint-disable @typescript-eslint/consistent-type-imports -- a top-level import would turn these
   ambient declarations into module augmentations. */
// Vitest aliases (tests/compat/vitest.config.ts) point these at the two implementations' sources.
declare module '#reference' {
  const component: import('vue').Component;
  export default component;
}
declare module '#ours' {
  const component: import('vue').Component;
  export default component;
}
