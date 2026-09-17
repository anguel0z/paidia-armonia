# Mobile agent — UI bugs sweep (beyond overflow) v294

**Date:** 2026-09-16  
**Scope:** `/m/` only · staff `e4` · child `k1` · EL / pro  
**Server:** `http://127.0.0.1:5173`  
**Viewports:** **390×844** (primary), **280×653** (Fold cover), **844×390** (landscape)  
**Product code:** not modified  

**Evidence root:** `.qa-screens/agent-ui-bugs-sweep-v294/`  
**Automation:** `node scripts/qa-mobile-ui-bugs-sweep.mjs` → `findings.json` + per-tab `*.json` probes + 48 PNGs  

**Prior context used:** `docs/agents/MOBILE_DEEP_MAP_v294.md`, `docs/agents/MOBILE_AGENT_SHOP_FOLD_RATE_v294.md`

---

## Executive read

Cross-cutting sticky chrome (especially `#pwaInstallBar`) is the dominant regression: it stacks with shop finish / stock counter, truncates its own copy, and on kid raises **above** the dock (`z:61` vs dock `z:45`). Talk compose is **fixed but parked far below the viewport** — empty state invites typing with no reachable composer. Shop finish **no longer overlaps the dock** at 390 (pad ~120px; finish bottom 766 / dockTop 780) — prior P0 dock collision is mitigated — but finish still wars with the PWA bar and internal receipt CTA wrap remains.

| Bucket | Count (deduped automation) | Human-curated below |
|--------|---------------------------:|---------------------|
| P0 | 5 | 3 themes |
| P1 | 38 | ~8 themes (many Fold dock-label repeats) |
| P2 | 3 | polish |

---

## P0

### 1. Talk compose not usable above the fold
- **What:** `.chat-compose.talk-compose` is `position:fixed` but measured at **top ≈ 1113 / bottom ≈ 1178** on 390×844 (vh 844). Above-fold Talk shows empty state (“Δεν υπάρχουν ακόμη μηνύματα. Γράψτε το πρώτο.”) with **no composer**; PWA bar sits where a compose strip should live.
- **Why it matters:** Core staff messaging regression — cannot start a message without hunting off-screen fixed chrome.
- **Repro:** Login `e4` → More → Talk (or `state.tab='talk'`).
- **Metrics:** `390x844/staff-talk.json` → `talk.aboveDock:false`, `overlapDock:64`, compose top 1113.
- **Shots:**  
  - `.qa-screens/agent-ui-bugs-sweep-v294/390x844/staff-talk.png`  
  - `.qa-screens/agent-ui-bugs-sweep-v294/280x653/staff-talk.png`  
  - `.qa-screens/agent-ui-bugs-sweep-v294/844x390/staff-talk.png`

### 2. `#pwaInstallBar` sticky war (stock + shop + global)
- **What:** Fixed install banner (`z≈35` staff / **`z:61` kid**) stacks with:
  - `#stockCounterOpen` — **48px** overlap (z 40 vs 35)
  - `.store-finish.bottom-dock` — **50px** overlap (z 48 vs 35)
  - Content bottoms on book / schedule / talk / admin / kid home
- **Copy:** Left instruction truncates to `Κοινή χρήση -> «Στ...` — meaning lost.
- **Why:** Second sticky bottom layer fights every page CTA and, on kid, outranks the dock in z-index.
- **Shots:**  
  - `.qa-screens/agent-ui-bugs-sweep-v294/390x844/staff-stock.png`  
  - `.qa-screens/agent-ui-bugs-sweep-v294/390x844/staff-shop.png`  
  - `.qa-screens/agent-ui-bugs-sweep-v294/390x844/staff-schedule.png`  
  - `.qa-screens/agent-ui-bugs-sweep-v294/390x844/kid-today.png`

