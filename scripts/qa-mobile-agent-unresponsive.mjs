/**
 * Mobile unresponsive / dead-tap hunter for /m/ (v294).
 * Hit-tests elementFromPoint vs dock / .store-finish / #sheetBg / null.
 *
 *   node scripts/qa-mobile-agent-unresponsive.mjs
 *
 * Writes: docs/agents/MOBILE_AGENT_UNRESPONSIVE_v294.md
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'),
);
const OUT_SHOT = path.join(ROOT, '.qa-screens', 'agent-unresponsive-v294');
const REPORT = path.join(ROOT, 'docs/agents/MOBILE_AGENT_UNRESPONSIVE_v294.md');
const REPORT_JSON = path.join(OUT_SHOT, 'report.json');
fs.mkdirSync(OUT_SHOT, { recursive: true });

const VIEWPORTS = [
  { id: '390x844', w: 390, h: 844, label: 'iPhone 14/15' },
  { id: '280x653', w: 280, h: 653, label: 'Fold cover' },
  { id: '375x667', w: 375, h: 667, label: 'iPhone SE' },
];

const STAFF_TABS = ['home', 'schedule', 'stock', 'shop', 'book', 'talk', 'admin'];

const rows = [];
const sheetChecks = [];
const p0 = [];

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
  await page.waitForTimeout(350);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function goStaffTab(page, tab) {
  await page.evaluate((t) => {
    state.tab = t;
    if (t === 'admin') state.adminPane = state.adminPane || 'ops';
    if (typeof render === 'function') render();
    window.scrollTo(0, 0);
  }, tab);
  await page.waitForTimeout(320);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function goKidView(page, view) {
  await page.evaluate((v) => {
    state.kidView = v;
    if (typeof render === 'function') render();
    window.scrollTo(0, 0);
  }, view);
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function sheetBgState(page) {
  return page.evaluate(() => {
    const bg = document.getElementById('sheetBg');
    if (!bg) return { exists: false, on: false, pe: '', blocks: false, sheetOpen: false };
    const on = bg.classList.contains('on');
    const pe = getComputedStyle(bg).pointerEvents;
    const r = bg.getBoundingClientRect();
    const mid = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return {
      exists: true,
      on,
      pe,
      blocks: on && pe !== 'none',
      sheetOpen: document.body.classList.contains('sheet-open'),
      size: { w: Math.round(r.width), h: Math.round(r.height) },
      midHit: mid
        ? `${mid.tagName.toLowerCase()}${mid.id ? '#' + mid.id : ''}`
        : null,
    };
  });
}

/**
 * Probe primary CTAs / sticky bars on current screen.
 * Returns array of hit rows.
 */
