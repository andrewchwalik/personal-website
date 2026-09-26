import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';

// Requires sharp (available in the workspace runtime through NODE_PATH).
const sharp = createRequire(import.meta.url)('sharp');
const root = new URL('../', import.meta.url);
const svg = await readFile(new URL('favicon.svg', root));
const pixels = await sharp(svg).resize(16, 16).png().toBuffer();
const sizes = [16, 32, 48];
const images = [];
for (const size of sizes) {
  const png = await sharp(pixels).resize(size, size, { kernel: 'nearest' }).png().toBuffer();
  await writeFile(new URL(`favicon-${size}.png`, root), png);
  images.push(png);
}
await sharp(pixels).resize(180, 180, { kernel: 'nearest' }).png().toFile(new URL('apple-touch-icon.png', root).pathname);

// ICO directory followed by one PNG payload per resolution.
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
images.forEach((png, i) => {
  const entry = 6 + i * 16;
  directory[entry] = directory[entry + 1] = sizes[i];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(png.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile(new URL('favicon.ico', root), Buffer.concat([directory, ...images]));
