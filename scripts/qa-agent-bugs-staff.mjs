/**
 * Staff-only mobile bug hunt for /m/ — Playwright iPhone 15 Pro.
 *   node scripts/qa-agent-bugs-staff.mjs
 * Output: .qa-screens/agent-bugs-staff/
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'agent-bugs-staff');
fs.mkdirSync(OUT, { recursive: true });

const PHONE = { ...devices['iPhone 15 Pro'], viewport: { width: 390, height: 844 }, serviceWorkers: 'block' };
const findings = [];
const consoleErrors = [];
const pageErrors = [];

function add(sev, title, detail, selectors = [], shot = null, works = false) {
  findings.push({ sev, title, detail, selectors, shot, works, at: new Date().toISOString() });
  console.log(`  [${sev}] ${title}: ${detail}${works ? ' (OK)' : ''}`);
}

async function shot(page, name) {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(OUT, file), fullPage: false }).catch(() => {});
  return file;
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

async function applyLocalPrefs(page) {
  await page.evaluate(() => {
    localStorage.setItem('paidia.lang', 'el');
    localStorage.setItem('paidia.uiMode', 'pro');
    localStorage.setItem('paidia.tourSeen', '1');
    localStorage.setItem('paidia.tipsSeen', '1');
    localStorage.setItem('paidia.pwaInstallDismiss', '1');
    localStorage.setItem('paidia.onboardingDone', '1');
  });
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
    const vh = innerHeight;
    const dock = document.querySelector('nav.dock[data-staff-dock], nav.dock');
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;
    const isVis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };
    const overflows = document.documentElement.scrollWidth > vw + 8;
    const lowContrast = [];
    [...document.querySelectorAll('#view button, #view a, #view .m-title, #view .pa, header button')]
      .slice(0, 80)
      .forEach((el) => {
        if (!isVis(el)) return;
        const s = getComputedStyle(el);
        const fg = s.color;
        const bg = s.backgroundColor;
        if (fg === bg && fg !== 'rgba(0, 0, 0, 0)') {
          lowContrast.push({ tag: el.tagName, id: el.id, cls: (el.className || '').toString().slice(0, 40) });
        }
      });
    const clipped = [];
    [...document.querySelectorAll('#view h1, #view h2, #view .m-title, nav.dock button span')]
      .slice(0, 40)
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
    return { label, overflows, lowContrast: lowContrast.slice(0, 5), clipped: clipped.slice(0, 6), underDock: underDock.slice(0, 8), dockTop: Math.round(dockTop), tab: document.body.dataset.tab || state?.tab };
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

async function testSheetClose(page, openFn, name) {
  await forceCloseSheets(page);
  await page.evaluate(() => {
    state.tab = 'home';
    render();
    scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  const beforeTab = await page.evaluate(() => state?.tab || document.body.dataset.tab);
  try {
    await openFn();
  } catch (e) {
    const f = await shot(page, `${name}-open-fail`);
    add('P1', `${name}: could not open sheet`, String(e.message || e).slice(0, 160), ['#btnNotifs', '#sheetBg'], f, false);
    await forceCloseSheets(page);
    return;
  }
  await page.waitForTimeout(400);
  const opened = await page.evaluate(
    () => document.body.classList.contains('sheet-open') || !!document.querySelector('.sheet.on, #sheet.on'),
  );
  const openShot = await shot(page, `${name}-open`);
  if (!opened) {
    add('P2', `${name}: sheet did not open`, 'No sheet-open / .sheet.on after open action', [name], openShot, false);
    return;
  }
  await page.evaluate(() => {
    document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
    if (typeof closeSheet === 'function') closeSheet();
  });
  await page.waitForTimeout(300);
  let bg = await sheetBgState(page);
  if (bg.blocks || bg.sheetOpen) {
    await page.mouse.click(20, 40);
    await page.waitForTimeout(200);
    bg = await sheetBgState(page);
  }
  if (bg.blocks || bg.sheetOpen) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    bg = await sheetBgState(page);
  }
  const closedShot = await shot(page, `${name}-after-close`);
  if (bg.on && bg.blocks) {
    add(
      'P0',
      `${name}: #sheetBg.on blocks taps after close`,
      `sheetBg.on=${bg.on} pointer-events=${bg.pe} sheet-open=${bg.sheetOpen}`,
      ['#sheetBg', 'closeSheet()', 'ensureSheetChromeConsistent'],
      closedShot,
      false,
    );
  } else if (bg.sheetOpen) {
    add('P0', `${name}: sheet stuck open`, 'body.sheet-open remains', ['body.sheet-open', '#sheet'], closedShot, false);
  } else {
    add('P2', `${name}: sheet open/close`, 'Opened and closed cleanly', ['#sheetBg', '#sheetClose'], openShot, true);
  }
  await forceCloseSheets(page);
  const afterTab = await page.evaluate(() => state?.tab || document.body.dataset.tab);
  if (beforeTab && afterTab !== beforeTab) {
    add('P2', `${name}: tab changed after sheet`, `${beforeTab} → ${afterTab}`, [], closedShot, false);
  }
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext(PHONE);
const page = await ctx.newPage();

page.on('pageerror', (err) => {
  pageErrors.push(err.message);
});
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const t = msg.text();
    if (/favicon|Download the React|net::ERR_FAILED|Failed to load resource/i.test(t)) return;
    consoleErrors.push(t);
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

console.log('=== login staff e4 ===');
await login(ctx, 'e4', 'staff');
await boot(page);

// ── Dock walk (real clicks) ─────────────────────────────────────────────
console.log('=== dock tabs ===');
const dockInfo = await page.evaluate(() =>
  [...document.querySelectorAll('nav.dock[data-staff-dock] button, nav.dock button[data-tab]')].map((b) => ({
    tab: b.dataset.tab,
    label: (b.innerText || '').replace(/\s+/g, ' ').trim(),
    disabled: b.disabled,
  })),
);
console.log('  dock:', dockInfo);

for (const { tab, label } of dockInfo) {
  if (!tab) continue;
  const tabBefore = await page.evaluate(() => state?.tab);
  const visible = await page.locator(`nav.dock button[data-tab="${tab}"]`).isVisible().catch(() => false);
  if (!visible) {
    const viaState = await page.evaluate((t) => {
      state.tab = t;
      if (t === 'schedule') setScheduleView('day', { persist: false });
      if (t === 'admin') state.adminPane = 'ops';
      render();
      scrollTo(0, 0);
      return state.tab === t;
    }, tab);
    if (!viaState) {
      const f = await shot(page, `dock-fail-${tab}`);
      add('P1', `dock: ${label} not in visible rail`, `Overflow tab — reached via state.tab=${tab}`, [`nav.dock button[data-tab="${tab}"]`, '··· Άλλα sheet'], f, viaState);
    }
  } else {
    try {
      await page.locator(`nav.dock button[data-tab="${tab}"]`).click({ timeout: 5000 });
    } catch (e) {
      await page.evaluate((t) => {
        state.tab = t;
        if (t === 'schedule') setScheduleView('day', { persist: false });
        render();
      }, tab);
      const f = await shot(page, `dock-fail-${tab}`);
      add('P1', `dock: ${label} tap failed, used state.tab`, String(e.message).slice(0, 100), [`nav.dock button[data-tab="${tab}"]`], f, true);
    }
  }
  await page.waitForTimeout(350);
  const tabAfter = await page.evaluate(() => state?.tab);
  const f = await shot(page, `dock-${tab}`);
  const layout = await probeLayout(page, `dock-${tab}`);
  if (layout.overflows) {
    add('P1', `${tab}: horizontal overflow`, `scrollW > vw on ${tab}`, ['#view', 'mobile/m-ui.css'], f, false);
  }
  for (const u of layout.underDock) {
    add('P1', `${tab}: control under dock`, `${u.label} (${u.sel}) dockTop=${u.dockTop}`, [u.sel, 'nav.dock'], f, false);
  }
  for (const c of layout.clipped) {
    add('P2', `${tab}: clipped text`, `"${c}"`, ['nav.dock button span', '#view .m-title'], f, false);
  }
  if (tabAfter !== tab) {
    add('P1', `dock ${label}: tab mismatch`, `expected ${tab}, got ${tabAfter}`, [`nav.dock button[data-tab="${tab}"]`], f, false);
  } else {
    add('P2', `dock ${label}`, `Navigated to tab ${tab}`, [`nav.dock button[data-tab="${tab}"]`], f, true);
  }
}

// Return home
await page.locator('nav.dock button[data-tab="home"]').click().catch(() => {});
await page.waitForTimeout(300);
await shot(page, 'staff-home-initial');

// ── Home shift CTAs geometry ─────────────────────────────────────────────
console.log('=== home shift CTAs ===');
for (const sel of ['#homeShiftJournal', '#homeShiftStock', '#homeShiftPresence', '#homeShiftPresenceStep']) {
  const ht = await hitTestButton(page, sel);
  const f = await shot(page, `home-cta-${sel.replace('#', '')}`);
  if (ht.missing) continue;
  if (ht.hitIsDock) {
    add(
      'P0',
      'home: shift CTA hit-stolen by dock',
      `${sel} center → dock (${ht.hitSel}); btnBottom=${ht.btnBottom} dockTop=${ht.dockTop}`,
      [sel, 'nav.dock', '--m-dock-h'],
      f,
      false,
    );
  } else if (!ht.clear) {
    add('P1', 'home: shift CTA overlaps dock band', `${sel} bottom=${ht.btnBottom} dockTop=${ht.dockTop}`, [sel, 'nav.dock'], f, false);
  } else {
    add('P2', `home: ${sel} geometry`, 'Clear of dock; center hits control', [sel], f, true);
  }
}

// ── Click home CTAs ───────────────────────────────────────────────────────
console.log('=== home click-all ===');
await page.locator('nav.dock button[data-tab="home"]').click().catch(() => {});
await page.waitForTimeout(250);

const homeTargets = await page.evaluate(() => {
  const dock = document.querySelector('nav.dock');
  const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
  const sels = [
    '#homeShiftJournal',
    '#homeShiftStock',
    '#homeShiftPresence',
    '#homeShiftPresenceStep',
    '#btnNotifs',
  ];
  const out = [];
  for (const sel of sels) {
    const el = document.querySelector(sel);
    if (el) out.push({ kind: 'id', sel, label: sel });
  }
  [...document.querySelectorAll('#view .home-task-row, #view .m-row.home-task, #view [data-home-task], #view .shift-task-row, #view .home-shift-step')]
    .slice(0, 12)
    .forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.height < 8 || r.top >= dockTop - 4) return;
      out.push({ kind: 'row', sel: `[data-idx="${i}"]`, label: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40), idx: i });
    });
  if (state.tab !== 'home') return out;
  [...document.querySelectorAll('#view button:not([disabled]), #view .page-act, #view .home-shift-primary')]
    .slice(0, 16)
    .forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 18 || r.top >= dockTop - 2) return;
      if (el.id === 'btnNotifs' || el.id === 'btnUser') return;
      if (/shop|cart|store|lager|schedule-agenda|planner/i.test(`${el.id} ${el.className}`)) return;
      const id = el.id ? `#${el.id}` : null;
      if (id && out.some((o) => o.sel === id)) return;
      out.push({ kind: 'btn', sel: id || `.${(el.className || '').toString().split(' ')[0]}`, label: (el.innerText || el.id || 'btn').replace(/\s+/g, ' ').trim().slice(0, 40), elIdx: out.length });
    });
  return out.slice(0, 24);
});

for (const t of homeTargets) {
  await forceCloseSheets(page);
  const before = await page.evaluate(() => ({
    tab: state?.tab,
    sheet: document.body.classList.contains('sheet-open'),
    hash: location.hash,
    viewLen: document.querySelector('#view')?.innerHTML?.length || 0,
  }));
  let clicked = false;
  try {
    if (t.kind === 'row') {
      clicked = await page.evaluate((idx) => {
        const rows = [...document.querySelectorAll('#view .home-task-row, #view .m-row.home-task, #view [data-home-task], #view .shift-task-row, #view .home-shift-step')];
        const el = rows[idx];
        if (!el) return false;
        el.click();
        return true;
      }, t.idx);
    } else if (t.sel.startsWith('#')) {
      await page.locator(t.sel).click({ timeout: 8000, force: false });
      clicked = true;
    }
  } catch (e) {
    const bg = await sheetBgState(page);
    const f = await shot(page, `home-click-fail-${t.label.replace(/\W+/g, '_').slice(0, 20)}`);
    if (bg.blocks) {
      add('P0', 'home: click blocked by #sheetBg.on', `${t.sel || t.label}: ${String(e.message).slice(0, 80)}`, ['#sheetBg.on', t.sel].filter(Boolean), f, false);
    } else {
      add('P1', 'home: CTA click failed', `${t.label} (${t.sel}): ${String(e.message).slice(0, 100)}`, [t.sel].filter(Boolean), f, false);
    }
    await forceCloseSheets(page);
    continue;
  }
  await page.waitForTimeout(350);
  const after = await page.evaluate(() => ({
    tab: state?.tab,
    sheet: document.body.classList.contains('sheet-open'),
    hash: location.hash,
    viewLen: document.querySelector('#view')?.innerHTML?.length || 0,
  }));
  const f = await shot(page, `home-after-${t.label.replace(/\W+/g, '_').slice(0, 22)}`);
  const changed = before.tab !== after.tab || before.sheet !== after.sheet || before.viewLen !== after.viewLen || before.hash !== after.hash;
  if (t.sel === '#homeShiftJournal' && after.tab === 'stock') {
    add('P0', 'home: journal CTA navigates to stock', 'Click stole by dock or wrong handler', ['#homeShiftJournal', 'nav.dock button[data-tab="stock"]'], f, false);
  } else if (!changed && t.sel !== '#btnNotifs') {
    add('P2', 'home: CTA no visible effect', `${t.label} — may be completed state`, [t.sel].filter(Boolean), f, false);
  } else if (changed) {
    add('P2', `home: ${t.label}`, 'Tap produced UI change', [t.sel].filter(Boolean), f, true);
  }
  await forceCloseSheets(page);
  if (after.tab !== 'home') {
    await page.locator('nav.dock button[data-tab="home"]').click().catch(() => {});
    await page.waitForTimeout(250);
  }
}

// Notifications sheet (Playwright click — catches pointer intercept)
await testSheetClose(page, () => page.locator('#btnNotifs').click({ timeout: 8000 }), 'staff-notifs');
await testSheetClose(page, () => page.locator('#btnUser').click({ timeout: 8000 }), 'staff-user');
await testSheetClose(
  page,
  () =>
    page.locator('nav.dock button').filter({ hasText: /Άλλα|Mehr|More|···/ }).first().click({ timeout: 5000 }),
  'staff-more',
);

await page.locator('nav.dock button[data-tab="stock"]').click().catch(() => {});
await page.waitForTimeout(300);
await testSheetClose(
  page,
  () =>
    page.evaluate(() => {
      const b = document.querySelector('#homeShiftStock') || [...document.querySelectorAll('#view button')].find((el) => /Έλεγχος|Kontrolle|Check|Αποθήκ/i.test(el.innerText || ''));
      b?.click();
    }),
  'staff-stock-check',
);

// Admin via more if present
await forceCloseSheets(page);
await page.locator('nav.dock button[data-tab="home"]').click().catch(() => {});
await page.waitForTimeout(200);
const adminReach = await page.evaluate(() => {
  state.tab = 'admin';
  state.adminPane = 'ops';
  render();
  return !!document.querySelector('#view .admin-pane, #view [data-admin-pane], #view .m-admin');
});
if (adminReach) {
  await shot(page, 'staff-admin-ops');
  add('P2', 'admin ops pane', 'Renderable via state.tab=admin', ['state.tab=admin', 'nav.dock / more sheet'], 'staff-admin-ops.png', true);
} else {
  await page.locator('nav.dock button').filter({ hasText: /Άλλα|Mehr|More/ }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, 'staff-more-admin-probe');
}

// Post-run sheetBg orphan
await forceCloseSheets(page);
const orphanBg = await sheetBgState(page);
const homeFinal = await shot(page, 'staff-home-final');
if (orphanBg.on) {
  add('P0', 'home: orphan #sheetBg.on after QA', `pointer-events=${orphanBg.pe}`, ['#sheetBg', 'ensureSheetChromeConsistent()'], homeFinal, false);
}

const layoutHome = await probeLayout(page, 'home-final');
if (layoutHome.lowContrast.length) {
  for (const lc of layoutHome.lowContrast) {
    add('P2', 'home: possible white-on-white', `${lc.tag} id=${lc.id} class=${lc.cls}`, [lc.id ? `#${lc.id}` : lc.cls], homeFinal, false);
  }
}

for (const e of [...new Set(pageErrors)]) {
  add('P0', 'runtime pageerror', e.slice(0, 240), ['app.js'], null, false);
}
for (const e of [...new Set(consoleErrors)].slice(0, 15)) {
  add('P1', 'console.error', e.slice(0, 200), [], null, false);
}

await browser.close();

const rank = { P0: 0, P1: 1, P2: 2 };
findings.sort((a, b) => rank[a.sev] - rank[b.sev] || a.title.localeCompare(b.title));
const uniq = [];
const keys = new Set();
for (const f of findings) {
  const k = `${f.sev}|${f.title}|${f.detail.slice(0, 90)}`;
  if (keys.has(k)) continue;
  keys.add(k);
  uniq.push(f);
}
const bySev = uniq.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});

const lines = [];
lines.push('# Staff mobile QA — `/m/` (agent-bugs-staff)');
lines.push('');
lines.push(`- **When:** ${new Date().toISOString()}`);
lines.push(`- **Base:** ${BASE}/m/`);
lines.push(`- **Auth:** e4 staff PIN from pins.json`);
lines.push(`- **Viewport:** iPhone 15 Pro 390×844, serviceWorkers blocked`);
lines.push(`- **Counts:** ${JSON.stringify(bySev)} (${uniq.length} unique)`);
lines.push('');
lines.push('## Findings (P0 → P2)');
lines.push('');
let i = 1;
for (const f of uniq.filter((x) => !x.works || x.sev !== 'P2')) {
  if (f.works && f.sev === 'P2' && /geometry|Navigated|sheet open/i.test(f.title)) continue;
}
for (const f of uniq) {
  if (f.works && f.sev === 'P2' && /^(dock |home: #home|admin ops|staff-notifs: sheet|staff-user: sheet|staff-more: sheet)/.test(f.title)) {
    continue;
  }
  lines.push(`### ${i}. [${f.sev}] ${f.title}`);
  lines.push('');
  lines.push(`- **Detail:** ${f.detail}`);
  lines.push(`- **UI OK:** ${f.works ? 'yes' : 'no'}`);
  if (f.selectors?.length) lines.push(`- **Selectors:** ${f.selectors.map((s) => `\`${s}\``).join(', ')}`);
  if (f.shot) lines.push(`- **Screenshot:** \`.qa-screens/agent-bugs-staff/${f.shot}\``);
  lines.push('');
  i++;
}

lines.push('## Passing checks (sample)');
lines.push('');
uniq.filter((f) => f.works).slice(0, 20).forEach((f) => {
  lines.push(`- [${f.sev}] ${f.title}${f.shot ? ` — \`${f.shot}\`` : ''}`);
});

fs.writeFileSync(path.join(OUT, 'REPORT.md'), lines.join('\n'));
fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify({ at: new Date().toISOString(), bySev, findings: uniq, pageErrors, consoleErrors }, null, 2));

console.log(JSON.stringify({ unique: uniq.length, bySev, out: OUT }, null, 2));
process.exit(uniq.some((f) => f.sev === 'P0' && !f.works) ? 1 : 0);
