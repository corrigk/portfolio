// Shrinks oversized photos in public/uploads so the site stays fast.
// Runs in CI before each build (see .github/workflows/deploy.yml), so originals in the repo are untouched.
// You can also run it locally:  node scripts/optimize-images.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DIR = 'public/uploads';
const MAX = 1920;
let changed = 0;

for (const name of await fs.readdir(DIR)) {
  const file = path.join(DIR, name);
  const ext = path.extname(name).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
  const input = await fs.readFile(file);
  const img = sharp(input, { failOn: 'none' }).rotate(); // apply phone EXIF orientation
  const { width = 0 } = await img.metadata();
  let pipe = width > MAX ? img.resize({ width: MAX, withoutEnlargement: true }) : img;
  pipe = ext === '.png' ? pipe.png({ compressionLevel: 9, palette: true, quality: 90 })
    : ext === '.webp' ? pipe.webp({ quality: 82 })
    : pipe.jpeg({ quality: 82, mozjpeg: true });
  const out = await pipe.toBuffer();
  if (out.length < input.length) {
    await fs.writeFile(file, out);
    changed++;
    console.log(`${name}: ${(input.length / 1024).toFixed(0)}KB -> ${(out.length / 1024).toFixed(0)}KB`);
  }
}
console.log(`optimize-images: ${changed} file(s) shrunk`);
