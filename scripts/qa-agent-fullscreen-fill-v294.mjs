/**
 * Intentional fullscreen / fill auditor — v294
 *   node scripts/qa-agent-fullscreen-fill-v294.mjs
 *
 * Distinguishes intentional full-bleed from bugs.
 * Output: .qa-screens/agent-fullscreen-fill-v294/
 * Doc:    docs/agents/MOBILE_AGENT_FULLSCREEN_FILL_v294.md
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'agent-fullscreen-fill-v294');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { id: '390x844', w: 390, h: 844, label: 'iPhone 15 portrait' },
  { id: '375x667', w: 375, h: 667, label: 'iPhone SE portrait' },
  { id: '844x390', w: 844, h: 390, label: 'landscape phone' },
];

const verdicts = [];
const shots = [];

function verdict(surface, viewport, result, intentional, detail, shot = null) {
  const row = { surface, viewport, result, intentional, detail, shot, at: new Date().toISOString() };
  verdicts.push(row);
  console.log(`  [${result}] ${viewport} · ${surface} · intentional=${intentional} — ${detail}`);
  return row;
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

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  shots.push(file);
  return `.qa-screens/agent-fullscreen-fill-v294/${name}.png`;
}

function measureFillScript() {
  return () => {
    const vw = innerWidth;
    const vh = innerHeight;
    const body = document.body;
    const view = document.getElementById('view');
    const dock = document.querySelector('nav.dock, nav.kid-dock, #bottomPanel');
    const sheetBg = document.getElementById('sheetBg');
    const sheet = document.getElementById('sheet');
    const finish = document.querySelector('.store-finish, .store-finish.bottom-dock');
    const kidHero = document.querySelector('.kid-hero, .kid-header, .arcade-hero');
    const kidContent = document.querySelector('.kid-home-cta, .m-kid .m-stack, .kid-shell');
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left * 10) / 10,
        top: Math.round(r.top * 10) / 10,
        right: Math.round(r.right * 10) / 10,
        bottom: Math.round(r.bottom * 10) / 10,
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
      };
    };
    const viewCs = cs(view);
    const dockCs = cs(dock);
    const sheetBgCs = cs(sheetBg);
    const finishCs = cs(finish);
    const heroCs = cs(kidHero);

    const dockReachable = (() => {
      if (!dock) return { ok: false, reason: 'no dock' };
      const r = dock.getBoundingClientRect();
      if (r.height < 8 || r.width < 8) return { ok: false, reason: 'dock zero-size', box: box(dock) };
      const display = dockCs.display;
      const visibility = dockCs.visibility;
      const opacity = Number(dockCs.opacity);
      if (display === 'none' || visibility === 'hidden' || opacity === 0) {
        return { ok: false, reason: `dock hidden display=${display}`, box: box(dock) };
      }
      const cx = Math.min(vw - 4, Math.max(4, r.left + r.width / 2));
      const cy = Math.min(vh - 4, Math.max(4, r.top + Math.min(20, r.height / 2)));
      const hit = document.elementFromPoint(cx, cy);
      const inDock = !!(hit && hit.closest('nav.dock, nav.kid-dock, #bottomPanel'));
      return { ok: inDock, reason: inDock ? 'hit dock' : `hit ${(hit && (hit.id || hit.className || hit.tagName)) || 'null'}`, box: box(dock), z: dockCs.zIndex };
    })();

    const finishVsDock = (() => {
      if (!finish || !dock) return null;
      const fb = finish.getBoundingClientRect();
      const db = dock.getBoundingClientRect();
      const finishBottom = fb.bottom;
      const dockTop = db.top;
      const overlap = Math.max(0, Math.min(fb.bottom, db.bottom) - Math.max(fb.top, db.top));
      const coversDock = fb.top < db.top + 4 && fb.bottom >= db.bottom - 2 && fb.height >= db.height * 0.6;
      const sitsAbove = finishBottom <= dockTop + 2;
      return {
        finish: box(finish),
        dock: box(dock),
        finishZ: finishCs?.zIndex,
        dockZ: dockCs?.zIndex,
        overlapPx: Math.round(overlap),
        sitsAbove,
        coversDock,
        finishBottom: Math.round(finishBottom),
        dockTop: Math.round(dockTop),
      };
    })();

    return {
      vw,
      vh,
      shellM: body.classList.contains('shell-m'),
      storeFullscreen: body.classList.contains('store-fullscreen'),
      sheetOpen: body.classList.contains('sheet-open'),
      modeChild: body.classList.contains('mode-child'),
      tab: body.dataset.tab || '',
      view: {
        box: box(view),
        padding: viewCs
          ? {
              top: viewCs.paddingTop,
              right: viewCs.paddingRight,
              bottom: viewCs.paddingBottom,
              left: viewCs.paddingLeft,
            }
          : null,
        widthFill: view ? Math.abs(view.getBoundingClientRect().width - vw) <= 1 : false,
        leftEdge: view ? Math.abs(view.getBoundingClientRect().left) <= 1 : false,
        rightEdge: view ? Math.abs(view.getBoundingClientRect().right - vw) <= 1 : false,
      },
      safeArea: {
        top: getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || 'n/a',
        bottom: (() => {
          // env() not readable directly; infer from padding calc via CSS vars
          const dockH = getComputedStyle(body).getPropertyValue('--m-dock-h').trim() || '72px';
          const kidDock = getComputedStyle(body).getPropertyValue('--kid-dock-h').trim() || '';
          return { dockH, kidDock, viewPadBottom: viewCs?.paddingBottom || null };
        })(),
      },
      dock: {
        box: box(dock),
        display: dockCs?.display,
        z: dockCs?.zIndex,
        leftEdge: dock ? Math.abs(dock.getBoundingClientRect().left) <= 1 : false,
        rightEdge: dock ? Math.abs(dock.getBoundingClientRect().right - vw) <= 1 : false,
        widthFill: dock ? Math.abs(dock.getBoundingClientRect().width - vw) <= 2 : false,
        reachable: dockReachable,
      },
      sheetBg: {
        box: box(sheetBg),
        display: sheetBgCs?.display,
        pointerEvents: sheetBgCs?.pointerEvents,
        hasOn: sheetBg?.classList.contains('on') || false,
        fillsViewport:
          sheetBg &&
          sheetBgCs?.display !== 'none' &&
          Math.abs(sheetBg.getBoundingClientRect().width - vw) <= 2 &&
          Math.abs(sheetBg.getBoundingClientRect().height - vh) <= 2,
      },
      sheet: {
        box: box(sheet),
        hasOn: sheet?.classList.contains('on') || false,
      },
      storeFinish: finish
        ? {
            box: box(finish),
            display: finishCs?.display,
            z: finishCs?.zIndex,
            position: finishCs?.position,
            vsDock: finishVsDock,
          }
        : null,
      kidHero: kidHero
        ? {
            box: box(kidHero),
            left: kidHero.getBoundingClientRect().left,
            right: kidHero.getBoundingClientRect().right,
            fullBleedX:
              kidHero.getBoundingClientRect().left <= 1 &&
              Math.abs(kidHero.getBoundingClientRect().right - vw) <= 1,
            marginInline: heroCs?.marginInline || heroCs?.marginLeft,
            width: heroCs?.width,
          }
        : null,
      kidContent: kidContent
        ? {
            box: box(kidContent),
            left: Math.round(kidContent.getBoundingClientRect().left),
            insetFromEdge: Math.round(kidContent.getBoundingClientRect().left),
          }
        : null,
      overflowX: document.documentElement.scrollWidth > vw + 2,
    };
  };
}

async function openStaffNotifs(page) {
  const opened = await page.evaluate(() => {
    const btn = document.getElementById('btnNotifs') || document.querySelector('[data-open-notifs], button[aria-label*="ειδοπ"], button[aria-label*="Notif"]');
    if (btn) {
      btn.click();
      return 'btn';
    }
    if (typeof openSheet === 'function') {
      openSheet('<div class="sheet-pad"><h2>QA Sheet</h2><p>fill audit</p></div>');
      return 'openSheet';
    }
    return null;
  });
  await page.waitForTimeout(400);
  return opened;
}

async function closeSheet(page) {
  await page.evaluate(() => {
    if (typeof closeSheet === 'function') closeSheet();
    document.body.classList.remove('sheet-open');
    document.getElementById('sheetBg')?.classList.remove('on');
    document.getElementById('sheet')?.classList.remove('on');
  });
  await page.waitForTimeout(250);
}

async function goShopWithPending(page) {
  await page.evaluate(() => {
    state.tab = 'shop';
    // Prefer a house that has pending Friday list entries
    const houses = (typeof HOUSES !== 'undefined' && HOUSES) || ['Kalyvia', 'Limenaria'];
    let found = null;
    for (const h of houses) {
      try {
        state.shopHouse = h;
        if (typeof shopHouse === 'function') {
          /* keep */
        }
        const entries = typeof fridayEntries === 'function' ? fridayEntries(h) : [];
        if (entries.some((e) => e.status === 'pending')) {
          found = h;
          break;
        }
      } catch (_) {}
    }
    if (found) state.shopHouse = found;
    // Force at least one pending visually if API allows mutating list in memory
    try {
      const h = typeof shopHouse === 'function' ? shopHouse() : state.shopHouse;
      const list = fridayEntries(h) || [];
      if (!list.some((e) => e.status === 'pending') && list.length) {
        list[0].status = 'pending';
      }
    } catch (_) {}
    render();
    scrollTo(0, 0);
  });
  await page.waitForTimeout(450);
}

