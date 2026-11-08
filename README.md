# chrisplo.dev

An editorial personal site built with Astro and deployed as a static site on GitHub Pages. The custom domain is kept in `public/CNAME`.

## Local development

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Production build

```sh
pnpm build
pnpm preview
```

## Journal entries

Add a Markdown file under `src/content/journal/`, for example `systems-and-teams.md`:

```md
---
title: "A clear, specific title"
description: "A short summary for the journal index and search engines."
published: 2026-11-01
draft: true
readingTime: 5
---

Write the article in Markdown here.
```

Set `draft` to `false` when the article is ready to publish. Drafts are excluded from both the journal index and the static build.

## Audio edition

Narrate an article locally (Qwen3-TTS), export an MP3 named after the article's file name without `.md`, and save it as `public/audio/<article-slug>.mp3` (or upload it in Pages CMS through the Audio narration field, which sets the line below for you). Otherwise add one line to the article's frontmatter:

```yaml
audio: /audio/<article-slug>.mp3
```

The player appears automatically and reads the duration from the file. The narrator name lives in `AUDIO_NARRATOR` in `src/lib/audio.ts`, next to `getAudioEditions()`, which returns title, description, publication date, canonical URL and MP3 URL for every article with audio (the basis for a future listing page or podcast feed). Articles without `audio` are unchanged. The build fails if the field points to a file that does not exist. Keep WAV masters outside the repository.

## Personal photos

Add personal photos under `src/assets/personal/` as JPG, PNG, WebP or AVIF files. Each filename is used as the image's alternative text, so use a short descriptive name such as `cats-on-the-sofa.jpg`.

## GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on pushes to `main`. Pull requests and pushes to `redesign` do not deploy. Review and merge the redesign separately when it is ready to go live. The workflow expects GitHub Pages to already use **GitHub Actions** as its source; this change does not alter repository settings or DNS.

## Content review before launch

- Confirm professional wording and any chronology you want to publish.
- Add only project details, metrics and employer information approved for public use.
- Add a portrait, social profiles or contact links only if you want them included.
- Refresh the “Currently thinking about” section when its snapshot changes.
