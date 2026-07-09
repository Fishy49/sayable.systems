# sayable.systems

The landing site for **[Sayable](https://github.com/Fishy49/sayable-systems)** — a free,
open-source AAC (Augmentative and Alternative Communication) board for the web. Tap pictures,
it speaks and builds sentences. No accounts, no subscription, works offline. **Free, forever.**

> Looking for the app itself? It lives in a separate repo:
> **[Fishy49/sayable-systems](https://github.com/Fishy49/sayable-systems)**.

## What this is

A single, static, dependency-free marketing site:

- **No build step.** Plain HTML, CSS, and vanilla JS.
- **No third-party requests.** No fonts, CDNs, analytics, or trackers — matching Sayable's
  privacy-first ethos. The whole page loads from this repo and nothing else.
- **A live demo.** The homepage embeds a real, tappable communication board that speaks aloud
  using the browser's built-in `speechSynthesis` — so visitors experience the product instantly.
- **Accessible by default.** Semantic landmarks, keyboard support, visible focus, honoured
  `prefers-reduced-motion`, and light/dark themes.

## Files

```
index.html      # the page (all content + metadata)
styles.css      # design system + all sections (light/dark)
app.js          # theme toggle + the live speaking demo board
app/            # the REAL Sayable app — a committed production build (see below)
assets/
  favicon.svg          # brand mark
  apple-touch-icon.png # home-screen icon
  og.png               # social / Open Graph card (1200×630)
robots.txt
sitemap.xml
```

## The hosted app (`/app/`)

`app/` is a production build of [Fishy49/sayable-systems](https://github.com/Fishy49/sayable-systems),
committed here so GitHub Pages serves the full PWA at `https://sayable.systems/app/`. Visitors
open it, add it to a home screen, and it runs offline from then on.

To update it after changing the app:

```sh
cd ../sayable-systems
SAYABLE_BASE=/app/ npm run build     # base-path-aware build (manifest, SW scope, fallback)
rm -rf ../sayable.systems/app && mkdir ../sayable.systems/app
cp -r dist/* ../sayable.systems/app/
# then commit & push this repo
```

## Run it locally

It's just static files — open `index.html`, or serve the folder:

```sh
python3 -m http.server 8080
# then visit http://localhost:8080
```

(Speech uses your device's built-in voices via the Web Speech API. Chrome, Edge, and Safari
all support it.)

## Deploying (GitHub Pages)

This site is designed to be served from GitHub Pages:

1. Push to the default branch.
2. In **Settings → Pages**, set **Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. It goes live at `https://<user>.github.io/sayable.systems/`.

All asset paths are **relative**, so it works from that project sub-path *and* from a custom
domain root. To use the `sayable.systems` domain, add it under **Settings → Pages → Custom
domain** (which commits a `CNAME` file) once DNS points at GitHub Pages.

## License

Sayable and this site are open-source under the **GPL-3.0** license. See [`LICENSE`](./LICENSE).

Pictograms referenced by the app are by **ARASAAC** (Gobierno de Aragón, author Sergio Palao),
licensed CC BY-NC-SA. Sayable was *inspired by* the open-source
[]() project; no  code or assets were
copied.
