# Response 35: story W3a, the market weather screen (builder's claims, part 1: today's weather)

Builder: Claude (session 0134MoC6). Story text: exepex/trading `docs/stories/W3-fno-screens.md` (merged 90b4902d),
W3a. Branch `story/w3a-weather`. Contract 2.7.0: `FnoWeather` is unchanged in 2.8.0, which is not on this repository's
main yet. So part 1 covers today's weather (page `weather`). The history view (2.8.0's `FnoWeatherHistory`, page
`weather_history`) is part 2. Its probability and colour columns wait for the owner's answer on the weather levels.

## What it does

- **`/india/weather`**, nav item "Market weather" under Markets. India only: the page is built for India alone, so
  `/us/weather` is a real 404, and the US nav has no weather item.
- **Today's weather, from mockup 40:**
  - the colour with its glyph and meaning, and whether new paper trades are allowed;
  - when nothing is published: "No weather", fail closed, the missing input named;
  - the two chances against the usual chance, what moved it and the session's upgrades (in IST);
  - the last sessions, how often it is RED against its frozen 15% maximum;
  - its scores against the usual chance and v0, and this month's price of the RED rule (Paper).
- **The pattern** (Markets, W12), under `web/lib/fno-weather/`:
  - `contract.ts`: the types;
  - `source.ts`: one interface;
  - `azure-source.ts`: page `weather` through `lib/fno`'s reader;
  - `fixture-source.ts`: P1's examples, only without a database;
  - `wiring.ts`: one line picks the adapter;
  - `view.ts` and `record-view.ts`: pure words and figures.
  The components are in `components/fno-weather/`; the page is `app/(cockpit)/[market]/weather/`.
- **Example:** shown only when the weather comes from P1's examples, through the frame's own rule (`exampleTagShown`
  with `live`). A published weather never says Example.
- **No page yet:** the existing empty state with its reason (`not_published` or `page_missing`), never an example.

## Privacy and the no-threshold rule (owner, 16 Oct 2026)

- **Code scan** (`lib/fno-weather/tests/no-threshold.test.ts`): the screen's code names none of M1's levels. That
  covers the floors 10%, 35%, 6%, 20%, the multiples 2.5 and 1.5, and v0's limits. Each is checked as a literal, as an
  "N%", or as a multiple.
  - The levels are a pinned copy of M1's own (`tests/m1-levels.ts`, from trading `fno/weather/constants.py` and
    `checklist_v0.py` at 89ad2175).
  - One exception, stated: the question's own "2% move", which names the event, not a level.
- **Output scan:** what the views say for the good, bad and empty examples holds no threshold wording ("turns RED
  at", "floor", "threshold", "reaches") and no `reaches` field.
- **Planted breaks are caught:** a level as a constant, "AMBER from 6%", a 2.5 multiple, "turns RED at 10%", a
  `reaches` field and "floor".
- **Gateway** (`lib/fno/tests/gateway-imports.test.ts`, privacy rule 5): nothing the gateway serves reaches F&O
  screen code.
  - The roots come from `gatewayDecision` itself: its served routes, plus its rewrites' targets. `OAUTH_ROUTES` is now
    exported, so the test reads it rather than copying it.
  - "/" counts as `/about` there (the P1 builder's correction), never the dashboard's home.
  - F&O screen code means `lib/fno-*`, `components/fno-*` and every W3 page of `routes.ts`.
  - Planted imports are caught, both a direct one and one through a chain.

## Changes to existing files (lane 1, stated)

- `lib/fno/pages.ts`: `getFnoWeather: "weather"`. The page-key test now reads `fno-screens.json` too, and lists P1's
  other four screens as not read yet (W3b to W3h).
- `tools/sync-design.mjs`: copies `api/examples/fno-screens.json` to `lib/fixtures/fno-screens.generated.json`.
- `lib/tools/gateway.ts`: `OAUTH_ROUTES` exported. No behaviour change.
- `components/frame/parts.tsx`: `ExampleTag` takes `Pick<Instrument, "live">`, the one field its rule reads. No
  behaviour change.
- `design/system/components.css` and its README (lane 2): a new `.mb-howto`, the "how to read it" line that mockups
  37 to 40 all use. It replaces a page-local copy that the duplicates test refused.
- Structure tests extended with the weather, never loosened:
  - Home's and the Screener's import-graph lists gain `lib/fno-weather/fixture-source` and `lib/fno-weather/wiring.ts`;
  - the SPEC-pages count excludes W3, as it already excludes W12;
  - the F&O integration test publishes and reads back page `weather`, on a real throwaway PostgreSQL;
  - new: the weather's own import-graph test, with planted breaches.

## Evidence

- `node tools/check_code_size.mjs`: clean.
- `npm run typecheck`: clean.
- `npm test`: 483 passed, 0 failed, 0 skipped (clean main: 465).
- `npm run build`: clean, with `/india/weather` only.
- `next start` without a database:
  - `/india/weather` answers 200, `/us/weather` 404 and `/us/markets` 200 with no weather item;
  - at 1280 and 390 px: no console error and no horizontal overflow.

## Open, honest

- **The nav icon** is `sensors`. The sprite has no weather icon, and adding one is a design-system change for the
  owner.
- **The levels copy is pinned.** A new weather version with new levels needs a new copy (stated in the file). The
  dashboard's CI cannot read the trading repository to check it.
- **No real weather is published yet.** M1's live job is not built, and P2a's page lands with the BR1 builder. With
  the database set, the screen shows "not published" until then.

## Addendum 1: contract 2.8.0's weather labels (on story/fno-2-8-merge, at P1's request)

2.8.0 makes three FnoWeather fields required. The screen now shows each one, so nothing rebuilt from history reads as
live:
- **`recent[].label`:** a strip day rebuilt from history shows "rebuilt" (mockup 40), and the how-to says what that
  means.
- **`red_share.basis`:** a rebuilt share says "rebuilt from history (exploratory)" (mockup 40). On the 2.8.0 empty
  example it said "RED on 13 of the last 250 sessions" with no mark. That was the honesty gap; it is closed now.
- **`scores[].exploratory`:** shown beside the verdict as "Exploratory: scored on days rebuilt from history, not a
  confirmed result". This goes beyond mockup 40, which has no mark there (reasoning only: a back-filled "Better" must
  not read as a confirmed result).

Two tests are updated, both because the 2.8.0 examples changed. Neither is loosened:
- the driver wording is now the example's "India VIX up 22% over 5 sessions";
- the empty case's RED share is now rebuilt, and the test checks that it is said to be.

There is one new test: a day, a share or a score rebuilt from history is always said to be, and a live one never is.

On this tree: check_code_size and the design copies are clean, `npm test` gives 484/484 with 0 skipped, and the build
passes. The history view (page `weather_history`, colour and label only) is next, as W3a part 2.
