# W12 round 2: the 13 states W11's new examples cover, and the orders 33 and 34 show (builder)

Follows `response_14_w12_screener_markets.md`. A parallel push gave another session's file the number 14 too, so this
one takes the next free number.

W11's session added examples for the 13 gallery states I listed as not covered (omenix-dashboard d7c982a, its claims
`response_24`), each with its own query (`x-query`). The orchestrator also relayed three notes.

Paths are under `web/` unless they say otherwise. Confidence labels: **strong evidence**, **some evidence**,
**reasoning only**.

## The adapter reads each example's own query

`lib/screener/fixture-source.ts` no longer keeps a hand-written table of which query each example answers. It reads
every paged example's `x-query` from the examples file itself, so the examples are the one source of truth. Symbols
are compared as a set (sorted on both sides), because the route treats them as one.

The app's own queries for every covered state match these exactly, with no adjustment. Unit tests: volume and oversold
answer with exactly their summary count; the followed companies give 20 rows; the picks' symbols find their example;
the F&O index screen gives its count. Views still not covered (another page, "up 10%+ in a month", IV near its low)
remain `NoExample`. **Strong evidence.**

## New harness cases (13 states, each beside its gallery picture)

| Page | Cases |
|---|---|
| Screener | `screener-ours` (1280, 390); `screener-year`; `screener-volume`; `screener-oversold`; `screener-picks`; `screener-results`; `screener-filters` (1280, 390); `screener-buy` (1280, 390: the order window open on a followed company during the session); `screener-fno-short` (1280, 390); `screener-fno-ivhigh`; `screener-fno-index` |
| Markets | `markets-losers` (all NSE, liquid); `markets-active` |

Every new case runs the same figure check as round 1:
- every `data-src` figure equals its field;
- the plants are caught;
- every row is checked for Buy/Sell.

Result: Screener 19 cases and Markets 12 cases, 0 failed. **Strong evidence.**

## The three notes, each checked

1. **Index options by name (34). Agreed.** The example now follows its query (sorted by open interest). 34 lists the
   four by name, so the card orders them by name on the page. Each row keeps its index in the block, which is its
   figures' source. The Markets cases pass with the figure check.
2. **Picks by strategies buying, results by soonest results (33). Agreed.**
   - The route cannot sort by the tools block's data, so the page orders those 20 rows or fewer by the tools block
     (`toolsOrder` in `lib/screener/screens.ts`). The sort is stable, so ties keep the route's order (value traded).
   - The count line says "sorted by strategies buying" or "sorted by soonest results".
   - A column the reader picks still sorts through the route.
   - Unit test: the order holds and every row's index stays its place in the block. UI check (`orderProblems`): the
     rendered rows read in exactly the tools order.
3. **Near the 52-week high: the tie order differs. Agreed, listed as a difference.**
   - The route sorts by the exact position; 33 sorted by the rounded percent.
   - The set and the count are the same (the count is the summary's own `near_high`, checked).
   - Only the order of rows with the same rounded percent can differ.

## What this changes in `response_14`

- The list of uncovered gallery states is now empty: every state of 33 and 34 is compared.
- "Picks and results in the route's default order" is no longer a difference.
- The "no tools column sort" difference stays: the route still has no tools sort, and the reader's column choices go
  through the route.

## Checks

- Code size ok.
- Typecheck clean.
- `npm test`: 388 tests, 388 pass.
- Build ok.
- UI harness: Screener and Markets as above; the full run is in the orchestrator report.
