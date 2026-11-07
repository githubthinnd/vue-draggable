// Ported from vuedraggable@4.1.0 (vue.draggable.next, MIT, Copyright (c) 2016-2019 David Desmaisons).
// See THIRD_PARTY_NOTICES.md. Phase 1 port: behaviour intentionally identical, bugs included.

function cached(fn: (str: string) => string): (str: string) => string {
  const cache: Record<string, string> = Object.create(null) as Record<string, string>;
  return function cachedFn(str: string): string {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
}

const regex = /-(\w)/g;
const camelize: (str: string) => string = cached((str) =>
  str.replace(regex, (_, c: string) => c.toUpperCase()),
);

export { camelize };
