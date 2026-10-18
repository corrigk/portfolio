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

When you change `site`/`base`, also update `site_url`/`display_url`/`repo` in `public/admin/config.yml`.

Name, tagline and links live in `src/data/site.json` (editable in the CMS under Site Settings).

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
specSheet:                # optional datasheet table on the project page
  - { label: Apogee, value: "4,200 ft" }
---
Markdown description here.
```

Images go in `public/uploads/` and are referenced as `/uploads/name.jpg` (the site adds the base path automatically). On every deploy, `scripts/optimize-images.mjs` shrinks photos wider than 1920px and recompresses them (originals in the repo are untouched).

Placeholder projects have `placeholder: true`. Delete those files when you have real ones (and the matching `public/uploads/<slug>*.svg`).

## Timeline

The **Timeline** page (`/timeline/`) mixes jobs, school, places lived, milestones and ideas, plus every project automatically (turn that off with `timelineIncludesProjects: false` in `site.config.mjs`). Each entry is a file in `src/content/timeline/`, editable in the CMS under *Timeline*:

```yaml
---
title: Software Engineering Intern, Acme
type: work            # work | education | home | milestone | idea
date: 2025-05-19      # start (leave out for ideas)
end: 2025-08-08       # or: ongoing: true
place: Chicago, IL
link: https://...     # optional
---
Optional short description.
```

Ideas appear in an "Ideas on the runway" section. The About page shows the five most recent entries.

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

## Look and feel

One theme: black and old gold (Purdue-inspired, not an official Purdue site) with Barlow Condensed headings and Inter body text. All colors, fonts and radii are CSS variables at the top of `src/styles/global.css`. Light and dark follow the visitor's system setting, and the ◐ button in the header cycles auto / light / dark (remembered in `localStorage`).

## Effects and extras

All optional polish lives in `src/scripts/fx.ts` and `src/styles/fx.css`; every animation is disabled for visitors with *reduce motion* turned on.

- **Motif:** `motif` in `site.config.mjs` picks the decorations: `aircraft` (an aircraft hangar on the home page: B-1B with sweeping wings, A-10, B-2, F-22 and SR-71 wireframes swap in with a hologram scan line over a radar grid; they drift and every few seconds bank, yaw, pull up on afterburner or roll, with engine glow and wingtip vapor; the HUD shows heading, bank, throttle, Mach and an attitude indicator; drag to spin with momentum and tilt, tap to switch; jet page transitions; code in `src/scripts/aircraft.ts`, where each aircraft is a short list of lines and new ones can be added to `MODELS`) or `space` (constellation, rockets).
- **Rocket/jet transition:** clicking an internal link sends a tiny rocket along the header's gold rule, then the page cross-fades (View Transitions).
- **Hero:** twinkling starfield plus the Cygnus constellation (it looks like an aircraft) drawing itself in and slowly rotating, with a satellite on an orbit (`src/components/HeroArt.astro`).
- **Telemetry strip** on the home page with live counts per category (`categoryOrder` in `site.config.mjs` sets the order).
- **Fuel gauge:** a gold reading-progress bar with a rocket tip on project pages.
- **HUD corner brackets** on card hover, scroll-reveal for cards, and a back-to-top rocket in the footer.
- **Spec sheet** table on project pages (`specSheet` field).
- **Résumé button** (upload a PDF in Site Settings), a copy-email button on Contact, an RSS feed at `/rss.xml`, an auto-generated share image at `/og.png`, and a "Lost in space" 404 page.

- **Hangar:** a hidden page at `/hangar/` (type the Konami code ↑↑↓↓←→←→BA anywhere, or find it in the command palette) with nine aircraft (B-1B, F-14, A-10, P-51, B-2, C-130, F-22, X-15, SR-71), spec cards, engine sound (off by default) and deep links like `/hangar/?aircraft=sr-71-blackbird`. Add aircraft in `src/scripts/aircraft.ts` (`MODELS`).
- **Command palette:** Ctrl/⌘+K or `/` searches every page and project and has quick actions (toggle dark mode, copy email).
- **Mission patches:** each project page gets a generated patch (title, category, year) and a blueprint dimension line over the cover.
- **Flyby:** every 35–60 s a jet formation (aircraft motif) or a shooting star (space motif) crosses the hero.
- **3D models:** add `model: /uploads/<slug>/model.glb` to a project (or use the CMS field) to show an interactive `<model-viewer>`.
- **Analytics (optional):** set `goatcounter` in `site.config.mjs` after creating a free GoatCounter account; no cookies, no banner needed.
- **Fonts** are self-hosted (Inter + Barlow Condensed via Fontsource), so there are no third-party requests on page load.

## Places map

The **Places** page (`/places/`) draws a world map (with Europe and Canada zoom views) and a US state map from `src/data/places.json`, editable in the CMS under *Site Settings → Places I've been*. Countries use their common English name (England, Scotland and Wales go under United Kingdom as regions), states are picked from a list, and each pinned city needs a latitude and longitude. A name the map doesn't recognise is still listed and prints a warning in the build log. The map is generated at build time with d3-geo and Natural Earth / US Census data and ships as plain SVG, so it adds no scripts beyond a few lines for the tabs.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml` and publishes to GitHub Pages. One-time: repo *Settings → Pages → Source: GitHub Actions*. CMS login needs a one-time extra setup: [SETUP-CMS.md](SETUP-CMS.md).

## Hand off / transfer ownership

1. Repo *Settings → General → Transfer ownership* to the new GitHub account.
2. Update `repo:` in `public/admin/config.yml`, `site`/`base` in `site.config.mjs`, and the `site_url`s.
3. Create a new GitHub OAuth App under the new owner and redeploy the worker with the new client ID/secret (SETUP-CMS.md steps 1-3) and update `base_url` if the worker URL changed.
4. Re-enable Pages (Source: GitHub Actions) if needed; the old `github.io` URL redirects for a while but update links.

## Known limitations

- The generated share image uses plain system fonts (Arial-style), not the site fonts.
- Fonts load from Google Fonts.
