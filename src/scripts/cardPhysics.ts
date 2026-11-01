// ─────────────────────────────────────────────────────────────────────────────
// Spring-physics card motion.
//
// Each glass card leans in 3D toward the pointer and settles back with real
// spring dynamics (stiffness + damping + velocity), so it overshoots a touch
// and wobbles to rest rather than snapping — momentum, not easing curves.
// A wet specular highlight tracks the cursor. One shared rAF loop drives every
// active card; idle cards cost nothing. Disabled for touch/coarse pointers
// (keeps scrolling clean) and for reduced-motion users.
// ─────────────────────────────────────────────────────────────────────────────

interface Spring {
  pos: number;
  vel: number;
  target: number;
}

interface CardState {
  el: HTMLElement;
  rx: Spring; // rotateX (deg)
  ry: Spring; // rotateY (deg)
  lift: Spring; // translateY (px)
  scale: Spring; // scale (unitless)
  active: boolean; // pointer is interacting
  pressed: boolean;
}

const MAX_TILT = 9; // degrees
const HOVER_LIFT = -8; // px
const HOVER_SCALE = 1.025;
const PRESS_SCALE = 0.985;

// Spring constants — lively but quick to settle (slightly under-damped → a
// little momentum/overshoot on the way back).
const STIFFNESS = 140;
const DAMPING = 15;

function stepSpring(s: Spring, dt: number) {
  // Semi-implicit Euler integration of a damped harmonic oscillator.
  const force = -STIFFNESS * (s.pos - s.target) - DAMPING * s.vel;
  s.vel += force * dt;
  s.pos += s.vel * dt;
}

function atRest(s: Spring, eps = 0.01) {
  return Math.abs(s.vel) < eps && Math.abs(s.pos - s.target) < eps;
}

export function initCardPhysics() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reduced) return;

  const cards = Array.from(document.querySelectorAll<HTMLElement>('.glass-card'));
  if (!cards.length) return;

  const states = new Map<HTMLElement, CardState>();
  const animating = new Set<CardState>();
  let rafId = 0;
  let lastTime = 0;

  function ensureLoop() {
    if (rafId) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function loop(now: number) {
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    // Clamp dt (tab switches / slow frames) so the integrator stays stable.
    if (dt > 0.05) dt = 0.05;

    for (const st of animating) {
      stepSpring(st.rx, dt);
      stepSpring(st.ry, dt);
      stepSpring(st.lift, dt);
      stepSpring(st.scale, dt);

      st.el.style.transform =
        `perspective(900px) rotateX(${st.rx.pos.toFixed(3)}deg) ` +
        `rotateY(${st.ry.pos.toFixed(3)}deg) ` +
        `translateY(${st.lift.pos.toFixed(2)}px) ` +
        `scale(${st.scale.pos.toFixed(4)})`;

      const settled =
        !st.active &&
        atRest(st.rx) &&
        atRest(st.ry) &&
        atRest(st.lift) &&
        atRest(st.scale);

      if (settled) {
        // Hand the transform back to CSS and stop spending frames on it.
        st.el.style.transform = '';
        animating.delete(st);
      }
    }

    rafId = animating.size ? requestAnimationFrame(loop) : 0;
  }

  function wake(st: CardState) {
    animating.add(st);
    ensureLoop();
  }

  for (const el of cards) {
    const st: CardState = {
      el,
      rx: { pos: 0, vel: 0, target: 0 },
      ry: { pos: 0, vel: 0, target: 0 },
      lift: { pos: 0, vel: 0, target: 0 },
      scale: { pos: 1, vel: 0, target: 1 },
      active: false,
      pressed: false,
    };
    states.set(el, st);

    el.addEventListener('pointerenter', () => {
      st.active = true;
      st.lift.target = HOVER_LIFT;
      st.scale.target = HOVER_SCALE;
      wake(st);
    });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      // Normalised pointer position within the card: -0.5 … 0.5
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      st.ry.target = nx * MAX_TILT * 2;
      st.rx.target = -ny * MAX_TILT * 2;
      // Wet specular highlight follows the cursor.
      el.style.setProperty('--px', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--py', `${((e.clientY - r.top) / r.height) * 100}%`);
      el.style.setProperty('--glare', '1');
      wake(st);
    });

    const release = () => {
      st.active = false;
      st.pressed = false;
      st.rx.target = 0;
      st.ry.target = 0;
      st.lift.target = 0;
      st.scale.target = 1;
      el.style.setProperty('--glare', '0');
      wake(st);
    };
    el.addEventListener('pointerleave', release);
    el.addEventListener('pointercancel', release);

    el.addEventListener('pointerdown', () => {
      st.pressed = true;
      st.scale.target = PRESS_SCALE;
      // A small inward "push" gives the press weight.
      st.lift.target = -2;
      wake(st);
    });
    el.addEventListener('pointerup', () => {
      if (!st.active) return;
      st.pressed = false;
      st.scale.target = HOVER_SCALE;
      st.lift.target = HOVER_LIFT;
      // Nudge velocity for a little springy rebound.
      st.scale.vel += 0.6;
      wake(st);
    });
  }

  // Stop the loop if the tab is hidden; resume lazily on the next interaction.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  });
}
