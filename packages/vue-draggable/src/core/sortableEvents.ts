// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md. Phase 1 port: behaviour intentionally identical, bugs included.

const manageAndEmit: readonly string[] = ['Start', 'Add', 'Remove', 'Update', 'End'];
const emit: readonly string[] = ['Choose', 'Unchoose', 'Sort', 'Filter', 'Clone'];
const manage: readonly string[] = ['Move'];
const eventHandlerNames = [manage, manageAndEmit, emit]
  .flatMap((events) => events)
  .map((evt) => `on${evt}`);

type EventKind = 'manage' | 'manageAndEmit' | 'emit';

const events: Readonly<Record<EventKind, readonly string[]>> = {
  manage,
  manageAndEmit,
  emit,
};

function isReadOnly(eventName: string): boolean {
  return eventHandlerNames.indexOf(eventName) !== -1;
}

export { events, isReadOnly };
export type { EventKind };
