import { readdir, mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";

const root = fileURLToPath(new URL("../", import.meta.url));
const assetDirectories = ["src/assets/personal", "src/assets/professional"];
const outputPath = join(root, "src/data/thumbhashes.ts");

const files = (
  await Promise.all(
    assetDirectories.map(async (directory) => {
      const absoluteDirectory = join(root, directory);
      const entries = await readdir(absoluteDirectory);
      return entries
        .filter((entry) => /\.(avif|jpe?g|png|webp)$/i.test(entry))
        .map((entry) => join(absoluteDirectory, entry));
    })
  )
).flat();

const hashes = {};

for (const file of files.sort()) {
  const { data, info } = await sharp(file)
    .rotate()
    .resize({ width: 100, height: 100, fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const thumbhash = rgbaToThumbHash(info.width, info.height, data);
  hashes[relative(join(root, "src/assets"), file).replaceAll("\\", "/")] =
    Buffer.from(thumbhash).toString("base64");
}

await mkdir(join(root, "src/data"), { recursive: true });
await writeFile(
  outputPath,
  `export const thumbhashes: Record<string, string> = ${JSON.stringify(hashes, null, 2)};\n`
);
