/**
 * Mobile fleet matrix — aspect ratios × staff/kid screens × button probes.
 *   node scripts/qa-mobile-fleet-matrix.mjs
 *
 * Auth: docs/marketing/.local-auth/pins.json against local QA server.
 * Read-mostly: clicks navigation / opens sheets; avoids destructive deletes.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const TAG = 'fleet-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const OUT = path.join(ROOT, '.qa-screens', TAG);
fs.mkdirSync(OUT, { recursive: true });

const DEVICES = [
  { id: 'iphone-se', w: 375, h: 667, label: 'iPhone SE' },
  { id: 'iphone-15', w: 390, h: 844, label: 'iPhone 15' },
  { id: 'iphone-15-pro-max', w: 430, h: 932, label: 'iPhone 15 Pro Max' },
  { id: 'pixel-7', w: 412, h: 915, label: 'Pixel 7' },
  { id: 'galaxy-fold-cover', w: 280, h: 653, label: 'Fold cover (narrow)' },
  { id: 'tablet-portrait', w: 768, h: 1024, label: 'iPad portrait' },
  { id: 'landscape-phone', w: 844, h: 390, label: 'Phone landscape' },
];

const STAFF_TABS = ['home', 'schedule', 'stock', 'shop', 'talk', 'kids', 'pocket', 'gallery', 'book', 'admin'];
const KID_VIEWS = ['today', 'games', 'rate', 'pocket', 'notes', 'bonus', 'plan', 'rewards', 'learn', 'gallery'];

const findings = [];
function note(sev, device, screen, detail, extra = {}) {
  findings.push({ sev, device, screen, detail, ...extra, at: new Date().toISOString() });
  console.log(`  [${sev}] ${device}/${screen}: ${detail}`);
}

async function login(ctx, id, mode) {
  const res = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { profileId: id, mode, pin: pins[id], remember: false },
  });
  if (!res.ok()) throw new Error(`login ${id} ${res.status()}`);
  await ctx.request.post(`${BASE}/api/auth/onboarding/complete`, { data: { version: 3 } }).catch(() => {});
}

async function boot(page) {
  await page.goto(`${BASE}/m/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
    { timeout: 60000 },
  );
  await page.waitForTimeout(280);
}

async function measure(page, device, screen) {
  const data = await page.evaluate(() => {
    const vw = innerWidth;
    const vh = innerHeight;
    const doc = document.documentElement;
    const dock = document.querySelector('nav.dock, nav.kid-dock, #bottomPanel');
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;
    const overflow = doc.scrollWidth > vw + 2;
    const mPage = document.querySelector('#view .m-page');

    const isVis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };

    const clipped = [];
    const underDock = [];
    const small = [];
    const deadLooking = [];

    const nodes = [...document.querySelectorAll(
      '#view button, #view a, #view [role="button"], header button, nav.dock button, nav.kid-dock button, #sheet button, .sheet button'
    )];

    for (const el of nodes) {
      if (!isVis(el)) continue;
      const r = el.getBoundingClientRect();
      const label = (el.innerText || el.getAttribute('aria-label') || el.id || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      const inRail = !!el.closest(
        '.m-rail, .kids-pane-tabs, .pocket-kids-rail, .house-selector, .shop-house-rail, .stock-house-rail, .planner-focus-switch, .shop-panel-seg, .week-jump, .arcade-rail, .section-shell-nav, .book-day-strip, .book-cal-strip, .book-panes, .paidia-cal, .pocket-cal-wrap, .home-shift-steps'
      );
      if (!inRail && (r.right > vw + 6 || r.left < -6)) clipped.push(label);
      if (r.bottom > dockTop + 6 && r.top < dockTop && r.top > 40 && !el.closest('nav.dock, nav.kid-dock, #bottomPanel')) underDock.push(label);
      if (r.height > 4 && r.height < 36 && r.width > 8 && r.top < vh && r.bottom > 0) small.push(`${label}(${Math.round(r.height)}px)`);
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      if (!el.onclick && !el.getAttribute('href') && !el.dataset.tab && !el.dataset.v && !el.id && !el.getAttribute('data-home-jump') && ![...el.attributes].some((a) => a.name.startsWith('data-'))) {
        if (label && r.width > 40) deadLooking.push(label);
      }
    }

    return {
      overflow,
      scrollW: doc.scrollWidth,
      vw,
      vh,
      hasMPage: !!mPage,
      mPageId: mPage?.dataset?.mPage || null,
      clipped: [...new Set(clipped)].slice(0, 6),
      underDock: [...new Set(underDock)].slice(0, 6),
      small: [...new Set(small)].slice(0, 6),
      deadLooking: [...new Set(deadLooking)].slice(0, 4),
      bodyClass: document.body.className,
    };
  });

  if (data.overflow) note('P0', device, screen, `page overflow scrollW=${data.scrollW}`);
  if (!data.hasMPage) note('P0', device, screen, 'missing .m-page');
  data.clipped.forEach((c) => note('P0', device, screen, `clipped: ${c}`));
  data.underDock.forEach((c) => note('P1', device, screen, `under dock: ${c}`));
  data.small.forEach((c) => note('P2', device, screen, `small tap: ${c}`));

  const shot = path.join(OUT, `${device}__${screen}.png`);
  await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
  return data;
}

async function clickProbe(page, device, screen) {
  const results = await page.evaluate(async () => {
    const out = [];
    const dockBtns = [...document.querySelectorAll('nav.dock button, nav.kid-dock button')].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 8 && r.height > 8;
    });
    for (const b of dockBtns.slice(0, 8)) {
      const label = (b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 24);
      try {
        b.click();
        out.push({ label, ok: true });
      } catch (e) {
        out.push({ label, ok: false, err: String(e.message || e) });
      }
      await new Promise((r) => setTimeout(r, 80));
    }
    // Header chips
    for (const sel of ['#btnNotifs', '#btnLang', '#btnUser']) {
      const el = document.querySelector(sel);
      if (!el) continue;
      try {
        el.click();
        out.push({ label: sel, ok: true });
        document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      } catch (e) {
        out.push({ label: sel, ok: false, err: String(e.message || e) });
      }
      await new Promise((r) => setTimeout(r, 60));
    }
    return out;
  });
  results.filter((r) => !r.ok).forEach((r) => note('P1', device, screen, `dead click ${r.label}: ${r.err || '?'}`));
  return results;
}

const browser = await chromium.launch({ headless: true });
const summary = { devices: [], staff: {}, kid: {} };

for (const d of DEVICES) {
  console.log(`\n=== ${d.label} (${d.w}×${d.h}) ===`);
  const ctx = await browser.newContext({
    viewport: { width: d.w, height: d.h },
    deviceScaleFactor: 2,
    isMobile: d.w < 700,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => note('P0', d.id, 'runtime', err.message));
  await page.addInitScript(() => {
    localStorage.setItem('paidia.lang', 'el');
    localStorage.setItem('paidia.uiMode', 'pro');
    localStorage.setItem('paidia.tourSeen', '1');
    localStorage.setItem('paidia.tipsSeen', '1');
    localStorage.setItem('paidia.pwaInstallDismiss', '1');
  });

  // Staff
  await login(ctx, 'e4', 'staff');
  await boot(page);
  await measure(page, d.id, 'staff-boot');
  for (const tab of STAFF_TABS) {
    await page.evaluate((t) => {
      state.tab = t;
      if (t === 'schedule') setScheduleView('day', { persist: false });
      if (t === 'admin') state.adminPane = 'ops';
      render();
      scrollTo(0, 0);
    }, tab);
    await page.waitForTimeout(220);
    await measure(page, d.id, `staff-${tab}`);
  }
  await page.evaluate(() => {
    state.tab = 'schedule';
    setScheduleView('week', { persist: false });
    render();
    scrollTo(0, 0);
  });
  await measure(page, d.id, 'staff-schedule-week');
  await page.evaluate(() => {
    state.tab = 'home';
    render();
  });
  await clickProbe(page, d.id, 'staff-dock-probe');

  // Kid
  await login(ctx, 'k1', 'child');
  await boot(page);
  await measure(page, d.id, 'kid-boot');
  for (const view of KID_VIEWS) {
    await page.evaluate((v) => {
      if (typeof goChildView === 'function') goChildView(v);
      else {
        state.childView = v;
        render();
      }
      scrollTo(0, 0);
    }, view);
    await page.waitForTimeout(220);
    await measure(page, d.id, `kid-${view}`);
  }
  await clickProbe(page, d.id, 'kid-dock-probe');

  await ctx.close();
  summary.devices.push(d.id);
}

await browser.close();

const bySev = findings.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});
const report = {
  tag: TAG,
  at: new Date().toISOString(),
  base: BASE,
  devices: DEVICES,
  findings,
  count: findings.length,
  bySev,
  out: OUT,
};
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

let md = `# Mobile fleet matrix — ${TAG}\n\n`;
md += `Devices: ${DEVICES.map((d) => d.label).join(', ')}\n\n`;
md += `Findings: **${findings.length}** (${JSON.stringify(bySev)})\n\n`;
md += `## P0\n`;
findings.filter((f) => f.sev === 'P0').forEach((f) => {
  md += `- **${f.device}/${f.screen}**: ${f.detail}\n`;
});
md += `\n## P1\n`;
findings.filter((f) => f.sev === 'P1').slice(0, 80).forEach((f) => {
  md += `- ${f.device}/${f.screen}: ${f.detail}\n`;
});
md += `\n## Screenshots\n\`${OUT}\`\n`;
fs.writeFileSync(path.join(OUT, 'NOTES.md'), md);
console.log('\n' + JSON.stringify({ findings: findings.length, bySev, out: OUT }, null, 2));
process.exit(findings.some((f) => f.sev === 'P0') ? 1 : 0);
