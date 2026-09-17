/**
 * Backup for failed e2e agents: staff buttons + kid buttons + sheets/Mehr.
 *   node scripts/qa-mobile-buttons-sheets.mjs
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', process.env.PAIDIA_QA_OUT || 'agent-buttons-sheets');
fs.mkdirSync(OUT, { recursive: true });
const findings = [];
const note = (sev, area, detail) => {
  findings.push({ sev, area, detail });
  console.log(`  [${sev}] ${area}: ${detail}`);
};

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
  await page.waitForTimeout(300);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false }).catch(() => {});
}

async function closeSheets(page) {
  await page.evaluate(() => {
    try {
      if (typeof closeSheet === 'function') closeSheet();
    } catch {}
    document.querySelectorAll('#sheetClose, .sheet-close, [data-sheet-close]').forEach((el) => el.click());
    document.body.classList.remove('sheet-open');
    document.getElementById('sheetBg')?.classList.remove('on');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    if (typeof ensureSheetChromeConsistent === 'function') ensureSheetChromeConsistent();
  });
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(150);
}

async function sheetBgState(page) {
  return page.evaluate(() => {
    const bg = document.getElementById('sheetBg');
    const panel = document.getElementById('sheet') || document.querySelector('.sheet');
    const on = !!bg?.classList.contains('on');
    const pe = bg ? getComputedStyle(bg).pointerEvents : '';
    const panelOn = !!panel?.classList.contains('on');
    const bodyOpen = document.body.classList.contains('sheet-open');
    const orphan = on && !panelOn && !bodyOpen;
    return { on, pe, blocks: on && pe !== 'none', panelOn, bodyOpen, orphan };
  });
}

/** Playwright click every visible interactive in #view + header (staff home / kid today). */
async function probeAllVisibleButtons(page, areaTag, { scrollSteps = [0] } = {}) {
  const dead = [];
  const clicked = [];
  const seenKeys = new Set();
  await closeSheets(page);
  const allTargets = [];
  for (const scrollY of scrollSteps) {
    await page.evaluate((y) => scrollTo(0, y), scrollY);
    await page.waitForTimeout(180);
    const batch = await page.evaluate(() => {
    const isVis = (el) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 8 && r.height > 8;
    };
    const dock =
      (isVis(document.querySelector('nav.kid-dock')) && document.querySelector('nav.kid-dock')) ||
      (isVis(document.querySelector('nav.dock[data-staff-dock]')) && document.querySelector('nav.dock[data-staff-dock]')) ||
      [...document.querySelectorAll('nav.dock, nav.kid-dock')].find(isVis) ||
      null;
    const dockTop = dock?.getBoundingClientRect().top ?? innerHeight;
    const sel =
      'header button, #view button, #view [role="button"], #view .m-row, #view .page-act, #view .home-shift-step-cta, #view a.btn, #view .kid-home-cta-tile, #view .course-tile, #view [data-child-view], #view .chip, #view .kid-sub-chip';
    return [...document.querySelectorAll(sel)]
      .filter((el) => {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 18 || r.height < 18) return false;
        if (r.top < 48 || r.bottom > dockTop - 6) return false;
        if (el.closest('nav.dock, nav.kid-dock')) return false;
        return true;
      })
      .map((el, i) => {
        const label = (el.innerText || el.getAttribute('aria-label') || el.id || `btn-${i}`)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 48);
        const r = el.getBoundingClientRect();
        return { label, x: r.left + r.width / 2, y: r.top + r.height / 2, id: el.id || null };
      });
    });
    for (const t of batch) {
      const dedupe = `${t.label}|${t.id}|${Math.round(t.x)}|${Math.round(t.y)}`;
      if (seenKeys.has(dedupe)) continue;
      seenKeys.add(dedupe);
      allTargets.push(t);
    }
  }
  const targets = allTargets;

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const key = `${areaTag}:${t.label || t.id || i}`;
    let ok = true;
    let err = '';
    let blockedBySheet = false;
    try {
      await page.mouse.click(t.x, t.y);
      await page.waitForTimeout(120);
      const bg = await sheetBgState(page);
      if (bg.orphan || (bg.blocks && !bg.panelOn)) {
        blockedBySheet = true;
        await closeSheets(page);
      }
    } catch (e) {
      ok = false;
      err = String(e.message || e).slice(0, 120);
    }
    const snap = await page.evaluate(() => ({
      tab: typeof state !== 'undefined' ? state.tab : null,
      childView: typeof state !== 'undefined' ? state.childView : null,
      sheetOpen: document.body.classList.contains('sheet-open'),
    }));
    if (!ok || blockedBySheet) {
      dead.push({ key, label: t.label, id: t.id, ok, err, blockedBySheet, ...snap });
      note(blockedBySheet ? 'P0' : 'P1', areaTag, `dead/blocked "${t.label}"${err ? ` ${err}` : ''}${blockedBySheet ? ' orphan sheetBg' : ''}`);
    } else {
      clicked.push({ key, label: t.label });
    }
    await closeSheets(page);
  }
  return { targets: targets.length, clicked: clicked.length, dead };
}

