import type { ImageMetadata } from "astro";

// Journal covers stay in public/images/journal so frontmatter paths keep working; importing them lets Astro optimize them.
const images = import.meta.glob<ImageMetadata>("/public/images/journal/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default"
});

export function getJournalImage(publicPath: string): ImageMetadata {
  const image = images[`/public${publicPath}`];
  if (!image) throw new Error(`Journal image ${publicPath} not found in public/images/journal`);
  return image;
}
