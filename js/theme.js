/**
 * Theme. The initial value is set by the inline script in <head> so the page
 * never paints the wrong theme first — a theme flash is a visible bug, and it
 * cannot be fixed from a module that loads after parse.
 *
 * This module only handles the toggle and keeping an un-overridden page in
 * sync with the OS.
 */

const root = document.documentElement;
const STORE = 'theme';
const media = window.matchMedia('(prefers-color-scheme: light)');

const listeners = new Set();

export function currentTheme() {
  return root.dataset.theme === 'light' ? 'light' : 'dark';
}

function labelFor(theme) {
  return theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
}

function apply(theme, { persist = true } = {}) {
  root.dataset.theme = theme;

  if (persist) {
    try { localStorage.setItem(STORE, theme); } catch { /* private mode */ }
  }

  for (const btn of document.querySelectorAll('[data-theme-toggle]')) {
    btn.setAttribute('aria-label', labelFor(theme));
  }

  for (const fn of listeners) fn(theme);
}

export function toggleTheme() {
  const next = currentTheme() === 'light' ? 'dark' : 'light';
  apply(next);
  return next;
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initTheme() {
  apply(currentTheme(), { persist: false });

  for (const btn of document.querySelectorAll('[data-theme-toggle]')) {
    btn.addEventListener('click', () => toggleTheme());
  }

  // Follow the OS only while the visitor has not made an explicit choice.
  media.addEventListener('change', (event) => {
    let explicit = null;
    try { explicit = localStorage.getItem(STORE); } catch { /* ignore */ }
    if (!explicit) apply(event.matches ? 'light' : 'dark', { persist: false });
  });
}