async function sheetMatrixRow(page, name, openFn, opts = {}) {
  await closeSheets(page);
  const row = { name, opened: false, closedClean: false, orphanAfterClose: false, detail: '', kind: opts.expectAccountTab ? 'account-nav' : 'sheet' };
  try {
    await openFn();
    await page.waitForTimeout(400);
    const opened = await page.evaluate((expectAccount) => {
      if (expectAccount) return state?.tab === 'account' && !!document.querySelector('#accountSecurityHost, .account-security');
      return document.body.classList.contains('sheet-open') || !!document.querySelector('#sheet.on, .sheet.on');
    }, !!opts.expectAccountTab);
    row.opened = opened;
    if (!opened) {
      row.detail = opts.expectAccountTab ? 'account view did not open' : 'sheet did not open';
      note('P1', 'sheet-matrix', `${name}: no open`);
      await shot(page, `matrix-${name}-fail-open`);
      return row;
    }
    if (opts.expectAccountTab) {
      await page.evaluate(() => {
        state.tab = 'home';
        render();
      });
      await page.waitForTimeout(200);
      row.closedClean = true;
      note('P3', 'sheet-matrix', `${name}: account nav OK`);
      await shot(page, `matrix-${name}-closed`);
      return row;
    }
    await shot(page, `matrix-${name}-open`);
    await page.evaluate(() => {
      document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
      if (typeof closeSheet === 'function') closeSheet();
      if (typeof ensureSheetChromeConsistent === 'function') ensureSheetChromeConsistent();
    });
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(150);
    const bg = await sheetBgState(page);
    row.orphanAfterClose = bg.orphan || (bg.on && bg.blocks);
    row.closedClean = !bg.bodyOpen && !bg.orphan && !(bg.on && bg.blocks);
    if (!row.closedClean) {
      row.detail = `bg.on=${bg.on} orphan=${bg.orphan} bodyOpen=${bg.bodyOpen}`;
      note('P0', 'sheet-matrix', `${name}: stale chrome after close — ${row.detail}`);
      await shot(page, `matrix-${name}-orphan`);
    } else {
      note('P3', 'sheet-matrix', `${name}: open/close OK`);
    }
    await shot(page, `matrix-${name}-closed`);
  } catch (e) {
    row.detail = String(e.message || e).slice(0, 160);
    note('P1', 'sheet-matrix', `${name}: ${row.detail}`);
  }
  await closeSheets(page);
  return row;
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  ...devices['iPhone 15 Pro'],
  viewport: { width: 390, height: 844 },
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
page.on('pageerror', (e) => note('P0', 'runtime', e.message));
await page.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
});

console.log('=== staff buttons ===');
await login(ctx, 'e4', 'staff');
await boot(page);

const staffTabs = ['home', 'schedule', 'stock', 'shop', 'talk', 'kids', 'pocket', 'gallery', 'book', 'admin'];
for (const tab of staffTabs) {
  await page.evaluate((t) => {
    state.tab = t;
    if (t === 'schedule') setScheduleView('day', { persist: false });
    if (t === 'admin') state.adminPane = 'ops';
    render();
    scrollTo(0, 0);
  }, tab);
  await page.waitForTimeout(200);
  await shot(page, `staff-${tab}`);

  // Click first few visible in-view CTAs
  const clicks = await page.evaluate(() => {
    const out = [];
    const btns = [...document.querySelectorAll('#view button.btn, #view .m-row, #view .page-act, #view .home-shift-step-cta')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 20 && r.height > 20 && r.top > 60 && r.bottom < innerHeight - 80;
      })
      .slice(0, 4);
    for (const b of btns) {
      const label = (b.innerText || b.id || '').replace(/\s+/g, ' ').trim().slice(0, 36);
      try {
        b.click();
        out.push({ label, ok: true });
      } catch (e) {
        out.push({ label, ok: false, err: String(e.message || e) });
      }
    }
    return out;
  });
  clicks.filter((c) => !c.ok).forEach((c) => note('P1', `staff-${tab}`, `dead click ${c.label}`));
  await closeSheets(page);
}

