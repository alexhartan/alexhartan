import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, 1.6);

/* ------------------------------------------------------------------ */
/*  Frame sequence: fetch → ImageBitmap, cover-drawn onto a canvas.    */
/*  A shared rAF loop lerps toward (scroll frame + mouse offset) so    */
/*  the scrub stays butter even when scroll events arrive in bursts.  */
/* ------------------------------------------------------------------ */

class Sequence {
  constructor(name, count, canvas) {
    this.name = name;
    this.count = count;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.frames = new Array(count).fill(null);
    this.base = 0; // scroll-driven frame (float)
    this.smooth = 0; // lerped copy of base, used for drawing
    this.offset = 0; // mouse-driven frame offset (float)
    this.drawnAt = -1;
    this.resize();
  }

  url(i) {
    return `${BASE}/frames/${this.name}/f-${String(i + 1).padStart(4, '0')}.webp`;
  }

  async loadFrame(i) {
    if (this.frames[i]) return;
    try {
      const res = await fetch(this.url(i));
      if (!res.ok) throw new Error(res.status);
      const blob = await res.blob();
      this.frames[i] = await createImageBitmap(blob);
    } catch {
      this.frames[i] = undefined; // mark as failed, don't retry forever
    }
  }

  /* Coarse pass first (every 6th frame) so scrubbing works almost      */
  /* immediately, then the fill pass sharpens it.                       */
  async load(onProgress, concurrency = 10) {
    const order = [];
    for (let step of [6, 2, 1]) {
      for (let i = 0; i < this.count; i += step) {
        if (!order.includes(i)) order.push(i);
      }
    }
    let done = 0;
    const worker = async () => {
      while (order.length) {
        const i = order.shift();
        await this.loadFrame(i);
        done++;
        onProgress?.(done / this.count);
        if (done % 4 === 0 || done === this.count) this.dirty = true;
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  nearest(i) {
    if (this.frames[i]) return this.frames[i];
    for (let d = 1; d < this.count; d++) {
      if (this.frames[i - d]) return this.frames[i - d];
      if (this.frames[i + d]) return this.frames[i + d];
    }
    return null;
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.canvas.width = Math.round(w * DPR);
    this.canvas.height = Math.round(h * DPR);
    this.drawnAt = -1;
    this.dirty = true;
  }

  draw() {
    const target = Math.max(0, Math.min(this.count - 1, Math.round(this.smooth + this.offset)));
    if (target === this.drawnAt && !this.dirty) return;
    const img = this.nearest(target);
    const { width: cw, height: ch } = this.canvas;
    const ctx = this.ctx;
    if (!img) {
      const g = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
      g.addColorStop(0, '#162140');
      g.addColorStop(1, '#070b16');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
      return;
    }
    const scale = Math.max(cw / img.width, ch / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    this.drawnAt = target;
    this.dirty = false;
  }
}

/* ------------------------------------------------------------------ */
/*  Boot                                                                */
/* ------------------------------------------------------------------ */

const sequences = {};
let manifest = { hero: { count: 0 }, pillars: { count: 0 }, work: { count: 0 } };

async function boot() {
  try {
    const res = await fetch(`${BASE}/frames/manifest.json`, { cache: 'no-cache' });
    if (res.ok) manifest = await res.json();
  } catch {
    /* fall back to gradient canvases */
  }

  for (const name of ['hero', 'pillars', 'work']) {
    const canvas = document.getElementById(`seq-${name}`);
    if (canvas) sequences[name] = new Sequence(name, manifest[name]?.count || 0, canvas);
  }

  const pct = document.getElementById('preloader-pct');
  const bar = document.getElementById('preloader-bar');
  const setProgress = (p) => {
    const v = Math.round(p * 100);
    if (pct) pct.textContent = `${v}%`;
    if (bar) bar.style.transform = `scaleX(${p})`;
  };

  const hero = sequences.hero;
  if (hero && hero.count) {
    await hero.load(setProgress);
  } else {
    setProgress(1);
  }

  document.documentElement.classList.add('is-loaded');
  document.body.classList.add('is-loaded');

  // stream the remaining sequences in the background
  sequences.pillars?.load(null, 6);
  sequences.work?.load(null, 6);

  initScroll();
  initRenderLoop();
  initReveals();
  initCounters();
}

/* ------------------------------------------------------------------ */
/*  Smooth scroll + scroll triggers                                     */
/* ------------------------------------------------------------------ */

function initScroll() {
  if (!REDUCED) {
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  if (REDUCED) {
    // static experience: middle frame, all beats readable, no pinning
    document.documentElement.classList.add('no-anim');
    for (const seq of Object.values(sequences)) {
      seq.base = seq.smooth = (seq.count - 1) / 2;
      seq.dirty = true;
      seq.draw();
    }
    document.querySelectorAll('.beat').forEach((b) => b.classList.add('is-active'));
    return;
  }

  /* HERO — pinned, scrubbed sequence + kinetic type */
  const heroSeq = sequences.hero;
  const heroTitle = document.getElementById('hero-title');
  const heroSub = document.getElementById('hero-sub');
  const heroEyebrow = document.getElementById('hero-eyebrow');
  const heroCopy = document.getElementById('hero-copy');
  const heroAccent = document.getElementById('hero-accent');
  const heroCue = document.getElementById('hero-cue');

  ScrollTrigger.create({
    trigger: '#top',
    start: 'top top',
    end: '+=280%',
    pin: true,
    scrub: true,
    anticipatePin: 1,
    onUpdate(self) {
      const p = self.progress;
      if (heroSeq?.count) heroSeq.base = p * (heroSeq.count - 1);

      // the copy line is a [data-reveal] element; drop its 0.9s CSS transition
      // once scrubbing starts so the fade tracks the scroll instantly
      if (p > 0 && heroCopy && !heroCopy.dataset.scrub) {
        heroCopy.style.transition = 'none';
        heroCopy.dataset.scrub = '1';
      }

      // name tracks out and fades as the camera rolls
      const fade = gsap.utils.clamp(0, 1, p / 0.4);
      gsap.set(heroTitle, {
        letterSpacing: `${fade * 0.14}em`,
        yPercent: -fade * 16,
        opacity: 1 - fade,
      });
      gsap.set([heroSub, heroEyebrow, heroCopy], { opacity: 1 - fade * 1.4 });
      gsap.set(heroCue, { opacity: 1 - gsap.utils.clamp(0, 1, p / 0.12) });

      // "Strategic design, not decoration." owns the middle of the shot
      const a = gsap.utils.clamp(0, 1, (p - 0.45) / 0.12) * (1 - gsap.utils.clamp(0, 1, (p - 0.82) / 0.1));
      gsap.set(heroAccent, { opacity: a, scale: 0.96 + a * 0.04 });
    },
  });

  /* PILLARS — pinned, three offers reveal one at a time */
  initBeatSection('#pillars', 'pillars', 3, sequences.pillars);

  /* WORK — pinned, hobbies beat then work cards */
  initBeatSection('#work', 'work', 2, sequences.work);
}

function initBeatSection(selector, name, beatCount, seq) {
  const beats = Array.from({ length: beatCount }, (_, i) =>
    document.querySelector(`[data-beat="${name}-${i}"]`)
  );
  const ticks = document.querySelectorAll(`[data-tick^="${name}-"]`);
  let active = -1;

  ScrollTrigger.create({
    trigger: selector,
    start: 'top top',
    end: `+=${beatCount * 130}%`,
    pin: true,
    scrub: true,
    anticipatePin: 1,
    onUpdate(self) {
      const p = self.progress;
      if (seq?.count) seq.base = p * (seq.count - 1);
      const idx = Math.min(beatCount - 1, Math.floor(p * beatCount));
      if (idx !== active) {
        active = idx;
        beats.forEach((b, i) => b?.classList.toggle('is-active', i === idx));
        ticks.forEach((t, i) => {
          t.style.backgroundColor = i <= idx ? 'var(--color-volt)' : '';
        });
      }
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Render loop: lerp scroll frame + mouse-driven camera offset        */
/* ------------------------------------------------------------------ */

function initRenderLoop() {
  let mouseTarget = 0;
  let mouse = 0;

  if (!REDUCED && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener(
      'pointermove',
      (e) => {
        mouseTarget = (e.clientX / window.innerWidth) * 2 - 1;
      },
      { passive: true }
    );
  }

  gsap.ticker.add(() => {
    mouse += (mouseTarget - mouse) * 0.06;
    for (const seq of Object.values(sequences)) {
      if (!seq) continue;
      // scroll frame is lerped a touch for extra butter;
      // mouse sways the camera by up to ±6% of the arc
      seq.smooth += (seq.base - seq.smooth) * 0.22;
      seq.offset = mouse * seq.count * 0.06;
      seq.draw();
    }
  });

  window.addEventListener(
    'resize',
    () => {
      for (const seq of Object.values(sequences)) seq?.resize();
      ScrollTrigger.refresh();
    },
    { passive: true }
  );
}

/* ------------------------------------------------------------------ */
/*  Reveals + stat counters                                             */
/* ------------------------------------------------------------------ */

function initReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.18 }
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
}

function initCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter() {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = String(Math.round(obj.v))),
        });
      },
    });
  });
}

boot();
