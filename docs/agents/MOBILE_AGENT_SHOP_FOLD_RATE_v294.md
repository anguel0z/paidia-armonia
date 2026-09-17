# Mobile agent rate — Shop + Fold chrome (v294)

**Date:** 2026-09-16  
**Scope:** Staff shopping mode (`tab=shop` → `.store-page`) + ultra-narrow shell (Fold cover **280×653**, iPhone SE **375×667**)  
**Auth:** staff `e4` / EL / pro · `http://127.0.0.1:5173/m/`  
**Product code:** not modified  

**Evidence**
- Visual read: `.qa-screens/live-check-2026-09-15-22-51/02-staff-shop.png` (390×844 live-check)
- Playwright: `.qa-screens/agent-shop-fold-rate-v294/` (`280x653-{home,shop,dock-*}.png`, `375x667-*`, `metrics.json`)
- Metrics: `.store-finish.bottom-dock` vs `#bottomPanel` / `nav.dock`

---

## Scores

| Axis | /10 | Verdict |
|------|----:|---------|
| **Shop · Brand** | **6.0** | Pine header + sage CTA land; cream list field + peach stock pills still a second system vs mineral stock. |
| **Shop · Hierarchy** | **4.0** | Header/search clear; list scan collapses under sticky finish — only ~1 of 3 open rows readable at rest. |
| **Shop · Sticky overlap** | **2.0** | `.store-finish` fixed `z:65` overlaps dock `z:50` by **58px** on 280 / 375 / 390; `padding-bottom: 0` on store page. |
| **Shop · EL units** | **8.5** | Live EL capture: `200 g`, `1 τμχ` — no `Stk`. Residual: peach “Αποθήκη · λίγο” tone, not DE unit strings. |
| **Shop overall** | **4.5** | Matches deep-map shop grade; sticky is the blocker. |
| **Fold chrome (280)** | **4.0** | Dock shell holds (no H-overflow); shop finish + home bento/labels crush. |

### Axis notes

**Brand (6.0)** — Forest header, white search, sage “Ακόμα ανοιχτά” are on-language. Warm cream list canvas + peach warehouse pills fight mineral `--glass` used elsewhere; shopping mode still feels like a bolted-on surface.

**Hierarchy (4.0)** — Categories + product thumbs work when visible. Sticky finish + tall header (~185–203px) leave a thin usable band; item names truncate early (`Τά…`, `Λασ…`) even at 390.

**Sticky overlap (2.0)** — Measured:

| Viewport | finish top→bottom | dock top | overlap | finish h |
|----------|-------------------|----------|---------|----------|
| 280×653 | 541–646 | 588 | **58px** | 105 |
| 375×667 | 573–660 | 602 | **58px** | 87 |
| 390×844 | 750–837 | 779 | **58px** | 87 |

Receipt CTA text (“Σάρωση απόδειξης (Παρασκευή)”) wraps into the progress title at ≤375; primary pill sits inside the dock hit band (`z-index` win over dock labels).

**EL units (8.5)** — `unitLabel()` path looks live on shop rows (`τμχ` / `g`). Prior deep-map “Stk” watch not reproduced in this EL session.

**Fold chrome (4.0)** — At 280×653: dock 5×~54px slots, no `scrollWidth` overflow — chrome *frame* OK. Failures are content chrome: home bento titles `Αποθ…` / `Πρόγρ…`, shift-card mid-row crush, shop finish illegible. At 375 home recovers labels; shop finish still overlaps dock and garbles receipt CTA.

---

## P0 / P1 only

### P0

1. **Shop sticky vs dock** — `.store-finish.bottom-dock` must sit **above** the dock (or absorb dock), with list `padding-bottom` ≥ finish height. Today: 58px collision, finish steals dock taps, covers row 2–3.
2. **Shop finish internal layout (≤375 / Fold)** — Receipt scan control + progress copy collide/wrap into unreadability; primary “0/3 · Ακόμα…” sits in dock band. Unusable shopping chrome on Fold cover.

### P1

1. **Shop list under sticky** — Without pad, open items remain under the finish card at scroll 0 (live-check + Fold shots).
2. **Fold home density** — 280 home: bento + shift mid-row truncate / collide; CTA stack tight to dock (shell OK, copy not).
3. **Early name truncation** — Product titles clip after 2–3 glyphs even at 390 when decision pills / icons compete — hurts aisle scanning.
4. **Brand drift (shop)** — Cream field + peach stock badge vs pine/mineral staff shell (cosmetic vs P0 sticky, but blocks “one system”).

---

## Pass bar (retest)

- [ ] 280×653 + 375×667 + 390×844: `finish.bottom ≤ dock.top - 4` and no `elementFromPoint` on finish mid hitting dock.
- [ ] Receipt CTA + progress title readable without overlap at 280.
- [ ] At scroll 0 with 3 open items, ≥2 full choice rows clear of finish.
- [ ] EL still shows `τμχ` / `g` (no `Stk`).

```bash
# optional reproduce
node scripts/qa-mobile-live-check.mjs
# fold shots already under .qa-screens/agent-shop-fold-rate-v294/
```

---

## Evidence index

| Shot | What it shows |
|------|----------------|
| `live-check-…22-51/02-staff-shop.png` | Sticky over list; receipt text wrap; peach badge; EL qty |
| `agent-shop-fold-rate-v294/280x653-shop.png` | Fold: finish illegible + dock overlap |
| `agent-shop-fold-rate-v294/280x653-home.png` | Fold: truncated bento / shift mid-row |
| `agent-shop-fold-rate-v294/280x653-dock-shop.png` | Finish pill flush into dock |
| `agent-shop-fold-rate-v294/375x667-shop.png` | Same sticky collision; slightly calmer copy |
| `agent-shop-fold-rate-v294/375x667-home.png` | Home labels recoverable at 375 |