// Dock probe
await page.evaluate(() => {
  state.tab = 'home';
  render();
});
const dockClicks = await page.evaluate(() => {
  return [...document.querySelectorAll('nav.dock button')].map((b) => {
    const label = (b.innerText || '').replace(/\s+/g, ' ').trim();
    try {
      b.click();
      return { label, ok: true, tab: b.dataset.tab || null };
    } catch (e) {
      return { label, ok: false, err: String(e.message || e) };
    }
  });
});
dockClicks.forEach((d) => {
  if (!d.ok) note('P0', 'staff-dock', `dead ${d.label}`);
});
await shot(page, 'staff-dock-last');

// Dock sweep may leave Άλλα/Mehr open — dismiss before header tools
await closeSheets(page);

// Header sheets
await page.evaluate(() => {
  state.tab = 'home';
  render();
});
for (const sel of ['#btnNotifs', '#btnUser']) {
  const exists = await page.$(sel);
  if (!exists) {
    note('P1', 'header', `missing ${sel}`);
    continue;
  }
  await page.click(sel).catch((e) => note('P1', 'header', `${sel} click fail ${e.message}`));
  await page.waitForTimeout(350);
  await shot(page, `sheet-${sel.replace('#', '')}`);
  const open = await page.evaluate(() => !!(document.querySelector('.sheet, #sheet, [role="dialog"]') || document.body.classList.contains('sheet-open')));
  if (!open) note('P1', 'header', `${sel} did not open visible sheet`);
  await closeSheets(page);
  await page.waitForTimeout(200);
}

// Mehr / Άλλα
const mehr = await page.locator('nav.dock button').filter({ hasText: /Άλλα|Mehr|···/ }).first();
if (await mehr.count()) {
  await mehr.click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, 'sheet-mehr');
  const dests = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.sheet button, #sheet button, [data-more-tab], [data-tab], a.sheet-link')].slice(0, 12);
    return items.map((el) => (el.innerText || el.dataset.tab || '').replace(/\s+/g, ' ').trim().slice(0, 40));
  });
  console.log('  mehr destinations:', dests.join(' | ') || '(none listed)');
  // click first 3 destinations
  for (let i = 0; i < Math.min(3, dests.length); i++) {
    await page.evaluate((idx) => {
      const items = [...document.querySelectorAll('.sheet button, #sheet button, [data-more-tab], [data-tab]')];
      items[idx]?.click();
    }, i);
    await page.waitForTimeout(300);
    await shot(page, `mehr-dest-${i}`);
    await closeSheets(page);
  }
} else {
  note('P1', 'mehr', 'Άλλα / Mehr dock button not found');
}

// Stock check sheet
await page.evaluate(() => {
  state.tab = 'stock';
  render();
});
await page.waitForTimeout(200);
const openedCheck = await page.evaluate(() => {
  const b = document.querySelector('#stockShiftCheck, .shift-check-open-btn, button.shift-check-open-btn');
  if (b) {
    b.click();
    return true;
  }
  const alt = [...document.querySelectorAll('button')].find((el) => /Έλεγχος|Kontrolle|Check/i.test(el.innerText || ''));
  if (alt) {
    alt.click();
    return true;
  }
  return false;
});
await page.waitForTimeout(400);
await shot(page, 'sheet-stock-check');
if (!openedCheck) note('P2', 'stock-check', 'could not open shift check sheet');
await closeSheets(page);

// Admin panes
console.log('=== admin panes ===');
for (const pane of ['ops', 'team', 'supplies', 'receipts', 'school', 'finance', 'system']) {
  await page.evaluate((p) => {
    state.tab = 'admin';
    state.adminPane = p;
    render();
    scrollTo(0, 0);
  }, pane);
  await page.waitForTimeout(180);
  await shot(page, `admin-${pane}`);
}

