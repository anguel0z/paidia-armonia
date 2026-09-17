# Mobile agent tap map — v294

**Generated:** 2026-09-15T22:57:11.513Z
**Base:** http://127.0.0.1:5173/m/ · **Pins:** e4 staff / k1 kid · **Device:** Chromium + iPhone 15 Pro **390×844**
**Method:** `scrollY=0` · control center via `document.elementFromPoint` vs `nav.dock` / `nav.kid-dock`
**Shots:** `.qa-screens/agent-tap-map-v294/`

## Overall tap score: **7.5 / 10**

Judged 12 controls → 9 pass / 3 fail · 0 N/A (missing). Aria @320: staff OK · kid OK.

| control | clear | hitDock | bottom | dockTop | notes |
|---------|:-----:|:-------:|-------:|--------:|-------|
| staff home .home-bento-tile | yes | no | 483 | 780 | clear |
| staff home .m-cta .m-primary | yes | no | 537 | 780 | clear |
| staff book #shiftNoteSave | no | yes | 1481 | 780 | tap stolen → nav.dock; center offscreen @scroll0 |
| staff talk compose | yes | no | 775 | 780 | clear |
| staff shop sticky/progress | no | no | 837 | 780 | bottom≥dock−4 (overlap geometry) |
| staff stock last +/- | no | yes | 833 | 780 | tap stolen → span.nav-ico.dock-more-glyph |
| kid dock item[0] | no | yes | 831 | 772 | dock self-hit OK |
| kid dock item[1] | no | yes | 831 | 772 | dock self-hit OK |
| kid dock item[2] | no | yes | 831 | 772 | dock self-hit OK |
| kid dock item[3] | no | yes | 831 | 772 | dock self-hit OK |
| kid home bonus tile | yes | no | 648 | 772 | clear |
| kid home pocket tile | yes | no | 648 | 772 | clear |

## Aria labels @ viewport 320 (`body.shell-m`)

### Staff `nav.dock`
- shell-m: **true** · visible buttons: **5** · all have aria-label: **true**
  - `Αρχική` → aria="Αρχική"
  - `Πρόγραμμα` → aria="Πρόγραμμα"
  - `Αποθήκη` → aria="Αποθήκη"
  - `Λίστα` → aria="Λίστα"
  - `··· Άλλα` → aria="Άλλα"

### Kid `nav.kid-dock` / dock
- shell-m: **true** · visible buttons: **4** · all have aria-label: **true**
  - `Αρχή` → aria="Αρχή"
  - `Παιχνίδια` → aria="Παιχνίδια"
  - `Βαθμοί` → aria="Βαθμοί"
  - `··· Άλλα` → aria="Άλλα"

## Scoring

- Pass = geometry clear of dock (`bottom < dockTop − 4`) **and** `elementFromPoint` does not land in dock (content controls).
- Dock items: pass if hit lands in dock (self).
- Missing / not visible = N/A (excluded from denominator).
- Aria miss @320 subtracts 0.5.

