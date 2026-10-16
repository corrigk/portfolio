# Kevin Corrigan: Portfolio

A static portfolio site built with [Astro](https://astro.build), content stored as files, editable through a browser form (Decap CMS at `/admin`), deployed to GitHub Pages.

**Live:** https://corrigk.github.io/portfolio/

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321/portfolio/
npm run build      # production build into dist/
npm run preview    # serve the production build
```

The site is served under the `base` path (`/portfolio`), so open the URL above, not the bare `localhost:4321`.

To try the CMS locally with no GitHub login, run in a second terminal:

```bash
npx decap-server
```

then open http://localhost:4321/portfolio/admin/ (`local_backend: true` is set in `public/admin/config.yml`). Edits write straight to your local files.

## Settings in one place

`site.config.mjs`:

| Setting | Meaning |
|---|---|
| `site` | Origin of the deployed site (`https://corrigk.github.io`; later your custom domain). Env: `SITE_URL`. |
| `base` | Sub-path. `/portfolio` for a project page, `''` for a user page (`corrigk.github.io` repo) or custom domain. Env: `SITE_BASE`. |
| `lockTheme` | `null` shows the theme switcher; `'blueprint' \| 'editorial' \| 'playful'` hides it and locks that theme. Env: `LOCK_THEME`. |

When you change `site`/`base`, also update `site_url`/`display_url`/`repo` in `public/admin/config.yml`.

Name, tagline, links and **default theme** live in `src/data/site.json` (editable in the CMS under Site Settings).

## Add or edit a project

**With the CMS:** open `/admin`, choose *Projects → New Project*, fill in the form, upload images, press *Publish*. See [FRIEND-GUIDE.md](FRIEND-GUIDE.md).

**With files:** add `src/content/projects/<slug>.md` (the file name becomes the URL). Frontmatter:

```yaml
---
title: My Project
summary: One line shown on cards.
category: hardware        # hardware | software | fun
tags: [3d-printing, esp32]
featured: false           # true = may appear in home page highlights (first 3)
date: 2026-03-01
status: complete          # complete | in-progress | paused
cover: /uploads/my-project.jpg
coverAlt: Describe the image
gallery:
  - { image: /uploads/a.jpg, alt: "What it shows", caption: "Optional" }
links: { demo: https://..., repo: https://github.com/..., video: https://youtu.be/..., other: https://... }
specs: [PLA, ESP32]       # tools / materials / tech
---
Markdown description here.
```

Images go in `public/uploads/` and are referenced as `/uploads/name.jpg` (the site adds the base path automatically). Resize photos to ~1600px wide before uploading; Pages serves them as-is.

Placeholder projects have `placeholder: true`. Delete those files when you have real ones (and the matching `public/uploads/<slug>*.svg`).

## Live demos

Add a `demo:` block to a project's frontmatter. It renders in a sandboxed iframe with a loading state and an "Open in new tab" fallback.

```yaml
demo:
  url: https://example.com/my-demo    # external; the site must allow embedding
  height: 520
```
or, for a built mini-app you host yourself:
```yaml
demo:
  folder: my-demo                     # serves public/demos/my-demo/index.html
```
Put the app's built static files in `public/demos/my-demo/` (build it with a relative base, e.g. Vite `base: './'`). A working example is `public/demos/sample-counter/`. The sandbox allows scripts, forms, popups and pointer lock, but not same-origin access, so demos can't touch the rest of the site (and `localStorage` inside the demo won't work).

## Themes

Three themes (Blueprint, Editorial, Playful) are defined as CSS variables at the top of `src/styles/global.css`, each with light and dark variants following the visitor's system setting (a ◐ button cycles auto/light/dark). The visitor's choice is remembered in `localStorage`.

To pick one and hide the switcher: set `lockTheme` in `site.config.mjs` (or build with `LOCK_THEME=editorial`), and set `defaultTheme` in `site.json` to match.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml` and publishes to GitHub Pages. One-time: repo *Settings → Pages → Source: GitHub Actions*. CMS login needs a one-time extra setup: [SETUP-CMS.md](SETUP-CMS.md).

## Hand off / transfer ownership

1. Repo *Settings → General → Transfer ownership* to the new GitHub account.
2. Update `repo:` in `public/admin/config.yml`, `site`/`base` in `site.config.mjs`, and the `site_url`s.
3. Create a new GitHub OAuth App under the new owner and redeploy the worker with the new client ID/secret (SETUP-CMS.md steps 1-3) and update `base_url` if the worker URL changed.
4. Re-enable Pages (Source: GitHub Actions) if needed; the old `github.io` URL redirects for a while but update links.

## Known limitations

- Uploaded images are served as-is (not auto-resized); keep them modest in size.
- Social-share image: the placeholder is an SVG, which many platforms ignore. Upload a 1200×630 JPG/PNG in Site Settings.
- Fonts load from Google Fonts.
