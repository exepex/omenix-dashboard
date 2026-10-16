# Response 39: story W3e, the F&O data health screen (claims for the judge)

Branch `story/w3e-data-health`, from main 38dfee6 (contract 2.10.0). Mockup `design/mockups/44-data-health`, contract
`FnoDataHealth` (page `data_health`, 2.8.0). Builder session 0134MoC6.

## What it adds

- **Data, the W12 pattern:** `lib/fno-data-health/` has the contract types, one interface (`DataHealthData.health()`),
  the Azure adapter (page `data_health` through `lib/fno`'s reader; no page yet is the empty state with its reason),
  the fixture adapter (P1's three examples, only without a database), one wiring with `dataHealthLive` for the frame's
  Example rule, and a pure view. `FNO_PAGES.getFnoDataHealth = "data_health"`, removed from the not-read list; the
  integration test's page record has it (the problems example).
- **Page:** `/india/data-health`, India only (static params, `dynamicParams = false`, the US is a 404); route
  `data-health` (mockup 44, endpoint fno/data-health, nav true).
- **What it shows, as mockup 44:** the last publish (published, failed with "yesterday's pages stay" and its reason,
  publishing, not run) and the daily health check (all found, problems with a count, not run), then each source in the
  payload's order (worst first as sent): plain name and id, status with glyph and word, last day, rows, days missing.
  Dates, counts and statuses only; no data value exists in the contract to show.
- **Components:** two single-purpose files (`data-health-runs.tsx`, `data-health-sources.tsx`); the shared
  `Sec`/`HowTo`/`Quiet` parts.

## A choice to check (reasoning only)

- **The nav item.** The Control group already had "Data health" with no page ("soon") in both markets. Story W3's
  answer (a) says data health is that existing item with an F&O section, and mockup 44 is India only (it sends the US
  to the dashboard). So the item now opens `/india/data-health` and is India only: **the US rail no longer shows a
  "soon" Data health item.** When the stock side's data health is built (a separate section, never mixed), the item
  can return to the US with its own page. The owner or judge may prefer keeping the US "soon" item; that needs a
  per-market page in the nav model, which I did not add for one item (KISS).

## Tests

- `lib/fno-data-health/tests/health.test.ts`: the three examples with hand-written expected values (published and ok;
  failed with its reason, three problems, sources in the payload's order; nothing run), a singular "1 problem", and a
  source with no file.
- `lib/fno-data-health/tests/route.test.ts`: the nav item in India's Control group opens the page; absent in the US;
  the route's mockup, endpoint and owner.
- The import-graph test (judge 222's tightening) finds `fno-data-health` by its wiring and its route `fno/data-health`.

## Gates on this tree

- check_code_size, check_contract, check_fno_screens and the design copies pass; typecheck passes; `npm test` 516/516
  with 0 skipped; build passes.
- Screenshots at 1280 and 390 px show no horizontal overflow and no console errors; `/us/data-health` gives 404; the
  rail marks Control on the page.
