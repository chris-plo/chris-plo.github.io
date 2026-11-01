import { getCollection } from "astro:content";

const site = "https://chrisplo.dev";

export async function GET() {
  const entries = (await getCollection("journal")).filter(({ data }) => !data.draft);
  const paths = ["/", "/journal", "/personal", ...entries.map(({ id }) => `/journal/${id}`)];
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`).join("\n");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
