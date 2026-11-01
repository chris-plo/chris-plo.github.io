import { getCollection } from "astro:content";

const site = "https://chrisplo.dev";

export async function GET() {
  const entries = (await getCollection("journal")).filter(({ data }) => !data.draft);
  const topics = [...new Set(entries.flatMap(({ data }) => data.tags))];
  const staticUrls = ["/", "/journal", "/personal"].map(
    (path) => `  <url><loc>${new URL(path, site)}</loc></url>`
  );
  const journalUrls = entries.map(
    ({ id, data }) =>
      `  <url><loc>${new URL(`/journal/${id}`, site)}</loc><lastmod>${(data.updated ?? data.published).toISOString().slice(0, 10)}</lastmod></url>`
  );
  const topicUrls = topics.map(
    (topic) => `  <url><loc>${new URL(`/journal/topics/${topic}`, site)}</loc></url>`
  );
  const urls = [...staticUrls, ...journalUrls, ...topicUrls].join("\n");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
