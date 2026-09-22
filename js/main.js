/**
 * Entry point.
 *
 * Everything here is progressive enhancement — the page is complete, readable
 * and navigable with this file removed. Nothing below creates content.
 */

import { initTheme } from './theme.js';
import { initPalette, closePalette, isPaletteOpen } from './palette.js';
import { initSheet, openSheet, closeSheet, isSheetOpen } from './sheet.js';
import {
  initReveals, initHeader, initNav, initMobileNav, initMagnetic,
  initFilters, initCopy, initCounters, initForm, initBackToTop,
  copyText, toast,
} from './ui.js';

function boot() {
  initTheme();
  initHeader();
  initNav();
  initMobileNav();
  initReveals();
  initCounters();
  initMagnetic();
  initFilters();
  initCopy();
  initForm();
  initBackToTop();
  initSheet();

  initPalette({
    onOpenProject: openSheet,
    onCopyEmail: async () => {
      const ok = await copyText('malikjamal812@yahoo.com');
      toast(ok ? 'Email copied to clipboard' : 'Could not copy — malikjamal812@yahoo.com');
    },
  });

  // One Escape handler, innermost layer first.
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (isPaletteOpen()) closePalette();
    else if (isSheetOpen()) closeSheet();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
