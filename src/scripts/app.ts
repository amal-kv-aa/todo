// ─────────────────────────────────────────────────────────────────────────────
// Experience orchestration: scroll reveals, the page-flip transition from the
// welcome card to the invitation, and the music control.
// ─────────────────────────────────────────────────────────────────────────────

import { createMusicController } from './music';
import { initCardPhysics } from './cardPhysics';
import { initLampGyro } from './lampGyro';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Runtime config (music) embedded by the page ──────────────────────────────
interface Runtime {
  musicSrc: string;
  musicVolume: number;
}
function readRuntime(): Runtime {
  const el = document.querySelector('[data-wedding-runtime]');
  try {
    return JSON.parse(el?.textContent || '{}');
  } catch {
    return { musicSrc: '', musicVolume: 0.35 };
  }
}

// ── 1. Reveal-on-scroll ───────────────────────────────────────────────────────
function initReveals() {
  const items = document.querySelectorAll<HTMLElement>('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          // Light stagger for a graceful cascade.
          window.setTimeout(() => el.classList.add('is-visible'), Math.min(i * 60, 240));
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  items.forEach((el) => io.observe(el));
  return io;
}

// Reveal any `.reveal` elements currently in view within a container.
function revealWithin(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) el.classList.add('is-visible');
  });
}

// ── 2. Music ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'wedding-music-pref';
function getPref(): 'on' | 'off' | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'on' || v === 'off' ? v : null;
  } catch {
    return null;
  }
}
function setPref(v: 'on' | 'off') {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* storage may be blocked; preference simply won't persist */
  }
}

function initMusic(runtime: Runtime) {
  const toggle = document.querySelector<HTMLButtonElement>('[data-music-toggle]');
  if (!toggle) return { onEnter: () => {} };

  const controller = createMusicController(runtime.musicSrc, runtime.musicVolume);

  function reflect(playing: boolean) {
    toggle!.setAttribute('aria-pressed', String(playing));
    toggle!.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  }

  toggle.addEventListener('click', () => {
    if (controller.isPlaying()) {
      controller.pause();
      setPref('off');
      reflect(false);
    } else {
      // Call synchronously inside the click handler — stays in gesture window.
      controller.play().then(() => {
        setPref('on');
        reflect(controller.isPlaying());
      });
    }
  });

  return {
    // NOT async — must stay synchronous so audio.play() lands inside the
    // user-gesture call stack from the tap-to-open handler. Returning the
    // play promise lets the caller observe completion without breaking that.
    onEnter(): Promise<void> {
      toggle.hidden = false;
      // Respect a previously chosen "off" preference.
      if (getPref() === 'off') {
        reflect(false);
        return Promise.resolve();
      }
      // Fire play() synchronously — this is the critical line for mobile
      // autoplay policies. Any await before here would break gesture attribution.
      return controller.play().then(() => {
        reflect(controller.isPlaying());
        if (controller.isPlaying()) setPref('on');
      });
    },
  };
}

// ── 3. Page-flip transition from the welcome card to the invitation ────────────
function initPageFlip(onEnterInvitation: () => void) {
  const welcome = document.getElementById('welcome');
  const trigger = document.querySelector<HTMLElement>('[data-enter]');
  const invitation = document.getElementById('invitation');
  const backBtn = document.querySelector<HTMLButtonElement>('[data-back-btn]');
  if (!welcome || !trigger || !invitation) return;

  let entered = false;

  function enter() {
    if (entered) return;
    entered = true;

    // Reveal the invitation behind the welcome page first, so the flip uncovers
    // real content rather than a blank screen.
    invitation!.hidden = false;
    window.scrollTo(0, 0);
    revealWithin(invitation!);
    requestAnimationFrame(() => revealWithin(invitation!));

    // Start music on this user gesture.
    onEnterInvitation();

    // Turn the welcome page away like flipping a page.
    requestAnimationFrame(() => welcome!.classList.add('is-flipping'));

    const remove = () => {
      welcome!.hidden = true;
    };
    welcome!.addEventListener('transitionend', remove, { once: true });
    // Safety fallback in case transitionend doesn't fire.
    window.setTimeout(remove, prefersReduced ? 700 : 1400);
  }

  function back() {
    if (!entered) return;
    entered = false;
    window.scrollTo(0, 0);
    welcome!.hidden = false;

    // Replay the arch / lamp / bouquet entrance animations. Toggling
    // `is-replay` sets animation: none, then removing it on the next frame
    // lets the browser restart the CSS keyframes from zero.
    welcome!.classList.add('is-replay');
    // Force a reflow so the browser flushes the animation-none state.
    void (welcome as HTMLElement).offsetWidth;

    requestAnimationFrame(() => {
      welcome!.classList.remove('is-flipping');
      welcome!.classList.remove('is-replay');
    });

    const hide = () => {
      invitation!.hidden = true;
    };
    welcome!.addEventListener('transitionend', hide, { once: true });
    window.setTimeout(hide, prefersReduced ? 700 : 1400);
  }

  trigger.addEventListener('click', enter);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      enter();
    }
  });
  backBtn?.addEventListener('click', back);
}

// ── Boot ────────────────────────────────────────────────────────────────────
function boot() {
  const runtime = readRuntime();
  initReveals();
  const music = initMusic(runtime);
  initPageFlip(() => music.onEnter());
  initCardPhysics();
  initLampGyro();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
