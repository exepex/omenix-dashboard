# 46 Weather history: data used, where it comes from, the contract

**Status:** first draft (16 Oct 2026), for story W3a part 2 (exepex/trading `docs/stories/W3-fno-screens.md`; the
screen is built by the W3 builder in `web/`, the page `weather_history` by P2a). Reached from the weather page (40):
its crumb, and the link under "The last sessions". India only, F&O only: absent in the US market.

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_calm` (default) | positive: 30 sessions, mostly GREEN, one AMBER; 20 rebuilt, 10 live | `api/examples/fno-screens.json`, `getFnoWeatherHistory_india_calm` |
| `india_stormy` | negative: three RED, one AMBER, one not scored (an input missing) | `getFnoWeatherHistory_india_stormy` |
| `india_none` | empty: no weather record yet | `getFnoWeatherHistory_india_none` |

**Every state is Mock: made-up colours on a future date (16 Nov 2026).** `data.json` is built from the catalog
(`_platform/catalog_data.py`), one copy of the data; `tools/api/check_fno_screens.py` fails if they differ.

**Real data today (exepex/trading, 16 Oct):** no live weather record yet; M1's back-fill exists only as an exploratory
rebuild. The screen will first show only "rebuilt" sessions, and the counts say so.

## Contract

`FnoWeatherHistory` (`api/schemas/fno-weather-history.yaml`), page `weather_history`: each session's `colour` and
`label` (live or rebuilt), and the counts. **Colour and label only** (judge 217 should-fix 1): until the owner chooses
on the weather levels, the chances of a big move are not in the history, because over many sessions colour beside the
chances would give back the levels at which an input turns a colour. Today's chances stay on the weather page.

## Things the owner should know (brutally honest)

1. **Rebuilt is not live.** A rebuilt session was coloured later from past data; it can never prove the weather works.
   Every rebuilt tile and the counts say so.
2. **No "was it right" here.** Whether a RED was followed by a big move is on the weather page's record (scored against
   the usual chance); this page only shows how often each colour came up.
3. **The year view at 250 sessions** is about 12 rows of month strips; fine on a laptop, a long scroll on a phone.
