# 40 Market weather: data used, where it comes from, the contract

**Status:** first draft for the owner (15 Oct 2026), built by story P1 (exepex/trading, the F&O data catalog).
Weather design: exepex/trading design v2 section 2.3 (thresholds accepted by the owner on 15 Oct 2026); the weather is
built by M1 (slice A) and scored by G8. India only, F&O only: absent in the US market.

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_green` (default) | positive: GREEN, beats the usual chance on the one-day question, RED saved money this month | `api/examples/fno-screens.json`, `getFnoWeather_india_green` |
| `india_red` | negative: RED, an intraday upgrade, over-alarming (16.4% of sessions), RED cost money this month | `getFnoWeather_india_red` |
| `india_missing` | empty: not published, the missing input named, no score yet; new entries blocked (fails closed) | `getFnoWeather_india_missing` |

**Every state is Mock: made-up numbers on a future date (Mon 16 Nov 2026).** The base rates shown (4.1% and 13.7%)
are the measured NIFTY figures quoted in design 2.3; everything else is made up. `data.json` is built from the catalog
(`_platform/catalog_data.py`); `python3 tools/api/check_fno_screens.py` fails if it differs.

## Contract

`FnoWeather` (`api/schemas/fno-weather.yaml`), `GET /api/v1/markets/india/fno/weather`; field table in
`api/catalog/fno-screens.md`.

## Elements

| Element | Fields |
|---|---|
| Verdict header | `colour`, `blocks_new_entries`, `session`, `model_version` |
| Not published | `status`, `missing_inputs[]` |
| The chance of a big move | `p_big_1d`, `p_big_5d`, `base_rate_1d`, `base_rate_5d`, `times_usual_1d`, `times_usual_5d` |
| What moved it | `drivers[]` |
| During the session | `intraday[]` |
| The last sessions | `recent[]` |
| How often it is RED | `red_share.*` |
| Its record | `scores[]` |
| The price of the RED rule | `price_of_calm.*` |

## Things the owner should know (brutally honest)

1. **The colour rule's numbers are not sent each day.** They are frozen per `model_version` (design 2.3) and never
   change inside a version, so repeating them in every payload would be a second copy. The screen links the version.
2. **"RED saved" or "RED cost" needs shadow fills (E8, slice B).** Until then the block says "not measured yet"; the
   design never claims RED protects anything before it is measured.
3. **A score verdict on this screen is the backend's**, under the frozen test; the screen only draws it.
4. No navigation entry yet (as 39: it waits for W3).

## Checks

- `python3 design/mockups/40-weather/build.py` twice gives the same bytes.
- `node design/system/check_page.js "design/mockups/40-weather/page.html#s=<state>" design/mockups/40-weather shot-<state>`
  for the three states at 1280 and 390 px: no console errors, no external requests, no overflow.
- `node design/system/check_text.js design/mockups/40-weather/page.html "" s=india_red s=india_missing`: 0 findings.
