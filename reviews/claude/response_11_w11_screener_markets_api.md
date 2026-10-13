# Response 11: story W11, round 2: answers to judge 27 (FAIL)

Judge 27 is `exepex/trading` `reviews/judge/judge_27_w11_screener_markets_api.md` (5125fca). Round 1 is
`response_10_w11_screener_markets_api.md`. The orchestrator agreed with all three should-fix findings on the evidence.
The owner has also answered question 1: exepex/trading publishes NSE's daily files. I accept all six findings. Each has
a fix, a check and a planted break below. Nothing in `design/` changed.

The web copy of Home's fixture `web/lib/home/fixture/blocks.generated.json` changed, written by `node tools/sync-design.mjs`.
`api/examples/blocks.json` changed for two reasons:
- Home's events are now a view of the one calendar;
- `/session` has a `major_event_names` value.

## Owner's answer (question 1): exepex/trading publishes the NSE-file blocks

- **The `nse_ingest` publisher is gone.** Its blocks are now publisher `fno` (exepex/trading), with envelope
  `FnoBlockMeta` (`product`, `publication_id`) and freshness rule `fno_calendar`. They are:
  - the India screener's summary and rows;
  - the F&O screener;
  - India's overview indices and sectors.
- **Story:** `TR-NSE-proposed` (repo trading, title "to be added in exepex/trading") replaces `NSE1-proposed` in
  `api/catalog/stories.yaml`.
- **The catalog's publisher column** says "exepex/trading". "Published today?" still says **no** for these blocks: true
  until the story lands.
- **Path rule** (`tools/api/check_contract.py`, `check_rules`): exepex/trading blocks are India only (`/markets/india/`),
  and only its F&O blocks live under `/markets/india/fno/`.

## Finding 1 (should fix): one calendar, one documented query per screen

**Accepted.** The root cause is two mockups with two event lists:
- 31's mock world has 3 companies but holds the market-wide events (RBI, CPI, FOMC, holiday, jobs, the monthly expiry);
- 34's real 12 Oct records have 20 companies but no economy events.

Where they overlap they agree: Reliance 16 Oct, HDFC Bank 17 Oct, JPM 13 Oct, Apple 29 Oct, Nvidia 17 Nov.

The fix, in `tools/api/examples_screens.py`:
- **`calendar()`** builds one calendar per market as recorded on 12 Oct:
  - the company events and NSE expiries come from 34's records. Company events are named "<company> results" as the
    stock tool's catalogue names them, and a weekly expiry is the kind `weekly_expiry`;
  - the market-wide events come from 31;
  - there is one row per date, kind and company.
  It is published as the example `getEvents_<market>_calendar`.
- **`view()`** is the endpoint's new query, `GET /events?kinds=…&from=…&limit=…` (`api/paths/blocks-home.yaml`).
  The two documented screen queries (`x-shared` on `/events`) are:
  - **Home** (31 row 6): `kinds=rbi_policy,earnings,holiday,fno_expiry,fomc,cpi,jobs_report&limit=6`, from its session.
    Home never receives ex-dividend or filing rows;
  - **Markets** (34 row 12): `kinds=earnings,ex_dividend,fno_expiry,weekly_expiry,filing,rbi_policy,fomc,cpi,jobs_report,budget&limit=12`,
    from its session.
- **Both screens' examples** are those queries applied to the calendar, and each example carries its `x-query`.
  - US Markets now lists US CPI on 14 Oct and the FOMC on 28 Oct.
  - India Home keeps the RBI decision of 7 Oct, so it stays consistent with Home's "RBI policy decision today" in
    Needs you.
- **Labels:** `filing` has a display word. Every kind has one in `x-kind-labels` (filing: "Filing").
  `x-kind-groups.economy` maps 34's word "economy" to the specific kinds, as the orchestrator chose.
- **Check:** `check_views` recomputes every example that has an `x-query` from the calendar example.
  **Planted break:** dropping the US CPI from the Markets view while Home's view shows it fails ("the two screens'
  calendars disagree": caught).

Honest effect on Home's fixture:
- India's 6 nearest are now RBI 7 Oct and five results. With 20 companies, the 20 Oct holiday, the 27 Oct expiry
  and the 29 Oct FOMC fall beyond 6 rows.
- US Home shows CPI 14 Oct.

That is the query's true output. Showing major events beyond the limit would be a screen rule for the owner.

## Finding 2 (should fix): F&O and India-only fields absent in the US by schema

**Accepted.** The root cause was open objects: the schemas never set `additionalProperties`. The fix:
- **Every W11 payload object is closed** (`additionalProperties: false`, 25 objects in `blocks-screener.yaml` and
  `blocks-overview.yaml`). So:
  - no F&O field (`fut`, `fc`, `oi`, `oc`, `b`, `iv*`, `pcr`, `mv`, `x`, `lot`) can appear on a stock row in either
    market;
  - no extra block (`fno`) can appear in a summary;
  - no `currency` can appear on a world quote.
