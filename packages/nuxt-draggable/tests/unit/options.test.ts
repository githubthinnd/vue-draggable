import { describe, expect, it } from 'vitest';
import {
  DraggableModuleError,
  parseRuntimeConfig,
  resolveOptions,
} from '../../src/runtime/domain/options';

describe('resolveOptions', () => {
  it('applies the defaults', () => {
    expect(resolveOptions({})).toEqual({
      componentNames: ['Draggable'],
      plugins: [],
      clientOnly: false,
      globalOptions: {},
    });
  });

  it('accepts aliases, plugins, clientOnly and JSON global options', () => {
    expect(
      resolveOptions({
        componentName: ['Draggable', 'VueDraggable', 'vue-draggable-list'],
        plugins: ['MultiDrag', 'Swap', 'MultiDrag'],
        clientOnly: true,
        globalOptions: {
          animation: 150,
          group: { name: 'g', pull: 'clone' },
          'ghost-class': 'ghost',
        },
      }),
    ).toEqual({
      componentNames: ['Draggable', 'VueDraggable', 'vue-draggable-list'],
      plugins: ['MultiDrag', 'Swap'],
      clientOnly: true,
      globalOptions: {
        animation: 150,
        group: { name: 'g', pull: 'clone' },
        'ghost-class': 'ghost',
      },
    });
  });

  it.each([
    [{ foo: 1 }, 'draggable.foo'],
    [{ componentName: '' }, 'draggable.componentName'],
    [{ componentName: ['Draggable', 'draggable list'] }, 'draggable.componentName[1]'],
    [{ componentName: ['A', 'A'] }, 'draggable.componentName'],
    [{ componentName: [] }, 'draggable.componentName'],
    [{ plugins: 'MultiDrag' }, 'draggable.plugins'],
    [{ plugins: ['MultiDrag', 'Nope'] }, 'draggable.plugins[1]'],
    [{ clientOnly: 'yes' }, 'draggable.clientOnly'],
    [{ globalOptions: [] }, 'draggable.globalOptions'],
    [{ globalOptions: { onEnd: 'x' } }, 'draggable.globalOptions.onEnd'],
    [{ globalOptions: { filter: () => true } }, 'draggable.globalOptions.filter'],
    [
      { globalOptions: { group: { put: [1, Number.NaN] } } },
      'draggable.globalOptions.group.put[1]',
    ],
  ])('rejects %j naming %s', (input, path) => {
    expect(() => resolveOptions(input)).toThrow(DraggableModuleError);
    expect(() => resolveOptions(input)).toThrow(`"${path}"`);
  });
});

describe('parseRuntimeConfig', () => {
  it('accepts what the module writes', () => {
    expect(parseRuntimeConfig({ plugins: ['Swap'], globalOptions: { animation: 1 } })).toEqual({
      plugins: ['Swap'],
      globalOptions: { animation: 1 },
    });
  });

  it.each([
    null,
    'x',
    { plugins: ['Nope'], globalOptions: {} },
    { plugins: [], globalOptions: [] },
    { plugins: 'Swap', globalOptions: {} },
  ])('returns null for %j', (value) => {
    expect(parseRuntimeConfig(value)).toBeNull();
  });
});
