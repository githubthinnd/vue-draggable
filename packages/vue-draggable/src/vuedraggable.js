// Legacy entry kept at 4.1.0's path (compat.md P-5): `import draggable from 'vuedraggable/src/vuedraggable'`
// was the usual workaround for #49. Tools that read the `exports` map get dist/index.(m|c)js instead;
// this file serves bundlers that ignore `exports` (webpack 4 / Vue CLI 4), which accept ESM syntax.
export { default } from '../dist/index.mjs';
