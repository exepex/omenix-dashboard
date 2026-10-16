# 37 Forecast lab: data used, where it comes from, the contract

**Status:** rebuilt on the F&O data catalog (16 Oct 2026), story W3b (exepex/trading `docs/stories/W3-fno-screens.md`;
the screen is built by the W3 builder in `web/`, the page by P2b). It replaces the first draft (13 Oct), whose own
data (`_platform/forecast_data.py`, removed) and "proposed contract" the
catalog's `FnoForecastLab` superseded. India only, F&O only: absent in the US market.

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
