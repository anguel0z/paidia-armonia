/**
 * Deep staff mobile QA — /m/ (390×844 + 375×667 probe).
 *   node scripts/qa-deep-staff.mjs
 * Output: .qa-screens/deep-staff/
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT_ROOT = path.join(ROOT, '.qa-screens', 'deep-staff');
fs.mkdirSync(OUT_ROOT, { recursive: true });

const ADMIN_PANES = [
  'ops',
  'team',
  'supplies',
  'receipts',
  'school',
  'review',
  'finance',
  'audit',
  'communications',
  'automations',
  'system',
];
const STAFF_TABS = ['home', 'schedule', 'stock', 'shop', 'talk', 'kids', 'pocket', 'gallery', 'book', 'admin'];

const findings = [];
const pageErrors = [];
const consoleErrors = [];

function add(sev, title, detail, selectors = [], shot = null, works = false, viewport = '390x844') {
  findings.push({ sev, title, detail, selectors, shot, works, viewport, at: new Date().toISOString() });
  console.log(`  [${sev}] ${title}: ${detail}${works ? ' (OK)' : ''}`);
}

async function shot(page, outDir, name) {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(outDir, file), fullPage: false }).catch(() => {});
  return `deep-staff/${path.basename(outDir)}/${file}`;
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
  await page.waitForTimeout(400);
}

async function sheetBgState(page) {
  return page.evaluate(() => {
    const bg = document.getElementById('sheetBg');
    const on = bg?.classList.contains('on');
    const pe = bg ? getComputedStyle(bg).pointerEvents : '';
    const blocks = on && pe !== 'none';
    return { on, pe, blocks, sheetOpen: document.body.classList.contains('sheet-open') };
  });
}

async function forceCloseSheets(page) {
  await page.evaluate(() => {
    try {
      if (typeof closeSheet === 'function') closeSheet();
    } catch {}
    document.getElementById('sheetBg')?.classList.remove('on');
    document.body.classList.remove('sheet-open');
    document.querySelectorAll('.sheet.on, #sheet.on').forEach((el) => el.classList.remove('on'));
  });
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(200);
}

async function probeLayout(page, label) {
  return page.evaluate((label) => {
    const vw = innerWidth;
    const dock = document.querySelector('nav.dock[data-staff-dock], nav.dock');
    const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
    const isVis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };
    const overflows = document.documentElement.scrollWidth > vw + 8;
    const clipped = [];
    [...document.querySelectorAll('#view h1, #view h2, #view .m-title, nav.dock button span, #view .btn')]
      .slice(0, 50)
      .forEach((el) => {
        if (!isVis(el)) return;
        if (el.scrollWidth > el.clientWidth + 2) {
          clipped.push((el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36));
        }
      });
    const underDock = [];
    for (const el of [...document.querySelectorAll('#view button, #view a, #view [role="button"]')]) {
      if (!isVis(el) || el.closest('nav.dock')) continue;
      const r = el.getBoundingClientRect();
      const mid = (r.top + r.bottom) / 2;
      if (mid > dockTop + 4 && r.bottom > dockTop + 8) {
        const sel = el.id ? `#${el.id}` : (el.className || el.tagName).toString().slice(0, 40);
        underDock.push({ sel, label: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40), dockTop: Math.round(dockTop) });
      }
    }
    const uiV294 = !!document.querySelector('link[href*="ui-v294"]');
    return {
      label,
      overflows,
      clipped: clipped.slice(0, 8),
      underDock: underDock.slice(0, 10),
      dockTop: Math.round(dockTop),
      tab: document.body.dataset.tab || (typeof state !== 'undefined' ? state?.tab : null),
      uiV294,
    };
  }, label);
}

async function hitTestButton(page, sel) {
  return page.evaluate((sel) => {
    const btn = document.querySelector(sel);
    if (!btn) return { missing: true, sel };
    const r = btn.getBoundingClientRect();
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    const el = document.elementFromPoint(cx, cy);
    const dock = document.querySelector('nav.dock');
    const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
    return {
      missing: false,
      sel,
      btnBottom: Math.round(r.bottom),
      dockTop: Math.round(dockTop),
      clear: r.bottom < dockTop - 4,
      hitSel: el ? (el.id ? `#${el.id}` : el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : '')) : null,
      hitIsDock: !!(el && el.closest('nav.dock')),
      hitIsSelf: el === btn || btn.contains(el),
    };
  }, sel);
}

async function goTab(page, tab, extra = {}) {
  await page.evaluate(
    ({ tab, extra }) => {
      state.tab = tab;
      if (tab === 'schedule' && extra.scheduleView) setScheduleView(extra.scheduleView, { persist: false });
      if (tab === 'admin') state.adminPane = extra.adminPane || 'ops';
      render();
      scrollTo(0, 0);
    },
    { tab, extra },
  );
  await page.waitForTimeout(350);
}

async function clickTopCTAs(page, outDir, tabLabel, limit = 5) {
  const targets = await page.evaluate((limit) => {
    const dock = document.querySelector('nav.dock');
    const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
    const isVis = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 20 && r.height > 18 && r.top > 50 && r.bottom < dockTop - 6;
    };
    return [...document.querySelectorAll('#view button:not([disabled]), #view a.btn, #view .page-act, #view .m-row')]
      .filter(isVis)
      .slice(0, limit)
      .map((el, i) => ({
        i,
        id: el.id || null,
        label: (el.innerText || el.id || `cta-${i}`).replace(/\s+/g, ' ').trim().slice(0, 40),
      }));
  }, limit);

  for (const t of targets) {
    await forceCloseSheets(page);
    const before = await page.evaluate(() => ({
      tab: state?.tab,
      sheet: document.body.classList.contains('sheet-open'),
      viewLen: document.querySelector('#view')?.innerHTML?.length || 0,
    }));
    let ok = false;
    try {
      ok = await page.evaluate((idx) => {
        const dock = document.querySelector('nav.dock');
        const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
        const els = [...document.querySelectorAll('#view button:not([disabled]), #view a.btn, #view .page-act, #view .m-row')].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 20 && r.height > 18 && r.top > 50 && r.bottom < dockTop - 6;
        });
        const el = els[idx];
        if (!el) return false;
        el.click();
        return true;
      }, t.i);
    } catch (e) {
      const f = await shot(page, outDir, `${tabLabel}-dead-${t.label.replace(/\W+/g, '_').slice(0, 18)}`);
      add('P1', `${tabLabel}: CTA click threw`, `${t.label}: ${String(e.message).slice(0, 80)}`, [t.id ? `#${t.id}` : '#view'], f, false);
      continue;
    }
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({
      tab: state?.tab,
      sheet: document.body.classList.contains('sheet-open'),
      viewLen: document.querySelector('#view')?.innerHTML?.length || 0,
    }));
    const changed = before.tab !== after.tab || before.sheet !== after.sheet || before.viewLen !== after.viewLen;
    if (!ok) {
      add('P1', `${tabLabel}: dead CTA`, t.label, [t.id ? `#${t.id}` : '#view'], null, false);
    } else if (!changed) {
      add('P2', `${tabLabel}: CTA no effect`, t.label, [t.id ? `#${t.id}` : '#view'], null, false);
    }
    await forceCloseSheets(page);
    if (after.tab !== before.tab) {
      await goTab(page, before.tab);
    }
  }
}

async function testSheetClose(page, outDir, openFn, name) {
  await forceCloseSheets(page);
  await goTab(page, 'home');
  try {
    await openFn();
  } catch (e) {
    const f = await shot(page, outDir, `${name}-open-fail`);
    add('P1', `${name}: open failed`, String(e.message || e).slice(0, 120), ['#btnNotifs', '#sheetBg'], f, false);
    await forceCloseSheets(page);
    return;
  }
  await page.waitForTimeout(400);
  const opened = await page.evaluate(
    () => document.body.classList.contains('sheet-open') || !!document.querySelector('.sheet.on, #sheet.on'),
  );
  const openShot = await shot(page, outDir, `${name}-open`);
  if (!opened) {
    add('P2', `${name}: no sheet visible`, 'After open action', [], openShot, false);
    return;
  }
  await page.evaluate(() => {
    document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
    if (typeof closeSheet === 'function') closeSheet();
  });
  await page.waitForTimeout(300);
  let bg = await sheetBgState(page);
  if (bg.blocks || bg.sheetOpen) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    bg = await sheetBgState(page);
  }
  const closedShot = await shot(page, outDir, `${name}-closed`);
  if (bg.on && bg.blocks) {
    add('P0', `${name}: orphan #sheetBg.on`, `pe=${bg.pe}`, ['#sheetBg'], closedShot, false);
  } else if (bg.sheetOpen) {
    add('P0', `${name}: sheet stuck open`, 'body.sheet-open', ['#sheet'], closedShot, false);
  } else {
    add('P2', `${name}: sheet cycle`, 'Open/close OK', ['#btnNotifs', '#sheetClose'], openShot, true);
  }
  await forceCloseSheets(page);
}

async function runViewport(vpLabel, width, height) {
  const outDir = path.join(OUT_ROOT, vpLabel);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    ...devices['iPhone 15 Pro'],
    viewport: { width, height },
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();

  page.on('pageerror', (err) => pageErrors.push(`[${vpLabel}] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (/favicon|Download the React|net::ERR_FAILED|Failed to load resource/i.test(t)) return;
      consoleErrors.push(`[${vpLabel}] ${t}`);
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem('paidia.lang', 'el');
    localStorage.setItem('paidia.uiMode', 'pro');
    localStorage.setItem('paidia.tourSeen', '1');
    localStorage.setItem('paidia.tipsSeen', '1');
    localStorage.setItem('paidia.pwaInstallDismiss', '1');
    localStorage.setItem('paidia.onboardingDone', '1');
  });

  console.log(`\n=== ${vpLabel} login ===`);
  await login(ctx, 'e4', 'staff');
  await boot(page);

  const v294 = await page.evaluate(() => !!document.querySelector('link[href*="ui-v294"]'));
  if (!v294) {
    add('P0', 'ui-v294.css not linked', 'Missing link[href*="ui-v294"] on /m/', ['link[href*="ui-v294"]', 'mobile/index.html'], null, false, vpLabel);
  } else {
    add('P2', 'ui-v294 loaded', 'Stylesheet link present', ['link[href*="ui-v294"]'], null, true, vpLabel);
  }

  // Dock walk
  console.log(`=== ${vpLabel} tabs ===`);
  for (const tab of STAFF_TABS) {
    const extra = tab === 'schedule' ? { scheduleView: 'day' } : tab === 'admin' ? { adminPane: 'ops' } : {};
    await goTab(page, tab, extra);
    const f = await shot(page, outDir, `tab-${tab}`);
    const layout = await probeLayout(page, tab);
    if (!layout.uiV294 && vpLabel === '390x844') {
      add('P0', `${tab}: ui-v294 missing`, 'DOM probe', ['link[href*="ui-v294"]'], f, false, vpLabel);
    }
    if (layout.overflows) {
      add('P1', `${tab}: horizontal overflow`, `scrollWidth > ${width}`, ['#view', 'ui-v294.css'], f, false, vpLabel);
    }
    for (const u of layout.underDock) {
      add('P1', `${tab}: under dock`, `${u.label} (${u.sel})`, [u.sel, 'nav.dock'], f, false, vpLabel);
    }
    for (const c of layout.clipped) {
      add('P2', `${tab}: clipped text`, `"${c}"`, ['#view .m-title'], f, false, vpLabel);
    }
    if (tab === 'home') {
      const j = await hitTestButton(page, '#homeShiftJournal');
      if (!j.missing) {
        if (j.hitIsDock) {
          add('P0', 'home: #homeShiftJournal dock steal', `hit=${j.hitSel}`, ['#homeShiftJournal', 'nav.dock'], f, false, vpLabel);
        } else if (!j.clear) {
          add('P1', 'home: #homeShiftJournal overlaps dock', `bottom=${j.btnBottom} dock=${j.dockTop}`, ['#homeShiftJournal'], f, false, vpLabel);
        } else {
          add('P2', 'home: #homeShiftJournal clear', 'elementFromPoint OK', ['#homeShiftJournal'], f, true, vpLabel);
        }
      }
    }
    await clickTopCTAs(page, outDir, tab, 5);
  }

  // Schedule week
  await goTab(page, 'schedule', { scheduleView: 'week' });
  const schedW = await shot(page, outDir, 'tab-schedule-week');
  const lw = await probeLayout(page, 'schedule-week');
  if (lw.overflows) add('P1', 'schedule-week: overflow', 'Horizontal scroll', ['#view'], schedW, false, vpLabel);

  // Admin panes
  for (const pane of ADMIN_PANES) {
    await goTab(page, 'admin', { adminPane: pane });
    const af = await shot(page, outDir, `admin-${pane}`);
    const la = await probeLayout(page, `admin-${pane}`);
    if (la.overflows) add('P1', `admin/${pane}: overflow`, 'Horizontal scroll', ['.admin-section-nav'], af, false, vpLabel);
    if (pane === 'ops' && la.underDock.length) {
      add('P1', `admin/${pane}: under dock`, la.underDock[0].label, [la.underDock[0].sel], af, false, vpLabel);
    }
  }

  // Sheets
  await forceCloseSheets(page);
  await goTab(page, 'home');
  await testSheetClose(page, outDir, () => page.locator('#btnNotifs').click({ timeout: 8000 }), 'notifs');
  await testSheetClose(page, outDir, () => page.locator('#btnUser').click({ timeout: 8000 }), 'account');

  // Mehr — 3+ destinations
  await forceCloseSheets(page);
  await goTab(page, 'home');
  const mehrBtn = page.locator('nav.dock button').filter({ hasText: /Άλλα|Mehr|More|···/ }).first();
  try {
    await mehrBtn.click({ timeout: 5000 });
    await page.waitForTimeout(400);
    await shot(page, outDir, 'mehr-open');
    const dests = await page.evaluate(() => {
      const sheet = document.querySelector('#sheet, .sheet.on, [role="dialog"]');
      if (!sheet) return [];
      return [...sheet.querySelectorAll('button, a, [role="menuitem"]')]
        .map((el) => ({
          label: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 48),
          tab: el.dataset?.tab || el.getAttribute('data-tab') || null,
        }))
        .filter((d) => d.label.length > 1)
        .slice(0, 12);
    });
    let navigated = 0;
    for (const d of dests.slice(0, 5)) {
      await forceCloseSheets(page);
      await goTab(page, 'home');
      await mehrBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(350);
      const clicked = await page.evaluate((label) => {
        const sheet = document.querySelector('#sheet, .sheet.on');
        if (!sheet) return false;
        const btn = [...sheet.querySelectorAll('button, a')].find((el) => (el.innerText || '').includes(label.slice(0, 12)));
        if (!btn) return false;
        btn.click();
        return true;
      }, d.label);
      if (clicked) {
        navigated++;
        await page.waitForTimeout(400);
        await shot(page, outDir, `mehr-to-${d.label.replace(/\W+/g, '_').slice(0, 20)}`);
      }
    }
    if (navigated >= 3) {
      add('P2', 'Mehr: 3+ destinations', `Opened ${navigated} from sheet`, ['nav.dock', '#sheet'], 'mehr-open.png', true, vpLabel);
    } else {
      add('P1', 'Mehr: few destinations', `Only ${navigated} navigations; dests=${dests.length}`, ['nav.dock button'], 'mehr-open.png', false, vpLabel);
    }
    await forceCloseSheets(page);
  } catch (e) {
    add('P1', 'Mehr sheet', String(e.message).slice(0, 100), ['nav.dock'], null, false, vpLabel);
  }

  // Stock-check from homeShiftStock
  await goTab(page, 'home');
  await testSheetClose(
    page,
    outDir,
    () => page.locator('#homeShiftStock').click({ timeout: 8000 }),
    'stock-check-homeShiftStock',
  );

  const orphan = await sheetBgState(page);
  await forceCloseSheets(page);
  const finalShot = await shot(page, outDir, 'final-home');
  if (orphan.on) {
    add('P0', 'orphan #sheetBg.on end', `pe=${orphan.pe}`, ['#sheetBg'], finalShot, false, vpLabel);
  }

  await browser.close();
}

console.log('Deep staff QA — Armonia Paidia /m/');
await runViewport('390x844', 390, 844);
await runViewport('375x667', 375, 667);

const rank = { P0: 0, P1: 1, P2: 2 };
const uniq = [];
const keys = new Set();
for (const f of findings.sort((a, b) => rank[a.sev] - rank[b.sev])) {
  const k = `${f.sev}|${f.title}|${f.detail.slice(0, 80)}|${f.viewport}`;
  if (keys.has(k)) continue;
  keys.add(k);
  uniq.push(f);
}

const bad = uniq.filter((f) => !f.works && f.sev !== 'P2');
const p0 = uniq.filter((f) => f.sev === 'P0' && !f.works).length;
const p1 = uniq.filter((f) => f.sev === 'P1' && !f.works).length;
const p2 = uniq.filter((f) => f.sev === 'P2' && !f.works).length;
let score = 10;
score -= p0 * 2.5;
score -= p1 * 0.45;
score -= p2 * 0.08;
score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

const worksList = uniq.filter((f) => f.works).map((f) => f.title);

const topFixes = bad
  .filter((f) => f.sev === 'P0' || f.sev === 'P1')
  .slice(0, 5)
  .map((f) => `- **${f.title}** (${f.sev}) — ${f.selectors?.[0] || 'see report'} — ${f.shot || 'no shot'}`);

const lines = [];
lines.push('# Deep staff mobile QA — `/m/`');
lines.push('');
lines.push(`- **When:** ${new Date().toISOString()}`);
lines.push(`- **Base:** ${BASE}/m/`);
lines.push(`- **Auth:** e4 staff · EL · pro · SW blocked`);
lines.push(`- **Viewports:** 390×844 (primary), 375×667 (probe)`);
lines.push(`- **Score:** **${score}/10**`);
lines.push(`- **Issues:** P0=${p0} P1=${p1} P2=${p2} (unique ${uniq.length})`);
lines.push('');
lines.push('## P0 / P1 / P2');
lines.push('');
for (const sev of ['P0', 'P1', 'P2']) {
  const items = uniq.filter((f) => f.sev === sev && !f.works);
  if (!items.length) {
    lines.push(`### ${sev}`);
    lines.push('');
    lines.push('_None_');
    lines.push('');
    continue;
  }
  lines.push(`### ${sev}`);
  lines.push('');
  for (const f of items) {
    lines.push(`- **${f.title}** (${f.viewport})`);
    lines.push(`  - ${f.detail}`);
    if (f.selectors?.length) lines.push(`  - Selectors: ${f.selectors.map((s) => `\`${s}\``).join(', ')}`);
    if (f.shot) lines.push(`  - Screenshot: \`.qa-screens/${f.shot}\``);
  }
  lines.push('');
}

lines.push('## What works');
lines.push('');
[...new Set(worksList)].slice(0, 25).forEach((t) => lines.push(`- ${t}`));
lines.push('');
lines.push('## Top 5 fixes');
lines.push('');
if (topFixes.length) topFixes.forEach((l) => lines.push(l));
else lines.push('- No P0/P1 blockers in this run.');
lines.push('');
if (pageErrors.length) {
  lines.push('## Page errors');
  lines.push('');
  [...new Set(pageErrors)].forEach((e) => lines.push(`- ${e.slice(0, 200)}`));
  lines.push('');
}

fs.writeFileSync(path.join(OUT_ROOT, 'REPORT.md'), lines.join('\n'));
fs.writeFileSync(
  path.join(OUT_ROOT, 'findings.json'),
  JSON.stringify({ score, p0, p1, p2, findings: uniq, pageErrors, consoleErrors }, null, 2),
);

console.log(JSON.stringify({ score, p0, p1, p2, out: OUT_ROOT }, null, 2));
process.exit(p0 > 0 ? 1 : 0);
