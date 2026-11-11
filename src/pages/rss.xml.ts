import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET(context: APIContext) {
  const entries = (await getCollection("journal", ({ data }) => !data.draft))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());

  return rss({
    title: "Christoph Ploessl - Journal",
    description: "Notes and essays by Christoph Plössl on software engineering, technology, AI, science, culture and ideas.",
    site: context.site!,
    trailingSlash: true,
    items: entries.map(({ id, data }) => ({
      title: data.title,
      description: data.description,
      pubDate: data.published,
      link: `/journal/${id}/`,
      categories: data.tags
    })),
    customData: "<language>en</language>"
  });
}
