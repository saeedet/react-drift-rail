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
  await page.getByLabel('Start at', { exact: true }).selectOption('start');
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

async function expectCentered(rail: Locator) {
  await expect
    .poll(() =>
      rail.evaluate((element) =>
        Math.abs(Math.abs(element.scrollLeft) - (element.scrollWidth - element.clientWidth) / 2),
      ),
    )
    .toBeLessThan(2);
}
test('opens in the middle on a fresh visit and drags both ways', async ({ page }) => {
  await page.reload();
  await page.getByLabel('Momentum', { exact: true }).uncheck();
  const rail = page.getByTestId('main-rail');
  await expectCentered(rail);
  const middle = await offset(rail);
  await drag(page, rail, -100);
  expect(await offset(rail)).toBeGreaterThan(middle + 80);
  await drag(page, rail, 200);
  expect(await offset(rail)).toBeLessThan(middle - 80);
});
test('supports middle and end starts in RTL', async ({ page }) => {
  await page.getByLabel('Start at', { exact: true }).selectOption('center');
  await page.getByLabel('RTL', { exact: true }).check();
  const rail = page.getByTestId('main-rail');
  await expectCentered(rail);
  const middle = await offset(rail);
  expect(middle).toBeLessThan(0);
  await drag(page, rail, -80);
  expect(await offset(rail)).toBeGreaterThan(middle + 60);
  await page.getByLabel('Start at', { exact: true }).selectOption('end');
  await expect
    .poll(() =>
      rail.evaluate((element) =>
        Math.abs(element.scrollLeft + element.scrollWidth - element.clientWidth),
      ),
    )
    .toBeLessThan(2);
});
test('can show flat or tilted photos without resetting the viewport', async ({ page }) => {
  const rail = page.getByTestId('main-rail');
  const photo = rail.locator('figure').first();
  await expect(photo).toHaveCSS('transform', 'none');
  await drag(page, rail);
  const before = await offset(rail);
  await page.getByLabel('Tilt photos', { exact: true }).check();
  await expect(photo).not.toHaveCSS('transform', 'none');
  expect(Math.abs((await offset(rail)) - before)).toBeLessThan(2);
  await page.getByLabel('Tilt photos', { exact: true }).uncheck();
  await expect(photo).toHaveCSS('transform', 'none');
});
test('hides all rail scrollbars while retaining drag, keyboard, and focus', async ({
  page,
  browserName,
}) => {
  const rail = page.getByTestId('main-rail');
  await expect(rail).toHaveCSS('scrollbar-width', 'none');
  await expect(rail).toHaveCSS('overflow-x', 'auto');
  if (browserName !== 'firefox')
    expect(
      await rail.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar').display),
    ).toBe('none');
  await expect(page.locator('.progress')).toHaveCount(0);
  await drag(page, rail);
  expect(await offset(rail)).toBeGreaterThan(100);
  await rail.focus();
  await page.keyboard.press('Home');
  expect(await offset(rail)).toBe(0);
  await expect(rail).toBeFocused();
  // Some automated/browser environments suppress scrollbars regardless of authored CSS.
  const visibleScrollbarWidth = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.scrollbarWidth = 'thin';
    document.body.append(probe);
    const value = getComputedStyle(probe).scrollbarWidth;
    probe.remove();
    return value;
  });
  await page.getByLabel('Show scrollbar', { exact: true }).check();
  await expect(rail).not.toHaveAttribute('data-scrollbar-hidden');
  await expect(rail).toHaveCSS('scrollbar-width', visibleScrollbarWidth);
  await expect(page.locator('.progress')).toHaveCount(1);
});
test('tracks late image sizing and new items until the reader interacts', async ({ page }) => {
  let imageRequest: import('@playwright/test').Route | undefined;
  await page.route('**/late-image.svg', (route) => {
    imageRequest = route;
  });
  await page.goto('/position-fixture.html', { waitUntil: 'domcontentloaded' });
  const rail = page.getByRole('region', { name: 'Position fixture' });
  await expect(rail).toBeVisible();
  await expectCentered(rail);
  const before = await offset(rail);
  await expect.poll(() => Boolean(imageRequest)).toBe(true);
  await imageRequest!.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100"><rect width="800" height="100" fill="green"/></svg>',
  });
  await expect.poll(() => offset(rail)).toBeGreaterThan(before + 100);
  await expectCentered(rail);
  await page.getByRole('button', { name: 'Add item' }).click();
  await expectCentered(rail);
  await drag(page, rail, -100);
  const moved = await offset(rail);
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(rail.locator('article')).toHaveCount(5);
  expect(Math.abs((await offset(rail)) - moved)).toBeLessThan(2);
  await page.setViewportSize({ width: 800, height: 900 });
  await expect.poll(() => offset(rail)).toBeCloseTo(moved, 0);
});
