import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const offset = (rail: Locator) => rail.evaluate((element) => element.scrollLeft);
async function drag(page: Page, rail: Locator, delta = -180) {
  await rail.scrollIntoViewIfNeeded();
  const box = await rail.boundingBox();
  if (!box) throw new Error('Rail has no layout');
  const x = box.x + Math.min(box.width / 2, 280);
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + delta, y, { steps: 12 });
  await page.mouse.up();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Momentum', { exact: true }).uncheck();
});
test('mouse dragging moves real scroll position and emits one completion', async ({ page }) => {
  const rail = page.getByTestId('main-rail');
  await drag(page, rail);
  await expect.poll(() => offset(rail)).toBeGreaterThan(100);
  await expect(page.getByTestId('drag-events')).toHaveText('1');
  await expect(rail).not.toHaveAttribute('data-dragging');
});
test('keyboard, native ref controls, and RTL boundaries', async ({ page }) => {
  const rail = page.getByTestId('main-rail');
  await rail.focus();
  await page.keyboard.press('End');
  expect(await offset(rail)).toBeGreaterThan(100);
  await page.keyboard.press('Home');
  expect(await offset(rail)).toBe(0);
  await page.getByRole('button', { name: 'Scroll forward' }).click();
  expect(await offset(rail)).toBeGreaterThan(100);
  await page.getByLabel('RTL', { exact: true }).check();
  await rail.focus();
  await page.keyboard.press('End');
  expect(await offset(rail)).toBeLessThan(-100);
  await page.keyboard.press('Home');
  expect(Math.abs(await offset(rail))).toBeLessThan(1);
  await drag(page, rail, 160);
  expect(await offset(rail)).toBeLessThan(-100);
});
test('clickable children remain usable while a drag cancels activation', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Save Alpine quiet', exact: true });
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await button.click();
  const box = await button.boundingBox();
  if (!box) throw new Error('Missing button');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 140, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
});
test('disabled dragging retains native scrolling', async ({ page, browserName, isMobile }) => {
  const rail = page.getByTestId('main-rail');
  await page.getByLabel('Dragging', { exact: true }).uncheck();
  await drag(page, rail);
  expect(await offset(rail)).toBe(0);
  if (browserName === 'webkit' && isMobile) {
    // Playwright cannot inject wheel input into mobile WebKit.
    await rail.evaluate((element) => element.scrollBy({ left: 220 }));
  } else {
    await rail.hover();
    await page.mouse.wheel(220, 0);
  }
  await expect.poll(() => offset(rail)).toBeGreaterThan(100);
});
test('controls inside the rail own their keyboard events', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Destination' });
  await input.fill('Alpine lake');
  const rail = page.getByTestId('cards-rail');
  const before = await offset(rail);
  await page.keyboard.press('Home');
  expect(await offset(rail)).toBe(before);
  await expect(input).toHaveValue('Alpine lake');
});
test('reduced motion prevents added inertia', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('Momentum', { exact: true }).check();
  const rail = page.getByTestId('main-rail');
  await drag(page, rail);
  const before = await offset(rail);
  await page.waitForTimeout(250);
  expect(await offset(rail)).toBe(before);
});
test('page has no automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
test('native touch pans the rail and page without custom callbacks', async ({
  page,
  browserName,
  isMobile,
}) => {
  test.skip(
    !isMobile || browserName !== 'chromium',
    'Real touch gesture injection requires Chromium CDP',
  );
  const rail = page.getByTestId('main-rail');
  await rail.scrollIntoViewIfNeeded();
  const box = await rail.boundingBox();
  if (!box) throw new Error('Missing rail');
  expect(await rail.evaluate((el) => getComputedStyle(el).touchAction)).toBe('auto');
  const session = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 290, y }],
  });
  for (let x = 270; x >= 80; x -= 20) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await page.waitForTimeout(16);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => offset(rail)).toBeGreaterThan(100);
  await expect(page.getByTestId('drag-events')).toHaveText('0');
  const before = await page.evaluate(() => window.scrollY);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 150, y }],
  });
  for (let dy = 20; dy <= 160; dy += 20) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 150, y: y - dy }],
    });
    await page.waitForTimeout(16);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 30);
  await session.detach();
});
