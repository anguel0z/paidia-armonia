/**
 * Narrow + landscape stress QA — /m/ only
 *   node scripts/qa-deep-stress.mjs
 * Output: .qa-screens/deep-stress/
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'deep-stress');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { id: '280x653', w: 280, h: 653, label: 'Fold cover narrow' },
  { id: '320x568', w: 320, h: 568, label: 'iPhone SE narrow' },
  { id: '844x390', w: 844, h: 390, label: 'landscape phone' },
  { id: '740x360', w: 740, h: 360, label: 'landscape Android' },
];

const RAIL_SEL = [
  '.m-rail', '.kids-pane-tabs', '.pocket-kids-rail', '.planner-seg', '.week-jump', '.plan-days',
  '[style*="overflow-x"]',
].join(', ');

const findings = [];
const perViewport = {};

function note(sev, viewport, screen, kind, detail, extra = {}) {
  const row = { sev, viewport, screen, kind, detail, ...extra, at: new Date().toISOString() };
  findings.push(row);
  perViewport[viewport] = perViewport[viewport] || { issues: [] };
  perViewport[viewport].issues.push(row);
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
  await page.waitForTimeout(350);
}

const initScript = () => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
};

async function shot(page, vpId, name) {
  const file = path.join(OUT, vpId, `${name}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: false }).catch(() => {});
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

async function probePage(page, vp, screen) {
  return page.evaluate(
    ({ railSel, screen, vwLimit }) => {
      const vw = innerWidth;
      const vh = innerHeight;
      const doc = document.documentElement;
      const overflow = doc.scrollWidth > vw + 2;
      const isVis = (el) => {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
        const r = el.getBoundingClientRect();
        return r.width > 1 && r.height > 1;
      };

      const dock = document.querySelector('nav.dock, nav.kid-dock, #bottomPanel');
      const dockTop = dock ? dock.getBoundingClientRect().top : vh;
      const header = document.querySelector('header.app-chrome');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const h1 = header?.querySelector('h1');
      const h1Data = h1
        ? {
            text: (h1.innerText || '').trim().slice(0, 48),
            w: Math.round(h1.getBoundingClientRect().width),
            scrollW: h1.scrollWidth,
            clientW: h1.clientWidth,
            crushed: h1.scrollWidth > h1.clientWidth + 2,
          }
        : null;

      const underDock = [];
      const underHeader = [];
      for (const el of document.querySelectorAll(
        '#view button, #view a, #view [role="button"], #view .kid-home-cta-tile',
      )) {
        if (!isVis(el)) continue;
        if (el.closest('nav.dock, nav.kid-dock, #bottomPanel, header.app-chrome')) continue;
        const inRail = !!el.closest(railSel);
        const isCalDay = !!el.closest('.paidia-cal, .cal-grid, [data-cal-day]');
        if (inRail || isCalDay) continue;
        const r = el.getBoundingClientRect();
        const label = (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 56);
        if (!label) continue;
        const cx = Math.round((r.left + r.right) / 2);
        const cy = Math.round((r.top + r.bottom) / 2);
        const hit = document.elementFromPoint(cx, cy);
        if (r.bottom > dockTop + 6 && r.top < dockTop && r.top > 36) {
          const stolen = !!(hit && hit.closest('nav.dock, nav.kid-dock, #bottomPanel'));
          underDock.push({ label, stolen, top: Math.round(r.top), bottom: Math.round(r.bottom) });
        }
        if (headerBottom > 8 && r.top < headerBottom - 2 && r.bottom > headerBottom - 8 && r.bottom < headerBottom + 36) {
          underHeader.push({ label, top: Math.round(r.top), bottom: Math.round(r.bottom) });
        }
      }

      const dockBtns = [...document.querySelectorAll('nav.dock button, nav.kid-dock button')].filter(isVis);
      const iconOnlyExpected = vw <= 360;
      const dockAudit = dockBtns.map((btn) => {
        const aria = btn.getAttribute('aria-label') || '';
        const labelSpan = btn.querySelector('span:not(.i):not(.nav-ico)');
        const icon = btn.querySelector('.i, .nav-ico, svg');
        const labelText = labelSpan ? (labelSpan.innerText || '').replace(/\s+/g, ' ').trim() : '';
        const spanStyle = labelSpan ? getComputedStyle(labelSpan) : null;
        const srOnly =
          labelSpan &&
          (spanStyle?.clip === 'rect(0px, 0px, 0px, 0px)' ||
            spanStyle?.clip === 'rect(0, 0, 0, 0)' ||
            (parseFloat(spanStyle?.width) <= 1 && parseFloat(spanStyle?.height) <= 1));
        const iconVis = icon && isVis(icon);
        const r = labelSpan ? labelSpan.getBoundingClientRect() : btn.getBoundingClientRect();
        const readable =
          !iconOnlyExpected &&
          labelSpan &&
          r.height >= 10 &&
          r.width >= 20 &&
          labelSpan.scrollWidth <= labelSpan.clientWidth + 3;
        return {
          aria: aria.slice(0, 40),
          labelText: labelText.slice(0, 24),
          srOnly: !!srOnly,
          iconVis: !!iconVis,
          readable: iconOnlyExpected ? !!aria && iconVis : readable || srOnly,
          isMore: /άλλα|mehr|more/i.test(labelText + aria),
        };
      });

      const scheduleView = typeof state !== 'undefined' ? state.scheduleView : null;
      const weekUi = !!document.querySelector('.planner-seg button.on[data-v="week"], [data-schedule-view="week"].on');
      const dayUi = !!document.querySelector(
        '.planner-seg button.on[data-v="day"], [data-schedule-view="day"].on, .m-plan .plan-day-chip.on',
      );
      const landscapeShort = window.matchMedia('(max-height:420px) and (orientation:landscape)').matches;

      const kidMoreBtn = document.querySelector('nav.kid-dock button[data-child-view="more"], nav.kid-dock button:last-child');
      let kidMore = null;
      if (kidMoreBtn && isVis(kidMoreBtn)) {
        const sp = kidMoreBtn.querySelector('span:not(.i):not(.nav-ico)') || kidMoreBtn;
        const sr = sp.getBoundingClientRect();
        kidMore = {
          label: (sp.innerText || kidMoreBtn.getAttribute('aria-label') || '').trim().slice(0, 20),
          h: Math.round(sr.height),
          w: Math.round(sr.width),
          aria: kidMoreBtn.getAttribute('aria-label') || '',
          iconOk: !!kidMoreBtn.querySelector('.i, .nav-ico, svg'),
        };
      }

      return {
        overflow,
        scrollW: doc.scrollWidth,
        vw,
        vh,
        h1Data,
        underDock: underDock.slice(0, 8),
        underHeader: underHeader.slice(0, 6),
        dockAudit,
        iconOnlyExpected,
        scheduleView,
        weekUi,
        dayUi,
        landscapeShort,
        kidMore,
        dockCount: dockBtns.length,
      };
    },
    { railSel: RAIL_SEL, screen, vwLimit: 360 },
  );
}

function scoreFromFindings(allFindings) {
  const p0 = allFindings.filter((f) => f.sev === 'P0').length;
  const p1 = allFindings.filter((f) => f.sev === 'P1').length;
  let score = 10;
  score -= p0 * 2.5;
  score -= p1 * 0.35;
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

const browser = await chromium.launch({ headless: true });
const shots = {};

for (const vp of VIEWPORTS) {
  console.log(`\n=== ${vp.label} (${vp.w}×${vp.h}) ===`);
  perViewport[vp.id] = { issues: [] };
  shots[vp.id] = {};

  const ctxOpts = {
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 2,
    isMobile: vp.w < 700,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    serviceWorkers: 'block',
  };

  // Staff home
  const staffCtx = await browser.newContext(ctxOpts);
  const staffPage = await staffCtx.newPage();
  staffPage.on('pageerror', (err) => note('P0', vp.id, 'staff-home', 'runtime', err.message));
  await staffPage.addInitScript(initScript);
  await login(staffCtx, 'e4', 'staff');
  await boot(staffPage);
  await staffPage.evaluate(() => {
    state.tab = 'home';
    render();
    scrollTo(0, 0);
  });
  await staffPage.waitForTimeout(300);
  let data = await probePage(staffPage, vp, 'staff-home');
  shots[vp.id].staffHome = await shot(staffPage, vp.id, 'staff-home');
  if (data.overflow) note('P0', vp.id, 'staff-home', 'overflow', `scrollW ${data.scrollW} > vw ${data.vw}`);
  if (data.h1Data?.crushed) {
    note('P1', vp.id, 'staff-home', 'header-crush', `title "${data.h1Data.text}" clipped (${data.h1Data.clientW}px)`);
  }
  if (vp.w <= 360 && data.h1Data && data.h1Data.w > 100) {
    note('P1', vp.id, 'staff-home', 'header-crush', `h1 width ${data.h1Data.w}px exceeds 96px cap at ≤360`);
  }
  for (const u of data.underDock) {
    note(u.stolen ? 'P0' : 'P1', vp.id, 'staff-home', 'under-dock-cta', `"${u.label}"${u.stolen ? ' (tap stolen)' : ''}`);
  }
  for (const u of data.underHeader) {
    note('P1', vp.id, 'staff-home', 'under-header', `"${u.label}"`);
  }
  if (data.iconOnlyExpected) {
    const bad = data.dockAudit.filter((d) => !d.srOnly || !d.iconVis || !d.aria);
    if (bad.length) {
      note(
        'P0',
        vp.id,
        'staff-home',
        'icon-dock',
        `${bad.length} dock tabs missing sr-only label, icon, or aria-label at ≤360`,
      );
    }
  } else {
    const trunc = data.dockAudit.filter((d) => !d.readable && d.labelText.length > 3);
    trunc.forEach((d) => note('P1', vp.id, 'staff-home', 'dock-readability', `"${d.labelText}" truncated`));
  }
  await staffCtx.close();

  // Staff schedule — landscape: week request must become day
  const schedCtx = await browser.newContext(ctxOpts);
  const schedPage = await schedCtx.newPage();
  schedPage.on('pageerror', (err) => note('P0', vp.id, 'staff-schedule', 'runtime', err.message));
  await schedPage.addInitScript(initScript);
  await login(schedCtx, 'e4', 'staff');
  await boot(schedPage);
  await schedPage.evaluate(() => {
    state.tab = 'schedule';
    if (typeof setScheduleView === 'function') setScheduleView('week', { persist: false });
    render();
    scrollTo(0, 0);
  });
  await schedPage.waitForTimeout(400);
  data = await probePage(schedPage, vp, 'staff-schedule');
  shots[vp.id].staffSchedule = await shot(schedPage, vp.id, 'staff-schedule');
  if (vp.h <= 420 && vp.w > vp.h) {
    if (data.scheduleView !== 'day') {
      note('P0', vp.id, 'staff-schedule', 'landscape-day', `scheduleView=${data.scheduleView} expected day after week`);
    }
    if (data.weekUi && !data.dayUi) {
      note('P1', vp.id, 'staff-schedule', 'landscape-day', 'week segment still active in UI');
    }
  }
  if (data.overflow) note('P0', vp.id, 'staff-schedule', 'overflow', `scrollW ${data.scrollW}`);
  for (const u of data.underDock) {
    note(u.stolen ? 'P0' : 'P1', vp.id, 'staff-schedule', 'under-dock-cta', `"${u.label}"${u.stolen ? ' (tap stolen)' : ''}`);
  }
  await schedCtx.close();

  // Kid home — 3 + More dock
  const kidCtx = await browser.newContext(ctxOpts);
  const kidPage = await kidCtx.newPage();
  kidPage.on('pageerror', (err) => note('P0', vp.id, 'kid-home', 'runtime', err.message));
  await kidPage.addInitScript(initScript);
  await login(kidCtx, 'k1', 'child');
  await boot(kidPage);
  await kidPage.evaluate(() => {
    if (typeof goChildView === 'function') goChildView('today');
    else {
      state.childView = 'today';
      render();
    }
    scrollTo(0, 0);
  });
  await kidPage.waitForTimeout(300);
  data = await probePage(kidPage, vp, 'kid-home');
  shots[vp.id].kidHome = await shot(kidPage, vp.id, 'kid-home');
  if (data.dockCount !== 4) {
    note('P1', vp.id, 'kid-home', 'kid-dock-layout', `expected 4 dock slots (3+More), got ${data.dockCount}`);
  }
  if (data.kidMore) {
    const { label, h, w, aria, iconOk } = data.kidMore;
    const narrow = vp.w <= 360;
    if (narrow) {
      if (!iconOk || !aria) note('P0', vp.id, 'kid-home', 'kid-more', 'More tab needs icon + aria-label when labels sr-only');
    } else if (h < 18 || w < 16 || (!label && !aria)) {
      note('P1', vp.id, 'kid-home', 'kid-more', `More not readable (label="${label}" ${w}×${h}px)`);
    }
  } else {
    note('P1', vp.id, 'kid-home', 'kid-more', 'More dock button not found');
  }
  if (data.iconOnlyExpected) {
    const bad = data.dockAudit.filter((d) => !d.srOnly || !d.iconVis || !d.aria);
    if (bad.length) note('P0', vp.id, 'kid-home', 'icon-dock', `${bad.length} kid dock tabs fail icon-only contract`);
  } else {
    const bad = data.dockAudit.filter((d) => !d.readable && d.labelText.length > 2);
    bad.forEach((d) => note('P1', vp.id, 'kid-home', 'dock-readability', `"${d.labelText}"`));
  }
  for (const u of data.underDock) {
    note(u.stolen ? 'P0' : 'P1', vp.id, 'kid-home', 'under-dock-cta', `"${u.label}"${u.stolen ? ' (tap stolen)' : ''}`);
  }
  await kidCtx.close();
}

await browser.close();

const p0List = findings.filter((f) => f.sev === 'P0');
const p1List = findings.filter((f) => f.sev === 'P1');
const score = scoreFromFindings(findings);

const reportJson = {
  at: new Date().toISOString(),
  base: `${BASE}/m/`,
  profiles: { staff: 'e4', child: 'k1' },
  viewports: VIEWPORTS,
  stressScore: score,
  findings,
  p0: p0List,
  p1: p1List,
  shots,
  out: path.relative(ROOT, OUT).replace(/\\/g, '/'),
};
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(reportJson, null, 2));

let md = `# Deep stress QA — narrow + landscape (/m/)\n\n`;
md += `- **When:** ${reportJson.at}\n`;
md += `- **Base:** ${BASE}/m/\n`;
md += `- **Auth:** e4 staff, k1 child\n`;
md += `- **Stress resilience score:** **${score}/10**\n\n`;
md += `## Viewports\n\n`;
for (const vp of VIEWPORTS) {
  const iss = perViewport[vp.id]?.issues || [];
  const p0 = iss.filter((i) => i.sev === 'P0').length;
  const p1 = iss.filter((i) => i.sev === 'P1').length;
  md += `### ${vp.id} (${vp.label})\n\n`;
  md += `- P0: ${p0}, P1: ${p1}\n`;
  md += `- Shots: staff-home \`${shots[vp.id]?.staffHome || '—'}\`, schedule \`${shots[vp.id]?.staffSchedule || '—'}\`, kid-home \`${shots[vp.id]?.kidHome || '—'}\`\n\n`;
  if (iss.length) {
    iss.forEach((i) => {
      md += `- **[${i.sev}]** ${i.screen} · ${i.kind}: ${i.detail}\n`;
    });
  } else md += `- No P0/P1 issues\n`;
  md += `\n`;
}

md += `## P0 summary\n\n`;
if (!p0List.length) md += `- None\n`;
else p0List.forEach((f) => (md += `- ${f.viewport} / ${f.screen}: ${f.detail}\n`));

md += `\n## P1 summary\n\n`;
const p1ByKind = {};
p1List.forEach((f) => {
  const k = f.kind;
  p1ByKind[k] = (p1ByKind[k] || 0) + 1;
});
md += `| Kind | Count |\n|------|-------|\n`;
Object.entries(p1ByKind)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => (md += `| ${k} | ${n} |\n`));

fs.writeFileSync(path.join(OUT, 'REPORT.md'), md);

console.log('\n' + JSON.stringify({ stressScore: score, p0: p0List.length, p1: p1List.length, out: OUT }, null, 2));
process.exit(p0List.length ? 1 : 0);
