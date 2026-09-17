/**
 * Deep aspect-ratio matrix — staff + kid home at fixed viewports.
 *   node scripts/qa-deep-aspects.mjs
 *
 * Output: .qa-screens/deep-aspects/{viewport}/
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'deep-aspects');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { id: '320x568', w: 320, h: 568, label: 'iPhone 5/SE narrow' },
  { id: '360x740', w: 360, h: 740, label: 'Android mid' },
  { id: '375x667', w: 375, h: 667, label: 'iPhone SE' },
  { id: '390x844', w: 390, h: 844, label: 'iPhone 15' },
  { id: '414x896', w: 414, h: 896, label: 'iPhone Plus' },
  { id: '280x653', w: 280, h: 653, label: 'Fold cover (narrow)' },
  { id: '844x390', w: 844, h: 390, label: 'landscape phone' },
  { id: '768x1024', w: 768, h: 1024, label: 'iPad portrait' },
];

const RAIL_SEL = [
  '.m-rail',
  '.kids-pane-tabs',
  '.pocket-kids-rail',
  '.pocket-rail-v2',
  '.pocket-filters',
  '.house-selector',
  '.shop-house-rail',
  '.lager-houses',
  '.planner-focus-switch',
  '.shop-panel-seg',
  '.week-jump',
  '.plan-days',
  '.plan-day-chip',
  '.arcade-rail',
  '.section-shell-nav',
  '.planner-seg',
  '.home-shift-steps',
  '[style*="overflow-x"]',
].join(', ');

const findings = [];
const perViewport = {};

function responsiveScore(p0, p1, p2) {
  let s = 10;
  s -= p0 * 2.5;
  s -= p1 * 0.35;
  s -= p2 * 0.08;
  return Math.max(1, Math.min(10, Math.round(s * 10) / 10));
}

function note(sev, viewport, screen, kind, detail, extra = {}) {
  const row = { sev, viewport, screen, kind, detail, ...extra, at: new Date().toISOString() };
  findings.push(row);
  perViewport[viewport] = perViewport[viewport] || { pass: true, issues: [], railPeeks: [] };
  perViewport[viewport].issues.push(row);
  if (sev === 'P0' || sev === 'P1') perViewport[viewport].pass = false;
  console.log(`  [${sev}] ${viewport}/${screen} (${kind}): ${detail}`);
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
  await page.waitForTimeout(300);
}

async function staffHome(page) {
  await page.evaluate(() => {
    state.tab = 'home';
    render();
    scrollTo(0, 0);
  });
  await page.waitForTimeout(280);
}

async function kidHome(page) {
  await page.evaluate(() => {
    if (typeof goChildView === 'function') goChildView('today');
    else {
      state.childView = 'today';
      render();
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(280);
}

async function inspect(page, viewport, screen) {
  const data = await page.evaluate((railSel) => {
    const vw = innerWidth;
    const vh = innerHeight;
    const doc = document.documentElement;
    const overflow = doc.scrollWidth > vw + 2;

    const dock = document.querySelector('nav.dock, nav.kid-dock, #bottomPanel');
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;
    const header = document.querySelector('header.app-chrome');
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;

    const isVis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };

    const clipped = [];
    const underChrome = [];
    const brokenGrid = [];
    const railPeeks = [];

    for (const rail of document.querySelectorAll(railSel)) {
      if (!isVis(rail)) continue;
      const s = getComputedStyle(rail);
      const scrollable =
        s.overflowX === 'auto' ||
        s.overflowX === 'scroll' ||
        rail.scrollWidth > rail.clientWidth + 6;
      if (scrollable && rail.scrollWidth > rail.clientWidth + 6) {
        const cls = (rail.className && rail.className.toString()) || rail.tagName;
        railPeeks.push({
          selector: cls.slice(0, 48),
          overflowPx: Math.round(rail.scrollWidth - rail.clientWidth),
        });
      }
    }

    const nodes = [...document.querySelectorAll(
      '#view button, #view a, #view [role="button"], header button, nav.dock button, #sheet button, .sheet button',
    )];

    for (const el of nodes) {
      if (!isVis(el)) continue;
      const r = el.getBoundingClientRect();
      const label = (el.innerText || el.getAttribute('aria-label') || el.id || '').replace(/\s+/g, ' ').trim().slice(0, 48);
      const inRail = !!el.closest(railSel);
      if (!inRail && (r.right > vw + 6 || r.left < -6)) {
        clipped.push({ label, left: Math.round(r.left), right: Math.round(r.right) });
      }
      const inDock = !!el.closest('nav.dock, nav.kid-dock, #bottomPanel, header.app-chrome');
      const isCalDay = !!el.closest('.paidia-cal, .pocket-cal, .cal-grid, [data-cal-day]');
      if (!inDock && !inRail && !isCalDay) {
        if (r.bottom > dockTop + 6 && r.top < dockTop && r.top > 40 && r.bottom < vh) {
          underChrome.push({ label, where: 'dock', top: Math.round(r.top), bottom: Math.round(r.bottom) });
        }
        if (headerBottom > 8 && r.top < headerBottom - 2 && r.bottom > 8 && r.bottom < headerBottom + 40) {
          underChrome.push({ label, where: 'header', top: Math.round(r.top), bottom: Math.round(r.bottom) });
        }
      }
    }

    const textClip = [];
    for (const el of document.querySelectorAll('#view h1, #view h2, #view h3, #view .m-card, #view .m-row-title, #view .section-title')) {
      if (!isVis(el)) continue;
      const s = getComputedStyle(el);
      if (s.overflow === 'hidden' || s.textOverflow === 'ellipsis') {
        if (el.scrollWidth > el.clientWidth + 4 && el.clientWidth > 20) {
          const t = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);
          if (t.length > 8) textClip.push(t);
        }
      }
    }

    for (const grid of document.querySelectorAll('#view [style*="grid"], #view .m-grid, #view .grid-2, #view .kids-grid')) {
      if (!isVis(grid)) continue;
      const kids = [...grid.children].filter(isVis);
      for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) {
          const a = kids[i].getBoundingClientRect();
          const b = kids[j].getBoundingClientRect();
          const overlap =
            a.left < b.right - 2 &&
            b.left < a.right - 2 &&
            a.top < b.bottom - 2 &&
            b.top < a.bottom - 2;
          if (overlap && Math.min(a.width, b.width) > 24) {
            brokenGrid.push(`${grid.className.toString().slice(0, 24) || 'grid'} overlap`);
            break;
          }
        }
        if (brokenGrid.length) break;
      }
    }

    const dockLabels = [...document.querySelectorAll('nav.dock button, nav.dock .dock-item, nav.kid-dock button')].map((el) => {
      if (!isVis(el)) return null;
      const labelEl = el.querySelector('.dock-label, .label, span, small') || el;
      const full = (labelEl.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      if (!full) return null;
      const s = getComputedStyle(labelEl);
      const truncated =
        labelEl.scrollWidth > labelEl.clientWidth + 1 ||
        (s.textOverflow === 'ellipsis' && labelEl.scrollWidth > labelEl.clientWidth);
      const r = labelEl.getBoundingClientRect();
      const crushed = full.length >= 4 && r.width < Math.min(28, full.length * 4);
      return { label: full.slice(0, 32), truncated: truncated || crushed };
    }).filter(Boolean);

    const mPage = document.querySelector('#view .m-page');
    let contentCoveredBySticky = false;
    if (mPage && dock) {
      const pad = parseFloat(getComputedStyle(mPage).paddingBottom) || 0;
      const lastKids = [...mPage.querySelectorAll('button, a, .m-card, .m-row, section')].filter(isVis);
      const last = lastKids[lastKids.length - 1];
      if (last) {
        const lr = last.getBoundingClientRect();
        if (lr.bottom > dockTop + 4 && lr.top < dockTop && pad < 48) contentCoveredBySticky = true;
      }
    }

    const slop = { purple: 0, pills: 0, weakBrand: false };
    for (const el of document.querySelectorAll('#view *, header.app-chrome *')) {
      if (!isVis(el)) continue;
      const s = getComputedStyle(el);
      const bg = `${s.backgroundColor} ${s.backgroundImage}`;
      if (/violet|purple|#7c3aed|#8b5cf6|147,\s*51,\s*234/i.test(bg)) slop.purple++;
      const br = parseFloat(s.borderRadius) || 0;
      const r = el.getBoundingClientRect();
      if (br >= 999 || (br > r.height / 2 && r.height < 48 && r.width > 60)) slop.pills++;
    }
    slop.pills = Math.min(slop.pills, 99);
    const brandMarks = document.querySelectorAll('.brand-mark, .logo-paidia, [data-brand], header .app-title');
    slop.weakBrand = brandMarks.length === 0;

    return {
      overflow,
      scrollW: doc.scrollWidth,
      vw,
      vh,
      hasMPage: !!mPage,
      clipped,
      underChrome,
      textClip: [...new Set(textClip)].slice(0, 6),
      brokenGrid: [...new Set(brokenGrid)].slice(0, 4),
      truncatedDock: dockLabels.filter((d) => d.truncated),
      contentCoveredBySticky,
      slop,
      railPeeks: [...new Map(railPeeks.map((r) => [r.selector, r])).values()].slice(0, 8),
    };
  }, RAIL_SEL);

  for (const rp of data.railPeeks || []) {
    perViewport[viewport] = perViewport[viewport] || { pass: true, issues: [], railPeeks: [] };
    perViewport[viewport].railPeeks.push({ screen, ...rp });
  }

  if (data.overflow) note('P0', viewport, screen, 'overflow', `page scrollWidth ${data.scrollW} > vw ${data.vw}`);
  if (!data.hasMPage) note('P0', viewport, screen, 'shell', 'missing .m-page');
  data.clipped.forEach((c) => note('P0', viewport, screen, 'clipped', `"${c.label}" L${c.left} R${c.right}`));
  data.brokenGrid.forEach((g) => note('P0', viewport, screen, 'grid', g));
  data.textClip.forEach((t) => note('P1', viewport, screen, 'text-clip', `"${t}"`));
  data.underChrome.forEach((c) => note('P1', viewport, screen, 'sticky-cover', `${c.where} covers "${c.label}"`));
  data.truncatedDock.forEach((d) => note('P1', viewport, screen, 'dock-truncation', `dock label "${d.label}"`));
  if (data.contentCoveredBySticky) {
    note('P1', viewport, screen, 'sticky-cover', 'content/control under sticky dock with weak page padding');
  }
  if (data.slop.purple > 3) note('P2', viewport, screen, 'visual-slop', `generic purple/violet surfaces (${data.slop.purple} hits)`);
  if (data.slop.pills > 24) note('P2', viewport, screen, 'visual-slop', `pill spam (${data.slop.pills} rounded chips)`);
  if (data.slop.weakBrand) note('P2', viewport, screen, 'visual-slop', 'weak brand mark in chrome');

  return data;
}

async function runScreen(page, vp, screenId, setupFn, filename) {
  await setupFn(page);
  const data = await inspect(page, vp.id, screenId);
  const shot = path.join(OUT, vp.id, filename);
  fs.mkdirSync(path.dirname(shot), { recursive: true });
  await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
  return { shot: path.relative(ROOT, shot).replace(/\\/g, '/'), ...data };
}

const browser = await chromium.launch({ headless: true });
const summaryRows = [];

for (const vp of VIEWPORTS) {
  console.log(`\n=== ${vp.label} (${vp.w}×${vp.h}) ===`);
  perViewport[vp.id] = { pass: true, issues: [], railPeeks: [] };

  const ctxOpts = {
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 2,
    isMobile: vp.w < 700,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    serviceWorkers: 'block',
  };

  const initScript = () => {
    localStorage.setItem('paidia.lang', 'el');
    localStorage.setItem('paidia.uiMode', 'pro');
    localStorage.setItem('paidia.tourSeen', '1');
    localStorage.setItem('paidia.tipsSeen', '1');
    localStorage.setItem('paidia.pwaInstallDismiss', '1');
  };

  const staffCtx = await browser.newContext(ctxOpts);
  const staffPage = await staffCtx.newPage();
  staffPage.on('pageerror', (err) => note('P0', vp.id, 'staff-home', 'runtime', err.message));
  await staffPage.addInitScript(initScript);
  await login(staffCtx, 'e4', 'staff');
  await boot(staffPage);
  const staffResult = await runScreen(staffPage, vp, 'staff-home', staffHome, 'staff-home.png');
  await staffCtx.close();

  const kidCtx = await browser.newContext(ctxOpts);
  const kidPage = await kidCtx.newPage();
  kidPage.on('pageerror', (err) => note('P0', vp.id, 'kid-home', 'runtime', err.message));
  await kidPage.addInitScript(initScript);
  await login(kidCtx, 'k1', 'child');
  await boot(kidPage);
  const kidResult = await runScreen(kidPage, vp, 'kid-home', kidHome, 'kid-home.png');
  await kidCtx.close();

  const issues = perViewport[vp.id].issues;
  const p0 = issues.filter((i) => i.sev === 'P0').length;
  const p1 = issues.filter((i) => i.sev === 'P1').length;
  const p2 = issues.filter((i) => i.sev === 'P2').length;
  const pass = p0 === 0 && p1 === 0;
  perViewport[vp.id].pass = pass;
  summaryRows.push({
    id: vp.id,
    label: vp.label,
    w: vp.w,
    h: vp.h,
    pass,
    p0,
    p1,
    p2,
    score: responsiveScore(p0, p1, p2),
    staffHome: staffResult.shot,
    kidHome: kidResult.shot,
    railPeeks: perViewport[vp.id].railPeeks,
  });
}

await browser.close();

const bySev = findings.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});
const reportJson = {
  at: new Date().toISOString(),
  base: `${BASE}/m/`,
  profiles: { staff: 'e4', child: 'k1' },
  viewports: VIEWPORTS,
  findings,
  bySev,
  summary: summaryRows,
  out: path.relative(ROOT, OUT).replace(/\\/g, '/'),
};
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(reportJson, null, 2));

let md = `# Deep aspect-ratio matrix — staff + kid home\n\n`;
md += `- **When:** ${reportJson.at}\n`;
md += `- **Base:** ${BASE}/m/\n`;
md += `- **Auth:** e4 staff, k1 child (pins.json)\n\n`;
md += `| Viewport | Size | Result | P0 | P1 | P2 | Score | Staff | Kid |\n`;
md += `|----------|------|--------|----|----|----|-------|-------|-----|\n`;
for (const r of summaryRows) {
  md += `| ${r.label} | ${r.w}×${r.h} | **${r.pass ? 'PASS' : 'FAIL'}** | ${r.p0} | ${r.p1} | ${r.p2} | ${r.score}/10 | \`${r.staffHome}\` | \`${r.kidHome}\` |\n`;
}
md += `\n## Intentional rail peeks (not counted as bugs)\n\n`;
for (const r of summaryRows) {
  if (!r.railPeeks?.length) continue;
  md += `### ${r.id}\n\n`;
  r.railPeeks.forEach((p) => {
    md += `- ${p.screen}: \`${p.selector}\` (+${p.overflowPx}px horizontal scroll)\n`;
  });
  md += `\n`;
}
md += `\n## Issues\n\n`;
for (const r of summaryRows) {
  const issues = perViewport[r.id]?.issues || [];
  if (!issues.length) continue;
  md += `### ${r.id}\n\n`;
  issues.forEach((i) => {
    md += `- **[${i.sev}]** ${i.screen} · ${i.kind}: ${i.detail}\n`;
  });
  md += `\n`;
}
fs.writeFileSync(path.join(OUT, 'REPORT.md'), md);

console.log('\n' + JSON.stringify({ pass: summaryRows.filter((r) => r.pass).length, fail: summaryRows.filter((r) => !r.pass).length, bySev, out: OUT }, null, 2));
process.exit(summaryRows.some((r) => !r.pass) ? 1 : 0);
