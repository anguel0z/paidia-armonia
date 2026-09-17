/**
 * Mobile UI stress — overflows, out-of-bounds, dead taps, aspect matrix,
 * intentional full-bleed / store-fullscreen coverage.
 *
 *   node scripts/qa-mobile-ui-stress-bounds.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const TAG = process.env.PAIDIA_QA_OUT || `ui-stress-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`;
const OUT = path.join(ROOT, '.qa-screens', TAG);
fs.mkdirSync(OUT, { recursive: true });

const DEVICES = [
  { id: 'fold-cover', w: 280, h: 653, label: 'Fold cover' },
  { id: 'iphone-se', w: 375, h: 667, label: 'iPhone SE' },
  { id: 'iphone-14', w: 390, h: 844, label: 'iPhone 14/15' },
  { id: 'iphone-max', w: 430, h: 932, label: 'iPhone Pro Max' },
  { id: 'pixel-7', w: 412, h: 915, label: 'Pixel 7' },
  { id: 'android-compact', w: 360, h: 800, label: 'Android compact' },
  { id: 'landscape-se', w: 667, h: 375, label: 'SE landscape' },
  { id: 'landscape-15', w: 844, h: 390, label: '15 landscape' },
  { id: 'ipad-port', w: 768, h: 1024, label: 'iPad portrait' },
  { id: 'ipad-land', w: 1024, h: 768, label: 'iPad landscape' },
  { id: 'tall-narrow', w: 320, h: 900, label: 'Tall narrow' },
  { id: 'square-ish', w: 600, h: 600, label: 'Square-ish' },
];

const STAFF_TABS = ['home', 'schedule', 'stock', 'shop', 'kids', 'pocket', 'book', 'admin', 'talk'];
const KID_VIEWS = ['today', 'games', 'rate'];

const findings = [];
function note(sev, device, screen, kind, detail, extra = {}) {
  findings.push({ sev, device, screen, kind, detail, ...extra });
  console.log(`  [${sev}] ${kind} ${device}/${screen}: ${detail}`);
}

async function login(ctx, id, mode) {
  const res = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { profileId: id, mode, pin: pins[id], remember: false },
  });
  if (!res.ok()) throw new Error(`login ${id} ${res.status()}`);
  await ctx.request.post(`${BASE}/api/auth/onboarding/complete`, { data: { version: 3 } }).catch(() => {});
}

async function boot(page) {
  await page.addInitScript(() => {
    localStorage.setItem('paidia.lang', 'el');
    localStorage.setItem('paidia.uiMode', 'pro');
    localStorage.setItem('paidia.tourSeen', '1');
    localStorage.setItem('paidia.tipsSeen', '1');
    localStorage.setItem('paidia.pwaInstallDismiss', '1');
  });
  await page.goto(`${BASE}/m/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
    { timeout: 60000 },
  );
  await page.waitForTimeout(250);
}

async function audit(page, device, screen) {
  return page.evaluate(({ device, screen }) => {
    const vw = innerWidth;
    const vh = innerHeight;
    const doc = document.documentElement;
    const body = document.body;
    const dock =
      [...document.querySelectorAll('nav.dock, nav.kid-dock, #bottomPanel')].find((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && r.height > 8 && r.bottom > 0;
      }) || null;
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;
    const dockZ = dock ? Number(getComputedStyle(dock).zIndex) || 0 : 0;

    const hOverflow = doc.scrollWidth > vw + 2;
    const issues = [];

    const push = (sev, kind, detail, extra = {}) => issues.push({ sev, kind, detail, ...extra });

    if (hOverflow) push('P0', 'overflow-x', `doc.scrollWidth ${doc.scrollWidth} > vw ${vw}`);

    // Intentional fullscreen / fill
    const storeFs = body.classList.contains('store-fullscreen');
    const view = document.querySelector('#view');
    const viewR = view?.getBoundingClientRect();
    const fillsWidth = viewR ? Math.abs(viewR.width - vw) <= 2 : false;
    const intentional = {
      storeFullscreen: storeFs,
      shellM: body.classList.contains('shell-m'),
      viewFillsWidth: fillsWidth,
      viewTop: viewR ? Math.round(viewR.top) : null,
      viewBottom: viewR ? Math.round(viewR.bottom) : null,
      dockTop: Math.round(dockTop),
    };

    // Fixed/sticky layers vs dock
    for (const el of document.querySelectorAll('.store-finish, .journal-write-actions, .talk-compose, [class*="bottom-dock"], .sticky-footer')) {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.height < 4 || r.width < 4) continue;
      const z = Number(s.zIndex) || 0;
      if (r.bottom > dockTop + 2 && s.position !== 'static') {
        push('P0', 'overlap-dock', `${el.className?.toString?.().slice(0, 40) || el.tagName} bottom ${Math.round(r.bottom)} > dock ${Math.round(dockTop)} (z ${z} vs dock ${dockZ})`, {
          overlap: Math.round(r.bottom - dockTop),
        });
      }
      if (r.left < -2 || r.right > vw + 2) {
        push('P0', 'out-of-bounds', `${el.className?.toString?.().slice(0, 40)} x=${Math.round(r.left)}..${Math.round(r.right)} vw=${vw}`);
      }
    }

    // Interactive controls
    const sels = '#view button, #view a, #view [role="button"], header button, nav.dock button, nav.kid-dock button';
    let probed = 0;
    let dead = 0;
    let underDock = 0;
    let oob = 0;
    let tiny = 0;
    for (const el of document.querySelectorAll(sels)) {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      // only viewport-intersecting
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      probed++;
      if (r.left < -4 || r.right > vw + 4 || r.top < -4) {
        oob++;
        if (oob <= 6) push('P1', 'out-of-bounds', `ctrl ${(el.innerText || el.id || el.className).toString().replace(/\s+/g, ' ').slice(0, 36)}`, {
          box: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)],
        });
      }
      if (r.bottom > dockTop + 4 && !el.closest('nav.dock, nav.kid-dock, #bottomPanel')) {
        underDock++;
      }
      if (r.width * r.height > 0 && (r.width < 28 || r.height < 28) && el.tagName === 'BUTTON') {
        tiny++;
      }
      // hit-test center if in viewport
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      if (cx >= 0 && cx <= vw && cy >= 0 && cy <= vh && cy < dockTop - 2) {
        const hit = document.elementFromPoint(cx, cy);
        if (!hit) {
          dead++;
          if (dead <= 5) push('P0', 'unresponsive', `elementFromPoint null for ${(el.innerText || el.id || '').toString().slice(0, 28)}`);
        } else if (hit.closest('nav.dock, nav.kid-dock') && !el.closest('nav.dock, nav.kid-dock')) {
          dead++;
          if (dead <= 8) push('P0', 'unresponsive', `tap stolen by dock: ${(el.innerText || el.id || '').toString().replace(/\s+/g, ' ').slice(0, 32)}`);
        } else if (!(hit === el || el.contains(hit) || hit.contains?.(el) || hit.closest?.('button,a,[role=button]') === el.closest?.('button,a,[role=button]'))) {
          // overlay steal — only flag sticky/finish overlays
          if (hit.closest('.store-finish, .sheet-bg, #sheetBg')) {
            dead++;
            if (dead <= 8) push('P0', 'unresponsive', `tap stolen by overlay: ${(el.innerText || '').toString().slice(0, 24)}`);
          }
        }
      }
    }

    if (underDock >= 4) push('P1', 'under-dock', `${underDock} controls intersect dock band at scroll 0`);
    if (tiny >= 6) push('P2', 'tiny-targets', `${tiny} buttons <28px`);

    // Rail peeks — classify as P2 if parent scrolls
    const rails = [...document.querySelectorAll('.m-rail, [class*="rail"], .house-rail, .book-day-strip')];
    for (const rail of rails) {
      const s = getComputedStyle(rail);
      const canScroll = rail.scrollWidth > rail.clientWidth + 4 || s.overflowX.includes('auto') || s.overflowX.includes('scroll');
      const kids = [...rail.children].filter((c) => {
        const r = c.getBoundingClientRect();
        return r.right > vw + 2 && r.left < vw;
      });
      if (kids.length && !canScroll) {
        push('P1', 'overflow-x', `non-scroll rail peeks ${kids.length} children`);
      }
    }

    return {
      device,
      screen,
      intentional,
      probed,
      dead,
      underDock,
      oob,
      hOverflow,
      issues,
      bodyClass: body.className,
    };
  }, { device, screen });
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

const browser = await chromium.launch({ headless: true });
const summary = { devices: [], findings, out: OUT };

for (const d of DEVICES) {
  console.log(`\n=== ${d.label} ${d.w}x${d.h} ===`);
  const ctx = await browser.newContext({
    viewport: { width: d.w, height: d.h },
    deviceScaleFactor: 2,
    isMobile: d.w < 700,
    hasTouch: true,
    serviceWorkers: 'block',
  });
  await login(ctx, 'e4', 'staff');
  const page = await ctx.newPage();
  await boot(page);

  for (const tab of STAFF_TABS) {
    await page.evaluate((t) => {
      state.tab = t;
      if (t === 'admin') state.adminPane = state.adminPane || 'ops';
      render();
      scrollTo(0, 0);
    }, tab);
    await page.waitForTimeout(320);
    const m = await audit(page, d.id, `staff-${tab}`);
    for (const i of m.issues) note(i.sev, d.id, `staff-${tab}`, i.kind, i.detail, i);
    summary.devices.push(m);
    if (tab === 'home' || tab === 'shop' || tab === 'book' || m.issues.some((x) => x.sev === 'P0')) {
      await shot(page, `${d.id}__staff-${tab}`);
    }
  }

  // Kid pass on subset of devices
  if (['fold-cover', 'iphone-se', 'iphone-14', 'landscape-15', 'ipad-port'].includes(d.id)) {
    await ctx.clearCookies();
    await login(ctx, 'k1', 'child');
    const kid = await ctx.newPage();
    await boot(kid);
    for (const view of KID_VIEWS) {
      await kid.evaluate((v) => {
        state.kidView = v;
        if (typeof render === 'function') render();
        scrollTo(0, 0);
      }, view);
      await kid.waitForTimeout(300);
      const m = await audit(kid, d.id, `kid-${view}`);
      for (const i of m.issues) note(i.sev, d.id, `kid-${view}`, i.kind, i.detail, i);
      summary.devices.push(m);
      if (view === 'today' || m.issues.some((x) => x.sev === 'P0')) {
        await shot(kid, `${d.id}__kid-${view}`);
      }
    }
    await kid.close();
  }

  await ctx.close();
}

await browser.close();

const bySev = findings.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});
const byKind = findings.reduce((a, f) => ((a[f.kind] = (a[f.kind] || 0) + 1), a), {});
const report = {
  out: OUT,
  devices: DEVICES.length,
  bySev,
  byKind,
  p0: findings.filter((f) => f.sev === 'P0'),
  p1: findings.filter((f) => f.sev === 'P1').slice(0, 80),
  intentionalSamples: summary.devices
    .filter((d) => d.screen.includes('shop') || d.screen.includes('home'))
    .map((d) => ({ device: d.device, screen: d.screen, intentional: d.intentional })),
  findings,
};
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

const md = `# UI stress / bounds / aspect matrix

**Out:** \`${OUT}\`
**Devices:** ${DEVICES.length}
**By sev:** ${JSON.stringify(bySev)}
**By kind:** ${JSON.stringify(byKind)}

## P0 (${report.p0.length})

${report.p0.map((f) => `- **${f.device}/${f.screen}** [${f.kind}] ${f.detail}`).join('\n') || '_none_'}

## P1 (sample)

${report.p1.slice(0, 40).map((f) => `- **${f.device}/${f.screen}** [${f.kind}] ${f.detail}`).join('\n') || '_none_'}

## Intentional fill samples

| Device | Screen | store-fs | view fills W | view bottom | dock top |
|--------|--------|:--------:|:------------:|------------:|---------:|
${report.intentionalSamples
  .slice(0, 24)
  .map((s) => `| ${s.device} | ${s.screen} | ${s.intentional.storeFullscreen} | ${s.intentional.viewFillsWidth} | ${s.intentional.viewBottom} | ${s.intentional.dockTop} |`)
  .join('\n')}
`;
fs.writeFileSync(path.join(OUT, 'REPORT.md'), md);
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify({ out: OUT, bySev, byKind, p0: report.p0.length }, null, 2));
process.exit(report.p0.length ? 1 : 0);
