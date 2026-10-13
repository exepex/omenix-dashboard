# Response 21: W11 item 3: the examples after the 1 Feb 2026 session fix, and the calendar check

The design session fixed the mockups' fetch scripts (f72dafb) and rebuilt 33's and 34's data (3a12c6c, merged as
348fe34). That commit also regenerated the API examples with `tools/api/examples.py`. My part:
- verify the regenerated examples;
- list every changed example field;
- add the calendar check, reusing design's one copy of the calendar.

## Verification (on main after 348fe34)

- check_contract, check_mapping, `examples.py --check` and `render_catalog.py --check` all pass.
- **Served schemas unchanged:** 3a12c6c touches no file under `api/paths` or `api/schemas`, only
  `api/examples/blocks-33-34.json`.
- `blocks.json` (frame and Home) and `blocks-32.json` (option chain) are byte-identical. The chain's history starts on
  1 Jun 2026, after the missing session.
- The calendar copy is current: `nse_calendar.py --check` against exepex/trading 87442b8 reports the copy identical.
- **Every changed screener row value is in design's list:** all 47 appear in
  `33-screener/changes_2026-10-13_sessions.csv` with the same new value (my script).

## Every changed example field (`api/examples/blocks-33-34.json`: 548 values in 5 examples)

| Example | Field | Values changed | Notes |
|---|---|---|---|
| `getOverviewIndicesIndia_india` | `indices[].closes[]` | 473 | the 250-close 1Y series of all 6 rows now include 1 Feb, so each window starts one session later |
| `getOverviewIndicesIndia_india` | `indices[].y1` | 6 | Nifty 50 −10.82 → −10.93; Next 50 −0.35 → −0.47; Nifty 500 −5.81 → −5.97; Midcap 100 1.41 → 0.94; Smallcap 100 8.35 → 8.02; India VIX 49.66 → 51.74 |
| `getIndiaSectors_india` | `indices[].y1` | 16 | e.g. Realty −8.17 → −9.16, PSU Bank 5.46 → 5.89, FMCG −19.88 → −19.45 |
| `getIndiaSectors_india` | `indices[].lo52` | 1 | **Nifty Pharma 21,549.55 → 21,535.30** (its 1 Feb close), as I reported before the fix |
| `getScreenerStocksIndia_india` | `rows[].y1` 20; `h` 1 (POONAWALLA 545.00 → 544.80); `l` 1 (BSE 2,180 → 2,210) | 22 | |
| `getScreenerStocksIndia_india_high` | `rows[].y1` 16 (GCSL null → 196.56: it now has a full year); `l` 1 (LIQUIDSHRI) | 17 | |
| `getScreenerStocksIndia_india_gainers` | `rows[].y1` | 8 | |
| each of the 5 | envelope `payload_sha256` | 5 | follows the payload |

**Not changed:**
- the summary counts (all universes; the tiles and chips), the F&O rows and the US examples;
- the RSI of every row shown. The RSI moved only for stocks outside the example pages; design's list has them.

## The calendar check (`tools/api/check_calendar.py`)

**One copy of the calendar:** the check imports design's `design/mockups/_platform/nse_calendar.py` and its
`nse_sessions.csv`. No second copy is kept in `tools/`.

**What it checks:**
- every India example's `as_of` day is an NSE session;
- every daily series in an India example (a `dates` list, or `days` rows with a `date`) is exactly NSE's run of
  sessions from its first day to its last: no weekday holiday in it, and no session missing, a Sunday one included.
  Events are dated rows too, but on any day, so they are not treated as a series.
- Today that covers 5 daily series: the chain's history (2), the contract histories (2) and the flows days. The check
  prints the count.

**3 plants, all caught; 58 in all:**
- Gandhi Jayanti (2 Oct) put into the chain's dates;
- a session dropped from a contract history;
- a flows day dated on a Saturday.

**Limit (stated):** 34's index `closes` and 33's 1Y figures carry no dates in the payload, so this check cannot see
their days. Those are guarded where they are made: design's fetch scripts now walk `sessions()`, and `nse_calendar.py
--check` keeps the copy equal to exepex/trading's. This is why the bug was invisible to an example-dates check, as I
said before the fix.

## A new data finding (not mine to fix; for the orchestrator and design)

**Evidence that 33's prices are not adjusted for corporate actions** (splits and bonuses):
- KOTAKBANK has price 443.40, 52-week high 2,266.00 and 1Y change −79.15 %. It is on the first page of the
  `getScreenerStocksIndia_india` example.
- In 33's data, **88 India rows** have a 52-week high above 3 × the price. Examples: ANGELONE −86.57 %, AJMERA
  −88.20 %, BANKNIFTY1 (an ETF) −90.19 %.

**Root cause** (some evidence, from the code and data): `33-screener/fetch_nse.py` builds each figure from raw daily
closes (`close_1y`, `high_52w`, `low_52w` in `source/equity.csv`), with no corporate-action adjustment. A 5:1 split
then reads as a −80 % year.

**Effect:**
- every affected row's `y1`, `h` and `l` are wrong;
- so are the counts built on them: `high`, `near_high`, `low`, `near_low`, `trend`, `fall`, and the 52-week position
  sort.

I have not verified each corporate action against NSE's corporate-actions file, so this is a strong pattern, not 88
confirmed splits.

**Proposed fix:** the fetch script, and later `TR-NSE-proposed`, adjusts past closes by NSE's corporate-actions file
before computing returns and 52-week ranges. Then 33 is rebuilt and the examples regenerate. Until then, 1Y and
52-week figures of split stocks are wrong on the screener and on Markets' movers.

## Checks (this commit)

- check_contract: 82 examples, 58 planted breaks, 5 daily series on NSE's sessions;
- check_mapping: zero gaps;
- examples and catalog: current;
- code size: within limits;
- web: typecheck, 372 tests pass and 0 fail, build passes.
