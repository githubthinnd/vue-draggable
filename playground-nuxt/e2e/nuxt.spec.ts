import { expect, test, type Locator, type Page } from '@playwright/test';

async function drag(page: Page, from: Locator, to: Locator): Promise<void> {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  if (!a || !b) throw new Error('element not visible');
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + 5, { steps: 5 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.8, { steps: 20 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(400);
}

const texts = async (list: Locator): Promise<string[]> =>
  (await list.locator(':scope > .item').allTextContents()).map((t) => t.trim());
const state = async (page: Page): Promise<string> =>
  ((await page.getByTestId('state').textContent()) ?? '').trim();

test.describe('@vue-draggable/nuxt', () => {
  test('ssr-check hydrates without warnings and starts Sortable', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'warning' || m.type() === 'error') messages.push(m.text());
    });
    page.on('pageerror', (e) => messages.push(e.message));
    const response = await page.goto('/ssr-check');
    expect(await response?.text()).toContain('data-draggable="true"');
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as { useNuxtApp?: unknown }).useNuxtApp) ||
        document.querySelector('#__nuxt'),
    );
    await page.waitForTimeout(500);
    expect(messages.filter((m) => /hydrat|mismatch|vue-draggable/i.test(m))).toEqual([]);
    const list = page.getByTestId('list');
    await drag(page, list.locator('.item').first(), list.locator('.item').last());
    expect(await texts(list)).toEqual((await state(page)).split(','));
  });

  for (const path of ['/basic', '/transition-group', '/header-footer']) {
    test(`${path}: dragging keeps DOM and data in sync`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path);
      const list = page.getByTestId('list');
      const before = await state(page);
      await drag(page, list.locator('.item').first(), list.locator('.item').last());
      expect(await state(page)).not.toBe(before);
      expect(await texts(list)).toEqual((await state(page)).split(','));
      expect(errors).toEqual([]);
    });
  }

  test('global options reach Sortable (animation 150 from nuxt.config)', async ({ page }) => {
    await page.goto('/basic');
    const animation = await page.getByTestId('list').evaluate((el) => {
      const vm = (
        el as unknown as {
          __draggable_component__?: { _sortable?: { options: { animation: number } } };
        }
      ).__draggable_component__;
      return vm?._sortable?.options.animation;
    });
    expect(animation).toBe(150);
  });

  test('MultiDrag plugin is mounted by the module', async ({ page }) => {
    await page.goto('/multidrag');
    const list = page.getByTestId('list');
    await list.locator('.item').nth(0).click();
    await list.locator('.item').nth(2).click();
    await expect(list.locator('.selected')).toHaveCount(2);
    await drag(page, list.locator('.item').nth(0), list.locator('.item').last());
    const after = (await state(page)).split(',');
    expect(after.slice(-2)).toEqual(['a', 'c']);
    expect(await texts(list)).toEqual(after);
  });

  test('alias component and cross-list move', async ({ page }) => {
    await page.goto('/two-lists');
    await drag(
      page,
      page.getByTestId('list1').locator('.item').first(),
      page.getByTestId('list2').locator('.item').first(),
    );
    const [one, two] = (await state(page)).split('|');
    expect(one).not.toContain('John');
    expect(two).toContain('John');
  });
});
