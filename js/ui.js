/**
 * Page behaviour: reveals, header state, nav indicator, magnetic buttons,
 * filtering, copy-to-clipboard, counters, and the contact form.
 */

import { Spring, prefersReducedMotion } from './spring.js';

const NATIVE_SCROLL_TIMELINE = CSS.supports('animation-timeline: view()');

/* ---------- toast ---------- */

let toastEl;
let toastTimer;

export function toast(message) {
  toastEl ??= document.querySelector('[data-toast]');
  if (!toastEl) return;

  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.dataset.enter = '';

  requestAnimationFrame(() => requestAnimationFrame(() => delete toastEl.dataset.enter));

  toastTimer = setTimeout(() => {
    toastEl.dataset.enter = '';
    setTimeout(() => { toastEl.hidden = true; }, 320);
  }, 2400);
}

/* ---------- scroll reveals ---------- */

export function initReveals() {
  // Where the browser can run these on the compositor, CSS already owns them.
  if (NATIVE_SCROLL_TIMELINE || prefersReducedMotion()) return;

  const targets = document.querySelectorAll('.reveal');
  if (!targets.length || !('IntersectionObserver' in window)) {
    for (const el of targets) el.setAttribute('data-visible', '');
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    // Stagger by position within the batch, capped so the last item is not late.
    const visible = entries.filter((entry) => entry.isIntersecting);
    visible.forEach((entry, index) => {
      entry.target.style.transitionDelay = `${Math.min(index * 55, 220)}ms`;
      entry.target.setAttribute('data-visible', '');
      observer.unobserve(entry.target); // fire once — never re-animate on scroll back
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  for (const el of targets) observer.observe(el);
}

/* ---------- header material ---------- */

export function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  // A sentinel instead of a scroll listener: no per-frame work at all.
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  Object.assign(sentinel.style, { position: 'absolute', top: '0', height: '1px', width: '1px' });
  document.body.prepend(sentinel);

  new IntersectionObserver(([entry]) => {
    header.toggleAttribute('data-stuck', !entry.isIntersecting);
  }).observe(sentinel);
}

/* ---------- nav: active section + sliding indicator ---------- */

export function initNav() {
  const links = [...document.querySelectorAll('.nav__link')];
  const indicator = document.querySelector('.nav__indicator');
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!links.length || !sections.length) return;

  function moveTo(link) {
    if (!indicator || !link) return;
    const nav = link.closest('.nav');
    const navBox = nav.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    indicator.style.transform =
      `translateX(${box.left - navBox.left}px) scaleX(${box.width})`;
    indicator.setAttribute('data-on', '');
  }

  function setActive(id) {
    let active = null;
    for (const link of links) {
      const on = link.getAttribute('href') === `#${id}`;
      link.setAttribute('aria-current', String(on));
      if (on) active = link;
    }
    if (active) moveTo(active);
    else indicator?.removeAttribute('data-on');
  }

  const seen = new Map();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) seen.set(entry.target.id, entry.intersectionRatio);

    let best = null;
    let bestRatio = 0;
    for (const [id, ratio] of seen) {
      if (ratio > bestRatio) { bestRatio = ratio; best = id; }
    }
    if (best && bestRatio > 0.06) setActive(best);
    else { for (const l of links) l.setAttribute('aria-current', 'false'); indicator?.removeAttribute('data-on'); }
  }, { threshold: [0, 0.06, 0.25, 0.5, 0.75, 1], rootMargin: '-25% 0px -45% 0px' });

  for (const section of sections) observer.observe(section);

  // Keep the pill aligned when the layout reflows.
  window.addEventListener('resize', () => {
    const active = links.find((l) => l.getAttribute('aria-current') === 'true');
    if (active) moveTo(active);
  }, { passive: true });
}

/* ---------- mobile nav ---------- */

export function initMobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.getElementById('mobile-nav');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  };

  toggle.addEventListener('click', () => setOpen(menu.hidden));
  for (const link of menu.querySelectorAll('a')) {
    link.addEventListener('click', () => setOpen(false));
  }
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 900) setOpen(false); }, { passive: true });
}

/* ---------- magnetic buttons ---------- */

/**
 * The element leans toward the cursor and springs back on exit. Two independent
 * springs — a single spring over a 2D distance desyncs when X and Y have
 * different velocities.
 *
 * Gated to fine pointers: on touch this is dead weight, and :hover lies.
 */
export function initMagnetic() {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const STRENGTH = 0.28;

  for (const el of document.querySelectorAll('[data-magnetic]')) {
    let x = 0, y = 0;

    const write = () => { el.style.transform = `translate(${x}px, ${y}px)`; };
    const sx = new Spring({ damping: 1, response: 0.38, onUpdate: (v) => { x = v; write(); } });
    const sy = new Spring({ damping: 1, response: 0.38, onUpdate: (v) => { y = v; write(); } });

    el.classList.add('is-magnetised');

    el.addEventListener('pointermove', (event) => {
      const box = el.getBoundingClientRect();
      sx.target = (event.clientX - (box.left + box.width / 2)) * STRENGTH;
      sy.target = (event.clientY - (box.top + box.height / 2)) * STRENGTH;
    });

    el.addEventListener('pointerleave', () => {
      // Springs re-target without losing velocity, so an exit mid-flight is smooth.
      sx.target = 0;
      sy.target = 0;
    });

    el.addEventListener('pointerdown', () => { sx.target = 0; sy.target = 0; });
  }
}

