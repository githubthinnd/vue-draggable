// Local declaration for the untyped `sortablejs` import (ADR-0002: no @types/sortablejs dependency).
// Shapes differ by build: the ESM build exports `default`, `Sortable`, `MultiDrag` and `Swap`; the
// CJS/UMD build is the constructor itself with every plugin already mounted. See ../sortable.ts.
declare module 'sortablejs' {
  const Sortable: unknown;
  export default Sortable;
  export const MultiDrag: unknown;
  export const Swap: unknown;
}