async function probeControls(page, { viewport, screen, role }) {
  return page.evaluate(({ viewport, screen, role }) => {
    const vw = innerWidth;
    const vh = innerHeight;
    const dock =
      [...document.querySelectorAll('nav.dock, nav.kid-dock, #bottomPanel')].find((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && r.height > 8 && r.bottom > 0;
      }) || null;
    const dockTop = dock ? Math.round(dock.getBoundingClientRect().top) : vh;
    const dockZ = dock ? Number(getComputedStyle(dock).zIndex) || 0 : 0;

    const isVis = (el) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    };
    const labelOf = (el) =>
      (el.getAttribute('aria-label') || el.innerText || el.id || el.className || '')
        .toString()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 40);
    const hitDesc = (hit) => {
      if (!hit) return 'null';
      const id = hit.id ? `#${hit.id}` : '';
      const cls = (hit.className || '').toString().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
      return `${hit.tagName.toLowerCase()}${id}${cls ? '.' + cls : ''}`;
    };

    const describe = (el, control, opts = {}) => {
      const r = el.getBoundingClientRect();
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      const cxHit = Math.min(Math.max(cx, 0), vw - 1);
      const cyHit = Math.min(Math.max(cy, 0), vh - 1);
      const hit = document.elementFromPoint(cxHit, cyHit);
      const hitDock = !!(hit && hit.closest('nav.dock, nav.kid-dock, #bottomPanel'));
      const hitSheetBg = !!(hit && hit.closest('#sheetBg, .sheet-bg'));
      const hitStoreFinish = !!(hit && hit.closest('.store-finish'));
      const clear = r.bottom < dockTop - 4;
      const overlapPx = Math.max(0, Math.round(r.bottom - dockTop));
      const selfOrChild =
        !!hit && (hit === el || el.contains(hit) || hit.contains?.(el) || !!hit.closest?.('button,a,[role=button]')?.closest?.('#view') === el.closest?.('#view') && (el.contains(hit) || hit === el));
      const hitSelf = !!(hit && (hit === el || el.contains(hit) || (el.id && hit.closest(`#${CSS.escape(el.id)}`))));
      const isDockSelf = !!el.closest('nav.dock, nav.kid-dock, #bottomPanel');
      const isStoreFinish = !!el.closest('.store-finish') || el.classList?.contains('store-finish');

      let honest = true;
      let hitKind = 'self';
      const notes = [];

      if (!hit) {
        honest = false;
        hitKind = 'null';
        notes.push('elementFromPoint null');
      } else if (isDockSelf) {
        honest = hitDock || hitSelf;
        hitKind = hitDock ? 'dock' : hitDesc(hit);
        notes.push(honest ? 'dock self-hit OK' : `dock miss → ${hitDesc(hit)}`);
      } else if (isStoreFinish) {
        // store-finish should receive its own taps even if geometry overlaps dock band
        const finishHit = hitStoreFinish || hitSelf;
        const stolenByDock = hitDock && !hitStoreFinish;
        if (stolenByDock) {
          honest = false;
          hitKind = 'dock';
          notes.push(`P0: store-finish tap stolen by dock (${overlapPx}px overlap)`);
        } else if (!finishHit && hitSheetBg) {
          honest = false;
          hitKind = 'sheetBg';
          notes.push('tap stolen by #sheetBg');
        } else if (!finishHit) {
          honest = false;
          hitKind = hitDesc(hit);
          notes.push(`store-finish miss → ${hitDesc(hit)}`);
        } else {
          hitKind = 'store-finish';
          if (overlapPx > 0) {
            notes.push(`hit OK but ${overlapPx}px geometry overlap w/ dock (z finish=${Number(getComputedStyle(el).zIndex)||0} dock=${dockZ})`);
            // geometry overlap with dock is still a P0 candidate for unresponsive risk
            // even if z-index saves the center hit — edges/lower area may steal
            if (overlapPx >= 40) {
              honest = false;
              notes.push('P0 candidate: ≥40px overlap vs nav.dock');
            } else {
              notes.push('overlap <40px; center hit honest');
            }
          } else {
            notes.push('clear');
          }
        }
      } else if (hitDock) {
        honest = false;
        hitKind = 'dock';
        notes.push(`tap stolen by dock → ${hitDesc(hit)}`);
      } else if (hitSheetBg) {
        honest = false;
        hitKind = 'sheetBg';
        notes.push('tap stolen by #sheetBg');
      } else if (hitStoreFinish && !isStoreFinish) {
        honest = false;
        hitKind = 'store-finish';
        notes.push('tap stolen by .store-finish');
      } else if (!clear && cy > dockTop) {
        honest = false;
        hitKind = hitDesc(hit);
        notes.push(`under dock band; hit=${hitDesc(hit)}`);
      } else if (hitSelf || selfOrChild) {
        hitKind = 'self';
        notes.push(clear ? 'clear' : `geom overlaps dock ${overlapPx}px but center hit self`);
        if (!clear && overlapPx >= 20) {
          // soft warn — still mark dishonest if content lives under dock
          honest = false;
          notes.push('P1: content under dock at scroll0');
        }
      } else {
        hitKind = hitDesc(hit);
        notes.push(`clear geom? ${clear}; hit=${hitDesc(hit)} (not self)`);
        // not necessarily dishonest if another interactive peer
        if (hit.closest('button,a,[role=button]')) {
          notes.push('peer control');
        } else {
          honest = false;
        }
      }

      if (opts.expectDock) {
        honest = hitDock || hitSelf;
        hitKind = hitDock ? 'dock' : hitDesc(hit);
        notes.length = 0;
        notes.push(honest ? 'dock self-hit OK' : `dock miss → ${hitDesc(hit)}`);
      }

      return {
        control,
        viewport,
        screen,
        role,
        clear,
        hit: hitKind,
        hitTag: hitDesc(hit),
        honest,
        overlapPx,
        dockTop,
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        z: Number(getComputedStyle(el).zIndex) || 0,
        dockZ,
        text: labelOf(el),
        notes: notes.join('; '),
      };
    };

    const out = [];
    const seen = new Set();
    const add = (control, el, opts) => {
      if (!el || !isVis(el)) return;
      const key = `${control}::${el.id || ''}::${Math.round(el.getBoundingClientRect().top)}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(describe(el, control, opts));
    };

    // Sticky / finish / compose bars — prefer the bar itself (visible center),
    // then primary button if its center is in the viewport.
    const stickySpecs = [
      { name: `${screen} .store-finish`, sels: ['.store-finish.bottom-dock', '.store-finish', '#confirmBatch'] },
      { name: `${screen} .talk-compose`, sels: ['.talk-compose', '.chat-compose'] },
      { name: `${screen} .journal-write-actions`, sels: ['.journal-write-actions', '#shiftNoteSave'] },
    ];
    for (const spec of stickySpecs) {
      let el = null;
      for (const sel of spec.sels) {
        const node = document.querySelector(sel);
        if (node && isVis(node)) {
          el = node;
          break;
        }
      }
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const cy = (r.top + r.bottom) / 2;
      // If bar center is off-screen below, try a primary button with in-view center
      if (cy > vh || cy < 0) {
        const btn = el.matches('button')
          ? el
          : el.querySelector('button.m-primary, button.btn, #shiftNoteSave, #confirmBatch, button');
        if (btn && isVis(btn)) {
          const br = btn.getBoundingClientRect();
          const bcy = (br.top + br.bottom) / 2;
          if (bcy >= 0 && bcy <= vh) {
            add(spec.name, btn);
            continue;
          }
        }
        // Still record geometry failure (under-dock / offscreen sticky)
        add(spec.name, el);
        continue;
      }
      add(spec.name, el);
    }

    // Primary CTAs by tab/view
    const primarySels = [
      '#homeShiftJournal',
      '#homeShiftStock',
      '#homeShiftPresence',
      '#homeShiftPresenceStep',
      '.home-bento-tile',
      '.m-cta .m-primary',
      '#shiftNoteSave',
      '#btnReceipt',
      '.admin-tile',
      '.admin-pane button.m-primary',
      '#view .m-primary',
      '.kid-home-cta-tile',
      '[data-child-view="bonus"]',
      '[data-child-view="pocket"]',
      '.lager-stepper button',
      '.stock-stepper button',
    ];

    for (const sel of primarySels) {
      const nodes = [...document.querySelectorAll(sel)].filter(isVis);
      if (!nodes.length) continue;
      // first in view + last in view for steppers
      const inView = nodes.filter((n) => {
        const r = n.getBoundingClientRect();
        const cy = (r.top + r.bottom) / 2;
        return cy >= 0 && cy <= vh;
      });
      if (!inView.length) continue;
      if (sel.includes('stepper') || sel.includes('lager')) {
        add(`${screen} last ${sel}`, inView[inView.length - 1]);
      } else {
        add(`${screen} ${sel}`, inView[0]);
      }
    }

    // Dock items (role-aware)
    const dockBtns = [...document.querySelectorAll('nav.dock button, nav.kid-dock button')].filter(isVis);
    dockBtns.forEach((btn, i) => {
      const aria = btn.getAttribute('aria-label') || labelOf(btn) || `item[${i}]`;
      add(`${role} dock:${aria}`, btn, { expectDock: true });
    });

    // Mid-viewport sanity (frozen / overlay)
    const mid = document.elementFromPoint(vw / 2, Math.min(vh * 0.45, dockTop - 40));
    out.push({
      control: `${screen} mid-viewport`,
      viewport,
      screen,
      role,
      clear: true,
      hit: hitDesc(mid),
      hitTag: hitDesc(mid),
      honest: !!mid && !mid.closest('#sheetBg.on, .sheet-bg.on') && mid.id !== 'sheetBg',
      overlapPx: 0,
      dockTop,
      top: Math.round(vh * 0.45),
      bottom: Math.round(vh * 0.45),
      z: 0,
      dockZ,
      text: '',
      notes: !mid
        ? 'P0: mid elementFromPoint null (frozen?)'
        : mid.closest('#sheetBg') || mid.id === 'sheetBg'
          ? 'P0: mid hits #sheetBg'
          : `mid → ${hitDesc(mid)}`,
    });

    return {
      dockTop,
      dockZ,
      storeFinish: (() => {
        const sf = document.querySelector('.store-finish, .store-finish.bottom-dock');
        if (!sf || !isVis(sf)) return null;
        const r = sf.getBoundingClientRect();
        const z = Number(getComputedStyle(sf).zIndex) || 0;
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          height: Math.round(r.height),
          overlap: Math.max(0, Math.round(r.bottom - dockTop)),
          z,
          dockZ,
          className: (sf.className || '').toString().slice(0, 60),
        };
      })(),
      sheetBg: (() => {
        const bg = document.getElementById('sheetBg');
        if (!bg) return null;
        return {
          on: bg.classList.contains('on'),
          pe: getComputedStyle(bg).pointerEvents,
        };
      })(),
      rows: out,
    };
  }, { viewport, screen, role });
}

async function cycleSheet(page, openFn, name, viewport) {
  try {
    await openFn();
  } catch (e) {
    const row = {
      control: `sheet:${name}`,
      viewport,
      clear: false,
      hit: 'open-fail',
      notes: `sheet open failed: ${String(e.message || e).slice(0, 120)}`,
      honest: null,
    };
    sheetChecks.push(row);
    console.log(`[sheet ${viewport}] ${name} OPEN FAIL`, e.message || e);
    return row;
  }
  await page.waitForTimeout(400);
  const open = await sheetBgState(page);
  // close via Escape / closeSheet / sheetClose
  await page.evaluate(() => {
    try {
      if (typeof closeSheet === 'function') closeSheet();
    } catch {}
  });
  await page.keyboard.press('Escape').catch(() => {});
  const closeBtn = page.locator('#sheetClose, .sheet-close, [data-close-sheet]').first();
  if (await closeBtn.count()) {
    await closeBtn.click({ timeout: 1500 }).catch(() => {});
  }
  await page.waitForTimeout(350);
  const closed = await sheetBgState(page);
  // Extra: tap mid — must not be sheetBg
  const midAfter = await page.evaluate(() => {
    const mid = document.elementFromPoint(innerWidth / 2, innerHeight * 0.4);
    return mid
      ? {
          tag: mid.tagName.toLowerCase(),
          id: mid.id || '',
          isSheetBg: !!(mid.closest('#sheetBg') || mid.id === 'sheetBg'),
        }
      : { tag: null, id: '', isSheetBg: false, nullHit: true };
  });
  const orphan = !!(closed.on && closed.pe !== 'none') || midAfter.isSheetBg;
  const row = {
    control: `sheet:${name}`,
    viewport,
    clear: !orphan,
    hit: midAfter.isSheetBg ? 'sheetBg' : midAfter.nullHit ? 'null' : `${midAfter.tag}${midAfter.id ? '#' + midAfter.id : ''}`,
    notes: orphan
      ? `P0 orphan after close: on=${closed.on} pe=${closed.pe} mid=${JSON.stringify(midAfter)}`
      : `open on=${open.on}; closed on=${closed.on} pe=${closed.pe}; mid OK`,
    honest: !orphan,
    open,
    closed,
    midAfter,
  };
  sheetChecks.push(row);
  if (orphan) p0.push({ ...row, screen: name });
  console.log(`[sheet ${viewport}] ${name}`, JSON.stringify({ orphan, open: open.on, closed: closed.on, pe: closed.pe }));
  return row;
}

function scoreAll(list) {
  const judged = list.filter((r) => r.honest !== null && r.honest !== undefined && !String(r.control).includes('not present'));
  const fail = judged.filter((r) => !r.honest);
  const pass = judged.length - fail.length;
  const raw = judged.length ? 10 * (pass / judged.length) : 0;
  // Weight P0 store-finish / sheetBg harder: −0.8 each unique P0
  const uniqueP0 = new Set(p0.map((x) => `${x.control}|${x.viewport}`)).size;
  const score = Math.max(0, Math.min(10, Math.round((raw - uniqueP0 * 0.35) * 10) / 10));
  return { score, pass, fail: fail.length, judged: judged.length, uniqueP0 };
}

const browser = await chromium.launch({ headless: true });
const generatedAt = new Date().toISOString();

for (const vp of VIEWPORTS) {
  console.log(`\n=== ${vp.label} ${vp.id} ===`);
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('paidia.lang', 'el');
    localStorage.setItem('paidia.uiMode', 'pro');
    localStorage.setItem('paidia.tourSeen', '1');
    localStorage.setItem('paidia.tipsSeen', '1');
    localStorage.setItem('paidia.pwaInstallDismiss', '1');
    localStorage.setItem('paidia.onboardingDone', '1');
  });

  // ── Staff ──────────────────────────────────────────────────────────
  await login(ctx, 'e4', 'staff');
  await boot(page);

  for (const tab of STAFF_TABS) {
    await goStaffTab(page, tab);
    const probe = await probeControls(page, { viewport: vp.id, screen: `staff-${tab}`, role: 'staff' });
    for (const r of probe.rows) {
      rows.push(r);
      if (!r.honest) {
        const sev =
          r.hit === 'dock' || r.hit === 'sheetBg' || r.hit === 'null' || /P0/.test(r.notes)
            ? 'P0'
            : 'P1';
        if (sev === 'P0') p0.push(r);
      }
      console.log(
        JSON.stringify({
          control: r.control,
          viewport: r.viewport,
          clear: r.clear,
          hit: r.hit,
          honest: r.honest,
          notes: r.notes,
          overlapPx: r.overlapPx,
        }),
      );
    }
    if (tab === 'shop' && probe.storeFinish) {
      console.log('  store-finish geom', JSON.stringify(probe.storeFinish));
      // Edge probe: 4px above bar bottom — catches dock steal when center is OK but lower band overlaps
      const edge = await page.evaluate(() => {
        const sf = document.querySelector('.store-finish, .store-finish.bottom-dock');
        const dock = document.querySelector('nav.dock');
        if (!sf || !dock) return null;
        const r = sf.getBoundingClientRect();
        const d = dock.getBoundingClientRect();
        const x = (r.left + r.right) / 2;
        const yBottom = Math.min(r.bottom - 4, innerHeight - 1);
        const yDock = d.top + 8;
        const hitBottom = document.elementFromPoint(x, yBottom);
        const hitAtDockTop = document.elementFromPoint(x, yDock);
        const desc = (hit) =>
          hit
            ? `${hit.tagName.toLowerCase()}${hit.id ? '#' + hit.id : ''}.${(hit.className || '')
                .toString()
                .split(/\s+/)
                .slice(0, 2)
                .join('.')}`
            : 'null';
        return {
          yBottom: Math.round(yBottom),
          yDock: Math.round(yDock),
          dockTop: Math.round(d.top),
          barBottom: Math.round(r.bottom),
          overlap: Math.max(0, Math.round(r.bottom - d.top)),
          hitBottom: desc(hitBottom),
          hitBottomIsDock: !!(hitBottom && hitBottom.closest('nav.dock')),
          hitBottomIsFinish: !!(hitBottom && hitBottom.closest('.store-finish')),
          hitAtDockTop: desc(hitAtDockTop),
          hitAtDockIsFinish: !!(hitAtDockTop && hitAtDockTop.closest('.store-finish')),
          hitAtDockIsDock: !!(hitAtDockTop && hitAtDockTop.closest('nav.dock')),
        };
      });
      rows.push({
        control: 'staff-shop .store-finish GEOMETRY',
        viewport: vp.id,
        screen: 'staff-shop',
        role: 'staff',
        clear: probe.storeFinish.overlap === 0,
        hit: 'geom',
        honest: probe.storeFinish.overlap < 40,
        overlapPx: probe.storeFinish.overlap,
        dockTop: probe.dockTop,
        top: probe.storeFinish.top,
        bottom: probe.storeFinish.bottom,
        z: probe.storeFinish.z,
        dockZ: probe.storeFinish.dockZ,
        text: probe.storeFinish.className,
        notes: `overlap=${probe.storeFinish.overlap}px height=${probe.storeFinish.height} z=${probe.storeFinish.z} vs dockZ=${probe.storeFinish.dockZ}`,
      });
      if (edge) {
        const edgeHonest = edge.hitBottomIsFinish && !edge.hitBottomIsDock;
        rows.push({
          control: 'staff-shop .store-finish EDGE',
          viewport: vp.id,
          screen: 'staff-shop',
          role: 'staff',
          clear: edge.overlap === 0,
          hit: edge.hitBottomIsDock ? 'dock' : edge.hitBottomIsFinish ? 'store-finish' : edge.hitBottom,
          honest: edgeHonest,
          overlapPx: edge.overlap,
          dockTop: edge.dockTop,
          top: edge.yBottom,
          bottom: edge.barBottom,
          notes: `y=${edge.yBottom} hit=${edge.hitBottom}; at dockTop+8 hit=${edge.hitAtDockTop} finish=${edge.hitAtDockIsFinish}`,
        });
        if (!edgeHonest || edge.overlap >= 40) {
          p0.push({
            control: 'staff-shop .store-finish EDGE',
            viewport: vp.id,
            clear: false,
            hit: edge.hitBottomIsDock ? 'dock' : 'overlap',
            notes: `P0: store-finish edge vs dock overlap=${edge.overlap}px hit=${edge.hitBottom}`,
            honest: false,
            overlapPx: edge.overlap,
          });
        }
      }
      if (probe.storeFinish.overlap >= 40) {
        p0.push({
          control: 'staff-shop .store-finish GEOMETRY',
          viewport: vp.id,
          clear: false,
          hit: 'geom-overlap',
          notes: `P0: ${probe.storeFinish.overlap}px overlap vs dock`,
          honest: false,
          overlapPx: probe.storeFinish.overlap,
        });
      }
    }
    if (tab === 'home' || tab === 'shop') {
      await page.screenshot({ path: path.join(OUT_SHOT, `${vp.id}__staff-${tab}.png`) });
    }
  }

  // Sheets: notifs + Άλλα (more)
  await goStaffTab(page, 'home');
  await cycleSheet(
    page,
    async () => {
      const btn = page.locator('#btnNotifs').first();
      if (await btn.count()) await btn.click({ timeout: 5000 });
      else await page.evaluate(() => {
        if (typeof openNotifs === 'function') openNotifs();
        else document.getElementById('btnNotifs')?.click();
      });
    },
    'notifs',
    vp.id,
  );

  await cycleSheet(
    page,
    async () => {
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('nav.dock button')].find((x) => {
          const s = getComputedStyle(x);
          const r = x.getBoundingClientRect();
          if (s.display === 'none' || r.height < 4) return false;
          return /Άλλα|Mehr|More|···/.test(
            `${x.textContent || ''} ${x.getAttribute('aria-label') || ''}`,
          );
        });
        b?.click();
      });
    },
    'alla-more',
    vp.id,
  );

  // ── Kid ────────────────────────────────────────────────────────────
  await ctx.clearCookies();
  await login(ctx, 'k1', 'child');
  await boot(page);

  for (const view of ['today', 'games', 'rate']) {
    await goKidView(page, view);
    const probe = await probeControls(page, { viewport: vp.id, screen: `kid-${view}`, role: 'kid' });
    for (const r of probe.rows) {
      rows.push(r);
      if (!r.honest && (r.hit === 'dock' || r.hit === 'sheetBg' || r.hit === 'null' || /P0/.test(r.notes))) {
        // dock self-hits already marked honest; content stolen by dock is P0
        if (!String(r.control).includes('dock:')) p0.push(r);
      }
      console.log(
        JSON.stringify({
          control: r.control,
          viewport: r.viewport,
          clear: r.clear,
          hit: r.hit,
          honest: r.honest,
          notes: r.notes,
        }),
      );
    }
    if (view === 'today') {
      await page.screenshot({ path: path.join(OUT_SHOT, `${vp.id}__kid-${view}.png`) });
    }
  }

  // Kid more sheet — #dockMore can be aria-hidden duplicate; click visible kid-dock item
  await goKidView(page, 'today');
  await cycleSheet(
    page,
    async () => {
      const opened = await page.evaluate(() => {
        const candidates = [
          ...document.querySelectorAll('nav.kid-dock button, #bottomPanel button, nav.dock button'),
        ];
        const btn = candidates.find((b) => {
          const s = getComputedStyle(b);
          const r = b.getBoundingClientRect();
          if (s.display === 'none' || s.visibility === 'hidden' || r.height < 4) return false;
          const t = `${b.getAttribute('aria-label') || ''} ${b.textContent || ''}`;
          return /Άλλα|Mehr|More|···|dockMore/i.test(t) || b.id === 'dockMore' || b.classList.contains('dock-more');
        });
        if (!btn) return false;
        btn.click();
        return true;
      });
      if (!opened) {
        await page.locator('nav.kid-dock button.dock-more, nav.kid-dock #dockMore').first().click({
          timeout: 3000,
          force: true,
        }).catch(() => {});
      }
    },
    'kid-alla-more',
    vp.id,
  );

  await ctx.close();
}

await browser.close();

// Deduplicate P0 by control+viewport
const p0Dedup = [];
const p0Keys = new Set();
for (const x of p0) {
  const k = `${x.control}|${x.viewport}|${x.hit}`;
  if (p0Keys.has(k)) continue;
  p0Keys.add(k);
  p0Dedup.push(x);
}

const scoring = scoreAll([...rows, ...sheetChecks]);

// Prefer a focused table: primary interesting rows (not every dock item × mid)
const tableRows = [
  ...rows.filter((r) => {
    const c = r.control || '';
    if (c.includes('GEOMETRY')) return true;
    if (c.includes('.store-finish')) return true;
    if (c.includes('mid-viewport')) return true;
    if (c.includes('#homeShift')) return true;
    if (c.includes('.m-cta') || c.includes('.home-bento')) return true;
    if (c.includes('#shiftNoteSave') || c.includes('.talk-compose')) return true;
    if (c.includes('last .lager') || c.includes('last .stock')) return true;
    if (c.includes('.admin-tile') || c.includes('admin')) return true;
    if (c.includes('kid-') && (c.includes('cta') || c.includes('bonus') || c.includes('dock:'))) return true;
    if (!r.honest) return true;
    return false;
  }),
  ...sheetChecks.map((s) => ({
    control: s.control,
    viewport: s.viewport,
    clear: s.clear,
    hit: s.hit,
    notes: s.notes,
    honest: s.honest,
  })),
];

// Unique table by control+viewport
const tableSeen = new Set();
const table = [];
for (const r of tableRows) {
  const k = `${r.control}|${r.viewport}`;
  if (tableSeen.has(k)) continue;
  tableSeen.add(k);
  table.push(r);
}

const md = `# Mobile agent — unresponsive / dead-tap hunt (v294)

**Generated:** ${generatedAt}
**Base:** ${BASE}/m/ · **Pins:** e4 staff / k1 kid
**Viewports:** ${VIEWPORTS.map((v) => `${v.id} (${v.label})`).join(' · ')}
**Method:** Playwright Chromium · \`scrollY=0\` · control center via \`document.elementFromPoint\` vs \`nav.dock\` / \`nav.kid-dock\` / \`.store-finish\` / \`#sheetBg\` / null
**Shots:** \`.qa-screens/agent-unresponsive-v294/\`

## Unresponsive honesty score: **${scoring.score} / 10**

Judged ${scoring.judged} probes → ${scoring.pass} honest / ${scoring.fail} dishonest · unique P0 keys: ${scoring.uniqueP0}
(10 = all taps honest; each unique P0 −0.35 from pass-rate baseline)

## P0 list

${
  p0Dedup.length
    ? p0Dedup
        .map(
          (r) =>
            `- **${r.control}** @ \`${r.viewport}\` — hit=\`${r.hit}\`${r.overlapPx != null ? ` overlap=${r.overlapPx}px` : ''} — ${r.notes}`,
        )
        .join('\n')
    : '_none_'
}

