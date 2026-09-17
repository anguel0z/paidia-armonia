/**
 * Live mobile shell check after overhaul notes.
 *   node scripts/qa-mobile-live-check.mjs
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'live-check-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'));
fs.mkdirSync(OUT, { recursive: true });

const findings = [];
const note = (sev, area, detail) => {
  findings.push({ sev, area, detail });
  console.log(`[${sev}] ${area}: ${detail}`);
};

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
  await page.waitForTimeout(400);
}

function hit(page, sel, dockSel = 'nav.dock') {
  return page.evaluate(({ sel, dockSel }) => {
    const dock = document.querySelector(dockSel);
    const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
    const el = document.querySelector(sel);
    if (!el) return { missing: true, dockTop: Math.round(dockTop) };
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return {
      missing: false,
      bottom: Math.round(r.bottom),
      dockTop: Math.round(dockTop),
      clear: r.bottom < dockTop - 4,
      hitDock: !!(t && t.closest(dockSel + ', #bottomPanel')),
      text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40),
    };
  }, { sel, dockSel });
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  ...devices['iPhone 15 Pro'],
  viewport: { width: 390, height: 844 },
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
page.on('pageerror', (e) => note('P0', 'runtime', e.message));
await page.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
});

// ── Staff ──────────────────────────────────────────────────────────────
await login(ctx, 'e4', 'staff');
await boot(page);

const cssOk = await page.evaluate(() =>
  [...document.styleSheets].some((s) => (s.href || '').includes('ui-v294')),
);
if (!cssOk) note('P0', 'css', 'ui-v294.css not loaded');
else console.log('css ui-v294: ok');

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
if (overflow) note('P0', 'home', `horizontal overflow scrollW=${document.documentElement.scrollWidth}`);

await page.screenshot({ path: path.join(OUT, '01-staff-home.png') });

const journal = await hit(page, '#homeShiftJournal');
console.log('journal', JSON.stringify(journal));
if (journal.missing) note('P1', 'home', 'journal CTA missing');
else if (journal.hitDock || !journal.clear) note('P0', 'home', `journal under dock ${JSON.stringify(journal)}`);

const cta = await hit(page, '.m-cta .btn.m-primary');
console.log('homeCta', JSON.stringify(cta));
if (cta.hitDock) note('P0', 'home', 'primary CTA under dock');

const bentoIco = await page.evaluate(() => document.querySelectorAll('.home-bento-ico').length);
const bentoDot = await page.evaluate(() => document.querySelectorAll('.home-bento-dot').length);
const bentoTiles = await page.evaluate(() => document.querySelectorAll('.home-bento-tile').length);
console.log({ bentoIco, bentoDot, bentoTiles });
if (bentoTiles > 2) note('P1', 'home', `expected ≤2 bento tiles, got ${bentoTiles}`);
if (bentoIco < 1) note('P1', 'home', 'bento missing icons');

const dockLabels = await page.evaluate(() =>
  [...document.querySelectorAll('nav.dock button')]
    .filter((b) => b.getBoundingClientRect().width > 8)
    .map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim()),
);
console.log('staffDock', dockLabels);
if (dockLabels.length < 4 || dockLabels.length > 6) note('P1', 'dock', `unexpected visible dock count ${dockLabels.length}`);

// Walk key tabs
for (const tab of ['schedule', 'stock', 'shop', 'kids', 'pocket', 'book', 'admin']) {
  await page.evaluate((t) => {
    state.tab = t;
    if (t === 'admin') state.adminPane = 'ops';
    render();
    scrollTo(0, 0);
  }, tab);
  await page.waitForTimeout(250);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
  if (ov) note('P0', tab, 'horizontal overflow');
  await page.screenshot({ path: path.join(OUT, `02-staff-${tab}.png`) });
}

// Unit localization on stock
await page.evaluate(() => {
  state.tab = 'stock';
  render();
  scrollTo(0, 0);
});
await page.waitForTimeout(300);
const units = await page.evaluate(() => {
  const text = document.querySelector('#view')?.innerText || '';
  return {
    hasStk: /\bStk\b/.test(text),
    hasTmx: /τμχ/.test(text),
    sample: (text.match(/min \d+ \S+/) || [])[0] || null,
  };
});
console.log('units', units);
if (units.hasStk) note('P1', 'stock', 'raw Stk still visible in EL UI');

// Sheet: notifs open/close
await page.evaluate(() => {
  state.tab = 'home';
  render();
});
await page.waitForTimeout(200);
await page.click('#btnNotifs').catch((e) => note('P1', 'notifs', e.message));
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(OUT, '03-staff-notifs.png') });
await page.evaluate(() => {
  if (typeof closeSheet === 'function') closeSheet();
  if (typeof render === 'function') render();
});
await page.waitForTimeout(200);
const sheetOrphan = await page.evaluate(() => {
  const bg = document.querySelector('#sheetBg');
  const bodyOpen = document.body.classList.contains('sheet-open');
  const panelOn = document.querySelector('#sheet')?.classList.contains('on');
  return {
    bgOn: !!bg?.classList.contains('on'),
    bodyOpen,
    panelOn,
    orphan: !!(bg?.classList.contains('on') && !bodyOpen && !panelOn),
  };
});
console.log('sheet', sheetOrphan);
if (sheetOrphan.orphan) note('P0', 'sheet', 'orphan #sheetBg.on');

// ── Kid ────────────────────────────────────────────────────────────────
await login(ctx, 'k1', 'child');
await boot(page);
await page.screenshot({ path: path.join(OUT, '04-kid-home.png') });

const kidDock = await page.evaluate(() =>
  [...document.querySelectorAll('nav.kid-dock button')].map((b) =>
    (b.innerText || '').replace(/\s+/g, ' ').trim(),
  ),
);
console.log('kidDock', kidDock);
if (kidDock.length !== 4) note('P1', 'kid-dock', `expected 4 items (3+More), got ${kidDock.length}: ${kidDock.join(' | ')}`);
if (!kidDock.some((l) => /Βαθμοί|Noten/.test(l))) note('P1', 'kid-dock', 'missing short rate label');
if (kidDock.some((l) => /Χαρτζιλίκι|Σημειώσεις|Pocket|Notizen/.test(l))) {
  note('P1', 'kid-dock', 'pocket/notes still on primary dock');
}

const kidTiles = await page.evaluate(() => {
  const dock = document.querySelector('nav.kid-dock, #bottomPanel');
  const dockTop = dock.getBoundingClientRect().top;
  return [...document.querySelectorAll('.kid-home-cta-tile')].map((el) => {
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return {
      id: el.dataset.childView,
      clear: r.bottom < dockTop - 4,
      hitDock: !!(t && t.closest('nav.kid-dock, #bottomPanel')),
    };
  });
});
console.log('kidTiles', JSON.stringify(kidTiles));
kidTiles.filter((t) => t.hitDock).forEach((t) => note('P0', 'kid-cta', `${t.id} tap stolen by dock`));

const nextUp = await page.evaluate(() => {
  const chip = document.querySelector('#view .chip.on[data-child-view="games"]');
  const btn = document.querySelector('#view button.next-up[data-child-view="games"]');
  return { oldChip: !!chip, nextBtn: !!btn };
});
console.log('nextUp', nextUp);
if (nextUp.oldChip) note('P0', 'kid-home', 'old games chip still present under dock risk');

if (nextUp.nextBtn) {
  await page.click('#view button.next-up[data-child-view="games"]');
  await page.waitForTimeout(350);
  const view = await page.evaluate(() => state.childView);
  if (view !== 'games') note('P0', 'kid-home', `next-up click went to ${view}, expected games`);
  await page.screenshot({ path: path.join(OUT, '05-kid-games.png') });
}

// Kid more sheet
await page.click('#kidDockMore').catch(() => note('P1', 'kid-more', 'more button missing'));
await page.waitForTimeout(350);
await page.screenshot({ path: path.join(OUT, '06-kid-more.png') });
const moreHasPocket = await page.evaluate(() =>
  /Χαρτζιλίκι|Pocket|Taschengeld|Σημειώσ/i.test(document.querySelector('#sheet')?.innerText || ''),
);
if (!moreHasPocket) note('P1', 'kid-more', 'pocket/notes not found in More sheet');

await browser.close();

const bySev = findings.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});
const report = { out: OUT, bySev, findings, ok: !findings.some((f) => f.sev === 'P0') };
fs.writeFileSync(path.join(OUT, 'REPORT.json'), JSON.stringify(report, null, 2));
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
