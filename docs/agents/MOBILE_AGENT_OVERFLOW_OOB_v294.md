# Mobile agent — overflow / OOB / bounds hunt v294

**Date:** 2026-09-16  
**Scope:** `/m/` only · staff `e4` · child `k1` · EL / pro  
**Server:** `http://127.0.0.1:5173`  
**Product code:** not modified (report only)

**Automation:** `PAIDIA_QA_OUT=agent-overflow-oob node scripts/qa-mobile-ui-stress-bounds.mjs`  
**Evidence:** `.qa-screens/agent-overflow-oob/` (+ `spot/` for 280×653 / 375×667 / 390×844 / 844×390)  
**Raw:** `REPORT.md` · `report.json` · `spot/spot.json`

**Devices in matrix:** 12 (fold 280→iPad land + square) · staff tabs 9 · kid views 3 on 5 devices

---

## Counts

### Raw automation (stress script)

| Sev | Count | Notes |
|-----|------:|-------|
| **P0** | **31** | 26 `overlap-dock` + 5 `unresponsive` |
| **P1** | **71** | 51 `out-of-bounds` + 20 `under-dock` |
| **P2** | **0** | script did not emit rail-peek P2 |
| **overflow-x (doc)** | **0** | no `documentElement.scrollWidth > vw` |

| Kind | Count |
|------|------:|
| out-of-bounds | 51 |
| overlap-dock | 26 |
| under-dock | 20 |
| unresponsive | 5 |

### Curated classification (this hunt)

| Sev / kind | Count | Rule |
|------------|------:|------|
| **P0** overflow-x / OOB fixed layers / dead overlay | **8 themes** (~31 raw hits, heavily device-duplicated) | Visible crush, fixed chrome past dock or stealing taps, clipped content that is not a scroll-rail |
| **P1** under-dock at scroll0 | **20** (raw) · **~6 themes** | ≥4 controls in dock band at `scrollY=0` |
| **P2** intentional rail peeks | **~45–51** of raw P1 `out-of-bounds` | House chips, admin panes, schedule mode, pocket kids — parent scrolls / peek OK |
| **Not bugs** | intentional fill | `body.store-fullscreen`, `shell-m` `#view` width≈vw, dock edge-to-edge when content clears dock |

**Kid automation:** 0 findings across kid today/games/rate. **Spot visual at 280×653 kid-today:** mid/bottom cards clip on the **right** (rounded corner lost) without raising `doc.scrollWidth` — add as curated P0 theme below.

---

## Intentional fullscreen / fill (NOT bugs)

From stress `intentionalSamples` + spot measures:

| Pattern | Observed | Verdict |
|---------|----------|---------|
| `shell-m` + `#view` width == vw | **all** home/shop samples `viewFillsWidth: true` | Intentional shell fill |
| `body.store-fullscreen` on shop | **true** on every staff-shop device | Intentional shop chrome; view top=0 |
| Dock edge-to-edge | dock left≈0 / width≈vw | Intentional |
| Shop finish **above** dock (portrait) | e.g. 280 finish bottom **549** / dock **~588**; 375 **537**/~602; 390 **537**/~779 | Clearance OK — **not** dock collision |
| Shop finish **past** dock (landscape) | 844×390 finish box `[18,371,826,459]` vs dockTop **~325** | **P0** — see below |

Home/staff tabs with view bottom ≫ vh are scrollable content, not horizontal bleed.

---

## Top 8 P0s

### 1. Shop `.store-finish` internal crush (narrow / Fold)
- **What:** Finish card text/icon stack collapses — “Σάρωση απόδειξης…”, progress, and green CTA overlap; receipt glyph floats on wrapped lines.
- **Kind:** overflow / clipped text (in-card), not doc `overflow-x`.
- **Where:** ≤280–360 especially; still messy at 375.
- **Shots:**  
  - `.qa-screens/agent-overflow-oob/fold-cover__staff-shop.png`  
  - `.qa-screens/agent-overflow-oob/spot/280x653__staff-shop.png`  
  - `.qa-screens/agent-overflow-oob/iphone-se__staff-shop.png`

### 2. Shop list taps stolen by finish overlay
- **What:** Stress `unresponsive`: `elementFromPoint` hits `.store-finish` / overlay for list row “Τόνος (κονσέρβα)…”.
- **Kind:** OOB / overlapping fixed layer (z finish **48–65** vs dock **50**).
- **Devices (raw):** fold-cover, iphone-se, iphone-14, android-compact, tall-narrow (**5**).
- **Shots:** same shop pack as #1.

### 3. Landscape shop finish under dock
- **What:** At **844×390** (and stress **667×375**), `.store-finish.bottom-dock` `pastDock: true` — finish rect sits **below** dockTop (e.g. top **371** vs dock **325**). Portrait clearance is fine; landscape regresses.
- **Kind:** OOB fixed layer / dock collision.
- **Shots:**  
  - `.qa-screens/agent-overflow-oob/spot/844x390__staff-shop.png`  
  - `.qa-screens/agent-overflow-oob/landscape-15__staff-shop.png`  
  - `.qa-screens/agent-overflow-oob/landscape-se__staff-shop.png`

### 4. Talk `.chat-compose.talk-compose` vs dock (flaky geometry)
- **What:** Stress flags **12/12** devices `overlap-dock` on talk (compose bottom ≫ dockTop, z **45**). Spot remount at 280 sometimes measures compose **above** dock (`[0,464,280,581]` / dock **589**). First-paint Talk screenshots often show **empty state with no reachable composer** (compose parked off-fold or covered).
- **Kind:** OOB / misplaced fixed layer.
- **Shots:**  
  - `.qa-screens/agent-overflow-oob/fold-cover__staff-talk.png`  
  - `.qa-screens/agent-overflow-oob/iphone-14__staff-talk.png`  
  - `.qa-screens/agent-overflow-oob/landscape-15__staff-talk.png`

