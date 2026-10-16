# Response 44: the F&O page holds on every W3 screen (contract 2.13.0, page `page_holds`; claims for judge D)

Branch `story/w3-page-holds`. It is built on three things, so it merges after 2.13 and W3f's withheld change:
- `story/fno-contract-2-13` a0a355d (2.13.0, including my null answer-day fix);
- main c2589b6;
- `story/w3f-withheld` 9f027cc (judge 234 add. 2 PASS).

Builder session 0134MoC6.

## What it adds

- **One reader:** `fnoPageHolds()` in `lib/fno/wiring.ts`, beside `fnoStatus`. With no database there are no holds;
  a publication without the page reads as unknown (`null`), so no notice is invented.
  `FNO_PAGES.getFnoPageHolds = "page_holds"` is removed from the not-read list and added to the integration test.
- **One pure view:** `lib/fno-holds/holds.ts` holds the types and the words:
  - `holdOf` gives "<page> held back since <date>: <reason>", and whether the screen shows nothing;
  - `holdRowsOf` gives data health's table;
  - the page names match mockup 44's table.

  It lives in `lib/fno-holds/`, not `lib/fno/`, because screen components may not reach `lib/fno/*` (the W3 import
  rule); the gateway and import-graph tests pass.
- **One notice:** `components/fno-common/held-notice.tsx`, a red `role="alert"`. The card's own `withheld` notice now
  uses it too, so both look the same with different words (the screens lead's suggestion).
- **One wrapper:** `app/(cockpit)/[market]/_fno/held-block.tsx`. `HeldBlock` puts the notice above the dated previous
  page (`previous_page`), or the notice and "Not published" in its place (`nothing`). `HoldsBlock` hands the holds to
  a screen that lists them.
- **Every W3 screen except the card** wraps its main block in `HeldBlock` with its own page key: weather,
  weather_history, forecast_lab, paper_trades, strategy_lab, data_health, budget and scoreboards. The card shows only
  its own `withheld` notice, as the screens lead asked.
- **Data health** gains mockup 44's "Pages held back" section: a table (page, since, why, what its screen shows), or
  "Every page was published normally", or "Not known…" when the holds are unknown.

## Tests and one changed test

- `lib/fno-holds/tests/holds.test.ts`:
  - the held example gives the forecast lab's `previous_page` words and the paper books' `nothing`;
  - no hold, or unknown holds, gives no notice;
  - the table rows;
  - a structure rule: every W3 screen's loader except the card's contains `<HeldBlock pageKey="<its key>">`, and the
    card's contains none. A new W3 screen without a known page key fails it.
- **Changed test, please check:** `lib/screener/tests/import-graph.test.ts` (W12) lists the modules allowed to read
  `lib/fno/wiring`. It gains `_fno/held-block.tsx`, the F&O screens' shared holds reader, in the same role as the
  listed `_fno/freshness-block.tsx`. My first draft also had data health's loader read the wiring directly; the test
  caught it, and data health now goes through `HoldsBlock`, so the list grew by the shared module only.

## Gates on this tree

- check_code_size, check_contract, check_fno_screens and the design copies pass; typecheck passes; `npm test` 583/583
  with 0 skipped; build passes.
- A sweep of all nine F&O pages at 1280 and 390 px shows no overflow and no console errors; data health shows "Pages
  held back: None".

## Open, honest

- In fixture mode the publication has no holds, so a held screen is not seen in a screenshot. The words and states are
  covered by the view tests and the structure rule, and the notice component is the card's, which is screenshotted
  in its held state (response 40, addendum 2).
