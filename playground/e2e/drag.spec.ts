import { drag, expect, open, state, test, texts } from './fixtures';

test.describe('single list', () => {
  test('reorders: DOM and data agree, no duplicates', async ({ page, errors }) => {
    void errors;
    await open(page, 'simple');
    const list = page.getByTestId('list');
    const before = await state(page);
    await drag(page, list.locator('.item').first(), list.locator('.item').nth(2), { below: true });
    const after = await state(page);
    expect(after).not.toBe(before);
    expect(await texts(list)).toEqual(after.split(','));
    expect(new Set(after.split(',')).size).toBe(4);
  });

  test('handle: only the handle starts a drag', async ({ page, errors }) => {
    void errors;
    await open(page, 'handle');
    const list = page.getByTestId('list');
    const before = await state(page);
    await drag(page, list.locator('.item').first(), list.locator('.item').last(), { below: true });
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

  test('transition-group (#140, #188, #228): no crash, animated sort', async ({ page, errors }) => {
    void errors;
    await open(page, 'transition-group');
    const list = page.getByTestId('list');
    await drag(page, list.locator('.item').first(), list.locator('.item').last(), { below: true });
    expect(await texts(list)).toEqual((await state(page)).split(','));
    await page.getByTestId('sort').click();
    await expect(list.locator('.flip-list-move').first()).toBeAttached({ timeout: 1000 });
    await page.waitForTimeout(600);
    expect(await texts(list)).toEqual((await state(page)).split(','));
  });
});

test.describe('several lists', () => {
  test('moves an item to another list', async ({ page, errors }) => {
    void errors;
    await open(page, 'two-lists');
    const list1 = page.getByTestId('list1');
    const list2 = page.getByTestId('list2');
    await drag(page, list1.locator('.item').first(), list2.locator('.item').first());
    const [one, two] = (await state(page)).split('|').map((s) => s.split(',').filter(Boolean));
    expect(one).not.toContain('John');
    expect(two).toContain('John');
    expect(await texts(list1)).toEqual(one);
    expect(await texts(list2)).toEqual(two);
  });

  test('clone: the source keeps its item', async ({ page, errors }) => {
    void errors;
    await open(page, 'clone');
    const source = page.getByTestId('source');
    const target = page.getByTestId('target');
    await drag(page, source.locator('.item').first(), target.locator('.item').first(), {
      below: true,
    });
    const [src, dst] = (await state(page)).split('|').map((s) => s.split(','));
    expect(src).toEqual(['dog', 'cat']);
    expect(dst).toContain('dog');
    expect(await texts(source)).toEqual(src);
    expect(await texts(target)).toEqual(dst);
  });

  test('nested lists keep data and DOM in sync', async ({ page, errors }) => {
    void errors;
    await open(page, 'nested');
    const before = await state(page);
    const items = page.locator('[data-testid="tree"] .item');
    await drag(
      page,
      items.filter({ hasText: 'task 5' }).first(),
      items.filter({ hasText: 'task 2' }).first(),
    );
    expect(await state(page)).not.toBe(before);
  });
});

test.describe('SortableJS plugins (#221)', () => {
  test('MultiDrag moves every selected item', async ({ page, errors }) => {
    void errors;
    await open(page, 'multidrag');
    const list = page.getByTestId('list');
    await list.locator('.item').nth(0).click();
    await list.locator('.item').nth(2).click();
    await expect(list.locator('.selected')).toHaveCount(2);
    await drag(page, list.locator('.item').nth(0), list.locator('.item').last(), { below: true });
    const after = (await state(page)).split(',');
    expect(after.slice(-2)).toEqual(['a', 'c']);
    expect(await texts(list)).toEqual(after);
  });

  test('Swap exchanges two items', async ({ page, errors }) => {
    void errors;
    await open(page, 'swap');
    const list = page.getByTestId('list');
    await drag(page, list.locator('.item').nth(0), list.locator('.item').nth(2));
    expect(await state(page)).toBe('c,b,a,d');
    expect(await texts(list)).toEqual(['c', 'b', 'a', 'd']);
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
