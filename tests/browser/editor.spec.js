import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { makeTemplate } from '../../src/templates.js';
async function open(page) {
  await page.goto('/');
  await expect(page.locator('#stage svg').first()).toBeVisible();
}
async function downloadJSON(page) {
  const pending = page.waitForEvent('download');
  await page.locator('[data-action="save"]').first().click();
  return JSON.parse(await fs.readFile(await (await pending).path(), 'utf8'));
}
async function input(page, key, value) {
  await page.locator(`[data-prop="${key}"]`).fill(String(value));
  await page.locator(`[data-prop="${key}"]`).press('Tab');
}
test('loads editor without console errors and renders polished desktop view', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'warning' && m.text().includes('icon name')) errors.push(m.text());
  });
  await open(page);
  await expect(page.locator('#page-thumbnails .page-thumb')).toHaveCount(2);
  await expect(page.locator('#save-status')).toContainText('Salvato');
  await page.screenshot({ path: 'artifacts/editor-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('text editing, layout controls, undo/redo, drag, duplication and deletion', async ({
  page,
}) => {
  await open(page);
  const initial = await page.locator('#stage [data-hit]').count();
  await page.locator('[data-action="add-title"]').click();
  await input(page, 'text', 'Titolo verificato');
  await input(page, 'fontSize', 42);
  await expect(page.locator('#stage')).toContainText('Titolo verificato');
  await page.locator('[data-action="undo"]').click();
  await expect(page.locator('[data-prop="fontSize"]')).toHaveValue('64');
  await page.locator('[data-action="redo"]').click();
  await expect(page.locator('[data-prop="fontSize"]')).toHaveValue('42');
  const selected = page.locator('#stage [data-hit]').last(),
    box = await selected.boundingBox();
  await page.mouse.move(box.x + 15, box.y + 15);
  await page.mouse.down();
  await page.mouse.move(box.x + 55, box.y + 45, { steps: 5 });
  await page.mouse.up();
  expect(Number(await page.locator('[data-prop="x"]').inputValue())).toBeGreaterThan(70);
  await page.locator('[data-action="duplicate"]').click();
  await expect(page.locator('#stage [data-hit]')).toHaveCount(initial + 2);
  await page.locator('[data-action="delete"]').click();
  await expect(page.locator('#stage [data-hit]')).toHaveCount(initial + 1);
});
test('proportional layouts add valid frames and preserve earlier objects', async ({ page }) => {
  await open(page);
  const before = await page.locator('#stage [data-hit]').count();
  await page.locator('[data-action="layout"]').first().click();
  await page.locator('[data-layout="golden"]').click();
  await expect(page.locator('#stage [data-hit]')).toHaveCount(before + 3);
  await page.locator('[data-action="undo"]').click();
  await expect(page.locator('#stage [data-hit]')).toHaveCount(before);
});
test('all templates open and page duplication can be undone', async ({ page }) => {
  await open(page);
  for (const id of ['forma', 'romanzo', 'didattica', 'manifesto', 'botanica']) {
    await page.locator('[data-action="templates"]').click();
    await page.locator(`[data-template="${id}"]`).click();
    await page.locator('#confirm-replace').click();
    await expect(page.locator('#stage svg').first()).toBeVisible();
  }
  await page.locator('[data-action="duplicate-page"]').click();
  await expect(page.locator('#page-thumbnails .page-thumb')).toHaveCount(3);
  await page.locator('[data-action="undo"]').click();
  await expect(page.locator('#page-thumbnails .page-thumb')).toHaveCount(2);
});
test('project file roundtrip and persistence restore edited content', async ({ page }) => {
  await open(page);
  await page.locator('[data-action="add-text"]').click();
  await input(page, 'text', 'Questa storia rimane salvata.');
  const doc = await downloadJSON(page);
  expect(doc.pages[0].nodes.at(-1).text).toBe('Questa storia rimane salvata.');
  await expect(page.locator('#save-status')).toContainText('Salvato in locale');
  await page.reload();
  await expect(page.locator('#stage')).toContainText('Questa storia rimane salvata.');
  await page.locator('#project-file').setInputFiles({
    name: 'project.dream.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await page.locator('#confirm-replace').click();
  expect((await downloadJSON(page)).pages).toEqual(doc.pages);
});
test('rejects malformed imports while preserving the current project', async ({ page }) => {
  await open(page);
  await page.locator('#project-file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.locator('#toast')).toContainText('non supportato');
  await expect(page.locator('#document-name')).toHaveValue('Botanica');
});
test('image insertion, mask and resize survive JSON export', async ({ page }) => {
  await open(page);
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=',
    'base64',
  );
  await page
    .locator('#image-file')
    .setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('[data-prop="mask"]')).toBeVisible();
  await page.locator('[data-prop="mask"]').selectOption('organic');
  await input(page, 'w', 220);
  const doc = await downloadJSON(page);
  expect(doc.pages[0].nodes.at(-1)).toMatchObject({ type: 'image', mask: 'organic', w: 220 });
  expect(doc.pages[0].nodes.at(-1).source).toContain('data:image/png;base64,');
});
test('SVG and PNG export produce real files; print view includes all pages', async ({ page }) => {
  await open(page);
  await page.locator('[data-action="export"]').click();
  let pending = page.waitForEvent('download');
  await page.locator('[data-action="svg"]').click();
  const svg = await fs.readFile(await (await pending).path(), 'utf8');
  expect(svg).toContain('<svg');
  expect(svg).not.toContain('data-hit');
  pending = page.waitForEvent('download');
  await page.locator('[data-action="png"]').click();
  const png = await fs.readFile(await (await pending).path());
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.length).toBeGreaterThan(10000);
  const popupPromise = page.waitForEvent('popup');
  await page.locator('[data-action="print"]').click();
  const popup = await popupPromise;
  await expect(popup.locator('article')).toHaveCount(2);
  const pdf = await popup.pdf({ preferCSSPageSize: true, printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(10000);
  await popup.close();
});
test('3D model changes with rotation, imports OBJ, and inserts a vector element', async ({
  page,
}) => {
  await open(page);
  await page.locator('[data-action="studio"]').first().click();
  await expect(page.locator('#studio-preview path').first()).toBeVisible();
  const path = await page.locator('#studio-preview path').first().getAttribute('d');
  await page.locator('#studio-angle').fill('80');
  await expect(page.locator('#studio-preview path').first()).not.toHaveAttribute('d', path);
  await page.screenshot({ path: 'artifacts/studio-3d.png' });
  await page.locator('#obj-file').setInputFiles({
    name: 'triangle.obj',
    mimeType: 'text/plain',
    buffer: Buffer.from('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3'),
  });
  await expect(page.locator('#studio-preview path')).toHaveCount(3);
  await page.locator('[data-action="insert-3d"]').click();
  await expect(page.locator('.selection-heading h3')).toContainText('Disegno 3D');
  expect((await downloadJSON(page)).pages[0].nodes.at(-1).paths).toHaveLength(3);
});
test('chart data and curved title are editable', async ({ page }) => {
  await open(page);
  await page.locator('[data-action="add-chart"]').click();
  await input(page, 'values', '20, 50, 80');
  await expect(page.locator('#stage')).toContainText('80');
  await page.locator('[data-action="add-curve"]').click();
  await input(page, 'text', 'Parole che seguono le onde');
  await input(page, 'curve', 100);
  const doc = await downloadJSON(page);
  expect(doc.pages[0].nodes.at(-1)).toMatchObject({
    text: 'Parole che seguono le onde',
    curve: 100,
  });
});
test('template gallery and smaller screens remain usable', async ({ page }) => {
  await open(page);
  await page.locator('[data-action="templates"]').click();
  await expect(page.locator('.template-card')).toHaveCount(5);
  await page.screenshot({ path: 'artifacts/templates.png' });
  await page.locator('[data-action="close"]').click();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(page.locator('[data-action="export"]')).toBeVisible();
  await page.screenshot({ path: 'artifacts/editor-tablet.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
});

test('bundled template text fits its frames with actual browser fonts', async ({ page }) => {
  await open(page);
  const overflow = await page.evaluate(async () => {
    const { templates } = await import('/src/templates.js');
    const { overflow } = await import('/src/render.js');
    return templates.flatMap((t) =>
      t.pages.flatMap((p) =>
        p.nodes
          .filter(overflow)
          .map((n) => ({ template: t.id, page: p.name, text: n.text.slice(0, 50) })),
      ),
    );
  });
  expect(overflow).toEqual([]);
});

test('keyboard shortcuts, resizing and layer order operate on the selected element', async ({
  page,
}) => {
  await open(page);
  await page.locator('[data-shape="rect"]').click();
  const handle = await page.locator('#stage [data-resize]').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 70, handle.y + 55, { steps: 4 });
  await page.mouse.up();
  expect(Number(await page.locator('[data-prop="w"]').inputValue())).toBeGreaterThan(250);
  await page.locator('#stage').focus();
  const x = Number(await page.locator('[data-prop="x"]').inputValue());
  await page.keyboard.press('Shift+ArrowRight');
  expect(Number(await page.locator('[data-prop="x"]').inputValue())).toBe(x + 10);
  const before = await downloadJSON(page),
    id = before.pages[0].nodes.at(-1).id;
  await page.locator('[data-action="back"]').click();
  const after = await downloadJSON(page);
  expect(after.pages[0].nodes.at(-2).id).toBe(id);
  await page.locator('#stage').focus();
  await page.keyboard.press('Control+z');
  expect((await downloadJSON(page)).pages[0].nodes.at(-1).id).toBe(id);
});

test('phone palette is accessible and adds elements without horizontal page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.locator('[data-tab="elements"]').click();
  await expect(page.locator('.library-panel')).toBeVisible();
  await page.locator('[data-action="add-title"]').click();
  await expect(page.locator('[data-prop="text"]')).toBeVisible();
  await expect(page.locator('.library-panel')).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'artifacts/editor-phone.png' });
});
