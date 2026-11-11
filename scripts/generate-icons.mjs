// Renders public/favicon.svg to the PNG/ICO icons that Google and iOS prefer.
// Run manually after changing the SVG: node scripts/generate-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile(new URL("../public/favicon.svg", import.meta.url));
const render = (size) => sharp(svg, { density: (72 * size) / 64 }).resize(size, size).png().toBuffer();
const out = (name) => new URL(`../public/${name}`, import.meta.url);

await writeFile(out("icon-192.png"), await render(192));
await writeFile(out("apple-touch-icon.png"), await sharp(svg, { density: 203 }).resize(180, 180).flatten({ background: "#f4f3ed" }).png().toBuffer());

// ICO container with PNG payloads at 16, 32 and 48 px.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(render));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
await writeFile(out("favicon.ico"), Buffer.concat([header, ...images]));
