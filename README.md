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

## Personal photos

Add personal photos under `src/assets/personal/` as JPG, PNG, WebP or AVIF files. Each filename is used as the image's alternative text, so use a short descriptive name such as `cats-on-the-sofa.jpg`.

## GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on pushes to `main`. Pull requests and pushes to `redesign` do not deploy. Review and merge the redesign separately when it is ready to go live. The workflow expects GitHub Pages to already use **GitHub Actions** as its source; this change does not alter repository settings or DNS.

## Content review before launch

- Confirm professional wording and any chronology you want to publish.
- Add only project details, metrics and employer information approved for public use.
- Add a portrait, social profiles or contact links only if you want them included.
- Refresh the “Currently thinking about” section when its snapshot changes.
