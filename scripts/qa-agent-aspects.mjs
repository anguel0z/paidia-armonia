/**
 * Aspect-ratio visual QA — mobile shell ONLY (/m/).
 * Staff screens: home, stock, schedule day, kids, pocket
 *
 *   node scripts/qa-agent-aspects.mjs
 *
 * Output: .qa-screens/agent-aspects/{viewport}/ + REPORT.md
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'agent-aspects');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { id: '280x653', w: 280, h: 653, label: 'ultra narrow (Fold cover)' },
  { id: '375x667', w: 375, h: 667, label: 'iPhone SE' },
  { id: '390x844', w: 390, h: 844, label: 'iPhone 15' },
  { id: '430x932', w: 430, h: 932, label: 'iPhone 15 Pro Max' },
  { id: '412x915', w: 412, h: 915, label: 'Pixel' },
  { id: '768x1024', w: 768, h: 1024, label: 'tablet portrait' },
  { id: '844x390', w: 844, h: 390, label: 'landscape phone' },
];

const SCREENS = [
  { id: 'home', tab: 'home', file: '01-home' },
  { id: 'stock', tab: 'stock', file: '02-stock' },
  { id: 'schedule-day', tab: 'schedule', file: '03-schedule-day', scheduleDay: true },
  { id: 'kids', tab: 'kids', file: '04-kids' },
  { id: 'pocket', tab: 'pocket', file: '05-pocket' },
];

// Intentional horizontal rails — peeking chips are OK (not clipped-control bugs)
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
  '[style*="overflow-x"]',
].join(', ');

const findings = [];
const perViewport = {};

function note(sev, viewport, screen, kind, detail, extra = {}) {
  const row = { sev, viewport, screen, kind, detail, ...extra, at: new Date().toISOString() };
  findings.push(row);
  perViewport[viewport] = perViewport[viewport] || { pass: true, issues: [] };
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

async function goScreen(page, screen) {
  await page.evaluate((s) => {
    state.tab = s.tab;
    if (s.scheduleDay && typeof setScheduleView === 'function') {
      setScheduleView('day', { persist: false });
    }
    render();
    scrollTo(0, 0);
  }, screen);
  await page.waitForTimeout(280);
}

async function inspect(page, viewport, screen) {
  const data = await page.evaluate((railSel) => {
    const vw = innerWidth;
    const vh = innerHeight;
    const doc = document.documentElement;
    const overflow = doc.scrollWidth > vw + 2;

    const stickyChrome = [...document.querySelectorAll('header.app-chrome, nav.dock, nav.kid-dock, #bottomPanel, .m-sticky, .sticky-bar, [data-sticky-chrome]')]
      .filter((el) => {
        const s = getComputedStyle(el);
        return (s.position === 'fixed' || s.position === 'sticky') && s.display !== 'none';
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, tag: el.tagName, cls: (el.className || '').toString().slice(0, 40) };
      });

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
      // Sticky chrome covering content (exclude rails + calendar day cells which scroll under dock)
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

    // Primary dock label truncation
    const dockLabels = [...document.querySelectorAll('nav.dock button, nav.dock .dock-item, nav.dock [data-tab]')].map((el) => {
      if (!isVis(el)) return null;
      const labelEl = el.querySelector('.dock-label, .label, span, small') || el;
      const full = (labelEl.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      if (!full) return null;
      const s = getComputedStyle(labelEl);
      const truncated =
        labelEl.scrollWidth > labelEl.clientWidth + 1 ||
        (s.textOverflow === 'ellipsis' && labelEl.scrollWidth > labelEl.clientWidth) ||
        (el.scrollWidth > el.clientWidth + 2);
      // Also flag when label text is visibly crushed (< ~3 chars worth of width for multi-char labels)
      const r = labelEl.getBoundingClientRect();
      const crushed = full.length >= 4 && r.width < Math.min(28, full.length * 4);
      return {
        label: full.slice(0, 32),
        truncated: truncated || crushed,
        scrollW: labelEl.scrollWidth,
        clientW: labelEl.clientWidth,
        w: Math.round(r.width),
      };
    }).filter(Boolean);

    // Content obscured: last visible primary content bottom vs dock
    const mPage = document.querySelector('#view .m-page');
    let contentCoveredBySticky = false;
    if (mPage && dock) {
      const pad = parseFloat(getComputedStyle(mPage).paddingBottom) || 0;
      const lastKids = [...mPage.querySelectorAll('button, a, .m-card, .m-row, section')].filter(isVis);
      const last = lastKids[lastKids.length - 1];
      if (last) {
        const lr = last.getBoundingClientRect();
        // At scrollTop 0, if a primary control sits under dock with insufficient padding
        if (lr.bottom > dockTop + 4 && lr.top < dockTop && pad < 48) contentCoveredBySticky = true;
      }
    }

    return {
      overflow,
      scrollW: doc.scrollWidth,
      vw,
      vh,
      hasMPage: !!mPage,
      mPageId: mPage?.dataset?.mPage || null,
      clipped: clipped.slice(0, 8),
      underChrome: underChrome.slice(0, 8),
      dockLabels,
      truncatedDock: dockLabels.filter((d) => d.truncated),
      stickyChrome,
      contentCoveredBySticky,
      bodyClass: document.body.className,
      tab: document.body.dataset.tab || '',
    };
  }, RAIL_SEL);

  if (data.overflow) note('P0', viewport, screen, 'overflow', `page scrollWidth ${data.scrollW} > vw ${data.vw}`);
  if (!data.hasMPage) note('P0', viewport, screen, 'shell', 'missing .m-page');
  data.clipped.forEach((c) => note('P0', viewport, screen, 'clipped', `"${c.label}" L${c.left} R${c.right}`));
  data.underChrome.forEach((c) => note('P1', viewport, screen, 'sticky-cover', `${c.where} covers "${c.label}"`));
  data.truncatedDock.forEach((d) =>
    note('P1', viewport, screen, 'dock-truncation', `dock label "${d.label}" scrollW=${d.scrollW} clientW=${d.clientW}`),
  );
  if (data.contentCoveredBySticky) {
    note('P1', viewport, screen, 'sticky-cover', 'content/control under sticky dock with weak page padding');
  }

  return data;
}

const browser = await chromium.launch({ headless: true });
const summaryRows = [];

for (const vp of VIEWPORTS) {
  console.log(`\n=== ${vp.label} (${vp.w}×${vp.h}) ===`);
  const dir = path.join(OUT, vp.id);
  fs.mkdirSync(dir, { recursive: true });
  perViewport[vp.id] = { pass: true, issues: [] };

  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 2,
    isMobile: vp.w < 700,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => note('P0', vp.id, 'runtime', 'runtime', err.message));
  await page.addInitScript(() => {
    localStorage.setItem('paidia.lang', 'el');
    localStorage.setItem('paidia.uiMode', 'pro');
    localStorage.setItem('paidia.tourSeen', '1');
    localStorage.setItem('paidia.tipsSeen', '1');
    localStorage.setItem('paidia.pwaInstallDismiss', '1');
  });

  await login(ctx, 'e4', 'staff');
  await boot(page);

  const screenResults = {};
  for (const screen of SCREENS) {
    await goScreen(page, screen);
    const data = await inspect(page, vp.id, screen.id);
    const shot = path.join(dir, `${screen.file}.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    screenResults[screen.id] = {
      overflow: data.overflow,
      clipped: data.clipped.length,
      underChrome: data.underChrome.length,
      truncatedDock: data.truncatedDock.length,
      shot: path.relative(ROOT, shot).replace(/\\/g, '/'),
    };
    console.log(`  shot ${screen.file}.png`);
  }

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
    screens: screenResults,
  });

  await ctx.close();
}

await browser.close();

const bySev = findings.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});
const offenders = [...summaryRows].sort((a, b) => b.p0 * 10 + b.p1 - (a.p0 * 10 + a.p1));

const reportJson = {
  at: new Date().toISOString(),
  base: `${BASE}/m/`,
  profile: 'e4 staff',
  viewports: VIEWPORTS,
  screens: SCREENS.map((s) => s.id),
  findings,
  bySev,
  summary: summaryRows,
  out: path.relative(ROOT, OUT).replace(/\\/g, '/'),
};
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(reportJson, null, 2));

let md = `# Aspect-ratio QA — mobile shell \`/m/\`\n\n`;
md += `- **When:** ${reportJson.at}\n`;
md += `- **Base:** ${BASE}/m/\n`;
md += `- **Auth:** e4 staff (pins.json)\n`;
md += `- **Screens:** home, stock, schedule day, kids, pocket\n`;
md += `- **Findings:** ${findings.length} (${JSON.stringify(bySev)})\n\n`;

md += `## Per-viewport pass/fail\n\n`;
md += `| Viewport | Size | Result | P0 | P1 | P2 |\n`;
md += `|----------|------|--------|----|----|----|\n`;
for (const r of summaryRows) {
  md += `| ${r.label} | ${r.w}×${r.h} | **${r.pass ? 'PASS' : 'FAIL'}** | ${r.p0} | ${r.p1} | ${r.p2} |\n`;
}

md += `\n## Worst offenders\n\n`;
const worst = offenders.filter((o) => !o.pass);
if (!worst.length) {
  md += `_None — all viewports passed (no P0/P1)._\n`;
} else {
  worst.slice(0, 5).forEach((o, i) => {
    md += `${i + 1}. **${o.label} (${o.w}×${o.h})** — P0=${o.p0}, P1=${o.p1}\n`;
    const sample = (perViewport[o.id]?.issues || []).filter((x) => x.sev === 'P0' || x.sev === 'P1').slice(0, 6);
    sample.forEach((x) => {
      md += `   - [${x.sev}] ${x.screen}/${x.kind}: ${x.detail}\n`;
    });
  });
}

md += `\n## Detection rules\n\n`;
md += `- **overflow** — \`documentElement.scrollWidth > innerWidth + 2\`\n`;
md += `- **clipped** — interactive control outside viewport; intentional rails excluded (\`.m-rail\`, house/kid rails, week-jump, etc.)\n`;
md += `- **dock-truncation** — primary dock label \`scrollWidth > clientWidth\` or crushed width\n`;
md += `- **sticky-cover** — control intersects fixed dock/header band; weak bottom padding under dock\n\n`;

md += `## Issues by viewport\n\n`;
for (const r of summaryRows) {
  md += `### ${r.label} (\`${r.id}\`)\n\n`;
  const issues = perViewport[r.id]?.issues || [];
  if (!issues.length) {
    md += `_Clean._\n\n`;
    continue;
  }
  issues.forEach((i) => {
    md += `- **[${i.sev}]** ${i.screen} · ${i.kind}: ${i.detail}\n`;
  });
  md += `\n`;
}

md += `## Screenshots\n\n\`.qa-screens/agent-aspects/{viewport}/01-home.png\` … \`05-pocket.png\`\n`;

fs.writeFileSync(path.join(OUT, 'REPORT.md'), md);
console.log('\n' + JSON.stringify({ findings: findings.length, bySev, out: OUT, pass: summaryRows.filter((r) => r.pass).length, fail: summaryRows.filter((r) => !r.pass).length }, null, 2));
process.exit(summaryRows.some((r) => !r.pass) ? 1 : 0);
