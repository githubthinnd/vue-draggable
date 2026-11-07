// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md.

function getConsole(): Console {
  if (typeof window !== 'undefined') {
    return window.console;
  }
  // ID-9: upstream read `global.console`, a ReferenceError at import time in runtimes that have
  // neither `window` nor `global` (Web Workers, edge/worker SSR runtimes, a bare VM context).
  return globalThis.console;
}
const console: Console = getConsole();

export { console };
