// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md. Phase 1 port: behaviour intentionally identical, bugs included.

const manageAndEmit: readonly string[] = ['Start', 'Add', 'Remove', 'Update', 'End'];
const emit: readonly string[] = ['Choose', 'Unchoose', 'Sort', 'Filter', 'Clone'];
const manage: readonly string[] = ['Move'];
// ID-12: handled and emitted like the first group, but declared last so the 4.1.0 emits keep
// their order. Fired by the engine when an item is dropped outside every list (OnSpill plugin).
const manageAndEmitExtra: readonly string[] = ['Spill'];
const eventHandlerNames = [manage, manageAndEmit, emit, manageAndEmitExtra]
  .flatMap((events) => events)
  .map((evt) => `on${evt}`);

type EventKind = 'manage' | 'manageAndEmit' | 'emit' | 'manageAndEmitExtra';

const events: Readonly<Record<EventKind, readonly string[]>> = {
  manage,
  manageAndEmit,
  emit,
  manageAndEmitExtra,
};

function isReadOnly(eventName: string): boolean {
  return eventHandlerNames.indexOf(eventName) !== -1;
}

export { events, isReadOnly };
export type { EventKind };
