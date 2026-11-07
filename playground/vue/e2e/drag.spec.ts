import { drag, expect, open, state, test, texts } from './fixtures';

test.describe('single list', () => {
  test('reorders: DOM and data agree, no duplicates', async ({ page, errors }) => {
    void errors;
    await open(page, 'sortable');
    const list = page.getByTestId('list');
    const before = await state(page);
    await drag(page, list.locator('.item').first(), list.locator('.item').nth(2), { below: true });
    const after = await state(page);
    expect(after).not.toBe(before);
    expect(await texts(list)).toEqual(after.split(','));
    expect(new Set(after.split(',')).size).toBe(5);
  });

  test('handle: only the handle starts a drag', async ({ page, errors }) => {
    void errors;
    await open(page, 'handle');
    const list = page.getByTestId('list');
    const before = await state(page);
    await drag(page, list.locator('.task-title').first(), list.locator('.item').last(), {
      below: true,
    });
    expect(await state(page)).toBe(before);
    await drag(page, list.getByTestId('handle').first(), list.locator('.item').last(), {
      below: true,
    });
    expect(await state(page)).not.toBe(before);
    expect(await texts(list)).toEqual((await state(page)).split(','));
  });

  test('header and footer stay in place', async ({ page, errors }) => {
    void errors;
    await open(page, 'header-footer');
    const list = page.getByTestId('list');
    await drag(page, list.locator('.item').first(), list.locator('.item').last(), { below: true });
    await expect(list.locator(':scope > li').first()).toHaveAttribute('data-testid', 'header');
    expect(await texts(list)).toEqual((await state(page)).split(','));
    await page.getByTestId('add').click();
    expect(await texts(list)).toEqual((await state(page)).split(','));
  });

  test('transition-group: no crash, animated sort', async ({ page, errors }) => {
    void errors;
    await open(page, 'transition');
    const list = page.getByTestId('list');
    await drag(page, list.locator('.item').first(), list.locator('.item').last(), { below: true });
    expect(await texts(list)).toEqual((await state(page)).split(','));
    await page.getByTestId('sort').click();
    await expect(list.locator('.flip-list-move').first()).toBeAttached({ timeout: 1000 });
    await page.waitForTimeout(700);
    expect(await texts(list)).toEqual((await state(page)).split(','));
  });
});

test.describe('delete and undo', () => {
  test('delete button, trash and drop outside remove items; undo and redo restore them', async ({
    page,
    errors,
  }) => {
    void errors;
    await open(page, 'trash');
    const list = page.getByTestId('list');
    const original = await state(page);
    await list.locator('.row-delete').first().click();
    expect((await state(page)).split(',')).toHaveLength(4);
    await drag(page, list.locator('.item').first(), page.getByTestId('trash'));
    expect((await state(page)).split(',')).toHaveLength(3);
    const box = await page.getByTestId('list').boundingBox();
    if (box) {
      await page.mouse.move(box.x + 60, box.y + 20);
      await page.mouse.down();
      await page.mouse.move(box.x + 60, box.y + 40, { steps: 5 });
      await page.mouse.move(box.x + box.width + 400, box.y + box.height + 300, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    expect((await state(page)).split(',')).toHaveLength(2);
    expect(await texts(list)).toEqual((await state(page)).split(','));
    for (let i = 0; i < 3; i++) await page.getByTestId('undo').click();
    expect(await state(page)).toBe(original);
    await page.keyboard.press('ControlOrMeta+Shift+Z');
    expect((await state(page)).split(',')).toHaveLength(4);
    expect(await texts(list)).toEqual((await state(page)).split(','));
  });

  test('Escape cancels a drag', async ({ page, errors }) => {
    void errors;
    await open(page, 'trash');
    const list = page.getByTestId('list');
    const before = await state(page);
    const from = await list.locator('.item').first().boundingBox();
    const to = await list.locator('.item').nth(3).boundingBox();
    if (!from || !to) throw new Error('not visible');
    await page.mouse.move(from.x + 60, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + 60, to.y + to.height * 0.8, { steps: 20 });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await page.waitForTimeout(300);
    expect(await state(page)).toBe(before);
    expect(await texts(list)).toEqual(before.split(','));
  });
});

test.describe('several lists', () => {
  test('kanban: moves a card to another column, undo puts it back', async ({ page, errors }) => {
    void errors;
    await open(page, 'kanban');
    const before = await state(page);
    await drag(
      page,
      page.getByTestId('col-todo').locator('.item').first(),
      page.getByTestId('col-doing').locator('.item').first(),
    );
    const [todo, doing] = (await state(page)).split('|');
    expect(todo).not.toContain('Audit color contrast');
    expect(doing).toContain('Audit color contrast');
    await page.getByTestId('undo').click();
    expect(await state(page)).toBe(before);
  });

  test('form builder: the palette keeps its fields', async ({ page, errors }) => {
    void errors;
    await open(page, 'clone');
    const source = page.getByTestId('source');
    const target = page.getByTestId('target');
    await drag(page, source.locator('.item').first(), target.locator('.item').first(), {
      below: true,
    });
    const [palette, form] = (await state(page)).split('|');
    expect(palette?.split(',')).toHaveLength(4);
    expect(form?.split(',')).toContain('Text input');
  });

  test('nested tree keeps data and DOM in sync', async ({ page, errors }) => {
    void errors;
    await open(page, 'nested');
    const before = await state(page);
    const rows = page.locator('[data-testid="tree"] .tree-row');
    await drag(
      page,
      rows.filter({ hasText: 'README.md' }).first(),
      rows.filter({ hasText: 'main.ts' }).first(),
    );
    expect(await state(page)).not.toBe(before);
  });
});

test.describe('plugins', () => {
  test('MultiDrag moves every selected item', async ({ page, errors }) => {
    void errors;
    await open(page, 'multi-select');
    const list = page.getByTestId('list');
    await list.locator('.item').nth(0).click();
    await list.locator('.item').nth(2).click();
    await expect(list.locator('.selected')).toHaveCount(2);
    await drag(page, list.locator('.item').nth(0), list.locator('.item').last(), { below: true });
    const after = (await state(page)).split(',');
    expect(after.slice(-2)).toEqual(['Design the onboarding flow', 'Fix the mobile navigation']);
    expect(await texts(list)).toEqual(after);
  });

  test('Swap exchanges two tiles', async ({ page, errors }) => {
    void errors;
    await open(page, 'swap');
    const list = page.getByTestId('list');
    await drag(page, list.locator('.item').nth(0), list.locator('.item').nth(2));
    expect(await state(page)).toBe('Churn,Active users,Revenue,Conversion,NPS,Latency');
    expect(await texts(list)).toEqual([
      'Churn',
      'Active users',
      'Revenue',
      'Conversion',
      'NPS',
      'Latency',
    ]);
  });
});

test('pointer fallback (touch devices)', async ({ page, errors }) => {
  void errors;
  await open(page, 'touch');
  const list = page.getByTestId('list');
  const before = await state(page);
  await drag(page, list.locator('.item').first(), list.locator('.item').last(), { below: true });
  expect(await state(page)).not.toBe(before);
  expect(await texts(list)).toEqual((await state(page)).split(','));
});