/* ---------- project filter ---------- */

export function initFilters() {
  const chips = [...document.querySelectorAll('[data-filter]')];
  const items = [...document.querySelectorAll('[data-tags]')];
  const emptyNote = document.querySelector('[data-empty]');
  if (!chips.length) return;

  function apply(filter) {
    let shown = 0;

    for (const item of items) {
      const tags = (item.dataset.tags || '').split(/\s+/);
      const visible = filter === 'all' || tags.includes(filter) || tags.includes('all');
      item.hidden = !visible;
      if (visible) shown++;
    }

    if (emptyNote) emptyNote.hidden = shown > 0;
  }

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      for (const other of chips) {
        const on = other === chip;
        other.classList.toggle('is-active', on);
        other.setAttribute('aria-pressed', String(on));
      }

      const run = () => apply(chip.dataset.filter);

      // Let the browser cross-fade the layout change where it can.
      if (document.startViewTransition && !prefersReducedMotion()) {
        document.startViewTransition(run);
      } else {
        run();
      }
    });
  }
}

/* ---------- copy to clipboard ---------- */

export async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Clipboard API needs a secure context; fall back for http:// and old Safari.
    try {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.append(field);
      field.select();
      const ok = document.execCommand('copy');
      field.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function initCopy() {
  for (const button of document.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', async () => {
      const ok = await copyText(button.dataset.copy);
      if (!ok) { toast('Could not copy — select the address instead'); return; }

      button.classList.add('is-copied');
      toast('Email copied to clipboard');
      setTimeout(() => button.classList.remove('is-copied'), 1600);
    });
  }
}

/* ---------- counters ---------- */

export function initCounters() {
  const targets = document.querySelectorAll('[data-count-to]');
  if (!targets.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const format = (n) => n.toLocaleString('en-US');

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const el = entry.target;
      observer.unobserve(el);

      const end = Number(el.dataset.countTo);
      if (!Number.isFinite(end)) continue;

      const duration = 620;
      const start = performance.now();

      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out
        el.textContent = format(Math.round(end * eased));
        if (t < 1) requestAnimationFrame(step);
      };

      el.textContent = '0';
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });

  for (const el of targets) observer.observe(el);
}

/* ---------- contact form ---------- */

export function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('button[type="submit"]');
  const label = form.querySelector('[data-submit-label]');
  let attempted = false;

  const RULES = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'),
    message: (v) => (v.trim().length >= 10 ? '' : 'A little more detail, please — at least 10 characters.'),
  };

  function validateField(input) {
    const rule = RULES[input.name];
    if (!rule) return true;

    const message = rule(input.value);
    const field = input.closest('.field');
    const error = field.querySelector('[data-error]');

    if (message) {
      field.setAttribute('data-invalid', '');
      input.setAttribute('aria-invalid', 'true');
      error.textContent = message;
      error.hidden = false;
      return false;
    }

    field.removeAttribute('data-invalid');
    input.removeAttribute('aria-invalid');
    error.hidden = true;
    error.textContent = '';
    return true;
  }

  for (const input of form.querySelectorAll('input, textarea')) {
    // Only nag after the first submit — validating as someone types is hostile.
    input.addEventListener('blur', () => { if (attempted) validateField(input); });
    input.addEventListener('input', () => { if (attempted) validateField(input); });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    attempted = true;

    const inputs = [...form.querySelectorAll('input, textarea')];
    const valid = inputs.map(validateField).every(Boolean);

    if (!valid) {
      status.dataset.state = 'err';
      status.textContent = 'Please fix the highlighted fields.';
      inputs.find((i) => i.getAttribute('aria-invalid'))?.focus();
      return;
    }

    submit.disabled = true;
    label.textContent = 'Sending…';
    status.dataset.state = '';
    status.textContent = '';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error(`Formspree responded ${response.status}`);

      form.reset();
      attempted = false;
      status.dataset.state = 'ok';
      status.textContent = 'Thanks — your message is on its way. I usually reply within a day.';
    } catch {
      status.dataset.state = 'err';
      status.innerHTML = 'Something went wrong sending that. Email me directly at <a href="mailto:malikjamal812@yahoo.com">malikjamal812@yahoo.com</a>.';
    } finally {
      submit.disabled = false;
      label.textContent = 'Send message';
    }
  });
}

/* ---------- misc ---------- */

export function initBackToTop() {
  const button = document.querySelector('[data-to-top]');
  button?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    document.querySelector('.wordmark')?.focus?.();
  });
}