console.log('=== kid buttons ===');
await login(ctx, 'k1', 'child');
await boot(page);
const kidViews = ['today', 'games', 'rate', 'pocket', 'notes', 'bonus', 'plan', 'rewards', 'learn', 'gallery', 'rules'];
for (const view of kidViews) {
  await page.evaluate((v) => {
    if (typeof goChildView === 'function') goChildView(v);
    else {
      state.childView = v;
      render();
    }
    scrollTo(0, 0);
  }, view);
  await page.waitForTimeout(200);
  await shot(page, `kid-${view}`);
}
const kidDock = await page.evaluate(() =>
  [...document.querySelectorAll('nav.kid-dock button')].map((b) => {
    const label = (b.innerText || '').replace(/\s+/g, ' ').trim();
    const r = b.getBoundingClientRect();
    const trunc = b.querySelector('span:not(.i):not(.nav-ico)')
      ? b.querySelector('span:not(.i):not(.nav-ico)').scrollWidth > b.querySelector('span:not(.i):not(.nav-ico)').clientWidth + 1
      : false;
    try {
      b.click();
      return { label, ok: true, trunc, w: Math.round(r.width) };
    } catch (e) {
      return { label, ok: false, trunc, err: String(e.message || e) };
    }
  }),
);
kidDock.forEach((d) => {
  if (!d.ok) note('P0', 'kid-dock', `dead ${d.label}`);
  if (d.trunc) note('P1', 'kid-dock', `truncated label ${d.label}`);
});
await shot(page, 'kid-dock-last');

// Kid more
const kidMore = page.locator('#kidDockMore, .kid-dock-more').first();
if (await kidMore.count()) {
  await kidMore.click().catch(() => {});
  await page.waitForTimeout(350);
  await shot(page, 'kid-more-sheet');
  await closeSheets(page);
}

console.log('=== deep probe: staff home buttons ===');
await login(ctx, 'e4', 'staff');
await boot(page);
await page.evaluate(() => {
  state.tab = 'home';
  render();
  scrollTo(0, 0);
});
await page.waitForTimeout(300);
await shot(page, 'deep-staff-home-before');
const staffHomeProbe = await probeAllVisibleButtons(page, 'staff-home');
await shot(page, 'deep-staff-home-after');

console.log('=== deep probe: kid today buttons ===');
const kidCtx = await browser.newContext({
  ...devices['iPhone 15 Pro'],
  viewport: { width: 390, height: 844 },
  serviceWorkers: 'block',
});
const kidPage = await kidCtx.newPage();
await kidPage.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
});
await login(kidCtx, 'k1', 'child');
await kidPage.goto(`${BASE}/m/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await kidPage.waitForFunction(
  () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
  { timeout: 60000 },
);
await kidPage.evaluate((v) => {
  if (typeof goChildView === 'function') goChildView(v);
  else {
    state.childView = v;
    render();
  }
  scrollTo(0, 0);
}, 'today');
await kidPage.waitForTimeout(300);
const kidShot = async (name) =>
  kidPage.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false }).catch(() => {});
await kidShot('deep-kid-today-before');
const kidTodayProbe = await probeAllVisibleButtons(kidPage, 'kid-today', { scrollSteps: [0, 380, 720, 1100] });
await kidShot('deep-kid-today-after');
await kidCtx.close();

console.log('=== sheet matrix (staff) ===');
await login(ctx, 'e4', 'staff');
await boot(page);
await page.evaluate(() => {
  state.tab = 'home';
  render();
});
const sheetMatrix = [];
sheetMatrix.push(
  await sheetMatrixRow(page, 'notifs', async () => {
    await page.click('#btnNotifs');
  }),
);
sheetMatrix.push(
  await sheetMatrixRow(page, 'user-account', async () => {
    await page.evaluate(() => {
      state.tab = 'home';
      render();
    });
    await page.click('#btnUser');
  }, { expectAccountTab: true }),
);
sheetMatrix.push(
  await sheetMatrixRow(page, 'mehr', async () => {
    const mehrBtn = page.locator('nav.dock button').filter({ hasText: /Άλλα|Mehr|···/ }).first();
    if (await mehrBtn.count()) await mehrBtn.click();
    else throw new Error('Mehr button missing');
  }),
);
await page.evaluate(() => {
  state.tab = 'stock';
  render();
});
await page.waitForTimeout(200);
sheetMatrix.push(
  await sheetMatrixRow(page, 'stock-check', async () => {
    const opened = await page.evaluate(() => {
      const b = document.querySelector('#stockShiftCheck, .shift-check-open-btn, button.shift-check-open-btn');
      if (b) {
        b.click();
        return true;
      }
      const alt = [...document.querySelectorAll('button')].find((el) => /Έλεγχος|Kontrolle|Check/i.test(el.innerText || ''));
      if (alt) {
        alt.click();
        return true;
      }
      return false;
    });
    if (!opened) throw new Error('stock check trigger not found');
  }),
);

await closeSheets(page);
await page.evaluate(() => {
  if (typeof ensureSheetChromeConsistent === 'function') ensureSheetChromeConsistent();
});
const finalSheet = await sheetBgState(page);
if (finalSheet.orphan) {
  note('P0', 'sheet-chrome', `orphan #sheetBg.on after QA (pe=${finalSheet.pe})`);
  await shot(page, 'orphan-sheetBg-final');
}

