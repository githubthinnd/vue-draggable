// @vitest-environment node
/**
 * Server side: importing the package must not touch `window` / `document` (Vitest's node
 * environment loads modules through Vite's SSR transform), and rendering produces plain markup.
 * The hydration test (ssr.hydration.test.ts) feeds the same HTML to createSSRApp in happy-dom.
 */
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';

describe('server rendering', () => {
  it('runs without browser globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it('imports the package and every scenario without touching the DOM', async () => {
    const { scenarios, createScenarioApp } = await import('./ssr-scenarios');
    for (const [name, app] of Object.entries(scenarios)) {
      const html = await renderToString(createScenarioApp(app));
      expect(html, name).toMatch(/^<main>.*<\/main>$/s);
    }
  });

  it('renders items with data-draggable, like 4.1.0 (R-14)', async () => {
    const { scenarios, createScenarioApp } = await import('./ssr-scenarios');
    const html = await renderToString(
      createScenarioApp(scenarios['ul with header and footer'] as never),
    );
    expect(html).toBe(
      '<main><ul><li class="h">H</li><li data-draggable="true">a</li><li data-draggable="true">b</li><li data-draggable="true">c</li><li>F</li></ul></main>',
    );
  });
});