### 5. Book `.journal-write-actions` fixed strip parked below fold
- **What:** Fixed `z:45` bar measured ~`top 1426 / bottom 1491` (vh 653–844) — **not in first viewport**, auditor still marks `overlap-dock` because `bottom > dockTop`. Primary save CTA invisible at scroll0; journal card shows clipped signature / ellipsis copy.
- **Kind:** OOB fixed layer (off-viewport) + clipped text in card.
- **Devices:** all 12 book passes.
- **Shots:**  
  - `.qa-screens/agent-overflow-oob/fold-cover__staff-book.png`  
  - `.qa-screens/agent-overflow-oob/spot/280x653__staff-book.png`  
  - `.qa-screens/agent-overflow-oob/iphone-14__staff-book.png`

### 6. Book journal card horizontal clip (Fold)
- **What:** At 280, signature line loses leading glyph (`υπογραφή` → `πογραφή…`); body ellipsis hard-clips mid-word on the right. Not a scroll-rail.
- **Kind:** clipped text / OOB inside card.
- **Shot:** `.qa-screens/agent-overflow-oob/fold-cover__staff-book.png`

### 7. Kid today cards bleed right edge (280) — visual, missed by stress
- **What:** Mid (“Η ΜΕΡΑ ΣΟΥ”) and lower progress cards lose right radius / margin; cut flush to viewport. `hOverflow: false` (clipped by ancestor, not doc scrollWidth).
- **Kind:** OOB / overflow-x visual.
- **Shot:** `.qa-screens/agent-overflow-oob/spot/280x653__kid-today.png`  
- **Contrast:** 390 / 844 kid-today look inset; staff home clean on all four spot sizes.

### 8. Landscape shop content band crushed under dock
- **What:** Tall shop header + dock leave a thin list band; fridge card bottom meets/underlaps dock at scroll0 (finish may be fully under dock — see #3).
- **Kind:** under-dock / fixed-layer stack (promote to P0 in landscape because usable list ≈0).
- **Shots:** landscape shop set above.

---

## P1 — under-dock at scroll0

Raw **20** hits when ≥4 controls intersect dock band:

| Screen | Devices (sample) | Typical count |
|--------|------------------|---------------|
| staff-stock | fold, SE, max, android, ipad, tall, square… | 6–12 |
| staff-pocket | fold, SE, ipad, square… | 6–14 |
| staff-kids | SE, ipad-land | 4 |
| staff-schedule | landscape-se / landscape-15 | 7 |
| staff-book | max, pixel, tall | 6–7 |

**Note:** Many stock/pocket hits are list rows that intentionally scroll under a translucent dock — still flagged at scroll0 per script rule. Prefer padding-bottom audit over treating every row as a ship-blocker.

---

## P2 — intentional rail peeks (reclass of raw P1 OOB)

Most of the **51** `out-of-bounds` controls are **horizontal chip / rail peeks**, not broken layout:

| Control label (examples) | Screens | Why P2 |
|--------------------------|---------|--------|
| House chips `Valeria+Lea`, `Julian groß`, `Στο σουπερμάρκετ` | stock, shop | house rail |
| Pocket kids `V Vincent 0,00 €`, `K Kai…` | pocket | kid rail |
| Admin panes `Αποδείξεις`, `Προμήθειες`, `Οικονομικά`… | admin | pane rail |
| Schedule `Ημέρα` / `Εβδομάδα` / `Ημ` | schedule @320 | mode rail |
| Book `ΣΑ 19`, `Περισσότερες ενότητες` | book | day strip / more |
| Kids `Ιστορικό`, `Υλικό` | kids | tab/rail |

Spot confirmed **one** intentional scroll rail: `book-day-strip` at 375×667 (`peekKids:1`, `canScroll:true`).

---

## Spot-check matrix (manual + measure)

| Viewport | staff-home | staff-shop | staff-book | kid-today |
|----------|------------|------------|------------|-----------|
| **280×653** | clean fill | finish crush P0; above dock | journal actions off-fold; card clip | **right card bleed P0** |
| **375×667** | clean | finish above dock; wrap messy | day-strip peek P2; actions off-fold | clean |
| **390×844** | clean | finish above dock | actions off-fold | clean |
| **844×390** | clean fill | **finish under dock P0** | actions off-fold | clean |

Evidence: `.qa-screens/agent-overflow-oob/spot/*.png` + `spot.json`.

---

## Clean / green notes

- **No document-level horizontal overflow** in the 12-device stress matrix.
- **Staff home** and **kid automation tabs** produced **zero** stress findings.
- **Portrait shop** finish no longer overlaps dock (pad OK) — landscape is the remaining collision.
- Dock edge-to-edge + `store-fullscreen` width fill are **by design**.

---

## Suggested fix order (for a later agent — not done here)

1. Landscape: pin `.store-finish` above dock (`bottom: calc(dock + safe)`), shrink finish height.  
2. Narrow: reflow finish receipt CTA (single line / icon-only / collapse).  
3. Talk compose: always pin above dock in first viewport; kill off-fold fixed parking.  
4. Book: same for `.journal-write-actions`; fix signature clip at 280.  
5. Kid today @280: card max-width / horizontal padding so right radius clears vw.

---

## Artifact index

```
.qa-screens/agent-overflow-oob/
  REPORT.md
  report.json
  *.__staff-*.png / *__kid-*.png   # stress shots
  spot/
    spot-check.mjs
    spot.json
    280x653|375x667|390x844|844x390__{staff-home,staff-shop,staff-book,kid-today}.png
```
