# Alex Hartan ◥ Personal Portfolio

Bold, dark-theme one-pager for Alex Hartan — digital craftsman, brand strategist & Webflow
expert, founder of [Galvanite](https://www.galvanite.io).

Built with **Astro 5** + **Tailwind CSS 4**, zero client-side frameworks — all interactions
are a few hundred lines of vanilla JS.

## Quick start

```bash
npm install
npm run dev       # local dev server
npm run build     # static build → dist/
npm run preview   # preview the production build
```

## ⚠️ Swap in the real photos

The two portrait photos couldn't be pulled into this environment, so the build ships with
styled placeholder images. Overwrite them with the real photos (same filenames, same spot):

| File | Used in | Aspect ratio |
| --- | --- | --- |
| `public/images/portrait-hero.jpg` | Hero section | ~9:10 portrait (900×1015) |
| `public/images/portrait-about.jpg` | About section | ~1:0.94 (1000×935) |

Any similar crop works — images are `object-cover` and get a duotone-to-color hover
treatment automatically.

## Structure

```
src/
  layouts/Base.astro        # <head>, fonts, cursor, all global JS interactions
  pages/index.astro         # section order
  styles/global.css         # Tailwind theme tokens, keyframes, effects
  components/
    Nav.astro               # fixed nav + full-screen mobile menu
    Hero.astro              # staggered letter intro, portrait, rotating badge
    Marquee.astro           # infinite service ticker (reused in footer)
    About.astro             # word-reveal statement, bio, count-up stats
    Services.astro          # volt-sweep hover rows
    Process.astro           # 4-step "how I work" cards
    GalvaniteBand.astro     # yellow studio callout
    OffCourt.astro          # boardgames & basketball cards
    Contact.astro           # giant email link + socials
    Footer.astro            # live Craiova clock, back-to-top
    Logo.astro              # the AH monogram (inline SVG)
```

## Design system

- **Colors** — deep navy `#0a0f22` base, panel navys, ink white `#f2f4fd`, volt yellow
  `#ffd316` accent (from the AH logo), defined as Tailwind theme tokens in `global.css`.
- **Type** — Space Grotesk (display) + Inter (body), self-hosted via Fontsource.
- **Motif** — the ◥ triangle from the logo, used as bullets, accents and hover cues.
- **Interactions** — custom cursor, magnetic buttons, scroll-reveals, word/letter stagger,
  marquees, tilt cards, parallax glows, scroll progress bar. Everything respects
  `prefers-reduced-motion` and disables pointer effects on touch devices.

## Deploy

Static output — `npm run build` and host `dist/` anywhere (Netlify, Vercel, Cloudflare
Pages, GitHub Pages). Update `site` in `astro.config.mjs` if the final domain isn't
`alexhartan.com`.
