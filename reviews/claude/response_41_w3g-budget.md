# Response 41: story W3g, the AI usage and budget screen (claims for the judge)

Branch `story/w3g-budget`, from main f4f7f40 (contract 2.10.0). Mockup `design/mockups/43-budget`, contract
`FnoBudget` (page `budget`, 2.8.0). Builder session 0134MoC6.

## What it adds

- **Data, the W12 pattern:** `lib/fno-budget/` (contract types, `BudgetData.budget()`, the Azure adapter for page
  `budget`, the fixture adapter with P1's three examples, one wiring with `budgetLive`, a pure view).
  `FNO_PAGES.getFnoBudget = "budget"`, removed from the not-read list; the integration test's page record has it.
- **Page:** `/india/budget`, India only (the US is a 404); route `budget` (mockup 43, endpoint fno/budget); nav item
  "AI usage and budget" in India's Control group (story W3 answer (a)).
- **What it shows, as mockup 43:** the AI books' and roles' minutes this month with the level (within budget, alert,
  stop, unknown), used and cap, the cap's basis (measured or your plan), a bar at the payload's `pct_of_cap` (full at
  100% and over), the note when the measure is unknown or a lower bound, and the minutes and runs by kind of work.

## Rules and choices

- **Minutes only:** no rupees, no AI model name, no session id. A test scans everything the views say in all three
  examples for money words, a copied 80%/50%/"half", and model or session names.
- **BG1's alert share (80%) and the cap's share of the basis (50%) are not copied into the screen.** Mockup 43 draws an
  alert tick at 80% and says "half of", but the contract sends neither number. The screen says "Alert: close to the
  cap", "Near the cap an alert goes out" and "Cap 920 min, out of 1,840 min measured", without a tick. I asked the
  screens lead for `alert_at_pct` and `cap_share_pct` fields; the tick and the shares come with them.
- **A real catch in the screenshot:** a page root class `budget` collided with a global `.budget` rule in the
  assistant page's CSS (a two-column grid), which broke the layout. The root class is now `ai-budget`. I checked
  every F&O screen's root class against all CSS: no other collision.
- **Shared CSS:** `.facts2` moved to fno-screen.css; the paper books keep their own `margin-top`.

## Tests

- `lib/fno-budget/tests/budget.test.ts`: the three examples (ok, alert, none) with hand-written values; a plan basis
  and a stop over the cap; minutes by group; and the minutes-only and no-copied-share check.
- `lib/fno-budget/tests/route.test.ts`: the nav and the route.

## Gates on this tree

- check_code_size, check_contract, check_fno_screens and the design copies pass; typecheck passes; `npm test`
  530/530 with 0 skipped; build passes.
- Screenshots at 1280 and 390 px show no horizontal overflow and no console errors; `/us/budget` gives 404.
