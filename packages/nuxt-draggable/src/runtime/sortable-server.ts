// Server builds resolve `sortablejs` to this module (see module.ts), so no SortableJS code ships to
// the server: a Sortable is only created in the component's `mounted` hook, which SSR never runs.
const Sortable = undefined;
export default Sortable;
export const MultiDrag = undefined;
export const Swap = undefined;
