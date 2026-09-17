# Mobile agent — anti-slop + kid portal rate (v294)

**Rater:** anti-slop + kid-portal  
**Scope:** `/m/` screenshots only · **Locale:** EL  
**Evidence set:** `.qa-screens/live-check-2026-09-15-22-51/`  
**Brand bar:** pine `#2a6b52`, mineral stone, Fraunces + Outfit  
**Flag:** purple · warm cream editorial · newspaper stacks · purple gradients · generic AI dashboards  

**Screens read:**
- `04-kid-home.png`
- `06-kid-more.png`
- `01-staff-home.png`
- `02-staff-shop.png`
- `02-staff-admin.png`
- `02-staff-book.png`

---

## Scores

| Axis | Score | One-line |
|------|------:|----------|
| **Anti-slop** | **6.7 / 10** | Pine/mineral hold; no purple. Shop sticky collision is still Fail; cream/newspaper editorial surfaces remain Watch on admin, book, kid bonus/more. |
| **Kid portal** | **7.5 / 10** | Clear day hero + star gauge + 3+Άλλα dock (Βαθμοί present). Drag: full welcome banner still owns the fold; cream Μπόνους tile + cream More sheet. |

---

## Checklist (pass / watch / fail)

| Pattern | Verdict | Evidence |
|---------|---------|----------|
| **Purple** (chrome / gradients / violet accents) | **Pass** | None on any of the six shots. Accents are pine, mineral, peach stock badges, pink avatar disks. |
| **Warm cream editorial** | **Watch** | Admin ops Fraunces hero card; shop list canvas; kid **Το μπόνους μου** tile; kid More sheet fill (`06-kid-more`). |
| **Newspaper cards** | **Watch** | Book **ΒΙΒΛΙΟ ΒΑΡΔΙΑΣ** clipping (serif date + dashed signature); admin stacked “Τι χρειάζεται προσοχή;” rows; staff home shift deck still reads multi-layer editorial. |
| **Broken sticky** | **Fail** | Shop floating strip: “Σάρωση απόδειξης…” overlaps icon / progress; list tails sit under sticky + dock (`02-staff-shop`). |
| **DE units in EL** | **Pass** | EL copy throughout; shop qty shows metric `g` + Greek “λίγο” (no `Stk` / DE labels in these frames). |
| **Generic tab bars** | **Pass** | Staff dock = 5 (Αρχική / Πρόγραμμα / Αποθήκη / Λίστα / Άλλα). Kid dock = 4 (Αρχή / Παιχνίδια / Βαθμοί / Άλλα). Not a 6+ AI dashboard strip. |

---

## Screen notes

### Kid home — `04-kid-home.png`
- **On brand:** pine header + pine welcome card; mineral “ARMONIA · Η ΜΕΡΑ ΣΟΥ”; Outfit greeting; circular star gauge.
- **Slop flags:** cream peach **Μπόνους** CTA (warm cream Watch); welcome “Καλώς ήρθες…” still full-width hero before day content.
- **Portal:** dock labels Greek; **Βαθμοί** on primary rail; next-up pair (bonus / pocket) readable. No purple, no DE units.

### Kid more — `06-kid-more.png`
- **On brand:** Fraunces **Μενού**, pine icons in mineral tiles, clear ΣΕΛΙΔΕΣ / ΑΛΛΑ split; pocket/notes/bonus/plan off primary dock (correct).
- **Slop flags:** sheet field is warm cream editorial (Watch) — delight ok, but fills the whole panel like a template sheet.

### Staff home — `01-staff-home.png`
- **On brand:** Fraunces **Αρχική**, pine CTAs, mineral page, shift → bento → actions readable.
- **Slop flags:** pink “A” avatar; dense shift card + triple green/outline buttons (hierarchy noise, not purple).
- **Dock:** 5-item Pass; active underline pine.

### Staff shop — `02-staff-shop.png` *(weakest)*
- **Fail:** sticky progress / receipt bar collision and text wrap over chrome.
- **Watch:** cream shopping canvas + peach “Αποθήκη … λίγο” badges diverge from mineral glass used elsewhere.
- **Pass (units):** EL strings; `g` metric, not DE `Stk`.
- Truncated row titles (`Τά…`, `Λασ…`) hurt scan but are secondary to sticky Fail.

### Staff admin — `02-staff-admin.png`
- **Watch:** cream Fraunces “Κέντρο λειτουργίας” intro = warm cream + soft newspaper energy.
- **Watch:** stacked attention cards under “Τι χρειάζεται προσοχή;”.
- Pill rail (Επιχειρήσεις active) and pine chrome otherwise OK; dock Pass.

### Staff book — `02-staff-book.png`
- **Watch:** intentional newspaper shift-log card (serif date, italic empty body, dashed signature) — brand-adjacent but still the newspaper flag.
- Pine **Έλεγχος τώρα** CTA clear; dock on Άλλα Pass; no purple / no DE units; sticky not broken in this frame.

---

## Concrete flags (actionable)

1. **Shop sticky** — Fail: isolate receipt + `0/3` bar; pad list bottom; kill self-overlap of “Σάρωση απόδειξης”.
2. **Cream surfaces** — Watch: admin hero, shop canvas, kid bonus tile, kid More sheet → mineral / pine tint where editorial isn’t the product metaphor.
3. **Newspaper stacks** — Watch: book handoff card + admin attention list + home shift multi-deck → one hero surface, not clipping collage.
4. **Kid welcome** — shrink/auto-dismiss so **Η μέρα σου** leads; keep dock 3+Άλλα.
5. **Avatars** — pink staff disk is mild brand drift (not purple Fail).

---

## Summary for fleet

| Score | Value |
|-------|------:|
| Anti-slop | **6.7 / 10** |
| Kid portal | **7.5 / 10** |

| Gate | Result |
|------|--------|
| Purple | Pass |
| Cream editorial | Watch |
| Newspaper cards | Watch |
| Broken sticky | **Fail** (shop) |
| DE units in EL | Pass |
| Generic tab bars | Pass |

**Ship blocker for anti-slop clean:** shop sticky only. Kid portal is shippable with cream/welcome polish as P2.