## Hit-test table

| control | viewport | clear | hit | notes |
|---------|----------|:-----:|-----|-------|
${table
  .map((r) => {
    const clear =
      r.clear === true ? 'yes' : r.clear === false ? 'no' : '—';
    const hit = String(r.hit || '').replace(/\|/g, '/');
    const notes = String(r.notes || '')
      .replace(/\|/g, '/')
      .replace(/\n/g, ' ');
    const mark = r.honest === false ? ' ❌' : r.honest === true ? '' : '';
    return `| ${r.control}${mark} | ${r.viewport} | ${clear} | \`${hit}\` | ${notes} |`;
  })
  .join('\n')}

## Scoring rules

- **Honest** = center \`elementFromPoint\` lands on the intended control (or dock self for dock items), not dock/sheetBg/null for content.
- **\`.store-finish\`** = P0 if geometry overlap vs dock ≥ 40px **or** center tap stolen by dock.
- **Sheets** = P0 if after close \`#sheetBg.on\` still blocks pointer events or mid-viewport hits \`#sheetBg\`.
- Content under dock at scroll0 (list tails) = dishonest / usually P1 unless tap is stolen at center.

## Staff tabs covered

${STAFF_TABS.map((t) => `\`${t}\``).join(', ')}

## Kid views covered

\`today\`, \`games\`, \`rate\` (+ dock items + Άλλα sheet)

\`\`\`json
${JSON.stringify(
  {
    score: scoring.score,
    scoring,
    p0: p0Dedup,
    sheetChecks,
    tableCount: table.length,
    rowCount: rows.length,
  },
  null,
  2,
)}
\`\`\`
`;

fs.writeFileSync(REPORT, md);
fs.writeFileSync(
  REPORT_JSON,
  JSON.stringify({ generatedAt, scoring, p0: p0Dedup, sheetChecks, table, rows }, null, 2),
);
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify({ report: REPORT, score: scoring.score, p0: p0Dedup.length, table: table.length }, null, 2));
process.exit(0);
