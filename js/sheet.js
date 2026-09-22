/**
 * Project detail sheet.
 *
 * On touch it behaves like a real bottom sheet: the panel tracks the finger 1:1,
 * resists past its boundary rather than stopping dead, and on release the
 * landing point is projected from the flick velocity instead of snapping from
 * wherever the finger happened to lift. That projection is what makes a flick
 * feel like it throws the sheet.
 *
 * On pointer devices it is a centred dialog — a sheet you cannot comfortably
 * drag should not pretend to be draggable.
 */

import { Spring, project, rubberband, VelocityTracker, prefersReducedMotion } from './spring.js';
import { PROJECTS } from './projects.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

let root, panel, grip, titleEl, eyebrowEl, bodyEl;
let lastFocused = null;
let open = false;
let spring = null;
let closeTimer = null;

/* Drag state */
let dragging = false;
let startY = 0;
let offset = 0;
let pointerId = null;
const tracker = new VelocityTracker();

function panelHeight() {
  return panel.getBoundingClientRect().height || window.innerHeight * 0.8;
}

function paint(value) {
  offset = value;
  panel.style.transform = value ? `translateY(${value}px)` : '';
}

/* ---------- open / close ---------- */

export function openSheet(key) {
  const data = PROJECTS[key];
  if (!data || open) return;

  open = true;
  lastFocused = document.activeElement;

  // Cancel a pending close, or its cleanup would wipe the sheet we just filled.
  clearTimeout(closeTimer);
  closeTimer = null;

  eyebrowEl.textContent = data.eyebrow;
  titleEl.textContent = data.title;
  bodyEl.innerHTML = data.body;

  root.hidden = false;
  document.body.classList.add('is-locked');

  // Force a frame so the closed transform is committed before data-open flips.
  void panel.offsetHeight;
  root.dataset.open = '';

  const first = panel.querySelector('.sheet__close');
  first?.focus();

  history.replaceState(null, '', `#project-${key}`);
}

export function closeSheet() {
  if (!open) return;
  open = false;

  delete root.dataset.open;
  delete root.dataset.dragging;
  spring?.stop();

  const finish = () => {
    root.hidden = true;
    panel.style.transform = '';
    offset = 0;
    bodyEl.innerHTML = '';
    document.body.classList.remove('is-locked');
  };

  clearTimeout(closeTimer);
  if (prefersReducedMotion()) finish();
  else closeTimer = setTimeout(finish, 320);

  if (lastFocused instanceof HTMLElement && document.contains(lastFocused)) {
    lastFocused.focus();
  }
  lastFocused = null;

  if (location.hash.startsWith('#project-')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

export function isSheetOpen() { return open; }

/* ---------- drag ---------- */

function canDrag() {
  // Only where a sheet genuinely is a sheet, and never under reduced motion.
  return window.matchMedia('(max-width: 859px)').matches && !prefersReducedMotion();
}

function onPointerDown(event) {
  if (!open || !canDrag() || pointerId !== null) return;
  // Multi-touch protection: a second finger mid-drag makes the panel jump.
  if (dragging) return;

  pointerId = event.pointerId;
  dragging = true;
  startY = event.clientY - offset;

  tracker.reset();
  tracker.add(event.clientY);

  spring?.stop();
  root.dataset.dragging = '';
  // Capture so tracking survives the pointer leaving the grip.
  event.currentTarget.setPointerCapture(pointerId);
}

function onPointerMove(event) {
  if (!dragging || event.pointerId !== pointerId) return;

  tracker.add(event.clientY);
  const raw = event.clientY - startY;

  // Downward is free. Upward is past the boundary, so it resists progressively.
  paint(raw >= 0 ? raw : -rubberband(-raw, panelHeight()));
}

function onPointerUp(event) {
  if (!dragging || event.pointerId !== pointerId) return;

  dragging = false;
  delete root.dataset.dragging;
  try { event.currentTarget.releasePointerCapture(pointerId); } catch { /* already gone */ }
  pointerId = null;

  const velocity = tracker.velocity;                 // px/s
  const height = panelHeight();
  const projected = offset + project(velocity);      // where the flick lands

  // Decide on the projection, not on the release position.
  const dismiss = projected > height * 0.42 || velocity > 620;

  if (dismiss) {
    spring.configure({ damping: 1, response: 0.32 });
    spring.set(offset);
    spring.onRest = () => { spring.onRest = null; closeSheet(); };
    spring.impulse(velocity);
    spring.target = height;
  } else {
    // A flick that did not commit gets a little bounce — it carried momentum.
    spring.configure({ damping: 0.82, response: 0.34 });
    spring.set(offset);
    spring.impulse(velocity);
    spring.target = 0;
  }
}

/* ---------- focus trap ---------- */

function trapFocus(event) {
  if (event.key !== 'Tab') return;
  const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ---------- setup ---------- */

export function initSheet() {
  root = document.getElementById('sheet');
  if (!root) return;

  panel = root.querySelector('.sheet__panel');
  grip = root.querySelector('[data-sheet-grip]');
  titleEl = root.querySelector('#sheet-title');
  eyebrowEl = root.querySelector('[data-sheet-eyebrow]');
  bodyEl = root.querySelector('[data-sheet-body]');

  spring = new Spring({ damping: 1, response: 0.34, onUpdate: paint });

  for (const trigger of document.querySelectorAll('[data-open-project]')) {
    trigger.addEventListener('click', () => openSheet(trigger.dataset.openProject));
  }
  for (const closer of root.querySelectorAll('[data-sheet-close]')) {
    closer.addEventListener('click', closeSheet);
  }

  panel.addEventListener('keydown', trapFocus);

  grip.addEventListener('pointerdown', onPointerDown);
  grip.addEventListener('pointermove', onPointerMove);
  grip.addEventListener('pointerup', onPointerUp);
  grip.addEventListener('pointercancel', onPointerUp);

  // Deep link support: /#project-qasas opens the case directly.
  const fromHash = () => {
    if (!location.hash.startsWith('#project-')) return null;
    const key = location.hash.slice('#project-'.length);
    return PROJECTS[key] ? key : null;
  };

  const initial = fromHash();
  if (initial) requestAnimationFrame(() => openSheet(initial));

  // Changing only the fragment does not reload the page, so a link pasted
  // while already here has to be handled separately.
  window.addEventListener('hashchange', () => {
    const key = fromHash();
    if (key) { if (open) closeSheet(); openSheet(key); }
    else if (open) closeSheet();
  });
}