- **`dl` and `screens.delivery` are India only:** optional in the shared schema (`x-market: india`), required by
  `IndiaScreenerStocksRule` and `IndiaScreenerSummaryRule`, and forbidden by the US rules. The US examples omit them:
  absent, not null.
- **Plants added** (in `planted()`), each **caught**:
  - J1: F&O fields on a US row;
  - J2: `dl` on a US row;
  - J5: an `fno` block in the US summary;
  - a delivery count in the US summary;
  - an India row without `dl`;
  - IV on a stock row;
  - J9: a currency on a world quote;
  - J7: an RBI decision in the US calendar. `UsEventsRule` now also forbids `rbi_policy`.

## Finding 3 (should fix): flows period totals with coverage

**Accepted**, with the orchestrator's design.
- `Flows.totals` holds one `FlowTotal` per period: `days_in_period` (1, 5, 21, 63, 250), `days` covered, `complete`,
  and `fii` and `dii`.
- A total is a number only when `complete`; otherwise it is null. The schema enforces this with `if`/`then`/`else`.
- The screen shows "—" with "only N days of data" (`Flows` description). FII and DII are never added together.
- **Check:** `check_flows` recomputes every flows example's totals from its days (the covered sum, null when not
  covered).
- **Planted breaks**, each caught:
  - a 1M total marked incomplete but carrying a number (schema);
  - a 1M total computed from 5 days and marked complete (semantic check).
- With 12 Oct's 5 days, 1D and 1W have totals; 1M, 3M and 1Y are null ("5 of 21 days" and so on).
- Whether the stock tool should publish a year of daily flows stays an owner question, listed in the catalog's "Open
  questions".

## Minor 4: no written W11 story

The orchestrator is writing it in `exepex/trading` `docs/stories/X-cross-repository.md`. That repository is read-only for
this session.

## Minor 5: `major_event_names` example

Home's `/session` examples now carry it, taken from 31's calendar rows marked major on the session date. India:
`["RBI policy decision"]`; US: `[]`. It is validated like every example.

## Minor 6: the mapping check is token-level

**Accepted as a limit, stated here:** `check_mapping.py` reads the backticked tokens of each notes row. "Zero gaps both
ways" is a token-level claim. I checked the prose requirements of every 33 and 34 Elements row by hand:

| Prose requirement | Served by |
|---|---|
| 33 header "the day; market" | `ScreenerSummary.as_of`; the market is the path |
| 33 tabs' counts | `universes.all.n`, `FnoScreenerSummary.n` |
| 33 row 3 tiles "counts of the screens below" | `near_high`, `near_low`, `screens.volume` |
| 33 row 7 "52-week position (p − l) ÷ (h − l)" | computed on screen from `p`, `h`, `l` |
| 33 row 7 "the chosen period's change" | `d1`…`y1` with the `period` query |
| 33 row 7 Buy/Sell "followed companies" | the tools block's companies (static rule) |
| 33 row 8 "value traded (p × v), the default" | `sort=value` (default) |
| 33 row 11 Chain | static link (32) |
| 34 row 3 "the closes over the period (chart)" | `OverviewQuote.closes` |
| 34 row 4 "volatility drawn in the neutral colour" | `kind: vol`/`vol_index` |
| 34 row 6 "equal-weighted average change", best, worst | `IndiaSectors.industries` |
| 34 row 7 "value traded (₹ crore / $ million)", "× usual" | `p × v`, `v ÷ va` on screen |
| 34 row 8 "the period total" | **now** `Flows.totals` (finding 3) |
| 34 row 9 "3-month middle (median of 63 closes)" | median of the last 63 `closes` on screen |
| 34 row 12 "the 12 nearest", type "economy" | **now** the Markets query (`limit=12`) and `x-kind-groups.economy` (finding 1) |

## Proof

```
$ python3 tools/api/check_mapping.py
elements: 72 (62 need data, 10 static with a reason); field keys: 304; endpoints: 37; endpoint fields: 1019 (753 leaves)
elements without an endpoint field: 0; endpoint fields without an element: 0
mapping: zero gaps both ways; no endpoint mixes two independent blocks
$ python3 tools/api/check_contract.py
contract: 64 paths (37 block endpoints), 70 block examples, 113 block schemas, 753 catalogued leaf fields, 31 planted breaks
contract: OpenAPI 3.1 valid; examples valid and current; catalog complete; screen rules hold; every planted break caught
$ python3 tools/api/examples.py --check      examples: api/examples/*.json match the mockups' data
$ python3 tools/api/render_catalog.py --check catalog: api/catalog/catalog.md is current
$ cd web && node tools/sync-design.mjs --check   design copies current
$ node tools/check_code_size.mjs             code size: every file within 350 lines or its listed size
```
`cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build`: typecheck clean, 363/363 tests, build succeeds (the only web/ change is the synced copy of Home's fixture).
