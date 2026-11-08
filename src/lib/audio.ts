import { getCollection, type CollectionEntry } from "astro:content";

/** Narrator name shown in the article audio player. */
export const AUDIO_NARRATOR = "Chris";

/** Prefixes a site-absolute path with the configured Astro `base`. */
export function withBase(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;
}

export interface AudioEdition {
  slug: string;
  title: string;
  description: string;
  published: Date;
  /** Canonical article URL. */
  url: string;
  /** Absolute URL of the MP3, including the Astro `base`. */
  audioUrl: string;
}

export function toAudioEdition(entry: CollectionEntry<"journal">, site: URL | string): AudioEdition | undefined {
  const { audio, title, description, published } = entry.data;
  if (!audio) return undefined;
  return {
    slug: entry.id,
    title,
    description,
    published,
    url: new URL(withBase(`/journal/${entry.id}`), site).href,
    audioUrl: new URL(withBase(audio), site).href
  };
}

/** All published articles with an audio edition, newest first. Basis for a future listing page or podcast feed. */
export async function getAudioEditions(site: URL | string): Promise<AudioEdition[]> {
  const entries = await getCollection("journal", ({ data }) => !data.draft && Boolean(data.audio));
  return entries
    .map((entry) => toAudioEdition(entry, site)!)
    .sort((a, b) => b.published.getTime() - a.published.getTime());
}
