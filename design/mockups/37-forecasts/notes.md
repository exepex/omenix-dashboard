# 37 Forecast lab: data used, where it comes from, the contract

**Status:** rebuilt on the F&O data catalog (16 Oct 2026), story W3b (exepex/trading `docs/stories/W3-fno-screens.md`;
the screen is built by the W3 builder in `web/`, the page by P2b). It replaces the first draft (13 Oct), whose own
data (`_platform/forecast_data.py`, removed) and "proposed contract" the
catalog's `FnoForecastLab` superseded. India only, F&O only: absent in the US market.

## The owner's 13 Oct 2026 requests: kept, changed or dropped (judge 217 should-fix 2)

The replaced third draft (13 Oct, before contract 2.x) was built from two rounds of the owner's feedback on its own
made-up data. The rebuild draws only what `FnoForecastLab` carries. Each request:

| Owner's request (13 Oct) | Now | Why |
|---|---|---|
| Call it a lab, not a contest | **Kept** ("Forecast lab") | |
| Plain language everywhere; plain question names | **Kept** | Question names are the payload's `plain` text; labels are plain words |
| Today's predictions on top, the past below, saying which is which | **Kept** | "Today: what each forecaster says" (with each answer date), then "The past" |
| Which family is best at which prediction | **Kept** | One row per question from the backend's own verdicts against its yardstick |
| Overall ranked cards | **Changed**: ranked within each question, no rank across questions | The questions use different miss scores (Brier for chances, QLIKE for move sizes); ranking across them would add unlike numbers. Reasoning only |
| Official statistics folded away "for the curious" | **Kept** | Per question, folded: average difference, likely range, p-value; v4 marked not frozen |
| A period you choose (last week to since the start, or picked dates), its table and the race chart; one line graph of all families by day | **Kept, from contract 2.9** | "A period you choose": a question picker, last week, last month, last 3 months, since the start, or From/To dates; a race chart of each forecaster's average miss from the period's start (the yardstick dashed) and a ranked table, from `getFnoForecastHistory` (owner, 16 Oct 2026, field A). Descriptive only: no test over a chosen period |
| Say how long it runs | **Changed**: per question, when it could settle | `settle` gives a projected date per question, not one end date for the lab |
| Who wins and loses and why; costliest mistakes as sentences ("what made the difference" story cards) | **Waiting** (owner, 16 Oct 2026) | Needs field B (settled forecasts with their outcomes), which the owner put off until about 60 live days are scored; until then too few misses mean anything |

**Owner's decision (16 Oct 2026, exepex/trading `docs/DESK_DECISIONS.md`; proposal in response 226):** field A, the
running score by session, is in contract 2.9 (`getFnoForecastHistory`, its own page) and drawn above. Field B, settled
forecasts with their outcomes for the "costliest mistakes" cards, waits until about 60 live days are scored.

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_winning` (default) | positive: the Hybrid book beats its yardstick on Q1; rules level with it | `api/examples/fno-screens.json`, `getFnoForecastLab_india_winning` |
| `india_losing` | negative: the AI team worse than the yardstick; a v4 question that cannot win (stop testing); late and breached answers not counted | `getFnoForecastLab_india_losing` |
| `india_waiting` | empty: not enough days; V1 waits for the 15-minute recorder; V6 not started | `getFnoForecastLab_india_waiting` |

"A period you choose" draws `getFnoForecastHistory` (contract 2.9) in the same case as the state: `india_ahead` with the
good case, `india_behind` with the bad case, `india_none` (no session scored) with the empty case (data.json `also`;
`tools/api/check_fno_screens.py` checks it against the catalog too). URL `q=` picks the question and `p=` the period
(5, 21, 63 sessions; since the start by default). Screenshot `shot-india_winning-v2-last-month-*`: V2 over the last
month.

**Every state is Mock: made-up numbers on a future date (16 Nov 2026).** `data.json` is built from the catalog
(`_platform/catalog_data.py`), one copy of the data.

**Real data today (exepex/trading, 16 Oct):** protocol v2 live on 2 days (14 and 15 Oct), G4 summaries for 3 days, one
exploratory v4 report (v4 not frozen), the AI books' 2 days with no on-time answer. The screen will look most like
the empty case at first.

## Contract

`FnoForecastLab` (`api/schemas/fno-forecast-lab.yaml`), page `forecast_lab`; field table in `api/catalog/fno-screens.md`.

## Things the owner should know (brutally honest)

1. **Forecast scores never promote a book**: the standing line says so on every view; net profit decides.
2. **A late, missing or breached answer is shown and not counted**, never filled in; each forecaster's coverage line
   shows how many days counted.
3. **The v4 verdicts are provisional** until the v4 freeze (G6 revision 1): "cannot win" and the p-values may change
   meaning.
4. **QLIKE scores can be negative**; only the comparison between two forecasters on the same days means anything.
