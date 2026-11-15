import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { statSync } from "node:fs";

const imageMimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif"
};

export async function GET(context: APIContext) {
  const now = Date.now();
  const entries = (await getCollection("journal", ({ data }) => !data.draft && data.published.getTime() <= now))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());

  return rss({
    title: "Christoph Ploessl - Journal",
    description: "Notes and essays by Christoph Plössl on software engineering, technology, AI, science, culture and ideas.",
    site: context.site!,
    trailingSlash: true,
    items: entries.map(({ id, data }) => {
      const extension = data.cover?.split(".").pop()?.toLowerCase() ?? "";
      const enclosure = data.cover?.startsWith("/images/journal/") && imageMimeTypes[extension]
        ? {
            url: new URL(data.cover, context.site).href,
            length: statSync(new URL(`../../public${data.cover}`, import.meta.url)).size,
            type: imageMimeTypes[extension]
          }
        : undefined;

      return {
        title: data.title,
        description: data.description,
        pubDate: data.published,
        link: `/journal/${id}/`,
        categories: data.tags,
        enclosure
      };
    }),
    customData: "<language>en</language>"
  });
}
