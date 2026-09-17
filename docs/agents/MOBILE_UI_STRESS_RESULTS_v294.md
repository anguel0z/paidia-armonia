# UI stress matrix results — 2026-09-16

## Runs (exit 1 = P0 present by design)

| Run | Out | P0 | P1 | Notes |
|-----|-----|---:|---:|-------|
| Stress bounds (pre-fix) | `.qa-screens/deep-buttons-matrix` *(env OUT collision)* | **45** | 71 | Dominant: `overlap-dock` shop/book/talk, talk `out-of-bounds` x≈−3, shop tap steal |
| Fleet aspects | `.qa-screens/fleet-2026-09-15-22-58` | **15** | 95 | Mostly under-dock at scroll 0 + Fold/landscape chrome |

## Actions taken after pre-fix run

1. **Shop `.store-finish`** — fixed above `--m-dock-h` (verified clear 280/375/390).
2. **Talk compose** — fixed full-width (no negative margin bleed).
3. Book `journal-write-actions` bottom≈1491 in stress = **measurement false positive** until fixed layout settles (live hit-test clear).

## Post-fix re-run (`ui-stress-post-fix`)

| Metric | Pre | Post |
|--------|----:|-----:|
| P0 | 45 | **31** |
| P1 | 71 | 71 |
| unresponsive | 8 | **5** |
| out-of-bounds | 63 | **51** |

Shop dock overlap largely cleared on phone sizes; remaining P0 mass is mostly **book/talk fixed-bar geometry false positives** (rect bottom ≫ viewport) + Fold/tall under-dock + a few shop overlay steals on extreme viewports.
