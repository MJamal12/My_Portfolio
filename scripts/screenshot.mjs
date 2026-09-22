/**
 * Capture a project screenshot for the portfolio.
 *
 *   node scripts/screenshot.mjs <url> <name> [settleMs]
 *   node scripts/screenshot.mjs https://illustrious-mousse-721221.netlify.app/ qasas-landing
 *
 * settleMs is how long to wait after load before capturing. Bump it for apps
 * that render slowly (Streamlit, anything on a cold free-tier host).
 *
 * Writes img/<name>.jpg, and img/<name>.webp when Pillow is available
 * (pip install Pillow). WebP runs roughly 40% smaller at the same quality.
 *
 * No npm dependencies — it drives your installed Chrome over the DevTools
 * Protocol using Node's built-in fetch and WebSocket.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { platform } from 'node:process';

const [url, name = 'screenshot', settleArg] = process.argv.slice(2);

if (!url) {
  console.error('Usage: node scripts/screenshot.mjs <url> [name]');
  process.exit(1);
}

/* Viewport. 1440x900 renders the desktop layout; the card displays it around
   530px wide, so this lands near 2.7x density — sharp on retina. */
const WIDTH = 1440;
const HEIGHT = 900;
const QUALITY = 82;
const PORT = 9351;
const SETTLE_MS = Number(settleArg) || 6000; // let a client-rendered SPA paint before capturing

const CHROME_CANDIDATES = {
  win32: [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
};

const chrome = (CHROME_CANDIDATES[platform] || []).find((p) => existsSync(p));
if (!chrome) {
  console.error(`No Chrome found for platform "${platform}". Edit CHROME_CANDIDATES.`);
  process.exit(1);
}

const profile = `${process.env.TEMP || '/tmp'}/portfolio-shot-profile`;
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', detached: false });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* Poll until the debugging endpoint answers, rather than sleeping blindly. */
async function targets() {
  for (let i = 0; i < 40; i++) {
    try { return await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); }
    catch { await wait(250); }
  }
  throw new Error('Chrome did not expose its debugging port');
}

const page = (await targets()).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let id = 1;
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const mid = id++;
  const on = (e) => {
    const m = JSON.parse(e.data);
    if (m.id === mid) {
      ws.removeEventListener('message', on);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    }
  };
  ws.addEventListener('message', on);
  ws.send(JSON.stringify({ id: mid, method, params }));
  setTimeout(() => reject(new Error(`${method} timed out`)), 60000);
});

await call('Page.enable');
await call('Runtime.enable');
await call('Emulation.setDeviceMetricsOverride', {
  width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false,
});

console.log(`Loading ${url} …`);
await call('Page.navigate', { url });
await wait(SETTLE_MS);
await call('Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }).catch(() => {});
await wait(1200);

const heading = await call('Runtime.evaluate', {
  expression: `document.querySelector('h1')?.textContent?.trim().slice(0,60) || '(no h1)'`,
  returnByValue: true,
}).then((r) => r.result.value);
console.log(`  h1: ${heading}`);

mkdirSync('img', { recursive: true });

const { data } = await call('Page.captureScreenshot', { format: 'jpeg', quality: QUALITY });
const jpg = Buffer.from(data, 'base64');
writeFileSync(`img/${name}.jpg`, jpg);
console.log(`  wrote img/${name}.jpg  (${Math.round(jpg.length / 1024)} KB)`);

ws.close();
proc.kill();

/* Optional WebP pass. Skipped silently when Pillow is not installed. */
const py = spawnSync('python', ['-c', `
from PIL import Image
Image.open('img/${name}.jpg').save('img/${name}.webp', 'WEBP', quality=86, method=6)
`], { encoding: 'utf8' });

if (py.status === 0) {
  const size = (await import('node:fs')).statSync(`img/${name}.webp`).size;
  console.log(`  wrote img/${name}.webp (${Math.round(size / 1024)} KB)`);
} else {
  console.log('  skipped webp — run "pip install Pillow" to enable it');
}

console.log('\nReference it with:');
console.log(`  <picture>
    <source srcset="img/${name}.webp" type="image/webp">
    <img class="browser__shot" src="img/${name}.jpg"
         width="${WIDTH}" height="${HEIGHT}" loading="lazy" decoding="async" alt="…">
  </picture>`);

process.exit(0);