```json
{
  "score": 7.5,
  "scoring": {
    "score": 7.5,
    "pass": 9,
    "fail": 3,
    "na": 0,
    "judged": 12
  },
  "ariaStaff": {
    "shell": true,
    "count": 5,
    "items": [
      {
        "text": "Αρχική",
        "aria": "Αρχική",
        "hasAria": true
      },
      {
        "text": "Πρόγραμμα",
        "aria": "Πρόγραμμα",
        "hasAria": true
      },
      {
        "text": "Αποθήκη",
        "aria": "Αποθήκη",
        "hasAria": true
      },
      {
        "text": "Λίστα",
        "aria": "Λίστα",
        "hasAria": true
      },
      {
        "text": "··· Άλλα",
        "aria": "Άλλα",
        "hasAria": true
      }
    ]
  },
  "ariaKid": {
    "shell": true,
    "count": 4,
    "items": [
      {
        "text": "Αρχή",
        "aria": "Αρχή",
        "hasAria": true
      },
      {
        "text": "Παιχνίδια",
        "aria": "Παιχνίδια",
        "hasAria": true
      },
      {
        "text": "Βαθμοί",
        "aria": "Βαθμοί",
        "hasAria": true
      },
      {
        "text": "··· Άλλα",
        "aria": "Άλλα",
        "hasAria": true
      }
    ]
  },
  "rows": [
    {
      "control": "staff home .home-bento-tile",
      "clear": true,
      "hitDock": false,
      "bottom": 483,
      "dockTop": 780,
      "notes": "clear",
      "pass": true,
      "expectedHitDock": false,
      "raw": {
        "missing": false,
        "usedSel": ".home-bento-tile",
        "bottom": 483,
        "top": 427,
        "dockTop": 780,
        "clear": true,
        "hitDock": false,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "b.",
        "text": "Αποθήκη 3 χαμηλά"
      }
    },
    {
      "control": "staff home .m-cta .m-primary",
      "clear": true,
      "hitDock": false,
      "bottom": 537,
      "dockTop": 780,
      "notes": "clear",
      "pass": true,
      "expectedHitDock": false,
      "raw": {
        "missing": false,
        "usedSel": ".m-cta .m-primary",
        "bottom": 537,
        "top": 493,
        "dockTop": 780,
        "clear": true,
        "hitDock": false,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "button.btn.m-primary",
        "text": "Στο πρόγραμμα"
      }
    },
    {
      "control": "staff book #shiftNoteSave",
      "clear": false,
      "hitDock": true,
      "bottom": 1481,
      "dockTop": 780,
      "notes": "tap stolen → nav.dock; center offscreen @scroll0",
      "pass": false,
      "expectedHitDock": false,
      "raw": {
        "missing": false,
        "usedSel": "#shiftNoteSave",
        "bottom": 1481,
        "top": 1437,
        "dockTop": 780,
        "clear": false,
        "hitDock": true,
        "hitSelf": false,
        "scrollY": 0,
        "offscreen": true,
        "hitTag": "nav.dock",
        "text": "Αποθήκευση παράδοσης"
      }
    },
    {
      "control": "staff talk compose",
      "clear": true,
      "hitDock": false,
      "bottom": 775,
      "dockTop": 780,
      "notes": "clear",
      "pass": true,
      "expectedHitDock": false,
      "raw": {
        "missing": false,
        "usedSel": ".talk-compose",
        "bottom": 775,
        "top": 710,
        "dockTop": 780,
        "clear": true,
        "hitDock": false,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "textarea#talkInput.",
        "text": "● Αποστολή"
      }
    },
    {
      "control": "staff shop sticky/progress",
      "clear": false,
      "hitDock": false,
      "bottom": 837,
      "dockTop": 780,
      "notes": "bottom≥dock−4 (overlap geometry)",
      "pass": false,
      "expectedHitDock": false,
      "raw": {
        "missing": false,
        "usedSel": ".store-finish.bottom-dock",
        "bottom": 837,
        "top": 750,
        "dockTop": 780,
        "clear": false,
        "hitDock": false,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "button#confirmBatch.btn.ui-fit-text",
        "text": "0/3 · Πρόοδος αγορών 0 από 3 αποφασί"
      }
    },
    {
      "control": "staff stock last +/-",
      "clear": false,
      "hitDock": true,
      "bottom": 833,
      "dockTop": 780,
      "notes": "tap stolen → span.nav-ico.dock-more-glyph",
      "pass": false,
      "expectedHitDock": false,
      "raw": {
        "missing": false,
        "usedSel": ".lager-stepper button",
        "bottom": 833,
        "top": 789,
        "dockTop": 780,
        "clear": false,
        "hitDock": true,
        "hitSelf": false,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "span.nav-ico.dock-more-glyph",
        "text": "+"
      }
    },
    {
      "control": "kid dock item[0]",
      "clear": false,
      "hitDock": true,
      "bottom": 831,
      "dockTop": 772,
      "notes": "dock self-hit OK",
      "pass": true,
      "expectedHitDock": true,
      "raw": {
        "missing": false,
        "usedSel": "nav.kid-dock button:nth-of-type(1)",
        "bottom": 831,
        "top": 777,
        "dockTop": 772,
        "clear": false,
        "hitDock": true,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "svg.[object.SVGAnimatedString]",
        "text": "Αρχή"
      }
    },
    {
      "control": "kid dock item[1]",
      "clear": false,
      "hitDock": true,
      "bottom": 831,
      "dockTop": 772,
      "notes": "dock self-hit OK",
      "pass": true,
      "expectedHitDock": true,
      "raw": {
        "missing": false,
        "usedSel": "nav.kid-dock button:nth-of-type(2)",
        "bottom": 831,
        "top": 777,
        "dockTop": 772,
        "clear": false,
        "hitDock": true,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "svg.[object.SVGAnimatedString]",
        "text": "Παιχνίδια"
      }
    },
    {
      "control": "kid dock item[2]",
      "clear": false,
      "hitDock": true,
      "bottom": 831,
      "dockTop": 772,
      "notes": "dock self-hit OK",
      "pass": true,
      "expectedHitDock": true,
      "raw": {
        "missing": false,
        "usedSel": "nav.kid-dock button:nth-of-type(3)",
        "bottom": 831,
        "top": 777,
        "dockTop": 772,
        "clear": false,
        "hitDock": true,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "svg.[object.SVGAnimatedString]",
        "text": "Βαθμοί"
      }
    },
    {
      "control": "kid dock item[3]",
      "clear": false,
      "hitDock": true,
      "bottom": 831,
      "dockTop": 772,
      "notes": "dock self-hit OK",
      "pass": true,
      "expectedHitDock": true,
      "raw": {
        "missing": false,
        "usedSel": "nav.kid-dock button:nth-of-type(4)",
        "bottom": 831,
        "top": 777,
        "dockTop": 772,
        "clear": false,
        "hitDock": true,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "span.nav-ico.dock-more-glyph",
        "text": "··· Άλλα"
      }
    },
    {
      "control": "kid home bonus tile",
      "clear": true,
      "hitDock": false,
      "bottom": 648,
      "dockTop": 772,
      "notes": "clear",
      "pass": true,
      "expectedHitDock": false,
      "raw": {
        "missing": false,
        "usedSel": ".kid-home-cta-tile[data-child-view=\"bonus\"]",
        "bottom": 648,
        "top": 551,
        "dockTop": 772,
        "clear": true,
        "hitDock": false,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "span.kid-home-cta-ico",
        "text": "Το μπόνους μου"
      }
    },
    {
      "control": "kid home pocket tile",
      "clear": true,
      "hitDock": false,
      "bottom": 648,
      "dockTop": 772,
      "notes": "clear",
      "pass": true,
      "expectedHitDock": false,
      "raw": {
        "missing": false,
        "usedSel": ".kid-home-cta-tile[data-child-view=\"pocket\"]",
        "bottom": 648,
        "top": 551,
        "dockTop": 772,
        "clear": true,
        "hitDock": false,
        "hitSelf": true,
        "scrollY": 0,
        "offscreen": false,
        "hitTag": "span.kid-home-cta-ico",
        "text": "Δες το χαρτζιλίκι"
      }
    }
  ]
}
```
