# Mobile QA consolidated findings — fleet + v294

**Generated:** 2026-09-15 (local)  
**Matrix:** `.qa-screens/fleet-2026-09-15-22-14/` + aspects `.qa-screens/agent-aspects-v294b/`  
**Follow-up:** Bug hunter P0s retested **cleared** (`qa-hit-dock-cta.mjs`). Aspects: shortened kid dock labels (Βαθμοί/Τσέπη); Home shift-first + inbox capped at 2 on `/m/`.

**2026-09-16 dock pass:** Home bento + book `#shiftNoteSave` clear dock (`qa-hit-home-book.mjs`); `scripts/qa-mobile-live-check.mjs` → `ok: true` (`.qa-screens/live-check-2026-09-15-22-51/`). Deep map overall **7.6/10** — see `MOBILE_DEEP_MAP_v294.md`.

---

## Executive verdict

| Area | Status |
|------|--------|
| Core phone (390×844) after v294 | Usable — dock labels OK, kid rows fixed, week day focus OK |
| Ultra-narrow (280 Fold cover) | **Fail polish** — header + dock truncate hard |
| Book / Βιβλίο | **P0-ish** — content under dock; meta text clips right |
| Stock house rail | Peek OK (intentional scroll); detector still flags last chip |
| Landscape phone (844×390) | Dock + week jump compete for vertical space |
| iPad portrait as `/m/` | Works but wastes width; under-dock false positives from tall viewport |

**Matrix tally:** 107 findings → **20 P0** (mostly rail/chip edge peeks + Book), **87 P1** (under-dock at scroll=0 — many are “last visible row behind dock”, fixable with padding / scroll-into-view).

---

## P0 — fix or reclassify

### Real (fix intentional rail peek)

1. **Βιβλίο (Book) on SE / Fold** — shift journal card and CTAs sit under dock; “Angela 2026-09-1…” clips on the right. Needs more `#view` / `.m-book` bottom pad + `min-width:0` on meta row.
2. **Fold cover chrome** — title truncates to `X..`, dock **Πρόγραμμα → Πρόγρα…** again (280px too narrow for 5 labels). Options: icon-only dock under 320px, or 2-line dock.
3. **Pocket “Διόρθωση” on Fold** — flagged clipped; verify in `galaxy-fold-cover__staff-pocket.png` (action may sit off-rail).

### Likely false positives (horizontal rails)

- Stock `Valeria+Lea` / `Julian groß` — house chip rail with intentional `overflow-x:auto`
- Schedule `ΚΥΡ 20` / `ΣΑΒ 19` — day strip peek
- Book calendar day chips `ΣΑ 19` / `ΚΥ 20` — same pattern; ensure parent is a scroll rail so they don’t expand `document.scrollWidth`

---

## P1 — under dock (scroll position 0)

Common across SE → Pro Max → Pixel:

| Screen | What’s buried |
|--------|----------------|
| Stock | Last product row −/+ steppers |
| Kids | Last kid card + edit icons |
| Pocket | Calendar day cells 28–30 / 1–6 |
| Schedule | Empty “＋ Δεν έχει προγραμματιστεί” |
| Admin | Attention list CTAs |
| Kid today/games | Bottom tiles / last game card |

**Fix pattern:** ensure `.m-page::after` spacer + `--m-dock-h` padding always applied; on Pocket calendar specifically add `padding-bottom` inside `.pocket-cal-wrap` so month grid clears dock without scrolling past.

---

## Aspect ratio matrix (pass/fail)

| Viewport | Home | Stock | Plan | Kids | Pocket | Notes |
|----------|------|-------|------|------|--------|-------|
| 280×653 Fold | ⚠ | ⚠ | ⚠ | ⚠ | ✗ | Dock + header crush |
| 375×667 SE | ✓ | ⚠ rail | ⚠ | ⚠ | ⚠ | Book clips |
| 390×844 15 | ✓ | ⚠ rail | ✓ | ✓ | ⚠ cal | Best target |
| 430×932 Max | ✓ | ⚠ | ✓ | ⚠ | ⚠ | Tall; more under-dock noise |
| 412×915 Pixel | ✓ | ⚠ | ⚠ | — | — | Similar to 15 |
| 768×1024 iPad | ✓ | ⚠ | ✓ | ✓ | ⚠ | `/m/` stretched; consider redirect desk |
| 844×390 land | ⚠ | ⚠ | ✗ week | ⚠ | ⚠ | Too short for dock+content |

