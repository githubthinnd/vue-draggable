/**
 * ID-9: loading the package in a runtime with neither `window` nor `global` (Web Workers,
 * edge/worker SSR, a bare VM). 4.1.0's source reads `global.console` at import time and throws a
 * ReferenceError; that source is what bundlers compile for `vuedraggable/src/vuedraggable` (the
 * #49 workaround) and for SSR builds. (Its webpack UMD bundle shims `global` and only ends up with
 * `console === undefined`.) Ours is checked on the built UMD in packages/vue-draggable/tests/package;
 * here the same bare context runs both implementations' console module.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const sources = {
  'vuedraggable@4.1.0': resolve(
    dirname(require.resolve('vuedraggable-ref/package.json')),
    'src/util/console.js',
  ),
  '@vue-draggable/core': resolve(here, '../../../packages/vue-draggable/src/util/console.ts'),
};

/** Evaluates a console module as a script in a context with only `globalThis.console`. */
function loadBare(file: string): unknown {
  const { code } = transformSync(readFileSync(file, 'utf8'), {
    loader: file.endsWith('.ts') ? 'ts' : 'js',
    format: 'iife',
    globalName: 'consoleModule',
  });
  const sandbox: Record<string, unknown> = { console: { error: (): void => undefined } };
  runInNewContext(`${code}\nthis.result = consoleModule;`, sandbox);
  return sandbox['result'];
}

describe('ID-9: the console helper without window or global', () => {
  it('vuedraggable@4.1.0 throws a ReferenceError on load', () => {
    expect(() => loadBare(sources['vuedraggable@4.1.0'])).toThrow(/global is not defined/);
  });

  it('@vue-draggable/core loads and uses globalThis.console', () => {
    const module = loadBare(sources['@vue-draggable/core']) as { console: { error: unknown } };
    expect(typeof module.console.error).toBe('function');
  });
});
