# Alex Hartan ◥ Cinematic Portfolio

Award-style cinematic one-pager for Alex Hartan — digital craftsman, brand strategist &
Webflow expert, founder of [Galvanite](https://www.galvanite.io).

Three Seedance 2.0 clips (generated on Magnific with Alex's photos as identity references)
are scrubbed as canvas frame sequences while you scroll, oryzo.ai-style: a pinned hero with
a ±15° camera arc that also sways with your mouse, a "three pillars" chapter, and an
"off the clock" chapter with holographic basketball + Carcassonne meeple orbiting Alex.

Built with **Astro 5** + **Tailwind CSS 4** + **GSAP ScrollTrigger** + **Lenis**.
Fjalla One display type, DM Sans body, ink/navy/volt-yellow palette, film grain.

## Quick start

```bash
npm install
npm run dev       # local dev server → http://localhost:4321/alexhartan/
npm run build     # static build → dist/
npm run preview   # preview the production build
```

## How the scroll film works

- `public/frames/{hero,pillars,work}/f-XXXX.webp` — frame sequences extracted from the
  three clips at 14 fps / 1600×900 (`.github/workflows/extract-frames.yml` regenerates
  them on a GitHub runner whenever `.frame-job.json` changes — clip URLs live there).
- `src/scripts/main.js` — loads frames as `ImageBitmap`s (coarse pass first so scrubbing
  works almost immediately), pins each chapter with ScrollTrigger, lerps the scroll frame,
  and adds a mouse-driven ±6% frame sway on the camera arc.
- Beats (pillar reveals, hobbies → work cards) are driven off the pinned section progress.

## Structure

```
src/
  layouts/Base.astro        # <head>, fonts, grain
  pages/index.astro         # section order + script entry
  styles/global.css         # theme tokens, letter/beat/grain/email animations
  scripts/main.js           # Lenis + ScrollTrigger + frame-sequence engine
  components/
    Preloader.astro         # logo + frame-loading progress
    Nav.astro               # fixed nav, logo, CTA
    Hero.astro              # pinned canvas + letter-by-letter ALEX HARTAN
    Stats.astro             # count-up stats strip
    Pillars.astro           # pinned canvas, three offers reveal one by one
    Work.astro              # pinned canvas, hobbies beat + Tobiko/Quotient cards
    Process.astro           # how I work
    Finale.astro            # blunt-brand CTA, giant email, footer
    Logo.astro              # Alex's exact AH logo SVG (untouched paths)
```
