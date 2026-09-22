/**
 * Command palette (Cmd/Ctrl+K).
 *
 * Deliberately has NO entrance animation. This is a keyboard-initiated action
 * on the 100+/day tier — Raycast, Linear and VS Code all open instantly, and
 * anything else feels like latency. Animating it would be the single most
 * obvious mistake here.
 *
 * Handles: fuzzy matching with match highlighting, roving selection, focus
 * trapping, and focus restoration on close.
 */

import { toggleTheme } from './theme.js';

const IS_MAC = /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);

let root, panel, input, list, empty;
let commands = [];
let matches = [];
let selected = 0;
let lastFocused = null;
let open = false;

/* ---------- fuzzy matching ---------- */

/**
 * Strips diacritics so "resume" matches "résumé" — nobody types the accents.
 *
 * Folds per code unit rather than over the whole string, because NFD on the
 * whole string expands "é" into two characters and every match index would
 * then point at the wrong letter when highlighting.
 */
function fold(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    out += text[i].normalize('NFD')[0].toLowerCase();
  }
  return out;
}

/**
 * Subsequence match, scored. Returns null when the query is not a subsequence.
 * Consecutive characters and word-boundary hits score higher so "cp" ranks
 * "Copy email" above "Contact Page".
 */
function fuzzy(text, query) {
  if (!query) return { score: 0, hits: [] };

  const lowerText = fold(text);
  const lowerQuery = fold(query);
  const hits = [];
  let score = 0;
  let textIndex = 0;
  let previousHit = -2;

  for (const char of lowerQuery) {
    const found = lowerText.indexOf(char, textIndex);
    if (found === -1) return null;

    if (found === previousHit + 1) score += 8;             // consecutive
    if (found === 0 || /[\s\-/(]/.test(lowerText[found - 1])) score += 6; // word start
    score += Math.max(0, 4 - (found - textIndex));         // proximity

    hits.push(found);
    previousHit = found;
    textIndex = found + 1;
  }

  score -= text.length * 0.08; // prefer tighter labels
  return { score, hits };
}

function highlight(text, hits) {
  if (!hits.length) return escapeHtml(text);
  const set = new Set(hits);
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const char = escapeHtml(text[i]);
    out += set.has(i) ? `<mark>${char}</mark>` : char;
  }
  return out;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---------- rendering ---------- */

function render() {
  const query = input.value.trim();

  matches = commands
    .map((command) => {
      const result = fuzzy(command.label, query);
      if (result) return { command, score: result.score, hits: result.hits };

      // Fall back to the group and any aliases, so "cv" finds the résumé and
      // "dark" finds the theme toggle. Nothing to highlight — the hit is
      // off-label — so the row shows its group instead, to explain the match.
      const alt = fuzzy(`${command.group} ${command.label} ${command.keywords || ''}`, query);
      return alt ? { command, score: alt.score - 12, hits: [], viaGroup: true } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  if (!query) matches = commands.map((command) => ({ command, hits: [] }));

  selected = 0;
  list.innerHTML = '';
  empty.hidden = matches.length > 0;

  let lastGroup = null;

  matches.forEach((match, index) => {
    const { command, hits, viaGroup } = match;
    const hint = command.hint || (viaGroup ? command.group : '');

    if (!query && command.group !== lastGroup) {
      const heading = document.createElement('li');
      heading.className = 'palette__group';
      heading.setAttribute('role', 'presentation');
      heading.textContent = command.group;
      list.append(heading);
      lastGroup = command.group;
    }

    const item = document.createElement('li');
    item.className = 'palette__item';
    item.id = `palette-option-${index}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(index === selected));
    item.dataset.index = String(index);
    item.innerHTML = `
      <svg class="icon" aria-hidden="true"><use href="#${command.icon}"/></svg>
      <span>${highlight(command.label, hits)}</span>
      ${hint ? `<span class="palette__hint">${escapeHtml(hint)}</span>` : ''}
    `;

    item.addEventListener('click', () => run(index));
    // Pointer hover moves selection so mouse and keyboard agree.
    item.addEventListener('pointermove', () => select(index));

    list.append(item);
  });

  syncActiveDescendant();
}

function options() {
  return list.querySelectorAll('.palette__item');
}

function select(index) {
  const items = options();
  if (!items.length) return;
  selected = (index + items.length) % items.length;
  items.forEach((item, i) => item.setAttribute('aria-selected', String(i === selected)));
  items[selected]?.scrollIntoView({ block: 'nearest' });
  syncActiveDescendant();
}

function syncActiveDescendant() {
  const active = options()[selected];
  if (active) input.setAttribute('aria-activedescendant', active.id);
  else input.removeAttribute('aria-activedescendant');
}

function run(index) {
  const match = matches[index];
  if (!match) return;
  closePalette();
  // Let focus restoration finish before the action moves focus again.
  requestAnimationFrame(() => match.command.run());
}

/* ---------- open / close ---------- */

export function openPalette() {
  if (open) return;
  open = true;
  lastFocused = document.activeElement;

  root.hidden = false;
  document.body.classList.add('is-locked');
  input.value = '';
  render();
  input.focus();
}

export function closePalette() {
  if (!open) return;
  open = false;

  root.hidden = true;
  document.body.classList.remove('is-locked');

  // Return focus where the user left it — never drop it on <body>.
  if (lastFocused instanceof HTMLElement && document.contains(lastFocused)) {
    lastFocused.focus();
  }
  lastFocused = null;
}

export function isPaletteOpen() { return open; }

/* ---------- setup ---------- */

function buildCommands({ onCopyEmail, onOpenProject }) {
  const go = (hash) => () => {
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', hash);
  };
  const visit = (url) => () => window.open(url, '_blank', 'noopener');

  return [
    { group: 'Navigate', icon: 'i-arrow', label: 'Selected work', hint: 'Work', run: go('#work') },
    { group: 'Navigate', icon: 'i-arrow', label: 'Experience', hint: 'Experience', run: go('#experience') },
    { group: 'Navigate', icon: 'i-arrow', label: 'Toolkit', hint: 'Toolkit', run: go('#toolkit') },
    { group: 'Navigate', icon: 'i-arrow', label: 'Contact', hint: 'Contact', run: go('#contact') },

    { group: 'Case studies', icon: 'i-external', label: 'Qasas CPA Firm — read the case', run: () => onOpenProject('qasas') },
    { group: 'Case studies', icon: 'i-external', label: 'AI Recipe Recommender — read the case', run: () => onOpenProject('recipe') },

    { group: 'Live projects', icon: 'i-external', label: 'Qasas CPA Firm (live site)', run: visit('https://illustrious-mousse-721221.netlify.app/') },
    { group: 'Live projects', icon: 'i-external', label: 'AI Recipe Recommender (demo)', run: visit('https://ai-recipe-recommender-09ot.onrender.com') },
    { group: 'Live projects', icon: 'i-external', label: 'Finance Tracker (demo)', run: visit('https://finance-tracker-mjamal.onrender.com') },
    { group: 'Live projects', icon: 'i-external', label: 'Study Planner (demo)', run: visit('https://study-planner-mjamal.onrender.com') },

    { group: 'Connect', icon: 'i-copy', label: 'Copy email address', hint: 'malikjamal812@yahoo.com', keywords: 'mail clipboard', run: onCopyEmail },
    { group: 'Connect', icon: 'i-github', label: 'Open GitHub', keywords: 'code repos source', run: visit('https://github.com/MJamal12') },
    { group: 'Connect', icon: 'i-linkedin', label: 'Open LinkedIn', keywords: 'profile social', run: visit('https://linkedin.com/in/MJamal2') },
    { group: 'Connect', icon: 'i-mail', label: 'Send an email', keywords: 'contact mailto write', run: () => { window.location.href = 'mailto:malikjamal812@yahoo.com'; } },
    { group: 'Connect', icon: 'i-download', label: 'Download résumé (PDF)', keywords: 'cv resume curriculum vitae', run: () => {
      const link = document.createElement('a');
      link.href = 'MalikJamalResume.pdf';
      link.download = 'MalikJamalResume.pdf';
      link.click();
    } },

    { group: 'Display', icon: 'i-sun', label: 'Toggle light / dark theme', keywords: 'appearance mode colour color', run: () => toggleTheme() },
    { group: 'Display', icon: 'i-github', label: 'View this site’s source', keywords: 'code github repo how built', run: visit('https://github.com/MJamal12/My_Portfolio') },
  ];
}

export function initPalette(handlers) {
  root = document.getElementById('palette');
  if (!root) return;

  panel = root.querySelector('.palette__panel');
  input = root.querySelector('#palette-input');
  list = root.querySelector('#palette-list');
  empty = root.querySelector('[data-palette-empty]');

  commands = buildCommands(handlers);

  // Show the right modifier for the platform instead of assuming Windows.
  if (IS_MAC) {
    for (const key of document.querySelectorAll('[data-cmd-key]')) key.textContent = '⌘';
  }

  for (const trigger of document.querySelectorAll('[data-open-palette]')) {
    trigger.addEventListener('click', openPalette);
  }
  for (const closer of root.querySelectorAll('[data-palette-close]')) {
    closer.addEventListener('click', closePalette);
  }

  input.addEventListener('input', render);

  input.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); select(selected + 1); break;
      case 'ArrowUp':   event.preventDefault(); select(selected - 1); break;
      case 'Home':      event.preventDefault(); select(0); break;
      case 'End':       event.preventDefault(); select(options().length - 1); break;
      case 'Enter':     event.preventDefault(); run(selected); break;
      case 'Escape':    event.preventDefault(); closePalette(); break;
    }
  });

  // Trap focus: the palette is modal, so Tab must not escape behind the scrim.
  panel.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    input.focus();
  });

  window.addEventListener('keydown', (event) => {
    const combo = (IS_MAC ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (combo) {
      event.preventDefault();
      open ? closePalette() : openPalette();
      return;
    }
    // "/" is a familiar search shortcut, but never steal it from a text field.
    if (event.key === '/' && !open && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) {
      event.preventDefault();
      openPalette();
    }
  });
}