const deadButtons = [
  ...staffHomeProbe.dead.map((d) => ({ ...d, surface: 'staff-home' })),
  ...kidTodayProbe.dead.map((d) => ({ ...d, surface: 'kid-today' })),
];
const probeTotal = staffHomeProbe.targets + kidTodayProbe.targets;
const probeDead = deadButtons.length;
const matrixFail = sheetMatrix.filter((r) => !r.closedClean || !r.opened).length;
const p0 = findings.filter((f) => f.sev === 'P0').length;
const p1 = findings.filter((f) => f.sev === 'P1').length;
let interactionScore = 10;
interactionScore -= Math.min(4, p0 * 2);
interactionScore -= Math.min(3, p1 * 0.5);
interactionScore -= Math.min(2, probeDead * 0.25);
interactionScore -= Math.min(2, matrixFail);
interactionScore = Math.max(1, Math.round(interactionScore * 10) / 10);

await browser.close();

const bySev = findings.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});
const report = {
  at: new Date().toISOString(),
  findings,
  bySev,
  count: findings.length,
  out: OUT,
  interactionScore,
  deadButtons,
  probeSummary: { staffHome: staffHomeProbe, kidToday: kidTodayProbe, totalTargets: probeTotal, totalDead: probeDead },
  sheetMatrix,
  finalSheetChrome: finalSheet,
  ensureSheetChromeConsistent: 'called on closeSheets + post-QA; orphan=false expected',
};
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
let md = `# Buttons + sheets QA\n\n**Interaction score:** ${interactionScore}/10\n\n`;
md += `Probe: ${probeTotal} targets, ${probeDead} dead/blocked on staff-home + kid-today.\n\n`;
md += `Sheet matrix: ${sheetMatrix.filter((r) => r.closedClean && r.opened).length}/${sheetMatrix.length} clean close.\n\n`;
md += `Final #sheetBg: on=${finalSheet.on} orphan=${finalSheet.orphan}\n\n`;
md += `Findings: ${findings.length} ${JSON.stringify(bySev)}\n\n`;
if (deadButtons.length) {
  md += `## Dead / blocked buttons\n\n`;
  deadButtons.forEach((d) => {
    md += `- **${d.surface}** \`${d.label}\`${d.blockedBySheet ? ' (sheetBg orphan)' : ''}${d.err ? `: ${d.err}` : ''}\n`;
  });
  md += `\n`;
}
md += `## Sheet matrix\n\n| Sheet | opened | closed clean | orphan |\n|-------|--------|--------------|--------|\n`;
sheetMatrix.forEach((r) => {
  md += `| ${r.name} | ${r.opened} | ${r.closedClean} | ${r.orphanAfterClose} |\n`;
});
md += `\n## All findings\n\n`;
findings.forEach((f) => {
  md += `- [${f.sev}] **${f.area}**: ${f.detail}\n`;
});
fs.writeFileSync(path.join(OUT, 'REPORT.md'), md);
console.log(
  JSON.stringify(
    { interactionScore, deadButtons: deadButtons.length, sheetMatrix, findings: findings.length, bySev, out: OUT },
    null,
    2,
  ),
);
process.exit(findings.some((f) => f.sev === 'P0') ? 1 : 0);
