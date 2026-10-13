# Response 12: story W11, round 3: answer to judge 32 (FAIL, one should-fix)

Judge 32 (`exepex/trading` 070ae63) accepted everything in round 2 except one item: Home's "6 nearest" query changed
the signed-off Home on the real 20-company calendar.
- India's Coming up lost NSE closed (20 Oct), the F&O expiry (27 Oct) and the FOMC (29 Oct).
- The US lost the FOMC, the jobs report and Nvidia.
- It also broke W9's harness on main (judge 31).

**Accepted.** The orchestrator and the judge set the rule: market-wide events first, then the nearest results, up to 6.

## Root cause and fix

**Cause:** Home's query took the 6 nearest rows of any kind. On a 20-company calendar the results crowd out the
market-wide events that Home's frozen row 6 shows.

**Fix:** one calendar is kept, and Home gets its own documented query.
- **The rule** (`tools/api/examples_screens.py`, `view()`): `order=market_first`. The market-wide rows come first,
  nearest first, up to the limit. Then each company's *next* results fill the rest, one row per company. The rows are
  shown by date.
- **Home's query** (`HOME_VIEW`) is `kinds=rbi_policy,earnings,holiday,fno_expiry,fomc,cpi,jobs_report&order=market_first&tickers=<tracked companies>&limit=6`.
  It is documented in `/events`' `x-shared` and in the new `tickers` and `order` parameters, and carried in each
  example's `x-query`.
- **Home's example** is that query on the one 12 Oct calendar, over the companies Home's world tracks (the active
  stocks of 30-shell). It is **exactly** the signed-off list of `31-dashboard/data.json` in both markets.
  `api/examples/blocks.json` events are back to their original rows; the web fixture copy was resynced.
- **The real calendar:** the new example `getEvents_<market>_home20` applies the same query to the stock tool's 20
  companies from 13 Oct.
  - India keeps NSE closed (20 Oct), the monthly F&O expiry (27 Oct) and the FOMC (29 Oct), plus 3 results.
  - The US keeps CPI, the FOMC and the jobs report, plus JPM, Bank of America and Progressive. Nvidia (17 Nov) falls
    beyond the three nearest results. That is true for 20 companies.

## Checks (new module `tools/api/check_semantics.py`, so `check_contract.py` stays at 289 lines)

- **`check_views`:** every view example equals its `x-query` applied to the calendar. Home is now among them.
- **`check_home_events` (new):**
  - Home's examples equal the signed-off Coming up exactly;
  - Home's query on the real calendar keeps holiday, F&O expiry and FOMC (India) and FOMC and jobs report (US).
- **Planted break:** Home's query without `market_first` (the plain 6 nearest). Both the signed-off check and the
  real-calendar check are caught.
- **DOM assertion** (`web/tests/ui/cases/home-checks.mjs`, `comingUpProblems`): Home's rendered "Coming up" rows (day and
  title, in order) must equal the signed-off list, in India and the US. The harness compares pictures; this asserts the
  rows.
  - On this round's fixture all 13 Home cases pass (`node tests/ui/harness.mjs --only home`: "13 cases, 0 failed").
  - **Planted:** I built the app with round 2's fixture (the plain 6 nearest) and ran `--only home-india`. Result:
    "4 cases, 3 failed" (home-india, frame-page-home-india, dark-home-india), all on Coming up. The good fixture was
    then restored.

## Proof

```
$ python3 tools/api/check_mapping.py      mapping: zero gaps both ways; no endpoint mixes two independent blocks
$ python3 tools/api/check_contract.py
contract: 64 paths (37 block endpoints), 72 block examples, 113 block schemas, 753 catalogued leaf fields, 32 planted breaks
contract: OpenAPI 3.1 valid; examples valid and current; catalog complete; screen rules hold; every planted break caught
$ python3 tools/api/examples.py --check   examples: api/examples/*.json match the mockups' data
$ cd web && node tools/sync-design.mjs --check   design copies current
$ cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build   EXIT 0, tests 363/363
$ cd web && node tests/ui/harness.mjs --only home   13 cases, 0 failed
$ node tools/check_code_size.mjs          code size: every file within 350 lines or its listed size
```