async function goStaffHome(page) {
  await page.evaluate(() => {
    state.tab = 'home';
    render();
    scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

async function goKidToday(page) {
  await page.evaluate(() => {
    if (typeof goChildView === 'function') goChildView('today');
    else {
      state.childView = 'today';
      render();
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

function judgeViewFill(m, vp) {
  const ok = m.shellM && m.view.widthFill && m.view.leftEdge && m.view.rightEdge;
  const pad = m.view.padding;
  const detail = ok
    ? `#view fills ${m.vw}px · pad L/R ${pad?.left}/${pad?.right} · bottom ${pad?.bottom} (dock+safe-area intentional inset)`
    : `#view fill fail shell=${m.shellM} wFill=${m.view.widthFill} L=${m.view.leftEdge} R=${m.view.rightEdge} box=${JSON.stringify(m.view.box)}`;
  return verdict('shell-m #view width fill', vp, ok ? 'PASS' : 'FAIL', true, detail);
}

function judgeStore(m, vp) {
  if (!m.storeFullscreen) {
    return verdict(
      'store-fullscreen (shop+pending)',
      vp,
      'FAIL',
      false,
      'body.store-fullscreen NOT applied — no pending shopping list / class missing',
    );
  }
  const dockOk = m.dock.reachable?.ok;
  const vs = m.storeFinish?.vsDock;
  // Intentional: class exists for immersive shopping. Bug if finish covers dock taps.
  let result = 'PASS';
  let intentional = true;
  const notes = [`class=on`, `dockReachable=${dockOk}`];
  if (!dockOk) {
    result = 'FAIL';
    intentional = false; // covering dock is NOT intentional per m-ui.css comment
    notes.push(`dockBlocked: ${m.dock.reachable?.reason}`);
  }
  if (vs) {
    notes.push(`finishZ=${vs.finishZ} dockZ=${vs.dockZ} overlap=${vs.overlapPx}px sitsAbove=${vs.sitsAbove} coversDock=${vs.coversDock}`);
    if (vs.overlapPx > 8 || vs.coversDock || (!vs.sitsAbove && vs.finishBottom > vs.dockTop + 4)) {
      result = 'FAIL';
      intentional = false;
      notes.push('.store-finish overlaps/covers dock (bug, not intentional fill)');
    } else if (vs.sitsAbove) {
      notes.push('.store-finish sits ABOVE dock (good)');
    }
  } else {
    notes.push('no .store-finish visible');
  }
  // Document that fullscreen mode itself is intentional design
  const detail = `Fullscreen MODE intentional (immersive shop). Geometry: ${notes.join('; ')}`;
  return verdict('store-fullscreen shop list', vp, result, true /* mode intentional */, detail);
}

function judgeSheetClosed(m, vp) {
  const painting =
    m.sheetBg.display !== 'none' && m.sheetBg.display !== undefined && m.sheetBg.hasOn;
  const blocking =
    m.sheetBg.display !== 'none' &&
    m.sheetBg.pointerEvents !== 'none' &&
    (m.sheetBg.hasOn || m.sheetBg.fillsViewport);
  const ok = !m.sheetOpen && !painting && !blocking && m.sheetBg.display === 'none';
  return verdict(
    'sheetBg closed',
    vp,
    ok ? 'PASS' : 'FAIL',
    true,
    ok
      ? `#sheetBg display=none, not filling (correct when closed)`
      : `CLOSED but sheetBg display=${m.sheetBg.display} on=${m.sheetBg.hasOn} pe=${m.sheetBg.pointerEvents} fills=${m.sheetBg.fillsViewport}`,
  );
}

function judgeSheetOpen(m, vp) {
  const ok = m.sheetOpen && m.sheetBg.hasOn && m.sheetBg.fillsViewport;
  return verdict(
    'sheetBg open fill',
    vp,
    ok ? 'PASS' : 'FAIL',
    true,
    ok
      ? `#sheetBg intentionally fills ${m.vw}×${m.vh} when open`
      : `OPEN expected fill — sheetOpen=${m.sheetOpen} on=${m.sheetBg.hasOn} fills=${m.sheetBg.fillsViewport} display=${m.sheetBg.display}`,
  );
}

function judgeKid(m, vp) {
  if (!m.modeChild) {
    return verdict('kid portal bleed', vp, 'FAIL', false, 'not in mode-child');
  }
  const heroBleed = m.kidHero?.fullBleedX === true;
  const contentInset = (m.kidContent?.insetFromEdge || 0) >= 8;
  const dockEdge = m.dock.widthFill && m.dock.leftEdge && m.dock.rightEdge;
  const ok = heroBleed && dockEdge;
  const intentional = true;
  let result = 'PASS';
  const parts = [
    `heroFullBleed=${heroBleed}`,
    `contentInset=${m.kidContent?.insetFromEdge}px`,
    `dockEdge=${dockEdge}`,
  ];
  if (!heroBleed) {
    result = 'FAIL';
    parts.push('welcome banner NOT edge-to-edge');
  }
  if (!dockEdge) {
    result = 'FAIL';
    parts.push('kid dock not edge-to-edge');
  }
  // Content should NOT be full-bleed (intentional inset via --m-pad)
  if (contentInset) parts.push('content inset intentional (not full-bleed)');
  return verdict('kid welcome vs content + dock', vp, result, intentional, parts.join('; '));
}

function judgeLandscape(m, vp) {
  // Compress = intentional if shell-m, no overflow-x, dock reachable, view fills width
  const compressed = m.vh < 500;
  const broken = m.overflowX || !m.view.widthFill || !m.dock.reachable?.ok;
  const result = broken ? 'FAIL' : 'PASS';
  const intentional = !broken; // if it works, compression is intentional responsive
  return verdict(
    'landscape compress vs break',
    vp,
    result,
    intentional,
    broken
      ? `BREAKS: overflowX=${m.overflowX} viewFill=${m.view.widthFill} dock=${m.dock.reachable?.reason}`
      : `Compresses intentionally @ ${m.vw}×${m.vh}; view fills; dock reachable; no overflow-x`,
  );
}

async function runViewport(browser, vp) {
  console.log(`\n=== ${vp.id} (${vp.label}) ===`);
  const dir = path.join(OUT, vp.id);
  fs.mkdirSync(dir, { recursive: true });

  // Staff context
  {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await login(ctx, 'e4', 'staff');
    const page = await ctx.newPage();
    await boot(page);
    await goStaffHome(page);

    let m = await page.evaluate(measureFillScript());
    const sHome = await shot(page, `${vp.id}/01-staff-home`);
    judgeViewFill(m, vp.id);
    judgeSheetClosed(m, vp.id);

    // Sheet open
    const how = await openStaffNotifs(page);
    m = await page.evaluate(measureFillScript());
    const sSheet = await shot(page, `${vp.id}/02-staff-sheet-open`);
    if (!how) {
      verdict('sheetBg open fill', vp.id, 'FAIL', true, 'could not open sheet (no btn / openSheet)', sSheet);
    } else {
      judgeSheetOpen(m, vp.id);
    }
    await closeSheet(page);
    m = await page.evaluate(measureFillScript());
    await shot(page, `${vp.id}/03-staff-sheet-closed`);
    judgeSheetClosed(m, vp.id);

    // Shop / store-fullscreen
    await goShopWithPending(page);
    m = await page.evaluate(measureFillScript());
    const sShop = await shot(page, `${vp.id}/04-staff-shop-store-fs`);
    const storeRow = judgeStore(m, vp.id);
    storeRow.shot = sShop;

    if (vp.id === '844x390') {
      await goStaffHome(page);
      m = await page.evaluate(measureFillScript());
      await shot(page, `${vp.id}/05-staff-landscape-home`);
      judgeLandscape(m, vp.id);
    }

    await ctx.close();
  }

  // Kid context
  {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await login(ctx, 'k1', 'child');
    const page = await ctx.newPage();
    await boot(page);
    await goKidToday(page);
    let m = await page.evaluate(measureFillScript());
    const sKid = await shot(page, `${vp.id}/06-kid-today`);
    judgeKid(m, vp.id);
    // also re-check view fill in kid mode
    judgeViewFill(m, vp.id);

    if (vp.id === '844x390') {
      m = await page.evaluate(measureFillScript());
      await shot(page, `${vp.id}/07-kid-landscape`);
      judgeLandscape(m, vp.id);
    }

    await ctx.close();
  }
}

function writeDocs() {
  const bySurface = {};
  for (const v of verdicts) {
    bySurface[v.surface] = bySurface[v.surface] || [];
    bySurface[v.surface].push(v);
  }

  const pass = verdicts.filter((v) => v.result === 'PASS').length;
  const fail = verdicts.filter((v) => v.result === 'FAIL').length;

  const lines = [];
  lines.push('# Mobile agent — intentional fullscreen / fill audit v294');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Base:** ${BASE}/m/ · **Pins:** e4 staff / k1 kid`);
  lines.push(`**Viewports:** 390×844, 375×667, landscape 844×390`);
  lines.push(`**Shots:** \`.qa-screens/agent-fullscreen-fill-v294/\``);
  lines.push(`**Product code:** unchanged (audit only)`);
  lines.push('');
  lines.push(`## Score: **${pass} PASS / ${fail} FAIL** (${verdicts.length} checks)`);
  lines.push('');
  lines.push('## Verdict table');
  lines.push('');
  lines.push('| Surface | Viewport | Result | Intentional fill? | Notes |');
  lines.push('|---------|----------|--------|-------------------|-------|');
  for (const v of verdicts) {
    const intent = v.intentional ? 'yes (by design)' : 'no (bug / accidental)';
    const note = (v.detail || '').replace(/\|/g, '/').slice(0, 160);
    lines.push(`| ${v.surface} | ${v.viewport} | **${v.result}** | ${intent} | ${note} |`);
  }
  lines.push('');
  lines.push('## Surface summary');
  lines.push('');
  for (const [surface, rows] of Object.entries(bySurface)) {
    const allPass = rows.every((r) => r.result === 'PASS');
    const anyIntent = rows.some((r) => r.intentional);
    lines.push(`### ${surface}`);
    lines.push(`- Overall: **${allPass ? 'PASS' : 'FAIL'}** · intentional-fill concept: **${anyIntent ? 'yes' : 'mixed/no'}**`);
    for (const r of rows) {
      lines.push(`  - \`${r.viewport}\`: ${r.result} — ${r.detail}`);
    }
    lines.push('');
  }
  lines.push('## Intentional vs bug criteria');
  lines.push('');
  lines.push('| Surface | Intentional when… | Bug when… |');
  lines.push('|---------|-------------------|-----------|');
  lines.push('| `body.shell-m` `#view` | Width = viewport; horizontal pad `--m-pad` (14px); bottom pad = dock + safe-area | Stage narrower than viewport / desk rails leak / no bottom pad |');
  lines.push('| `body.store-fullscreen` | Class toggles on shop with pending Friday list (immersive shopping) | `#bottomPanel` hidden/unreachable OR `.store-finish` covers dock taps |');
  lines.push('| `#sheetBg` | `display:block` + full inset when sheet open | Paints or captures taps when closed |');
  lines.push('| Kid welcome `.kid-hero` | Full-bleed via negative margin canceling stage pad | Hero inset like a card *and* dock not edge-to-edge |');
  lines.push('| Landscape | Compress chrome; no horizontal overflow; dock reachable | Overflow-x, unreachable dock, broken grids |');
  lines.push('');
  lines.push('## CSS anchors');
  lines.push('');
  lines.push('- `mobile/m-ui.css` — `#view` width 100% + pad; `body.shell-m.store-fullscreen #bottomPanel { display:flex !important }`');
  lines.push('- `mobile/index.html` — `body.store-fullscreen .bottom-panel{display:none}` (overridden on shell-m); `.sheet-bg{inset:0}`; kid `.kid-hero` bleed');
  lines.push('- `ui-v294.css` — closed `#sheetBg` force `display:none` when `body:not(.sheet-open)`');
  lines.push('- `app.js` — `document.body.classList.toggle(\'store-fullscreen\', storeDock)` when shop has pending');
  lines.push('');

  const docPath = path.join(ROOT, 'docs', 'agents', 'MOBILE_AGENT_FULLSCREEN_FILL_v294.md');
  fs.writeFileSync(docPath, lines.join('\n'), 'utf8');
  fs.writeFileSync(path.join(OUT, 'REPORT.md'), lines.join('\n'), 'utf8');
  fs.writeFileSync(path.join(OUT, 'verdicts.json'), JSON.stringify({ pass, fail, verdicts, shots }, null, 2), 'utf8');
  console.log(`\nWrote ${docPath}`);
  console.log(`Shots → ${OUT}`);
}

const browser = await chromium.launch({ headless: true });
try {
  for (const vp of VIEWPORTS) {
    await runViewport(browser, vp);
  }
  writeDocs();
} finally {
  await browser.close();
}

const fail = verdicts.filter((v) => v.result === 'FAIL').length;
process.exitCode = fail ? 1 : 0;
