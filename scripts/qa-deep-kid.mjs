/**
 * Deep mobile QA — child /m/ only.
 *   node scripts/qa-deep-kid.mjs
 * Output: .qa-screens/deep-kid/
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'deep-kid');
fs.mkdirSync(OUT, { recursive: true });

const PHONE = { ...devices['iPhone 15 Pro'], viewport: { width: 390, height: 844 }, serviceWorkers: 'block' };
const findings = [];
const consoleErrors = [];
const pageErrors = [];
const cleared = [];
const shots = [];

function add(sev, title, detail, selectors = [], shot = null) {
  findings.push({ sev, title, detail, selectors, shot, at: new Date().toISOString() });
  console.log(`  [${sev}] ${title}: ${detail}`);
}

async function shot(page, name) {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(OUT, file), fullPage: false }).catch(() => {});
  if (!shots.includes(file)) shots.push(file);
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

function dockProbeScript() {
  const dock = document.querySelector('nav.kid-dock, #bottomPanel');
  const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
  const isVis = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const hitDock = (el) => {
    const r = el.getBoundingClientRect();
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    const hit = document.elementFromPoint(cx, cy);
    return {
      cx: Math.round(cx),
      cy: Math.round(cy),
      bottom: Math.round(r.bottom),
      dockTop: Math.round(dockTop),
      stolen: !!(hit && hit.closest('nav.kid-dock, #bottomPanel')),
      clear: r.bottom < dockTop - 4,
    };
  };
  return { dockTop: Math.round(dockTop), isVis, hitDock };
}

async function hitTestSelectors(page, selectors, label) {
  const results = await page.evaluate((sels) => {
    const dock = document.querySelector('nav.kid-dock, #bottomPanel');
    const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
    const out = [];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) {
        out.push({ sel, missing: true });
        continue;
      }
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      const hit = document.elementFromPoint(cx, cy);
      out.push({
        sel,
        missing: false,
        display: s.display,
        w: Math.round(r.width),
        h: Math.round(r.height),
        bottom: Math.round(r.bottom),
        dockTop: Math.round(dockTop),
        stolen: !!(hit && hit.closest('nav.kid-dock, #bottomPanel')),
        clear: r.bottom < dockTop - 4,
      });
    }
    return out;
  }, selectors);

  for (const r of results) {
    if (r.missing) {
      add('P2', `${label}: missing`, r.sel, [r.sel]);
      continue;
    }
    if (r.display === 'none' || r.w < 2) continue;
    if (r.stolen) {
      add(
        'P0',
        `${label}: tap stolen by dock`,
        `${r.sel} bottom=${r.bottom} dockTop=${r.dockTop}`,
        [r.sel, 'nav.kid-dock'],
        null,
      );
    } else if (!r.clear) {
      add(
        'P1',
        `${label}: overlaps dock zone`,
        `${r.sel} bottom=${r.bottom} dockTop=${r.dockTop}`,
        [r.sel],
        null,
      );
    }
  }
  return results;
}

async function clickDockTab(page, viewId) {
  const sel = `nav.kid-dock button[data-child-view="${viewId}"]`;
  const loc = page.locator(sel);
  if ((await loc.count()) === 0) {
    add('P0', `dock missing primary tab`, `No ${sel} (expected only today/games/rate + More)`, [sel]);
    return null;
  }
  const before = await page.evaluate(() => (typeof state !== 'undefined' ? state.childView : '') || '');
  await loc.first().click({ timeout: 8000 });
  await page.waitForTimeout(350);
  const after = await page.evaluate(() => (typeof state !== 'undefined' ? state.childView : '') || '');
  const file = await shot(page, `dock-${viewId}`);
  if (after !== viewId) {
    add('P0', `dock tab dead or wrong view`, `clicked ${viewId}, before=${before} after=${after}`, [sel], file);
  } else {
    cleared.push(`dock-${viewId}`);
  }
  return after;
}

async function openMore(page) {
  await page.locator('#kidDockMore').first().click({ timeout: 8000 });
  await page.waitForTimeout(400);
  const opened = await page.evaluate(
    () => document.body.classList.contains('sheet-open') || !!document.querySelector('.sheet.on, #sheet.on'),
  );
  if (!opened) {
    add('P0', 'kid More sheet did not open', '#kidDockMore', ['#kidDockMore'], await shot(page, 'more-fail-open'));
    return false;
  }
  return true;
}

async function closeMore(page) {
  await page.evaluate(() => {
    document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
    if (typeof closeSheet === 'function') closeSheet();
  });
  await page.waitForTimeout(300);
}

async function goViaMore(page, viewId, shotName) {
  if (!(await openMore(page))) return;
  const sel = `#sheet [data-child-view="${viewId}"], .sheet [data-child-view="${viewId}"]`;
  const loc = page.locator(sel).first();
  if ((await loc.count()) === 0) {
    add('P1', `More menu missing ${viewId}`, sel, [sel], await shot(page, `more-missing-${viewId}`));
    await closeMore(page);
    return;
  }
  await loc.click({ timeout: 6000 });
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => (typeof state !== 'undefined' ? state.childView : '') || '');
  const file = await shot(page, shotName || `view-${viewId}`);
  if (after !== viewId) {
    add('P0', `More nav failed`, `expected ${viewId}, got ${after}`, [sel], file);
  } else {
    cleared.push(`more-${viewId}`);
  }
}

async function measureGradeUI(page) {
  await page.evaluate(() => {
    if (typeof goChildView === 'function') goChildView('rate');
    scrollTo(0, 0);
  });
  await page.waitForTimeout(350);
  const file = await shot(page, 'rate-grades');
  const info = await page.evaluate(() => {
    const picks = [...document.querySelectorAll('#view button.grade-pick[data-grade-val]')];
    const staff = document.querySelector('.child-staff-rating, .school-sub-row, .kid-rate-pc');
    return {
      pickCount: picks.length,
      hasStaffSummary: !!staff,
      small: picks.filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width < 44 || r.height < 44;
      }).length,
    };
  });
  if (!info.pickCount) {
    add(
      'P2',
      'rate: read-only grade UI (no grade-pick)',
      'Staff summary / stars only — expected for child bindKidExtras',
      ['.kid-rate-pc[data-tour="kid-rate"]', '.child-staff-rating'],
      file,
    );
    cleared.push('rate-readonly-ok');
  } else if (info.small) {
    add('P1', 'rate: grade buttons below 44px', `${info.small} small targets`, ['button.grade-pick'], file);
  } else {
    cleared.push('rate-grade-targets');
  }
}

async function probePocketDays(page) {
  await goViaMore(page, 'pocket', 'pocket');
  const calCell = page.locator('#view [data-pocket-day]').first();
  if ((await calCell.count()) === 0) {
    add('P1', 'pocket: no calendar day cells', 'missing [data-pocket-day]', ['[data-pocket-day]'], await shot(page, 'pocket-empty'));
    return;
  }
  const before = await page.evaluate(() => state.pocketDay);
  await calCell.click();
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => state.pocketDay);
  await shot(page, 'pocket-day-tap');
  if (before === after) {
    add('P1', 'pocket: day cell tap no-op', 'data-pocket-day did not change state.pocketDay', ['[data-pocket-day]'], 'pocket-day-tap.png');
  } else {
    cleared.push('pocket-day-cells');
  }
}

async function probeNotesFromMore(page) {
  await goViaMore(page, 'notes', 'notes');
  const hasNotes = await page.evaluate(() =>
    !!document.querySelector('#view .kid-notes, #view [data-notes-cal-day], #view textarea, #view .notes-list'),
  );
  if (!hasNotes) {
    add('P1', 'notes: view empty after More', 'notes sheet item opened but no notes UI', ['#sheet [data-child-view="notes"]'], await shot(page, 'notes-empty'));
  } else {
    cleared.push('notes-from-more');
  }
}

function scoreFromFindings(bySev) {
  let s = 10;
  s -= (bySev.P0 || 0) * 2.5;
  s -= (bySev.P1 || 0) * 0.75;
  s -= (bySev.P2 || 0) * 0.2;
  return Math.max(1, Math.min(10, Math.round(s * 10) / 10));
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext(PHONE);
const page = await ctx.newPage();

page.on('pageerror', (err) => pageErrors.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const t = msg.text();
    if (/favicon|Failed to load resource.*ui-v294|404.*ui-v294/i.test(t)) return;
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

console.log('=== deep kid QA k1 /m/ ===');
await login(ctx, 'k1', 'child');
await boot(page);

// Dock shape
const dockInfo = await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('nav.kid-dock button')].map((b) => ({
    label: (b.innerText || '').replace(/\s+/g, ' ').trim(),
    view: b.dataset.childView || (b.id === 'kidDockMore' ? 'more' : ''),
    isMore: b.id === 'kidDockMore' || b.classList.contains('kid-dock-more'),
  }));
  return { tabs, count: tabs.length };
});
await shot(page, '01-home-today');
console.log('dock', dockInfo.tabs.map((t) => t.label).join(' | '));

if (dockInfo.count !== 4) {
  add('P0', 'dock item count', `expected 4 (3 nav + Άλλα), got ${dockInfo.count}: ${dockInfo.tabs.map((t) => t.label).join(' | ')}`, ['nav.kid-dock'], '01-home-today.png');
}
const badDock = dockInfo.tabs.filter(
  (t) => !t.isMore && /Χαρτζιλίκι|Σημειώσεις|Pocket|Notizen|Taschengeld/i.test(t.label),
);
if (badDock.length) {
  add('P0', 'pocket/notes on primary dock', badDock.map((t) => t.label).join(', '), ['nav.kid-dock button[data-child-view]'], '01-home-today.png');
} else {
  cleared.push('dock-4-items');
}

const notesOnDock = await page.locator('nav.kid-dock button[data-child-view="notes"]').count();
const pocketOnDock = await page.locator('nav.kid-dock button[data-child-view="pocket"]').count();
if (notesOnDock || pocketOnDock) {
  add('P0', 'pocket/notes dock buttons present', `notes=${notesOnDock} pocket=${pocketOnDock}`, ['nav.kid-dock'], null);
}

// Hit-test home CTAs + next-up
await page.evaluate(() => {
  if (typeof goChildView === 'function') goChildView('today');
  scrollTo(0, 0);
});
await page.waitForTimeout(200);

const tileIds = await page.evaluate(() =>
  [...document.querySelectorAll('.kid-home-cta-tile[data-child-view]')]
    .map((el) => el.dataset.childView)
    .filter(Boolean),
);
const ctaSels = tileIds.map((id) => `.kid-home-cta-tile[data-child-view="${id}"]`);
ctaSels.push('#view button.next-up[data-child-view="games"]');
await hitTestSelectors(page, ctaSels, 'home hit-test');
await shot(page, '02-home-hit-test');

// Tap next-up if present
const nextUp = page.locator('#view button.next-up[data-child-view="games"]').first();
if ((await nextUp.count()) > 0) {
  const geom = await nextUp.evaluate((node) => {
    const r = node.getBoundingClientRect();
    return { cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 };
  });
  await page.mouse.click(geom.cx, geom.cy);
  await page.waitForTimeout(350);
  const v = await page.evaluate(() => state.childView);
  await shot(page, '03-next-up-games');
  if (v !== 'games') add('P0', 'next-up navigation', `expected games, got ${v}`, ['button.next-up[data-child-view="games"]'], '03-next-up-games.png');
  else cleared.push('next-up-games');
} else {
  const chip = await page.locator('#view .chip.on[data-child-view="games"]').count();
  if (chip) add('P0', 'legacy games chip on home', 'chip under dock risk still in DOM', ['#view .chip[data-child-view="games"]'], '02-home-hit-test.png');
}

// Primary dock walk
for (const view of ['today', 'games', 'rate']) {
  await clickDockTab(page, view);
  await shot(page, `04-tab-${view}`);
}

// More menu contents
if (await openMore(page)) {
  const moreText = await page.evaluate(() => document.querySelector('#sheet, .sheet')?.innerText || '');
  await shot(page, '05-more-open');
  if (!/Χαρτζιλίκι|Pocket|Taschengeld/i.test(moreText)) {
    add('P1', 'More missing pocket entry', 'sheet text has no pocket label', ['#kidDockMore', '#sheet [data-child-view="pocket"]'], '05-more-open.png');
  }
  if (!/Σημειώσ|Notizen|Notes/i.test(moreText)) {
    add('P1', 'More missing notes entry', 'sheet text has no notes label', ['#sheet [data-child-view="notes"]'], '05-more-open.png');
  } else {
    cleared.push('more-has-pocket-notes');
  }
  await closeMore(page);
  const stuck = await page.evaluate(() => document.body.classList.contains('sheet-open'));
  if (stuck) add('P0', 'More sheet stuck open', 'sheet-open after close', ['#sheetClose'], await shot(page, 'more-stuck'));
}

// Views via More + home CTAs where applicable
const moreViews = ['pocket', 'notes', 'bonus', 'plan', 'rewards', 'learn', 'gallery'];
for (const v of moreViews) {
  if (v === 'pocket') continue; // probePocketDays handles
  if (v === 'notes') continue;
  await goViaMore(page, v, `view-${v}`);
}

await probePocketDays(page);
await probeNotesFromMore(page);
await measureGradeUI(page);

// Home CTA navigation (pro tiles)
await page.evaluate(() => {
  goChildView('today');
  scrollTo(0, 0);
});
await page.waitForTimeout(250);
for (const id of ['bonus', 'plan', 'rewards']) {
  const vis = await page.evaluate((tileId) => {
    const el = document.querySelector(`.kid-home-cta-tile[data-child-view="${tileId}"]`);
    if (!el) return { missing: true };
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { missing: false, display: s.display, w: r.width, h: r.height };
  }, id);
  if (vis.missing) {
    add('P2', `home CTA missing: ${id}`, 'not in DOM', [`.kid-home-cta-tile[data-child-view="${id}"]`]);
    continue;
  }
  if (vis.display === 'none' || vis.w < 2) {
    add(
      'P1',
      `home CTA hidden (pro)`,
      `${id} display=${vis.display} size=${Math.round(vis.w)}×${Math.round(vis.h)}`,
      [`.kid-home-cta-tile[data-child-view="${id}"]`, 'body.mode-pro'],
      await shot(page, `cta-${id}-hidden`),
    );
    continue;
  }
  const el = page.locator(`.kid-home-cta-tile[data-child-view="${id}"]`).first();
  const geom = await el.evaluate((node) => {
    const r = node.getBoundingClientRect();
    const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return {
      cx: (r.left + r.right) / 2,
      cy: (r.top + r.bottom) / 2,
      stolen: !!(hit && hit.closest('nav.kid-dock, #bottomPanel')),
    };
  });
  if (geom.stolen) {
    add('P0', `home CTA tap stolen`, id, [`.kid-home-cta-tile[data-child-view="${id}"]`], await shot(page, `cta-${id}`));
    continue;
  }
  const before = await page.evaluate(() => state.childView);
  await page.mouse.click(geom.cx, geom.cy);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => state.childView);
  await shot(page, `cta-${id}`);
  if (after !== id) add('P1', `CTA nav`, `${id} expected, got ${after}`, [`.kid-home-cta-tile[data-child-view="${id}"]`], `cta-${id}.png`);
  else cleared.push(`cta-${id}`);
  await page.evaluate(() => {
    goChildView('today');
    scrollTo(0, 0);
  });
  await page.waitForTimeout(200);
}

for (const e of [...new Set(pageErrors)]) add('P0', 'pageerror', e, ['app.js']);
for (const e of [...new Set(consoleErrors)].slice(0, 8)) add('P1', 'console error', e.slice(0, 200), []);

await browser.close();

const rank = { P0: 0, P1: 1, P2: 2 };
findings.sort((a, b) => rank[a.sev] - rank[b.sev] || a.title.localeCompare(b.title));
const uniq = [];
const keys = new Set();
for (const f of findings) {
  const k = `${f.sev}|${f.title}|${f.detail.slice(0, 80)}`;
  if (keys.has(k)) continue;
  keys.add(k);
  uniq.push(f);
}
const bySev = uniq.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});
const score = scoreFromFindings(bySev);

const p0 = uniq.filter((f) => f.sev === 'P0');
const p1 = uniq.filter((f) => f.sev === 'P1');
const p2 = uniq.filter((f) => f.sev === 'P2');

const lines = [];
lines.push('# Deep mobile QA — child `/m/`');
lines.push('');
lines.push(`- **When:** ${new Date().toISOString()}`);
lines.push(`- **Server:** ${BASE}/m/`);
lines.push(`- **Auth:** child \`k1\` / pins.json`);
lines.push(`- **Viewport:** 390×844 · el · pro · tour/tips/PWA dismissed · SW blocked`);
lines.push(`- **Score:** **${score}/10**`);
lines.push(`- **Counts:** ${JSON.stringify(bySev)}`);
lines.push(`- **Dock observed:** ${dockInfo.tabs.map((t) => t.label).join(' · ')}`);
lines.push('');
lines.push('## P0');
lines.push('');
if (!p0.length) lines.push('_None_');
for (const f of p0) {
  lines.push(`- **${f.title}** — ${f.detail}`);
  if (f.shot) lines.push(`  - Screenshot: \`.qa-screens/deep-kid/${f.shot}\``);
}
lines.push('');
lines.push('## P1');
lines.push('');
if (!p1.length) lines.push('_None_');
for (const f of p1) {
  lines.push(`- **${f.title}** — ${f.detail}`);
  if (f.shot) lines.push(`  - Screenshot: \`.qa-screens/deep-kid/${f.shot}\``);
}
lines.push('');
lines.push('## P2');
lines.push('');
if (!p2.length) lines.push('_None_');
for (const f of p2) {
  lines.push(`- **${f.title}** — ${f.detail}`);
  if (f.shot) lines.push(`  - Screenshot: \`.qa-screens/deep-kid/${f.shot}\``);
}
lines.push('');
lines.push('## Top fixes');
lines.push('');
const topFixes = [];
if (p0.some((f) => /stolen|dock|chip|next-up/i.test(f.title + f.detail))) {
  topFixes.push('Ensure `#view` bottom padding / `.next-up-idle` keeps home CTAs above `nav.kid-dock` hit layer (390×844).');
}
if (p1.some((f) => /pro tile hidden|CTA hidden/i.test(f.title))) {
  topFixes.push('Show pro home tiles on `/m/` when `paidia.uiMode=pro` (`.kid-home-cta-tile.pro-only` vs `m-ui.css` hide rules).');
}
if (p0.length === 0 && p1.length === 0) {
  topFixes.push('No blocking issues — polish rate read-only copy and More sheet close affordance.');
}
for (const t of topFixes.slice(0, 5)) lines.push(`1. ${t}`);
lines.push('');
lines.push('## Screenshots');
lines.push('');
for (const s of shots.sort()) lines.push(`- \`.qa-screens/deep-kid/${s}\``);
lines.push('');
lines.push('## Cleared');
lines.push('');
for (const c of cleared) lines.push(`- ${c}`);
lines.push('');

fs.writeFileSync(path.join(OUT, 'REPORT.md'), lines.join('\n'));
fs.writeFileSync(
  path.join(OUT, 'findings.json'),
  JSON.stringify(
    { at: new Date().toISOString(), base: `${BASE}/m/`, score, bySev, dock: dockInfo, findings: uniq, cleared, shots },
    null,
    2,
  ),
);

console.log(JSON.stringify({ score, bySev, p0: p0.length, out: OUT }, null, 2));
process.exit(p0.length ? 1 : 0);