---

## Button / interaction (session so far)

Already verified earlier this session:

- Staff dock 5 items clickable; labels readable at 390
- Kid dock 6 items present; `Αξιολόγηση` still truncates at 390 — **overhaul candidate** (short labels or 5+More)
- Shift-check sheet opens; footer stacks after v294
- Home empty-task letter-stack chip removed
- **Home shift journal CTA** — moved to `.home-shift-start-head` (no longer last step button under dock)
- **Hit-test `qa-hit-dock-cta.mjs` (post-fix):** staff journal `clear:true hitIsDock:false` (btnBottom 618 / dockTop 780); stock also clear; kid home CTA + dock notes OK
- Kid home CTA grid hides dock-dup tiles (`games/rate/pocket/notes`) on `/m/` — notes via kid dock only

Agents still validating: full CTA matrix, Mehr destinations, sheet dismiss, Admin panes.

---

## Anti–AI-slop / overhaul directions (preview)

Kill:

- Duplicate heroes (page title in header **and** big in-body title)
- Card-on-card (shift check banner + instruction card + journal on Book)
- Status bento with empty circular placeholders (Home Αποθήκη/Πρόγραμμα/Λίστα icons missing)
- Mixed DE units (`Stk`) inside EL UI
- Six kid-dock destinations fighting for width

Keep:

- Pine/mineral tokens, Fraunces display, Outfit UI
- Product photo rows in Lager
- Dark pocket balance hero (v285)
- Five-item staff dock + Mehr sheet model

Full write-up lands in `docs/agents/MOBILE_UI_OVERHAUL_NOTES_v294.md` (anti-slop agent).

---

## Recommended next code fixes (ordered)

1. **≤320px:** icon-only staff + kid dock (labels `sr-only` / aria-label only)
2. **Book `.m-book`:** bottom clear + meta ellipsis; book-panes as horizontal rail
3. **Pocket calendar:** dock clearance padding on `.paidia-cal`
4. **Stock/Shop house rails:** already scroll — silence detector; optional fade mask
5. **Landscape:** collapse header tools; prefer day view; hide week jump or make it drawer
6. **Home bento:** either real icons or remove empty circles
7. **Kid dock:** rename `Αξιολόγηση` → `Αξιολ.` / `Βαθμοί` or move to More

---

## Aspect agent ([Aspect ratio visual fleet](2c8f52c0-6b28-4398-bf73-136207c9e408))

**1 PASS / 6 FAIL**, 0 P0, 29 P1. Full table in `.qa-screens/agent-aspects/REPORT.md`.

Dominant pattern: **sticky dock covering last visible list/CTA rows** (stock ±, kids edit, home bento) — not horizontal page overflow. Ultra-narrow **280** also truncates dock label **Πρόγραμμα**.

## Follow-up fixes (post-aspect)

1. `ensureSheetChromeConsistent()` — clears orphan `#sheetBg.on` that blocked all taps (found by buttons backup script)
2. Icon-only dock for **≤360px** (was 320)
3. Extra bottom padding on long mobile pages/lists
4. Overhaul notes: `docs/agents/MOBILE_UI_OVERHAUL_NOTES_v294.md`

## Bug hunter ([Bug hunter overflows stuck](5bf87410-e605-4b30-95b5-d7e12b7a1b44))

Report: `.qa-screens/agent-bugs/REPORT.md`

Confirmed P0s fixed in this follow-up:
1. Staff **Άνοιξε σελίδα** under dock → side-by-side shift step CTA again
2. Kid **Γράψε σημείωση** under dock → CTA grid margin clears kid dock
3. **`ui-v294.css` 404** → added to `server.py` + `api/index.py` allowlists (restarted local QA server → 200)

Also: orphan `#sheetBg` trap → `ensureSheetChromeConsistent()` in `render()` + CSS belt in `ui-v294.css`.

