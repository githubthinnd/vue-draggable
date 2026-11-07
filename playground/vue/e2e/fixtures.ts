import { expect, test as base, type Locator, type Page } from '@playwright/test';

/** Fails the test on any page error or console.error (e.g. the #140 TypeError). */
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await use(errors);
    expect(errors).toEqual([]);
  },
});
export { expect };

export async function open(page: Page, example: string): Promise<void> {
  await page.goto(`/#${example}`);
  await expect(page.locator(`[data-example="${example}"]`)).toBeVisible();
}

/** Drags with real pointer events in small steps, the way SortableJS expects (native or fallback). */
export async function drag(
  page: Page,
  from: Locator,
  to: Locator,
  options: { below?: boolean } = {},
): Promise<void> {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  if (!a || !b) throw new Error('element not visible');
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + 5, { steps: 5 });
  const y = options.below ? b.y + b.height * 0.8 : b.y + b.height * 0.2;
  await page.mouse.move(b.x + b.width / 2, y, { steps: 20 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(300);
}

/** Item texts in DOM order. */
export async function texts(list: Locator): Promise<string[]> {
  return list
    .locator(':scope > .item')
    .evaluateAll((items) =>
      items.map(
        (item) =>
          (
            item.querySelector('.task-title, .subtle, .form-field__label') ?? item
          ).textContent?.trim() ?? '',
      ),
    );
}

/** The data, as the example prints it in its <pre data-testid="state">. */
export async function state(page: Page): Promise<string> {
  return ((await page.getByTestId('state').textContent()) ?? '').trim();
}
