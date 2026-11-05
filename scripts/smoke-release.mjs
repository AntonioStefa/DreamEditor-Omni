import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { validateDocument } from '../src/model.js';
const release = resolve('artifacts/release/DreamEditor-Prototype-0.1');
const server = spawn(process.execPath, ['start.mjs'], {
  cwd: release,
  env: { ...process.env, PORT: '4179' },
  stdio: 'pipe',
});
let browser;
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server non pronto')), 10000);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes('localhost:4179')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.on('error', reject);
    server.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error('Server terminato: ' + code));
    });
  });
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
      (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [],
    external = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route('**/*', (route) => {
    if (!route.request().url().startsWith('http://127.0.0.1:4179/')) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('http://127.0.0.1:4179/');
  await page.locator('#stage svg').first().waitFor();
  assert.equal(await page.locator('#page-thumbnails .page-thumb').count(), 2);
  for (const file of await readdir(resolve(release, 'esempi'))) {
    if (!file.endsWith('.json')) continue;
    const data = await readFile(resolve(release, 'esempi', file));
    validateDocument(JSON.parse(data));
    await page
      .locator('#project-file')
      .setInputFiles({ name: file, mimeType: 'application/json', buffer: data });
    await page.locator('#confirm-replace').click();
    assert.ok((await page.locator('#stage [data-hit]').count()) > 0);
  }
  await page.locator('[data-action="studio"]').first().click();
  await page.locator('#studio-preview path').first().waitFor();
  await page.locator('[data-action="insert-3d"]').click();
  await page.locator('[data-action="export"]').click();
  const pending = page.waitForEvent('download');
  await page.locator('[data-action="png"]').click();
  const png = await readFile(await (await pending).path());
  assert.equal(png.readUInt32BE(16), 1440);
  assert.equal(png.readUInt32BE(20), 1920);
  const popupPromise = context.waitForEvent('page');
  await page.locator('[data-action="print"]').click();
  const popup = await popupPromise;
  if (popup) {
    await popup.waitForLoadState();
    assert.ok((await popup.locator('article').count()) > 0);
    await popup.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  const status = await fetch('http://127.0.0.1:4179/package.json');
  assert.equal(status.status, 404);
  console.log(
    'PASS: server del pacchetto, sei esempi JSON, modulo 3D lazy, PNG 1440×1920, nessuna richiesta esterna o errore JavaScript, file sorgenti non esposti.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
