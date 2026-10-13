# Response 16: W11 follow-ups found by P6 (stored parts, stored tables, the NSE session calendar)

The orchestrator relayed three findings from P6 (the exepex/trading builder) on W11's screener contract. Items 1 and 2
are done as one additive push (contract 2.4.0; every served schema and example unchanged). Item 3 is not done: its
root cause is in `design/`, which this session must not edit. It needs a decision (below).

## 1. India's screener summary: two publishers, one served block (accepted; decision (a))

**Finding:** `IndiaScreenerSummaryRule` requires the universes all, n500, fno and ours. But the "ours" counts come from
the stock tool's followed companies, not from NSE, so exepex/trading alone cannot publish the record. **Agreed**
(strong evidence): the served example's `ours` counts are those 20 companies' rows (`examples_screens.py`).

**Done:**
- **Stored parts** (`api/schemas/blocks-stored.yaml`), each closed and each with `x-stored-by` (publisher, read model,
  story):
  - `ScreenerSummaryNsePart`: exepex/trading stores `{as_of, universes: {all, n500, fno}}`;
  - `ScreenerSummaryOursPart`: the stock tool stores `{as_of, ours}`.
- **The merge:** the route merges the two parts only when they are of one close (the same `as_of`). Otherwise it
  answers 503, so it never shows a mixed day.
- **Contract and catalog:**
  - the operation names its parts (`x-stored`), and its read model says "two stored parts merged by the route";
  - the `ours` property carries the stock tool's catalog entry;
  - `catalog.md` names both publishers on the endpoint row and gains a "Stored parts" table.
- **Check** (`tools/api/check_stored.py`): both parts are built on their own from 33's data, through
  `summary_parts()`, and validated against their stored schemas. Their merge must validate against the served
  `ScreenerSummaryIndiaResponse` and equal the served example.

## 2. Paged blocks: the stored table apart from the served page (accepted)

**Done:**
- **Stored tables:** `ScreenerStocksTableIndia` (exepex/trading), `ScreenerStocksTableUs` (stock tool) and
  `FnoScreenerTable` (exepex/trading). Each is `{as_of, currency, total, rows: every row}`, and every row is validated
  against the same row schema as the served page.
- **India and US rules:** they apply to both the stored table and the served page. They were moved into
  `IndiaStockRows` and `UsStockRows`, which the served rules now reference. This keeps one rule in one place; what the
  rules allow is unchanged.
- **The served page** is unchanged (page_size at most 100).
- **Checks:**
  - a stored table's `total` equals its number of rows;
  - every served page example is rows of its stored table (each row equal, `total` within the table).
  - The tables are built in memory from 33's data and are not written as example files: 2,924 India rows would be
    about 640 KB in the bundled contract.

**Planted breaks: 6 new, 45 in all, every one caught:**
- the stock tool's counts in the NSE part;
- an F&O universe in the stock tool's part;
- the two parts of different closes;
- a stored table whose total is not its rows;
- NSE delivery on a stored US row;
- a served page row that is not the stored row.

**Limit (stated):** the per-field catalog shows `UniverseCounts`' leaves once per operation, with the first
universe's publisher (exepex/trading). The stock tool's ownership of `ours` therefore shows on the `ours` property,
the endpoint row and the Stored parts table, not on each `ours` leaf.

## 3. The 1Y series skip NSE's Sunday 1 Feb 2026 Budget session (agreed; not fixed here: needs a decision)

**Root cause** (strong evidence, read in the code): the weekday walk is not in `tools/api`. It is in the mockups'
fetch scripts:
- `design/mockups/33-screener/fetch_nse.py` (`days()`);
- `design/mockups/34-markets/fetch_nse_indices.py` (`main()`);
- `design/mockups/32-option-chain/fetch_nse.py` (line 32).

All three keep `weekday() < 5`. The examples only copy those mockups' values. Recomputing them in `tools/api` would make
the examples disagree with the signed-off mockups and would leave the fetch scripts wrong: a patch, not a fix.

**Impact** (checked against NSE's real `ind_close_all_01022026.csv`): NIFTY 50 closed at 24,825.45 (−1.96 %) and India
VIX at 15.10 on 1 Feb.
- Of 34's 22 indices, Nifty Pharma's published 52-week low (21,549.55) is wrong: it closed at 21,535.30 on 1 Feb.
- Every 1Y change counts one session too few.
- The year-long RSI shifts slightly.
- The stock rows are not recomputed yet.

32 is not affected: its history starts on 1 Jun 2026, and the calendar has no special session from Oct 2025 to Oct 2026
except 1 Feb.

**Proposed fix:**
- The three fetch scripts read `exepex/trading` `research/data/calendar/nse_sessions.csv`: weekdays, minus holidays,
  plus special sessions.
- 33's and 34's data.json are re-fetched and rebuilt. `examples.py` then regenerates on its own, and the diff lists
  every changed field.
- The session-calendar check belongs in those fetch scripts, with a synced copy of the calendar. The examples carry no
  1Y date series, so a check on example dates alone would not catch this.

**Question:** who changes `design/`, and does changing signed-off numbers need the owner's sign-off?
