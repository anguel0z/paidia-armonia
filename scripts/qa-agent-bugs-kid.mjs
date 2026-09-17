/**
 * Kid-only /m/ bug hunt — dock walk, home CTAs, rate/pocket/notes.
 *   node scripts/qa-agent-bugs-kid.mjs
 * Output: .qa-screens/agent-bugs-kid/
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'agent-bugs-kid');
fs.mkdirSync(OUT, { recursive: true });

const PHONE = { ...devices['iPhone 15 Pro'], viewport: { width: 390, height: 844 }, serviceWorkers: 'block' };
const findings = [];
const consoleErrors = [];
const pageErrors = [];
const cleared = [];

function add(sev, title, detail, selectors = [], shot = null) {
  findings.push({ sev, title, detail, selectors, shot, at: new Date().toISOString() });
  console.log(`  [${sev}] ${title}: ${detail}`);
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

async function probeChrome(page, label) {
  return page.evaluate((label) => {
    const vw = innerWidth;
    const vh = innerHeight;
    const dock = document.querySelector('nav.kid-dock, #bottomPanel');
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;
    const isVis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };
    const underDock = [];
    for (const el of document.querySelectorAll('#view button, #view a, #view [role="button"]')) {
      if (!isVis(el)) continue;
      if (el.closest('nav.kid-dock, #bottomPanel')) continue;
      const r = el.getBoundingClientRect();
      const mid = (r.top + r.bottom) / 2;
      if (r.top < vh && mid > dockTop + 4 && mid < vh - 2 && r.bottom > dockTop + 12) {
        const cv = el.getAttribute('data-child-view');
        let sel = el.id ? `#${el.id}` : `.${String(el.className).split(/\s+/).filter(Boolean).slice(0, 2).join('.')}`;
        if (cv) {
          if (el.classList.contains('kid-home-cta-tile')) sel = `.kid-home-cta-tile[data-child-view="${cv}"]`;
          else if (el.classList.contains('chip')) sel = `#view .chip[data-child-view="${cv}"]`;
          else if (el.classList.contains('course-tile')) sel = `.course-tile[data-child-view="${cv}"]`;
          else sel = `[data-child-view="${cv}"]`;
        }
        const label = (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 56);
        const cx = Math.round((r.left + r.right) / 2);
        const cy = Math.round((r.top + r.bottom) / 2);
        const hit = document.elementFromPoint(cx, cy);
        const stolen = !!(hit && hit.closest('nav.kid-dock, #bottomPanel'));
        underDock.push({ label, sel, mid: Math.round(mid), dockTop: Math.round(dockTop), stolen, cx, cy });
      }
    }
    return {
      label,
      childView: typeof state !== 'undefined' ? state.childView : document.body.dataset.childView || '',
      underDock: underDock.slice(0, 12),
      dockTop: Math.round(dockTop),
      scrollW: document.documentElement.scrollWidth,
      vw,
    };
  }, label);
}

async function assertView(page, label) {
  const data = await probeChrome(page, label);
  const file = await shot(page, label);
  if (data.scrollW > data.vw + 8) {
    add('P1', `${label}: horizontal overflow`, `scrollW=${data.scrollW} vw=${data.vw}`, ['#view', 'body.shell-m'], file);
  }
  const seen = new Set();
  for (const u of data.underDock) {
    const key = u.label.slice(0, 20);
    if (seen.has(key)) continue;
    seen.add(key);
    const sev = u.stolen ? 'P0' : 'P1';
    add(
      sev,
      `${label}: control under dock${u.stolen ? ' (tap stolen)' : ''}`,
      `"${u.label}" mid=${u.mid} dockTop=${u.dockTop} stolen=${u.stolen}`,
      [u.sel, 'nav.kid-dock', 'mobile/m-ui.css .kid-shell padding-bottom'],
      file,
    );
  }
  return data;
}

async function clickDockTab(page, viewId) {
  const sel = `nav.kid-dock button[data-child-view="${viewId}"]`;
  const loc = page.locator(sel);
  if ((await loc.count()) === 0) {
    add('P1', `dock missing tab`, `No ${sel}`, [sel]);
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

async function tapAndExpectView(page, selector, expectView, shotName) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) {
    add('P2', `missing CTA`, selector, [selector]);
    return;
  }
  const geom = await el.evaluate((node) => {
    const r = node.getBoundingClientRect();
    const dock = document.querySelector('nav.kid-dock');
    const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    const hit = document.elementFromPoint(cx, cy);
    return {
      cx: Math.round(cx),
      cy: Math.round(cy),
      bottom: Math.round(r.bottom),
      dockTop: Math.round(dockTop),
      stolen: !!(hit && hit.closest('nav.kid-dock, #bottomPanel')),
    };
  });
  const before = await page.evaluate(() => (typeof state !== 'undefined' ? state.childView : '') || '');
  await page.mouse.click(geom.cx, geom.cy);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => (typeof state !== 'undefined' ? state.childView : '') || '');
  const file = await shot(page, shotName);
  if (geom.stolen && after === before) {
    add(
      'P0',
      `home CTA tap stolen by dock`,
      `${selector} center hit dock; view stayed ${before}`,
      [selector, 'nav.kid-dock button'],
      file,
    );
  } else if (after !== expectView) {
    add('P1', `CTA wrong navigation`, `expected ${expectView}, got ${after}`, [selector], file);
  } else {
    cleared.push(shotName);
  }
}

async function measureGradeButtons(page) {
  await page.evaluate(() => {
    goChildView('rate');
    scrollTo(0, 0);
  });
  await page.waitForTimeout(350);
  const file = await shot(page, 'kid-rate-grades');
  const sizes = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('#view button.grade-pick[data-grade-val]')];
    return btns.slice(0, 12).map((b) => {
      const r = b.getBoundingClientRect();
      return {
        val: b.dataset.gradeVal,
        w: Math.round(r.width),
        h: Math.round(r.height),
        sel: `button.grade-pick[data-grade-val="${b.dataset.gradeVal}"]`,
      };
    });
  });
  if (!sizes.length) {
    add(
      'P2',
      'rate: no interactive grade-pick (read-only kid view)',
      'childBewertungenView shows staff summary + stars; bindKidExtras blocks data-kid-rate taps',
      ['.kid-rate-pc[data-tour="kid-rate"]', '.child-staff-rating', '.school-sub-row'],
      file,
    );
    return;
  }
  const small = sizes.filter((s) => s.w < 44 || s.h < 44);
  if (small.length) {
    add(
      'P1',
      'rate: grade buttons below 44px',
      small.map((s) => `${s.val}=${s.w}×${s.h}`).join(', '),
      small.map((s) => s.sel),
      file,
    );
  } else {
    cleared.push('grade-buttons-44px');
  }
  const first = page.locator('button.grade-pick[data-grade-val="3"]').first();
  if ((await first.count()) > 0) {
    const before = await first.evaluate((b) => b.classList.contains('on'));
    await first.click();
    await page.waitForTimeout(200);
    const after = await first.evaluate((b) => b.classList.contains('on'));
    await shot(page, 'kid-rate-grade-tap');
    if (!after && !before) {
      add('P1', 'rate: grade tap no toggle', 'grade-pick did not get .on', ['button.grade-pick[data-grade-val="3"]'], file);
    }
  }
}

async function probePocket(page) {
  await clickDockTab(page, 'pocket');
  await assertView(page, 'kid-pocket');
  const calCell = page.locator('#view [data-pocket-day]').first();
  if ((await calCell.count()) > 0) {
    const before = await page.evaluate(() => state.pocketDay);
    await calCell.click();
    await page.waitForTimeout(250);
    const after = await page.evaluate(() => state.pocketDay);
    await shot(page, 'kid-pocket-day');
    if (before === after && after === before) {
      add('P1', 'pocket: calendar day tap no-op', 'data-pocket-day click did not toggle state.pocketDay', ['[data-pocket-day]'], 'kid-pocket-day.png');
    } else {
      cleared.push('pocket-cal-day');
    }
  } else {
    add('P2', 'pocket: no calendar cells', 'pocket view mounted without data-pocket-day', ['[data-pocket-day]'], await shot(page, 'kid-pocket-empty'));
  }
}

async function probeNotesFromDock(page) {
  await clickDockTab(page, 'notes');
  await assertView(page, 'kid-notes-dock');
  const hasNotes = await page.evaluate(() => {
    return !!document.querySelector('#view .kid-notes, #view [data-notes-cal-day], #view textarea, #view .notes-list');
  });
  if (!hasNotes) {
    add('P1', 'notes: view empty or failed mount', 'notes dock tab opened but no notes UI', ['nav.kid-dock [data-child-view="notes"]', '#view'], await shot(page, 'kid-notes-empty'));
  } else {
    cleared.push('notes-dock');
  }
}

async function testKidMoreSheet(page) {
  const openSel = '#kidDockMore, nav.kid-dock .kid-dock-more';
  await page.locator(openSel).first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  const opened = await page.evaluate(() => document.body.classList.contains('sheet-open') || !!document.querySelector('.sheet.on, #sheet.on'));
  const openFile = await shot(page, 'kid-more-open');
  if (!opened) {
    add('P1', 'kid more sheet did not open', openSel, [openSel], openFile);
    return;
  }
  await page.evaluate(() => {
    document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
    if (typeof closeSheet === 'function') closeSheet();
  });
  await page.waitForTimeout(300);
  const stuck = await page.evaluate(() => document.body.classList.contains('sheet-open'));
  if (stuck) {
    add('P0', 'kid more sheet stuck open', 'sheet-open after close', ['#sheetClose', '.sheet-close'], await shot(page, 'kid-more-stuck'));
  } else {
    cleared.push('kid-more-close');
  }
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

console.log('=== child k1 kid-only ===');
await login(ctx, 'k1', 'child');
await boot(page);

const css294 = await page.evaluate(async () => {
  try {
    const r = await fetch('/ui-v294.css?v=294', { method: 'HEAD' });
    return r.status;
  } catch {
    return 0;
  }
});
if (css294 === 404) {
  add('P1', 'ui-v294.css 404 on boot', 'stylesheet missing from static allowlist', ['link[href*="ui-v294"]'], null);
}

await assertView(page, 'kid-home-today');

for (const view of ['today', 'games', 'rate', 'pocket', 'notes']) {
  await clickDockTab(page, view);
  await assertView(page, `kid-tab-${view}`);
}

await page.evaluate(() => {
  if (typeof goChildView === 'function') goChildView('today');
  else {
    state.childView = 'today';
    render();
  }
  scrollTo(0, 0);
});
await page.waitForTimeout(300);

for (const id of ['bonus', 'plan', 'rewards']) {
  await page.evaluate(() => {
    state.childView = 'today';
    render();
    scrollTo(0, 0);
  });
  await page.waitForTimeout(200);
  const vis = await page.evaluate((tileId) => {
    const el = document.querySelector(`.kid-home-cta-tile[data-child-view="${tileId}"]`);
    if (!el) return { missing: true };
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { missing: false, display: s.display, w: r.width, h: r.height, pro: el.classList.contains('pro-only') };
  }, id);
  if (vis.missing) {
    add('P2', `home CTA missing: ${id}`, 'tile not in DOM', [`.kid-home-cta-tile[data-child-view="${id}"]`]);
    continue;
  }
  if (vis.display === 'none' || vis.w < 2) {
    add(
      'P1',
      `home CTA pro tile hidden on /m/`,
      `${id} tile display=${vis.display} size=${Math.round(vis.w)}×${Math.round(vis.h)} despite paidia.uiMode=pro`,
      [`.kid-home-cta-tile[data-child-view="${id}"]`, 'body.mode-pro', '.pro-only.mode-pro-block'],
      await shot(page, `cta-${id}-hidden`),
    );
    continue;
  }
  await tapAndExpectView(page, `.kid-home-cta-tile[data-child-view="${id}"]`, id, `cta-${id}`);
}

await measureGradeButtons(page);
await probePocket(page);
await probeNotesFromDock(page);
await testKidMoreSheet(page);

for (const view of ['bonus', 'plan', 'rewards', 'learn', 'gallery']) {
  await page.evaluate((v) => {
    if (typeof goChildView === 'function') goChildView(v);
    else {
      state.childView = v;
      render();
    }
    scrollTo(0, 0);
  }, view);
  await page.waitForTimeout(280);
  await assertView(page, `kid-view-${view}`);
}

for (const e of [...new Set(pageErrors)]) {
  add('P0', 'pageerror', e, ['app.js']);
}
for (const e of [...new Set(consoleErrors)].slice(0, 10)) {
  add('P1', 'console error', e.slice(0, 220), []);
}

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

const lines = [];
lines.push('# Kid mode bug hunt — `/m/`');
lines.push('');
lines.push(`- **When:** ${new Date().toISOString()}`);
lines.push(`- **Server:** ${BASE}/m/`);
lines.push(`- **Auth:** child \`k1\` / pins.json`);
lines.push(`- **Viewport:** 390×844, localStorage el/pro, SW blocked`);
lines.push(`- **Counts:** ${JSON.stringify(bySev)}`);
lines.push('');
lines.push('## Findings');
lines.push('');
let i = 1;
for (const f of uniq) {
  lines.push(`### ${i}. [${f.sev}] ${f.title}`);
  lines.push('');
  lines.push(`- **Detail:** ${f.detail}`);
  if (f.selectors?.length) lines.push(`- **Selectors:** ${f.selectors.map((s) => `\`${s}\``).join(', ')}`);
  if (f.shot) lines.push(`- **Screenshot:** \`.qa-screens/agent-bugs-kid/${f.shot}\``);
  lines.push('');
  i++;
}
lines.push('## Cleared checks');
lines.push('');
for (const c of cleared) lines.push(`- ${c}`);
lines.push('');

fs.writeFileSync(path.join(OUT, 'REPORT.md'), lines.join('\n'));
fs.writeFileSync(
  path.join(OUT, 'findings.json'),
  JSON.stringify({ at: new Date().toISOString(), base: `${BASE}/m/`, bySev, findings: uniq, cleared, pageErrors, consoleErrors }, null, 2),
);

console.log(JSON.stringify({ unique: uniq.length, bySev, out: OUT }, null, 2));
process.exit(uniq.some((f) => f.sev === 'P0') ? 1 : 0);
