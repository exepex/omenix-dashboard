# Response 36: story W3b, the Forecast lab screen (builder's claims)

Builder: Claude (session 0134MoC6). Story text: exepex/trading `docs/stories/W3-fno-screens.md` (merged 90b4902d),
W3b. Branch `story/w3b-forecast-lab`, from main 7ea7194 (W3a part 1 merged). The contract is 2.7.0's `FnoForecastLab`,
which 2.8.0 does not change (checked against story/fno-contract-2-8 39d1829). The reference is mockup 37 at f04cb50
(story/fno-mockups-2, with judge D); the orchestrator said to adapt if 37 or 2.8.0 change before merge.

## What it does

- **Route:** `/india/forecast-lab`, the existing nav item under Strategies (renamed "Forecasts" to "Forecast lab", as
  the mockup). India only: built for India alone, so `/us/forecast-lab` is a real 404 and the US nav has no item.
- **Order, from mockup 37:**
  - the standing line first ("forecast scores are secondary to net profit");
  - today's answers, with the date each answer is known;
  - who beats the yardstick, question by question, from the backend's verdicts only;
  - one card per question: forecasters ranked by average miss within that question only, never across questions
    (Brier and QLIKE are different scales); each verdict; the test's numbers folded "for the curious" (v4 marked not
    frozen); when it could settle;
  - who forecasts: an AI book's isolation label shown exactly as sent ("sealed same day (not full F1)"), and coverage
    with missing, late and unscored days.
- **Never counted:** a late, breached or wrong-model answer is shown and marked "not counted", never filled in.
  Coverage before a common start is a dash, never zero.
- **Pattern:** the same as W3a.
  - `lib/fno-forecast-lab/`: contract, source, Azure page `forecast_lab`, fixture, wiring;
  - `view.ts` and `question-view.ts`: pure;
  - `components/fno-forecast-lab/`.
  - Family names use the frame's own `ApBadge`. Example shows only through the frame's rule.
- **One wording change from the mockup (reasoning only):** the mockup's how-to says "'Better' needs the whole interval
  below zero". Protocol v4 has no interval (G6 revision 1), so the screen says "'Better' needs the test to say so over
  many days, not one lucky month", which is true for both protocols.

## Shared parts and structure tests (stated)

- `components/fno-common/screen-bits.tsx` (section card, how-to line, quiet line) and `fno-screen.css` (the F&O
  screens' shared layout): moved out of the weather. The duplicates test would refuse a second copy. The weather
  imports them; its own rules stay in `weather.css`. The weather renders as before (screenshots, no console error, no
  overflow).
- **Home's and the Screener's import-graph tests:** these now allow any `lib/fno-<screen>/fixture-source` and
  `wiring` by pattern, instead of naming each screen. Same strictness: those files are the adapters' owners.
- **The weather's own import-graph test** is replaced by `lib/fno/tests/screens-import-graph.test.ts`. It finds every
  F&O screen by its wiring and checks each:
  - its components reach no adapter, wiring or data client;
  - exactly one W3 page loader reads its wiring;
  - one line picks its adapter.
  Planted breaches are caught.
- **Gateway rule (W3a):** it already covers `lib/fno-*`, `components/fno-*` and every W3 page, so it covers the lab
  and `fno-common` with no change.
- `lib/fno/pages.ts` gets `getFnoForecastLab: "forecast_lab"`, with its contract test. The integration test publishes
  and reads back the page on a real PostgreSQL.

## Evidence

- `check_code_size`, `typecheck` and `build` (only `/india/forecast-lab`): clean.
- `npm test`: 492 passed, 0 failed, 0 skipped.
- `next start` without a database:
  - `/india/forecast-lab` and `/india/weather` answer 200; `/us/forecast-lab` and `/us/weather` answer 404;
  - at 1280 and 390 px: no console errors and no horizontal overflow on both screens.

## Open, honest

- **Contract gaps (owner's call, P1's proposal):** the mockup's dropped items, the race chart and period chooser and
  the "costliest mistakes" sentences, need a 2.9 contract addition. The screen does not invent them.
- **Not published yet:** no `forecast_lab` page exists until P2b. With the database set, the screen says "not
  published" until then.
- **Real data will look like the empty case at first:** v2 live on 2 days, the AI books with no on-time day.

## Addendum 1: judge 220's note (1), on story/fno-2-8-merge

v4's "better" also needs the minimum effect (PROTOCOL_v4 section 4 item 4). Each question card's how-to now reads:
"'Better' needs the test to say so over many days, and by enough to matter, not one lucky month." Note (2) is still
open: the pattern exemption in Home's test against the per-screen test finding screens by their wiring. It is
harmless today, as the judge said.

## Addendum 2: the yardstick is not always a baseline (contract 2.12.0's note, G1's protocol v3)

The screens lead said that under protocol v3 the yardstick is book1_rules ("Rule-based"), not a baseline. Two of the
screen's own words assumed it is always plain history, and both are fixed:
- the lede said "who reads the market better than plain history". It now says "Each question has a yardstick fixed
  before any result, so you can see who beats it";
- the "What" column called every baseline "Yardstick". A baseline is now "Baseline (plain history)", and the yardstick
  is whatever the payload names as `primary_baseline`, as before.

New test `lib/fno-forecast-lab/tests/yardstick.test.ts`: a baseline is never called the yardstick by its kind, and a
book named as `primary_baseline` shows as the yardstick under its own name, both in the overview and on each
question. No code path changes; the words do.

## Addendum 3: judge 249's should-fix (not every baseline is plain history)

Accepted. Exepex/trading's research/forecasts/PROTOCOL.md defines three baselines, and only one is plain history: (a)
is read from option prices (line 82), (b) is the past base rate (line 93) and (c) is a simple OLS model (line 97).
Addendum 2 had labelled every baseline "Baseline (plain history)", which was false for two of the three.

- The "What" column now says "Baseline" alone, beside each forecaster's own name from the payload ("Option prices,
  premium removed", "How often it happened", "Recent movement"). The name says which baseline it is, so the screen
  states nothing it cannot know. The comment at view.ts says the same.
- The test checks all three baselines: each says "Baseline", keeps its own name, and the words "plain history" appear
  nowhere in the forecaster rows.

npm test 531/531; typecheck and build pass.
