import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const referenceRoot = path.resolve(root, '..', 'design-reference', 'stitch-13719569424321305608');
const outputRoot = path.resolve(root, 'src', 'assets', 'stitch', 'generated');
const baselineRoot = path.resolve(root, 'tests', 'visual-baselines');

const screenFolders = (await readdir(referenceRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const references = new Map();

for (const folder of screenFolders) {
  const html = await readFile(path.join(referenceRoot, folder, 'screen.html'), 'utf8');
  const urls = html.match(/https:\/\/lh3\.googleusercontent\.com\/aida-public\/[A-Za-z0-9_-]+/g) || [];

  for (const url of urls) {
    const screens = references.get(url) || [];
    screens.push(folder);
    references.set(url, screens);
  }
}

await mkdir(outputRoot, { recursive: true });
await rm(baselineRoot, { recursive: true, force: true });
await mkdir(baselineRoot, { recursive: true });

const manifest = {};
let index = 0;

for (const [url, screens] of references) {
  index += 1;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to download ${url}: ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  const extension =
    bytes[0] === 0x89 && bytes[1] === 0x50 ? 'png' :
    bytes[0] === 0xff && bytes[1] === 0xd8 ? 'jpg' :
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' ? 'webp' :
    'bin';
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 12);
  const filename = `stitch-${String(index).padStart(2, '0')}-${hash}.${extension}`;

  await writeFile(path.join(outputRoot, filename), bytes);
  manifest[url] = {
    file: filename,
    screens: [...new Set(screens)],
  };
}

for (const folder of screenFolders) {
  const files = await readdir(path.join(referenceRoot, folder));
  const screenshot = files.find((file) => file.startsWith('screenshot.'));
  if (!screenshot) throw new Error(`Missing screenshot for ${folder}`);
  await sharp(path.join(referenceRoot, folder, screenshot))
    .png()
    .toFile(path.join(baselineRoot, `${folder}.png`));
}

await writeFile(
  path.join(outputRoot, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(`Downloaded ${Object.keys(manifest).length} assets and ${screenFolders.length} baselines`);
