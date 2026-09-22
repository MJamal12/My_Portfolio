# Malik Jamal — Portfolio

Personal portfolio site. **malikjamalportfolio.com**

Hand-built with vanilla HTML, CSS and JavaScript. No framework, no build step,
no dependencies, no third-party requests at runtime.

---

## Why no framework

The site's job is to demonstrate that I can build things well, so the build
itself is part of the argument. A hand-written site that ships ~11 KB of gzipped
JavaScript and makes zero external requests is a better demonstration than a
templated framework app that ships 200 KB to render the same text.

There is no build step. `index.html` is the source and the artifact.

---

## Running it

ES modules require a real origin, so open it over HTTP rather than `file://`:

```bash
python -m http.server 8777
# then http://127.0.0.1:8777
```

---

## Refreshing a project screenshot

Project shots live in `img/` and are captured straight from the live site, so
they never go stale by hand:

```bash
node scripts/screenshot.mjs https://your-project-url.com qasas-landing
```

It drives your installed Chrome over the DevTools Protocol — no npm
dependencies — and writes `img/<name>.jpg` plus `img/<name>.webp` when Pillow
is installed (`pip install Pillow`). It prints the `<picture>` markup to paste.

---

## Structure

```
index.html        markup, inline icon sprite, structured data
styles.css        design tokens + all styling
og.svg            social share card
favicon.svg
img/              project screenshots (webp + jpg fallback)
scripts/
  screenshot.mjs  regenerates a project screenshot from a live URL
js/
  main.js         entry point, wires modules together
  spring.js       spring physics, momentum projection, velocity tracking
  palette.js      command palette (Cmd/Ctrl+K)
  sheet.js        project detail sheet + drag-to-dismiss
  projects.js     case study content
  theme.js        theme switching and persistence
  ui.js           reveals, nav, magnetic buttons, filters, form
```

---

## Notable implementation details

**Command palette** — `Cmd/Ctrl+K` or `/`. Fuzzy matching folds diacritics per
code unit so "resume" matches "résumé" while match indices still line up for
highlighting. It has no entrance animation on purpose: it is a keyboard action
on the hundreds-of-times-a-day tier, and anything other than instant reads as lag.

**Spring physics** (`js/spring.js`) — parameterised as damping ratio + response
rather than mass/stiffness/damping. Re-targeting a spring never resets its
velocity, so motion can be interrupted and reversed without a visible seam. One
shared `requestAnimationFrame` loop drives every spring on the page.

**Drag-to-dismiss** — the sheet tracks the finger 1:1, applies rubber-band
resistance past its boundary, and on release projects where the flick would come
to rest (exponential decay, not the textbook `v²/2a`) to decide dismiss vs. settle.

**Scroll reveals** — CSS `animation-timeline: view()` where supported, which runs
on the compositor at zero JS cost. `animation-timeline` is not Baseline, so an
IntersectionObserver fallback handles the rest. Content is visible by default;
JavaScript arms the animation rather than creating the content.

**Theme** — resolved by an inline script before first paint, so there is no flash.
Follows the OS until the visitor makes an explicit choice, then persists it.

---

## Verified

- 27/27 behavioural checks (palette, theme, filters, sheet, form) via Chrome DevTools Protocol
- Console completely silent — no errors, warnings or logs
- Contrast 14/14 at 4.5:1 in **both** themes
- No horizontal overflow at 320 / 360 / 390 / 768px
- All touch targets ≥ 44px under `pointer: coarse`
- Readable with JavaScript disabled
- `prefers-reduced-motion`, `prefers-reduced-transparency` and `prefers-contrast` all honoured

---

## Links

- **GitHub** — [github.com/MJamal12](https://github.com/MJamal12)
- **LinkedIn** — [linkedin.com/in/MJamal2](https://linkedin.com/in/MJamal2)
- **Email** — malikjamal812@yahoo.com

© 2026 Malik Jamal
