# Response 24: W11 follow-up: examples for the 13 Screener and Markets states W12 could not render

W12 found 13 signed-off states with no example data. They now have validated examples, built from 33's and 34's
data.json after design's demerger rebuild (00abb11). No served schema changed.

## The new examples (each is the route's page for the query the state asks; the query is in the example's `x-query`)

| State (states.json) | Example | Query (`x-query`) | Total, rows shown |
|---|---|---|---|
| 33 ours, 33 buy (same list; buy only opens the order window) | `getScreenerStocksIndia_india_ours` | u=ours, sort=value | 20, 20 |
| 33 year | `…_india_year` | u=n500, period=y1, sort=chg | 497, 25 |
| 33 volume | `…_india_volume` | screen=volume, sort=vr | 63, 25 |
| 33 oversold | `…_india_oversold` | u=n500, screen=oversold, sort=-r | 44, 25 |
| 33 picks | `…_india_picks` | symbols = the 7 followed companies with 3+ buys (tools block order), sort=value | 7, 7 |
| 33 results | `…_india_results` | symbols = the 5 with results within 7 days, sort=value | 5, 5 |
| 33 filters | `…_india_filters` | period=m1, pmin=100, cmin=5, dlmin=60, sort=value | 28, 25 |
| 33 fno-short | `getFnoScreenerRows_india_short` | screen=short_buildup, sort=oc | 65, 25 |
| 33 fno-ivhigh | `…_india_ivhigh` | screen=ivhigh, sort=ivr | 35, 25 |
| 33 fno-index | `…_india_index` | screen=index, sort=oi | 6, 6 |
| 34 losers | `getScreenerStocksIndia_india_losers` | u=all, vamin=100000, pmin=20, sort=-d1, page_size=8 | 1,449, 8 |
| 34 active | `…_india_active` | u=n500, sort=value, page_size=8 | 497, 8 |

**Matching W12's queries:** each query has exactly W12's keys and values (`web/lib/screener/state.ts` `stocksQuery` and
`fnoQuery`, `web/lib/overview/state.ts` `moversQuery`), so W12 can add them to its fixture tables as they are. The
symbol lists keep W12's order.

**Checked against 34's own lists:** 34's losers (all NSE) and most-traded (Nifty 500) lists are reproduced exactly by
the route, as the gainers already were. The builder raises if they ever differ.

## How they are built and checked (new)

- **`tools/api/screener_route.py`:** the reference for the route's filters, sorts and pages. It is ported from 33's
  template: the screens of notes rows 4 and 10, the filters of row 6, and sortRows (a missing value always last).
  `examples_pages.py` builds every page example from the stored table (`stored_tables`) with it.
- **The check** (`check_stored.check_pages`) is now exact: every page example (19 stock pages and 5 F&O pages) must
  equal the route's answer to its `x-query` over the stored table. Before, it only checked that the page was rows of
  that table.
- **2 new plants, 60 in all, all caught:**
  - a page whose `x-query` sort does not match its rows;
  - a row dropped from the picks page.
- **Tie-break defined:** equal sort values go by value traded (F&O: futures open interest), then by symbol. A
  publisher's storage order is not part of the contract, so the route never depends on it. This keeps every existing
  example identical except one (below).

## One existing example changed, and why

`getFnoScreenerRows_india_index_options`: its rows were in name order (as 34 shows them), but its query asks
`sort=oi`. The example must be the answer to its own query, so its rows are now in open-interest order: NIFTY,
BANKNIFTY, MIDCPNIFTY, FINNIFTY. The same four rows are checked against 34's list (compared in name order).

**For W12:** to look like 34, order these four by name on the page (presentation), or say whether the route should
sort by name. That would need a sort key the contract does not have.

## Findings for W12 and the orchestrator (not changed here)

1. **Picks and results order differs from the signed-off 33.**
   - 33 sorts "Our strategies: 3+ buy" by buys, most first (`tools`), and "Results within 7 days" by days to results,
     soonest first (`-res`).
   - W12 asks `sort=value`, and the contract's sort enum has neither key. Those keys come from the stock tool's tools
     block, not from exepex/trading's table, so the route cannot sort by them without a join.
   - Strong evidence: the template's SPRESETS, compared with W12's `screens.ts`.
   - Recommendation (reasoning only): W12 orders these at most 20 rows by the tools block on the page, as 33 does. The
     examples follow W12's actual query.
2. **The near-high order differs from the 33 picture in ties.** 33's template rounds the 52-week position to a whole
   percent before sorting. With 56 stocks at or near their high, many tie at 100 %, and the picture orders those
   ties by the table's (alphabetical) order. The route sorts by the exact position, then value traded. The set and the
   count are the same; only the order of ties differs. The existing example already did this.

## Checks (this commit)

- check_contract: 94 examples, 60 planted breaks, 5 daily series on NSE's sessions;
- check_mapping: zero gaps;
- examples and catalog: current;
- design-sync: copies current (the web fixture copy is resynced);
- code size: within limits;
- web: typecheck, 387 tests pass and 0 fail, build passes.
- `blocks.json` and `blocks-32.json` are unchanged.
