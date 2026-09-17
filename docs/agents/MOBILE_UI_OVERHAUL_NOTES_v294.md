# Mobile UI overhaul notes — anti AI-slop — v294

**Scope:** `/m/` only. Brand: Armonia Thassos — pine `#2a6b52`, mineral stone, Fraunces + Outfit.  
**Evidence:** fleet matrices + agent QA under `.qa-screens/`.

---

## 1. What works (keep)

- Staff dock: **4 rail + Άλλα** (not a 9-icon tab bar)
- Kid dock: **3 primary + Άλλα** (pocket/notes in More)
- Product photo rows in **Αποθήκη** (`fridgeKitArt`)
- Dark pocket balance hero (v285)
- Day-first **Πρόγραμμα** on phone; landscape forces day
- Pine/mineral CSS tokens; Fraunces + Outfit
- `.m-page` shell as the mobile composition root
- Shift journal CTA in card header; sheet backdrop cleanup

---

## 2. AI-slop patterns — status

| Slop | Status |
|------|--------|
| Duplicate titles | Partial — chrome still owns titles; Book howto cards **hidden** on `/m/` |
| Empty circle placeholders | **Fixed** — bento uses real `ui()` icons; `/m/` shows 2 tiles |
| Card stacked on card (Book) | **Mitigated** — howto/tutorial cards hidden; dock-height pad |
| Pill-rail everything | Keep intentional rails; admin ops → **text links** |
| Mixed DE `Stk` in EL UI | **Fixed** — `unitLabel()` → `τμχ` |
| Six kid-dock labels | **Fixed** — 3 + Άλλα |
| Ghost glass + emoji | Keep pine ink icons |
| Plan triple-zero stats | **Fixed** — empty-day summary omitted on `/m/` |

---

## 3–4. Principles (unchanged)

One composition · brand first · no card spam · dock is law · rails scroll · ≤360 icon dock · motion sparingly.

---

## 5. Backlog — shipped this pass

### Done
1. `#sheetBg` consistency · icon dock ≤360 · Book/list dock padding · journal header CTA  
2. Kid labels Βαθμοί · **kid dock 3+Άλλα** · home bento icons + 2-tile `/m/`  
3. Plan empty-day no zero strip · agenda empty compact · landscape day-force  
4. `unitLabel()` for Stk · admin ops text links · header ≤375 (bell+avatar)  
5. Pocket chip grid 3×n · Book howto hide · tablet **desk handoff** chip  
6. Shift stock CTA outline secondary · home `.m-cta` under shift · inbox capped  

### Still open (P2 polish)
- Shop empty-state copy trim (CSS hides essay `small`; review EL strings later)
- Talk compose vs dock audit
- Fold 280px remaining chrome crush (icon dock helps; title still short)

---

## 6. Aspect-ratio strategy

| Band | Strategy |
|------|----------|
| ≤360 | Icon dock; short header |
| 375–430 | Full labels; day-first plan |
| Landscape h≤420 | Compact header; **force day** |
| ≥768 `/m/` | Soft chip → `/desk/` |

---

## 7. Fleet retest notes (v294b)

See prior agent write-up. After this overhaul pass, re-run:

```
node scripts/qa-hit-dock-cta.mjs
node scripts/qa-kid-p0-recheck.mjs
node scripts/qa-mobile-fleet-matrix.mjs
```

### What NOT to change
Staff 4+Άλλα · Lager photos · pocket dark hero · day-first plan · kids directory rows · pine tokens · journal header placement · sheet cleanup · intentional `.m-rail` peeks.
