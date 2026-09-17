/**
 * Deep mobile UI audit — overflow, clipped controls, overlaps, dead taps.
 *   node scripts/qa-mobile-ui-audit.mjs
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'm-audit-294');
fs.mkdirSync(OUT, { recursive: true });

const PHONE = { ...devices['iPhone 15 Pro'], viewport: { width: 390, height: 844 }, serviceWorkers: 'block' };
const findings = [];

function add(name, sev, detail, extra = {}) {
  findings.push({ name, sev, detail, ...extra });
  console.log(`  [${sev}] ${name}: ${detail}`);
}

async function login(ctx, id, mode) {
  const res = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { profileId: id, mode, pin: pins[id], remember: false },
  });
  if (!res.ok()) throw new Error(`login ${id} ${res.status()} ${await res.text()}`);
  await ctx.request.post(`${BASE}/api/auth/onboarding/complete`, { data: { version: 3 } }).catch(() => {});
}

async function boot(page) {
  await page.goto(`${BASE}/m/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
    { timeout: 60000 },
  );
  await page.waitForTimeout(350);
}

async function inspect(page, name) {
  await page.waitForTimeout(280);
  const data = await page.evaluate(() => {
    const vw = innerWidth;
    const vh = innerHeight;
    const doc = document.documentElement;
    const overflow = doc.scrollWidth > vw + 2;
    const dock = document.querySelector('nav.dock, #bottomPanel');
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;
    const issues = [];

    const isVisible = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };

    const clipped = [];
    const small = [];
    const off = [];
    const behindDock = [];
    const overlaps = [];
    const noHandler = [];

    const interactives = [...document.querySelectorAll(
      '#view button, #view [role="button"], #view a, header button, nav.dock button, #bottomPanel button, .sheet button, .sheet-open button, #sheetHost button'
    )];

    interactives.forEach((el) => {
      if (!isVisible(el)) return;
      const r = el.getBoundingClientRect();
      const label = (el.innerText || el.getAttribute('aria-label') || el.id || el.className || '').replace(/\s+/g, ' ').trim().slice(0, 48);
      const inHScroll = !!el.closest('[style*="overflow-x"], .m-rail, .kids-pane-tabs, .pocket-kids-rail, .house-selector, .shop-house-rail, .planner-seg, .planner-focus-switch, .shop-panel-seg, .week-jump, .arcade-rail, .section-shell-nav');
      const parent = el.parentElement;
      const parentOverflow = parent && ['auto','scroll'].includes(getComputedStyle(parent).overflowX);
      if ((r.right > vw + 4 || r.left < -4) && !inHScroll && !parentOverflow) clipped.push({ label, left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
      if (r.width > 8 && r.height > 4 && r.height < 36 && r.top < vh && r.bottom > 0) {
        small.push({ label, h: Math.round(r.height), w: Math.round(r.width) });
      }
      if (r.bottom > 0 && r.top < vh && (r.right < 0 || r.left > vw)) off.push(label);
      if (r.bottom > dockTop + 8 && r.top < dockTop && r.bottom < vh && !el.closest('nav.dock, #bottomPanel')) {
        behindDock.push(label);
      }
    });

    // Horizontal overflow of any in-flow block inside #view
    const boxes = [...document.querySelectorAll('#view *, header.app-chrome, .sheet, .sheet-body, .m-page')].slice(0, 800);
    boxes.forEach((el) => {
      const s = getComputedStyle(el);
      if (s.position === 'fixed' || s.position === 'sticky') return;
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') return;
      const r = el.getBoundingClientRect();
      if (r.width > vw + 8 && r.left < 4) {
        const label = (el.className || el.id || el.tagName || '').toString().slice(0, 60);
        issues.push({ kind: 'wide', label, w: Math.round(r.width) });
      }
    });

    // Overlapping visible buttons in the same viewport band
    const visBtns = interactives.filter(isVisible).map((el) => {
      const r = el.getBoundingClientRect();
      return { el, r, label: (el.innerText || el.id || '').replace(/\s+/g, ' ').trim().slice(0, 32) };
    }).filter((x) => x.r.width > 20 && x.r.height > 16 && x.r.top < vh && x.r.bottom > 0);

    for (let i = 0; i < visBtns.length; i++) {
      for (let j = i + 1; j < visBtns.length; j++) {
        const a = visBtns[i].r, b = visBtns[j].r;
        const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (ox > 12 && oy > 12 && !visBtns[i].el.contains(visBtns[j].el) && !visBtns[j].el.contains(visBtns[i].el)) {
          overlaps.push(`${visBtns[i].label} ∩ ${visBtns[j].label}`);
        }
      }
    }

    const mPage = document.querySelector('#view .m-page');
    const hero = document.querySelector('#view .kid-rating-hero-v2, #view .pocket-hero-v2, #view .stock-pantry-hero, #view .m-hero');
    let heroTextColor = null;
    if (hero) {
      const probe = hero.querySelector('h1, h2, .pocket-balance-big, b') || hero;
      heroTextColor = getComputedStyle(probe).color;
    }

    return {
      overflow,
      scrollW: doc.scrollWidth,
      vw,
      hasMPage: !!mPage,
      mPageId: mPage?.dataset?.mPage || null,
      tab: document.body.dataset.tab || '',
      clipped: clipped.slice(0, 8),
      small: small.slice(0, 8),
      behindDock: behindDock.slice(0, 6),
      overlaps: [...new Set(overlaps)].slice(0, 8),
      wide: issues.filter((i) => i.kind === 'wide').slice(0, 6),
      heroTextColor,
      bodyClasses: document.body.className,
    };
  });

  if (data.overflow) add(name, 'P0', `page overflow scrollW=${data.scrollW} vw=${data.vw}`);
  if (!data.hasMPage) add(name, 'P0', 'missing .m-page');
  data.clipped.forEach((c) => add(name, 'P0', `clipped control "${c.label}" L${c.left} R${c.right}`));
  data.wide.forEach((w) => add(name, 'P1', `wide element ${w.label} w=${w.w}`));
  data.behindDock.forEach((l) => add(name, 'P1', `control under dock: ${l}`));
  data.overlaps.slice(0, 4).forEach((o) => add(name, 'P2', `overlap ${o}`));
  data.small.forEach((s) => add(name, 'P2', `small tap ${s.h}×${s.w} "${s.label}"`));

  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false }).catch(() => {});
  return data;
}

async function clickIf(page, selector, name) {
  const el = page.locator(selector).first();
  if (await el.count() && await el.isVisible().catch(() => false)) {
    await el.click({ timeout: 4000 }).catch((e) => add(name, 'P1', `click failed ${selector}: ${e.message}`));
    await page.waitForTimeout(250);
    return true;
  }
  return false;
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext(PHONE);
const page = await ctx.newPage();
page.on('pageerror', (err) => add('runtime', 'P0', err.message));
await page.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
});

console.log('=== staff login ===');
await login(ctx, 'e4', 'staff');
await boot(page);
await inspect(page, 'staff-home');

const staffTabs = [
  ['home', 'staff-home-rerender'],
  ['schedule', 'staff-schedule'],
  ['stock', 'staff-stock'],
  ['shop', 'staff-shop'],
  ['talk', 'staff-talk'],
  ['kids', 'staff-kids'],
  ['pocket', 'staff-pocket'],
  ['gallery', 'staff-gallery'],
  ['book', 'staff-book'],
  ['admin', 'staff-admin'],
];

for (const [tab, name] of staffTabs) {
  await page.evaluate((t) => {
    state.tab = t;
    if (t === 'schedule') setScheduleView('day', { persist: false });
    if (t === 'admin') state.adminPane = 'ops';
    render();
    scrollTo(0, 0);
  }, tab);
  await inspect(page, name);
}

await page.evaluate(() => {
  state.tab = 'schedule';
  setScheduleView('week', { persist: false });
  render();
  scrollTo(0, 0);
});
await inspect(page, 'staff-schedule-week');

await page.evaluate(() => {
  state.tab = 'schedule';
  setScheduleView('calendar', { persist: false });
  render();
  scrollTo(0, 0);
});
await inspect(page, 'staff-schedule-cal');

// Kids: open first profile if present
await page.evaluate(() => {
  state.tab = 'kids';
  render();
});
await page.waitForTimeout(200);
const openedKid = await page.evaluate(() => {
  const btn = document.querySelector('#view [data-kid], #view .kid-dir-row, #view .m-row[data-kid-open], #view button[data-open-kid]');
  if (btn) { btn.click(); return true; }
  const any = [...document.querySelectorAll('#view button, #view .m-row')].find((el) => /προφίλ|profil|kid|παιδ/i.test(el.textContent || ''));
  if (any) { any.click(); return true; }
  return false;
});
if (openedKid) {
  await page.waitForTimeout(400);
  await inspect(page, 'staff-kid-profile');
} else {
  add('staff-kid-profile', 'P2', 'could not open a kid profile');
}

// Stock: list + check sheet
await page.evaluate(() => {
  state.tab = 'stock';
  render();
  scrollTo(0, 0);
});
await inspect(page, 'staff-stock-2');
await clickIf(page, '#view [data-stock-check], #view button:has-text("Έλεγχος"), #view button:has-text("Kontrolle")', 'staff-stock-check');
await inspect(page, 'staff-stock-check-sheet');
await page.keyboard.press('Escape').catch(() => {});
await page.evaluate(() => {
  document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
});

// Pocket settings tab
await page.evaluate(() => {
  state.tab = 'pocket';
  if (state.pocketPane !== undefined) state.pocketPane = 'settings';
  render();
});
await inspect(page, 'staff-pocket-settings');
await clickIf(page, '#view .pocket-pane-tabs button, #view .pocket-tabs-v2 .chip', 'staff-pocket-tabs');

// Admin panes
for (const pane of ['team', 'supplies', 'receipts', 'school', 'finance', 'system']) {
  await page.evaluate((p) => {
    state.tab = 'admin';
    state.adminPane = p;
    render();
    scrollTo(0, 0);
  }, pane);
  await inspect(page, `staff-admin-${pane}`);
}

// Mehr sheet / more dock
await page.evaluate(() => {
  state.tab = 'home';
  render();
});
const mehr = await clickIf(page, 'nav.dock button[data-tab="more"], nav.dock #dockMore, #btnMore, button:has-text("Mehr"), button:has-text("Περισσότερα")', 'staff-more');
if (mehr) await inspect(page, 'staff-more-sheet');

// Header buttons
await page.evaluate(() => {
  document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
});
await clickIf(page, '#btnNotifs', 'staff-bell');
await inspect(page, 'staff-notifs');
await page.evaluate(() => {
  document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
});
await clickIf(page, '#btnUser', 'staff-user');
await inspect(page, 'staff-user-sheet');

console.log('=== child login ===');
await login(ctx, 'k1', 'child');
await boot(page);
await inspect(page, 'kid-today');

const kidViews = ['today', 'games', 'rate', 'bonus', 'notes', 'plan', 'rewards', 'learn', 'gallery', 'pocket', 'regeln', 'rules'];
for (const view of kidViews) {
  await page.evaluate((v) => {
    if (typeof goChildView === 'function') goChildView(v);
    else {
      state.childView = v;
      render();
    }
    scrollTo(0, 0);
  }, view);
  await inspect(page, `kid-${view}`);
}

await browser.close();

const report = { at: new Date().toISOString(), findings, count: findings.length };
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const bySev = findings.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});
console.log(JSON.stringify({ findings: findings.length, bySev, out: OUT }, null, 2));
process.exit(findings.some((f) => f.sev === 'P0') ? 1 : 0);
