// ─────────────────────────────────────────────────────────────────────────────
// Experience orchestration: scroll reveals, the page-flip transition from the
// welcome card to the invitation, and the music control.
// ─────────────────────────────────────────────────────────────────────────────

import { createMusicController } from './music';

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

  // Start (or try to start) music the moment the user lands on the welcome
  // screen. On desktops the autoplay attempt usually succeeds outright. On
  // mobile — where browsers require a user gesture — we arm a one-shot
  // listener BEFORE the autoplay attempt resolves, so the very first tap on
  // the welcome cover (or anywhere else) will unlock playback. Arming eagerly
  // is the key: if we waited for the autoplay promise to resolve first, a
  // quick tap could land before the fallback was registered and we'd miss
  // the gesture window entirely.
  let unlocked = false;
  function armFirstInteractionFallback() {
    if (unlocked) return;
    const start = () => {
      if (unlocked) return;
      if (getPref() === 'off') return;
      unlocked = true;
      controller.play().then(() => {
        reflect(controller.isPlaying());
        if (controller.isPlaying()) setPref('on');
        else unlocked = false; // let a later gesture try again
      });
    };
    const opts = { capture: true, passive: true } as AddEventListenerOptions;
    window.addEventListener('pointerdown', start, opts);
    window.addEventListener('keydown', start, opts);
    window.addEventListener('touchstart', start, opts);
  }

  if (getPref() !== 'off') {
    // Arm the gesture fallback up-front so a tap during the first few
    // hundred ms can still start music.
    armFirstInteractionFallback();
    controller.play().then(() => {
      if (controller.isPlaying()) {
        unlocked = true;
        reflect(true);
        setPref('on');
      }
    });
  }

  return {
    // NOT async — must stay synchronous so audio.play() lands inside the
    // user-gesture call stack from the tap-to-open handler. Returning the
    // play promise lets the caller observe completion without breaking that.
    onEnter(): Promise<void> {
      // Already playing (from autoplay or earlier interaction) — nothing to do.
      if (controller.isPlaying()) return Promise.resolve();
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
  const openBtn = document.querySelector<HTMLElement>('[data-open-btn]');
  if (!welcome || !trigger || !invitation) return;

  // Play the diya lighting animation, then flip. Shorter when reduced-motion.
  const LIGHT_DELAY = prefersReduced ? 120 : 850;

  let entered = false;

  function enter() {
    if (entered) return;
    entered = true;

    // Fire music on this user gesture (must stay synchronous).
    onEnterInvitation();

    // Light the diya first — class triggers the halo / flame / sparks keyframes.
    openBtn?.classList.add('is-lighting');

    // After the ignition plays, uncover the invitation and flip the page.
    window.setTimeout(() => {
      invitation!.hidden = false;
      window.scrollTo(0, 0);
      revealWithin(invitation!);
      requestAnimationFrame(() => revealWithin(invitation!));

      requestAnimationFrame(() => welcome!.classList.add('is-flipping'));

      const remove = () => {
        welcome!.hidden = true;
      };
      welcome!.addEventListener('transitionend', remove, { once: true });
      // Safety fallback in case transitionend doesn't fire.
      window.setTimeout(remove, prefersReduced ? 700 : 1400);
    }, LIGHT_DELAY);
  }

  function back() {
    if (!entered) return;
    entered = false;
    window.scrollTo(0, 0);

    // Reset the diya so it can be re-lit on the next open.
    openBtn?.classList.remove('is-lighting');

    // Hide the invitation immediately. The welcome has no opaque background
    // of its own (the frame image lives in the shared .site-bg layer), so
    // if we leave the invitation visible under the welcome during the slide
    // transition its content peeks through and only "disappears" after the
    // welcome arrives — the glitch where the inner-page content snaps away
    // late. The site-bg (same frame image) stays behind during the slide,
    // so there's nothing visually jarring about dropping the invitation now.
    invitation!.hidden = true;

    // Reveal the welcome section. It still carries `is-flipping` from the
    // earlier enter(), so it starts off-screen (translateY(-100%), opacity 0).
    welcome!.hidden = false;

    // Reset the fade-up entrance animation on the cover so its content
    // doesn't get stuck at opacity 0 on return — some browsers freeze an
    // animation whose host was `display: none` and don't restart it.
    const cover = welcome!.querySelector<HTMLElement>('.cover');
    if (cover) {
      cover.style.animation = 'none';
      void cover.offsetWidth;
      cover.style.animation = '';
    }

    // Double-rAF: first frame commits the newly-visible off-screen state,
    // second frame removes `is-flipping` which cleanly triggers the slide-
    // down transition. Without the second rAF, Chromium/Safari sometimes
    // snap straight to the end state and skip the transition.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        welcome!.classList.remove('is-flipping');
      });
    });
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
