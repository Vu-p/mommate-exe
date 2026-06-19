import { chromium } from '@playwright/test';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const referenceRoot = path.resolve(root, '..', 'design-reference', 'stitch-13719569424321305608');
const baselineRoot = path.resolve(root, 'tests', 'visual-baselines');

const folders = (await readdir(referenceRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

await rm(baselineRoot, { recursive: true, force: true });
await mkdir(baselineRoot, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
  locale: 'vi-VN',
  timezoneId: 'Asia/Ho_Chi_Minh',
  reducedMotion: 'reduce',
});

for (const folder of folders) {
  const page = await context.newPage();
  let html = await readFile(path.join(referenceRoot, folder, 'screen.html'), 'utf8');
  html = html.replace(/```html/g, '').replace(/```/g, '');

  await page.setContent(html, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(baselineRoot, `${folder}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  await page.close();
  console.log(`Rendered ${folder}`);
}

await context.close();
await browser.close();
