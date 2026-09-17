import { chromium, devices } from 'playwright';
import fs from 'fs';

const pins = JSON.parse(fs.readFileSync('docs/marketing/.local-auth/pins.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  ...devices['iPhone 15 Pro'],
  viewport: { width: 390, height: 844 },
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
});

await ctx.request.post('http://127.0.0.1:5173/api/auth/login', {
  data: { profileId: 'e4', mode: 'staff', pin: pins.e4, remember: false },
});
await ctx.request.post('http://127.0.0.1:5173/api/auth/onboarding/complete', { data: { version: 3 } }).catch(() => {});
await page.goto('http://127.0.0.1:5173/m/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'));
await page.waitForTimeout(400);

const staff = await page.evaluate(() => {
  const cssOk = [...document.styleSheets].some((s) => (s.href || '').includes('ui-v294'));
  const dock = document.querySelector('nav.dock');
  const dockTop = dock.getBoundingClientRect().top;
  const check = (sel) => {
    const btn = document.querySelector(sel);
    if (!btn) return { missing: true };
    const r = btn.getBoundingClientRect();
    const el = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return {
      missing: false,
      btnBottom: Math.round(r.bottom),
      clear: r.bottom < dockTop - 4,
      hitIsDock: !!(el && el.closest('nav.dock')),
    };
  };
  return {
    cssOk,
    dockTop: Math.round(dockTop),
    journal: check('#homeShiftJournal'),
    stock: check('#homeShiftStock'),
    presence: check('#homeShiftPresence, #homeShiftPresenceStep'),
  };
});
console.log('staff', JSON.stringify(staff));

await ctx.request.post('http://127.0.0.1:5173/api/auth/login', {
  data: { profileId: 'k1', mode: 'child', pin: pins.k1, remember: false },
});
await page.goto('http://127.0.0.1:5173/m/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'));
await page.waitForTimeout(400);

const kid = await page.evaluate(() => {
  const dock = document.querySelector('nav.kid-dock, #bottomPanel');
  const dockTop = dock.getBoundingClientRect().top;
  /* notes/games/rate/pocket are dock-only on /m/ — check a remaining home tile + dock notes */
  const homeBtn = document.querySelector('.kid-home-cta-tile[data-child-view="bonus"], .kid-home-cta-tile');
  const dockNotes = document.querySelector('nav.kid-dock [data-child-view="notes"], nav.kid-dock button');
  const check = (btn, label) => {
    if (!btn) return { [label]: { missing: true } };
    const r = btn.getBoundingClientRect();
    const el = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return {
      [label]: {
        missing: false,
        btnBottom: Math.round(r.bottom),
        clear: r.bottom < dockTop - 4 || label === 'dockNotes',
        hitIsDock: !!(el && el.closest('nav.kid-dock, #bottomPanel')),
        hitOk: label === 'dockNotes'
          ? !!(el && el.closest('nav.kid-dock'))
          : !(el && el.closest('nav.kid-dock, #bottomPanel')),
      },
    };
  };
  return {
    dockTop: Math.round(dockTop),
    ...check(homeBtn, 'homeCta'),
    ...check(dockNotes, 'dockNotes'),
  };
});
console.log('kid', JSON.stringify(kid));
await browser.close();
