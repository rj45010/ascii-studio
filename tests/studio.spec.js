import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const IMAGE = 'tests/fixtures/sample.png';
const VIDEO = 'tests/fixtures/clip.webm';

/** @param {import('@playwright/test').Page} page */
const fingerprint = page => page.evaluate(() => {
  const c = /** @type {HTMLCanvasElement} */ (document.getElementById('out'));
  const d = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data ?? [];
  let sum = 0;
  for (let i = 0; i < d.length; i += 397) sum = (sum * 31 + d[i]) % 1e9;
  return sum;
});

/** @param {import('@playwright/test').Page} page */
async function openImage(page) {
  await page.locator('#file').setInputFiles(IMAGE);
  await expect(page.locator('#status')).toHaveText('sample.png : 1280×672');
}

/** @param {import('@playwright/test').Page} page @param {string} id @param {string} value */
const setRange = (page, id, value) => page.locator(`#${id}`).evaluate((el, v) => {
  /** @type {HTMLInputElement} */ (el).value = v;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, value);

test.beforeEach(async ({ page }) => {
  const errors = /** @type {string[]} */ ([]);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/index.html');
  await page.evaluate(() => document.fonts.ready);
  /** @type {any} */ (page).__errors = errors;
});

test.afterEach(async ({ page }) => {
  expect(/** @type {any} */ (page).__errors).toEqual([]);
});

test('empty state: prompt shown, actions disabled', async ({ page }) => {
  await expect(page.locator('#hint')).toBeVisible();
  await expect(page.locator('#out')).toBeHidden();
  for (const id of ['save', 'record', 'zoomIn', 'zoomOut', 'zoomLevel', 'zoomFit']) await expect(page.locator(`#${id}`)).toBeDisabled();
  await expect(page.locator('aside.left h2')).toHaveText(['Characters', 'Placement']);
  await expect(page.locator('aside.bar:not(.left) h2')).toHaveText(['Colour', 'Background', 'Effects']);
});

test('opening an image renders glyphs at source size', async ({ page }) => {
  await openImage(page);
  await expect(page.locator('#hint')).toBeHidden();
  const size = await page.locator('#out').evaluate(c => [/** @type {HTMLCanvasElement} */ (c).width, /** @type {HTMLCanvasElement} */ (c).height]);
  expect(size).toEqual([1280, 672]);
  await expect(page.locator('#save')).toBeEnabled();
  await expect(page.locator('#record')).toBeDisabled();

  // glyphs off must give a different frame than glyphs on
  const withGlyphs = await fingerprint(page);
  await setRange(page, 'charOpacity', '0');
  expect(await fingerprint(page)).not.toBe(withGlyphs);
});

test('every slider re-renders and updates its readout', async ({ page }) => {
  await openImage(page);
  const ids = await page.locator('.bar input[type=range]').evaluateAll(els => els.map(e => e.id));
  expect(ids).toHaveLength(13);
  for (const id of ids) {
    const input = page.locator(`#${id}`);
    const max = await input.getAttribute('max');
    const start = await input.inputValue();
    const before = await fingerprint(page);
    await setRange(page, id, /** @type {string} */ (max));
    await expect(input.locator('xpath=following-sibling::output')).toHaveText(/** @type {string} */ (max));
    expect(await fingerprint(page), `${id} at max should change the render`).not.toBe(before);
    await setRange(page, id, start);
  }
});

test('characters field and switches change the render', async ({ page }) => {
  await openImage(page);
  let prev = await fingerprint(page);
  await page.locator('#chars').fill('#');
  expect(await fingerprint(page)).not.toBe(prev);
  for (const id of ['invert', 'randomChars']) {
    prev = await fingerprint(page);
    await page.locator(`#${id}`).check();
    expect(await fingerprint(page), id).not.toBe(prev);
  }
});

test('Save PNG downloads a PNG of the canvas', async ({ page }) => {
  await openImage(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#save').click()]);
  expect(download.suggestedFilename()).toBe('ascii.png');
  const bytes = readFileSync(/** @type {string} */ (await download.path()));
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.readUInt32BE(16)).toBe(1280);
  expect(bytes.readUInt32BE(20)).toBe(672);
});

test('zoom: fit, step in and out, actual size, scrollable when zoomed', async ({ page }) => {
  await openImage(page);
  const level = page.locator('#zoomLevel');
  const fit = parseInt(/** @type {string} */ (await level.textContent()));
  expect(fit).toBeGreaterThan(0);
  expect(fit).toBeLessThan(100);

  await page.locator('#zoomIn').click();
  // fit is shown rounded, zoom steps from the exact value, so allow 1%
  expect(Math.abs(parseInt(/** @type {string} */ (await level.textContent())) - fit * 1.25)).toBeLessThanOrEqual(1);
  await page.locator('#zoomOut').click();
  await expect(level).toHaveText(`${fit}%`);

  await level.click();
  await expect(level).toHaveText('100%');
  expect(await page.locator('#stage').evaluate(s => s.scrollWidth > s.clientWidth)).toBe(true);

  await page.locator('#zoomFit').click();
  await expect(level).toHaveText(`${fit}%`);
  expect(await page.locator('#stage').evaluate(s => s.scrollWidth > s.clientWidth)).toBe(false);

  for (let i = 0; i < 30; i++) await page.locator('#zoomIn').click();
  await expect(level).toHaveText('800%');
});

test('drag and drop opens a file', async ({ page }) => {
  const b64 = readFileSync(IMAGE).toString('base64');
  await page.evaluate(async b64 => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'dropped.png', { type: 'image/png' }));
    window.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, cancelable: true }));
  }, b64);
  await expect(page.locator('#status')).toHaveText('dropped.png : 1280×672');
});

test('video: plays through the effect and records to a file', async ({ page }) => {
  await page.locator('#file').setInputFiles(VIDEO);
  await expect(page.locator('#status')).toHaveText('clip.webm : 320×168');
  await expect(page.locator('#record')).toBeEnabled();

  // the rAF loop keeps re-rendering while the clip plays
  const a = await fingerprint(page);
  await expect.poll(() => fingerprint(page)).not.toBe(a);

  await page.locator('#record').click();
  await expect(page.locator('#record')).toHaveClass(/on/);
  await page.waitForTimeout(1200);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#record').click()]);
  expect(download.suggestedFilename()).toMatch(/^ascii\.(mp4|webm)$/);
  expect(readFileSync(/** @type {string} */ (await download.path())).length).toBeGreaterThan(10_000);
  await expect(page.locator('#record')).not.toHaveClass(/on/);
});

test('phone width: no horizontal page scroll, image first', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openImage(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const stageTop = (await page.locator('#stage').boundingBox())?.y ?? Infinity;
  const paneTop = (await page.locator('aside.left').boundingBox())?.y ?? 0;
  expect(stageTop).toBeLessThan(paneTop);
});