### 3. Shop finish chrome still broken (receipt wrap + list occlusion)
- **What:** Dock collision **improved** (`overlapDock: 0`, `padBottom: 120px` at 390). Remaining P0-grade UX:
  - Finish card + PWA bar stacked sticky (see #2)
  - Receipt control “Σάρωση απόδειξης (Παρασκευή)” **wraps into / overlaps** icon and progress title inside `.store-finish`
  - At landscape 844×390, finish (`top:224 h:88`) + dock (`top:326`) leave a thin usable list band under a tall shop header
- **Shots:**  
  - `.qa-screens/agent-ui-bugs-sweep-v294/390x844/staff-shop.png`  
  - `.qa-screens/agent-ui-bugs-sweep-v294/280x653/staff-shop.png`  
  - `.qa-screens/agent-ui-bugs-sweep-v294/844x390/staff-shop.png`  
  - Prior Fold pack still useful: `.qa-screens/agent-shop-fold-rate-v294/280x653-shop.png`

---

## P1

### 4. Book save CTA not above dock / not in first viewport
- **What:** `#shiftNoteSave` / `.journal-write-actions` measured mid ≈ **1459** (fixed strip parked below fold). First viewport shows stock-check promo + empty journal card; primary “Αποθήκευση παράδοσης” not visible. Signature line **«υπογραφή»** clips on the left of the journal card.
- **Shots:** `.qa-screens/agent-ui-bugs-sweep-v294/390x844/staff-book.png` (+ `280x653/`, `844x390/`)

### 5. Kid dock z-index under PWA bar
- **What:** Kid session: `#pwaInstallBar` `z:61` vs `#bottomPanel` `z:45`. Banner sits directly on the dock seam; risk of tap theft on Αρχή / Παιχνίδια / Βαθμοί / Άλλα.
- **Probe quirk:** Kid `dockTop` sometimes reported `0` when selector missed `nav.kid-dock` — visual + bottomPanel rect still confirm stacked bottom chrome.
- **Shot:** `.qa-screens/agent-ui-bugs-sweep-v294/390x844/kid-today.png`

### 6. Fold 280 — home bento / shift mid-row meaning loss
- **What:** At 280×653, status tiles show `Αποθ…` / `Πρόγρ…`; shift card right labels `Έλεγχος αποθέ…` / `Γράψε στο βιβλίο …`. Dock slots ~54px with `scrollWidth > clientWidth` on all five labels (aria-labels present — visual meaning still lost).
- **Shots:**  
  - `.qa-screens/agent-ui-bugs-sweep-v294/280x653/staff-home.png`  
  - `.qa-screens/agent-ui-bugs-sweep-v294/280x653/staff-*.png` (dock labels)

### 7. Duplicate titles (shell vs body)
- **Stock:** Chrome “Αποθήκη” + in-body H1 “Αποθήκη” stacked.  
  Shot: `390x844/staff-stock.png`
- **Admin:** Truncated shell “Κέντρο λειτου…” + hero “Κέντρο λειτουργίας”.  
  Shot: `390x844/staff-admin.png`

### 8. Admin ops polish / regressions
- **Desk stat tile wall:** Not reproduced this run (ops shows text attention rows) — prior P1 appears mitigated.
- **Still broken:** m-rail last pill truncates (`Ατ…`); attention row “Έλεγχος αναφορών · 0” **center-aligned** vs left-aligned siblings; hero still cream “newspaper” vs mineral pocket language.
- **Shot:** `.qa-screens/agent-ui-bugs-sweep-v294/390x844/staff-admin.png`

### 9. Stock store-chip truncation + counter sticky
- **What:** Location chips clip (`Julian groß`, trailing `V…`). `#stockCounterOpen` fixed above dock wars with PWA (#2).
- **Shot:** `390x844/staff-stock.png`

### 10. Landscape usable band crush (shop / any sticky footer)
- **What:** 844×390: dock ~64px + shop finish ~88px + tall shopping header → list almost unusable; finish sticky war flagged as P1 at this viewport.
- **Shot:** `844x390/staff-shop.png`

---

## P2

### Schedule empty chrome
- Week counters `0 Εβδομάδα / 0 Ημέρες / 0 Χωρίς άτομο` + day strip zeros when empty — noise, not broken.
- **Shot:** `390x844/staff-schedule.png`

### Pocket empty probe noise
- Automation flagged `.empty` with no-copy on pocket — treat as low confidence until visual empty state is broken (not confirmed as user-facing garbage string).

### Kid welcome still owns fold
- Full “Καλώς ήρθες…” banner on kid home before day content — hierarchy drag (matches deep-map #9), not a layout crash.
- **Shot:** `390x844/kid-today.png`

---

## Cleared / improved vs prior notes

| Prior claim | This sweep |
|-------------|------------|
| Shop finish ∩ dock ~58px | **Mitigated** at 390 — `overlapDock: 0`, pad 120px |
| Shop EL `Stk` | **Not seen** — rows show `τμχ` / `g` |
| Admin `.admin-ops-desk-stats` tile wall | **Not visible** on ops in these shots |
| Talk compose sticky above dock | **Regressed / still broken** — compose off-viewport |
| Book save under dock | Still not first-viewport / fixed strip misplaced |

---

## Top 10 bugs (priority order)

1. **Talk compose off-viewport** — cannot message from empty Talk (P0) — `390x844/staff-talk.png`
2. **PWA install bar sticky wars** — stock counter + shop finish + global content cover; truncated “«Στ…” (P0) — `staff-stock.png`, `staff-shop.png`
3. **Shop finish internal layout** — receipt CTA wrap / progress collision (P0 residual) — `staff-shop.png`
4. **Kid PWA z > dock** — tap honesty risk on kid shell (P1) — `kid-today.png`
5. **Book save / journal actions not in fold** + signature clip (P1) — `staff-book.png`
6. **Fold 280 home truncation** — bento `Αποθ…`/`Πρόγρ…` + shift mid-row (P1) — `280x653/staff-home.png`
7. **Duplicate titles** stock + admin (P1/P2) — `staff-stock.png`, `staff-admin.png`
8. **Admin rail + attention alignment** (P1) — `staff-admin.png`
9. **Stock location chips truncate** (P1) — `staff-stock.png`
10. **Landscape shop usable band** finish+dock+header (P1) — `844x390/staff-shop.png`

---

## Pass bar (retest)

- [ ] Talk: compose `bottom ≤ dockTop - 4` and visible without scroll on empty channel (390 + 280 + landscape).
- [ ] Dismiss or relocate `#pwaInstallBar` so it never intersects `.store-finish`, `#stockCounterOpen`, or kid `#bottomPanel`; no truncated install copy.
- [ ] Shop receipt CTA readable at 280 without overlapping progress title; finish stays clear of dock.
- [ ] Book: `#shiftNoteSave` visible above dock after short scroll ≤1 screen; signature not clipped.
- [ ] 280 home: bento labels ≥4 readable glyphs or icon-only with aria.
- [ ] Stock/Admin: single title owner (shell **or** body H1, not both).

```bash
node scripts/qa-mobile-ui-bugs-sweep.mjs
# artifacts: .qa-screens/agent-ui-bugs-sweep-v294/
```

---

## Evidence index (primary)

| Path | Shows |
|------|--------|
| `390x844/staff-talk.png` | Empty Talk, no compose, PWA over card |
| `390x844/staff-shop.png` | Finish + PWA stack; receipt wrap |
| `390x844/staff-stock.png` | Dup title; counter+PWA; chip clip |
| `390x844/staff-book.png` | Save missing from fold; signature clip; PWA |
| `390x844/staff-admin.png` | Dup/trunc title; rail `Ατ…`; attention align |
| `390x844/staff-schedule.png` | Zero strip + PWA stack |
| `390x844/kid-today.png` | Welcome + PWA over kid dock |
| `280x653/staff-home.png` | Fold meaning-loss truncations |
| `844x390/staff-shop.png` | Landscape band crush |
| `*/staff-*.json` | Sticky rects / z / overlap metrics |
| `findings.json` | Raw automation dump |
