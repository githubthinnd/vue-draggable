// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md. Phase 1 port: behaviour intentionally identical, bugs included.

import { camelize } from '../util/string';
import { events, isReadOnly, type EventKind } from './sortableEvents';
import { isHtmlAttribute } from '../util/tags';

type Dictionary = Record<string, unknown>;
type CallBackBuilder = Readonly<Record<EventKind, (event: string) => unknown>>;

function project(entries: [string, unknown][]): Dictionary {
  return entries.reduce<Dictionary>((res, [key, value]) => {
    res[key] = value;
    return res;
  }, {});
}

function getComponentAttributes({
  $attrs,
  componentData = {},
}: {
  $attrs: Dictionary;
  componentData?: Dictionary | null;
}): Dictionary {
  const attributes = project(Object.entries($attrs).filter(([key]) => isHtmlAttribute(key)));
  return {
    ...attributes,
    ...componentData,
  };
}

function createSortableOption({
  $attrs,
  callBackBuilder,
}: {
  $attrs: Dictionary;
  callBackBuilder: CallBackBuilder;
}): Dictionary {
  const options = project(getValidSortableEntries($attrs));
  (Object.entries(callBackBuilder) as [EventKind, (event: string) => unknown][]).forEach(
    ([eventType, eventBuilder]) => {
      events[eventType].forEach((event) => {
        options[`on${event}`] = eventBuilder(event);
      });
    },
  );
  const userDraggable = options['draggable'];
  // Same conversion as upstream's template literal `${options.draggable || ""}`, objects included.
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const draggable = `[data-draggable]${userDraggable ? String(userDraggable) : ''}`;
  return {
    ...options,
    draggable,
  };
}

function getValidSortableEntries(value: Dictionary): [string, unknown][] {
  return Object.entries(value)
    .filter(([key]) => !isHtmlAttribute(key))
    .map(([key, entryValue]): [string, unknown] => [camelize(key), entryValue])
    .filter(([key]) => !isReadOnly(key));
}

export { getComponentAttributes, createSortableOption, getValidSortableEntries };
export type { CallBackBuilder, Dictionary };
