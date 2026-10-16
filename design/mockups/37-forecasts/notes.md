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
| Say how long it runs | **Changed**: per question, when it could settle | `settle` gives a projected date per question, not one end date for the lab |
| Who wins and loses and why; costliest mistakes as sentences ("what made the difference" story cards) | **Dropped for now** | The contract has no per-day forecasts with their outcomes; inventing them on screen would be made-up data. Needs a new field |
| A period you choose (last week to since the start, or picked dates), its table and the race chart; one line graph of all families by day | **Dropped for now** | The contract has scores since the start only, no per-day or per-period series. Needs a new field |

**To bring back the dropped two** (proposal, owner's call; reasoning only): a 2.9 addition of (1) a per-question,
per-forecaster series of the running average miss score by session (the race chart and the period chooser), and (2)
the last few settled forecasts with their outcomes (the "costliest mistakes" sentences). Both come from records the
backend keeps (G4 scores, the forecast records); both are public-safe (answers and outcomes, never a rule). Not added
in 2.8.0 because the orchestrator scoped 2.8 to the W3 pages and P2 would have to build them.

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_winning` (default) | positive: the Hybrid book beats its yardstick on Q1; rules level with it | `api/examples/fno-screens.json`, `getFnoForecastLab_india_winning` |
| `india_losing` | negative: the AI team worse than the yardstick; a v4 question that cannot win (stop testing); late and breached answers not counted | `getFnoForecastLab_india_losing` |
| `india_waiting` | empty: not enough days; V1 waits for the 15-minute recorder; V6 not started | `getFnoForecastLab_india_waiting` |

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
