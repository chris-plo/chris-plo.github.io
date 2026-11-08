import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const journal = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/journal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    readingTime: z.number().int().positive().default(4),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    audio: z.string().regex(/^\/audio\/[a-z0-9][a-z0-9-]*\.mp3$/, "audio must look like /audio/<article-slug>.mp3").optional()
  })
});

export const collections = { journal };
