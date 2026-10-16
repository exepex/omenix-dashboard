# Response 42: story W3h, the F&O scoreboards screen (claims for the judge)

Branch `story/w3h-scoreboards`, from main f4f7f40 (contract 2.10.0). Mockup `design/mockups/42-scoreboards`, contract
`FnoScoreboards` (page `scoreboards`, 2.8.0). Builder session 0134MoC6.

## What it adds

- **Data, the W12 pattern:** `lib/fno-scoreboards/` has:
  - the contract types and `ScoreboardsData.boards()`;
  - the Azure adapter for the page `scoreboards`;
  - the fixture adapter, with P1's examples ahead, behind (B ran, A in its pilot) and none;
  - one wiring, with `scoreboardsLive`;
  - a pure view, which reuses the paper books' signed profit-or-loss look, so both screens say Up or Down the same
    way.

  `FNO_PAGES.getFnoScoreboards = "scoreboards"` is removed from the not-read list and added to the integration test's
  page record.
- **Page:** `/india/fno-scoreboards`, India only (the US is a 404). It has the route `fno-scoreboards` (mockup 42,
  endpoint fno/scoreboards) and the nav item "F&O scoreboards" in India's Strategies group. That item sits beside the
  stock tool's "Scoreboards (Rule vs AI)", which keeps its own page `compare` and is never merged with this one.
- **What it shows, as mockup 42:** scoreboard B (whole systems), then A (matched decisions), each in its own card.
  Each card has its status (ran, pilot with no verdict, not run), its standing and date, and one row per book: trades,
  after all costs with sign, glyph and word, worst month, largest fall, and whether it beats doing nothing. A pilot
  gives no verdict. Below the rows is the do-nothing yardstick.

## Rules and choices

- **Never combined:** no total row, no winner across B and A, and no mixing with the stock scoreboard. A test checks
  that no three-book total appears.
- **Tabs or stacked:** story W3 answer (a) says "A and B as tabs"; mockup 42 shows them stacked, one card each. I
  followed the mockup (reasoning only: both boards fit on one page, and stacking keeps them visibly apart). Tabs are a
  small change if the owner prefers them.
- **Root class `fno-boards`**, checked against all CSS for collisions after W3g's `.budget` clash; no other collisions.

## Tests

- `lib/fno-scoreboards/tests/boards.test.ts`: B then A; a board that ran, with every row's values; a behind board
  (No) and a pilot (no verdict, no yardstick); nothing run; a Yes.
- `lib/fno-scoreboards/tests/route.test.ts`: the nav (apart from the stock scoreboard) and the route.

## Gates on this tree

- check_code_size, check_contract, check_fno_screens and the design copies pass; typecheck passes; `npm test`
  529/529 with 0 skipped; build passes.
- Screenshots at 1280 and 390 px show no horizontal overflow and no console errors; `/us/fno-scoreboards` gives 404.
