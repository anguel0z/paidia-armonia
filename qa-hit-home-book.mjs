import { chromium, devices } from 'playwright';
import fs from 'fs';

const pins = JSON.parse(fs.readFileSync('docs/marketing/.local-auth/pins.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...devices['iPhone 15 Pro'],
  viewport: { width: 390, height: 844 },
  serviceWorkers: 'block',
});
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
});
await context.request.post('http://127.0.0.1:5173/api/auth/login', {
  data: { profileId: 'e4', mode: 'staff', pin: pins.e4, remember: false },
});
await page.goto('http://127.0.0.1:5173/m/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'));
await page.waitForTimeout(500);

const home = await page.evaluate(() => {
  const dockTop = document.querySelector('nav.dock').getBoundingClientRect().top;
  const kids = [...document.querySelector('#view').children].map((el) => ({
    cls: (el.className || el.tagName || '').toString().slice(0, 48),
    top: Math.round(el.getBoundingClientRect().top),
    bottom: Math.round(el.getBoundingClientRect().bottom),
  }));
  const tiles = [...document.querySelectorAll('.home-bento-tile')].map((el) => {
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return {
      text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 24),
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      clear: r.bottom < dockTop - 4,
      hitDock: !!(t && t.closest('nav.dock')),
    };
  });
  return { dockTop: Math.round(dockTop), kids, tiles };
});
console.log('HOME', JSON.stringify(home, null, 2));

await page.evaluate(() => {
  state.tab = 'book';
  render();
  scrollTo(0, 0);
});
await page.waitForFunction(() => {
  const el = document.querySelector('#shiftNoteSave');
  const actions = document.querySelector('.journal-write-actions');
  if (!el || !actions) return false;
  const cs = getComputedStyle(actions);
  const r = el.getBoundingClientRect();
  const dockTop = document.querySelector('nav.dock').getBoundingClientRect().top;
  return cs.position === 'fixed' && r.bottom > 0 && r.bottom < dockTop;
}, null, { timeout: 8000 });
const book = await page.evaluate(() => {
  const dockTop = document.querySelector('nav.dock').getBoundingClientRect().top;
  const actions = document.querySelector('.journal-write-actions');
  const el = document.querySelector('#shiftNoteSave');
  const ar = actions.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const y = Math.min(Math.max(8, (r.top + r.bottom) / 2), window.innerHeight - 8);
  const x = Math.min(Math.max(8, (r.left + r.right) / 2), window.innerWidth - 8);
  const t = document.elementFromPoint(x, y);
  const cs = getComputedStyle(actions);
  return {
    dockTop: Math.round(dockTop),
    actions: {
      top: Math.round(ar.top),
      bottom: Math.round(ar.bottom),
      pos: cs.position,
      bottomCss: cs.bottom,
      topCss: cs.top,
      z: cs.zIndex,
    },
    save: {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      clear: r.bottom < dockTop - 4,
      hitDock: !!(t && t.closest('nav.dock')),
      hit: t?.id || String(t?.className || '').slice(0, 40),
    },
  };
});
console.log('BOOK', JSON.stringify(book, null, 2));
if (!book.save.clear || book.save.hitDock) process.exitCode = 1;
await browser.close();
