# 37 Forecast contest: data used, where it comes from, the proposed contract

**Status:** first draft for the owner's sign-off (13 Oct 2026). Slice 2 of exepex/trading `docs/BUILD_MAP.md`
("Forecast contest, Book 1"; the producer is G4 plus P1/P2). India only, F&O only: in the US market the screen is absent
(the page sends the US market to Home, as the option chain does; the navigation item is India only).

## What the screen answers

Which family (Rule-based, Hybrid, AI team) reads NIFTY best: every trading day each one gives its chance of five things
happening, each forecast gets a miss score when its answer is known, and each family is tested against simple
yardsticks. Profit decides which family trades; the screen says so at the top (protocol "Standing", design 12.7).

## Data used

| State | What it shows | Source |
|---|---|---|
| Real (no `ex`) | No forecast exists: the reason, the steps G1-G5 with their status, the first-score rule (10 / 20 trading days after the first forecast) | exepex/trading `docs/stories/G-forecasts.md` (status lines), `research/forecasts/PROTOCOL.md` draft 1, `docs/BUILD_MAP.md`, read on 13 Oct 2026 at `68c6bb8` |
| Example `ex=start` | If the first forecast were made on Mon 2 Nov 2026: first scores Tue 17 Nov (question 4) and Wed 2 Dec (questions 1-3, 5) | NSE's session calendar (`_platform/nse_sessions.csv`, the vendored copy of exepex/trading's), muhurat sessions left out (protocol section 2) |
| Example `ex=early` | Day 45: too early to tell; AI team not running | made-up numbers (`_platform/forecast_example.py`) |
| Example `ex=review` | Day 150, after the first review: Hybrid winning, AI team losing, Rule-based mostly no clear difference | made-up numbers, scored by `_platform/forecast_scoring.py` |

**The Example numbers are made up, never real NIFTY or India VIX results.** The protocol's access attestation (section 11)
forbids computing any question's outcome on real data before the freeze, so the mockup does not either. Days are
numbered ("day 45"), never dated, so an Example cannot be mistaken for history. Each Example is scored by the
protocol's own rules (Brier, clipped log score, 10 calibration bins, 20-day moving-block bootstrap with B = 10,000 and
the seed `SeedSequence([20261013, k])`, Holm at 5% over all 45 comparisons, at least 40 paired days), so every verdict
on the screen follows from its own numbers. That copy exists for the mockup only; the app never scores.

## Proposed contract (G4's report fields are not defined yet)

One read-model page per publication, `product = fno`, `page_key = forecast_contest`, inside the atomic publication of
design 13.2 (`publication_id`, `as_of`, `schema_version`, `source_commit`, `payload_sha256`). Fields marked **G1**
exist in the protocol or the record schema today; **proposed** are new and need G4/P2's agreement.

```
protocol: {version: "1", status: "draft_awaiting_review" | "frozen", frozen_commit: str | null}      G1 (FREEZE.md)
standing: str                                                                                        G1 (protocol "Standing")
questions[5]: {id, days, plain, yes_when, yardsticks[2]}                                             G1 section 2 (plain words: proposed)
families[3], yardsticks[3]: {id, name, plain}                                                        G1 sections 1, 4 (names: dashboard)
rules: {min_dates: 40, block_days: 20, comparisons: 45, family_wise_error: 0.05, review: str}       G1 section 8
state:
  kind: "real"                                                                                       proposed
  reason: str | null; steps[]: {story, what, status, detail}                                        proposed (empty state)
  first_forecast: {first_forecast, q4, others} | null; first_score_rule: {q4_vix_up_10d: 10, others: 20}   proposed
  review: {reached: bool, date: date | null}                                                         proposed (design 12.8)
  day: int | null                                                                                    proposed (trading days since the first forecast)
  forecasters: {<id>: {status: "not_started" | "not_running" | "running", days, with_forecast}}     G5 criterion 3 (coverage)
  questions: {<question id>: {
    made: date, resolves: date, void: int,                                                           G1 sections 2, 7
    today: {<forecaster id>: probability | null},                                                    G1 record (probability; null = "no forecast")
    scores: {<forecaster id>: {n_forecasts, n_no_forecast, n_scored, brier, log,                     G1 section 7
             calibration[10]: {bin: [lo, hi], n, mean_p, freq},
             split?: {interpolated: {n, brier}, flagged: {n, brier}}}},                              G1 section 7 (question 5 only)
    rolling: {<forecaster id>: [[date, mean Brier of the last 20 settled days]]},                    proposed (the line chart)
    comparisons[9]: {k, a, b, n_dates, mean_diff, ci: [lo, hi] | null, p,                            G1 section 8
                     status: "tested" | "too_few_dates" | "not_running",
                     significant: bool, verdict: "better" | "worse" | "no_difference" |               proposed (verdict)
                              "before_review" | "too_few_dates" | "not_running"},
    recent[≤6]: {date, said: {<family id>: probability | null}, outcome: 0 | 1}}}                    proposed
```

- In the real app `day` and `made`/`resolves` are dates; the mockup's Examples use day numbers on purpose.
- **`verdict` is the backend's word, not the screen's.** The backend applies the frozen rule (tested, Holm, review
  reached) and the screen only draws it. If ChatGPT's review changes the rule (response 57 point 8 asks whether Holm over
  45 is too strict and offers "one primary comparison per question"), only the backend changes; the screen does not.
- The scoreboard cell (a family against one question's two yardsticks) is summed up by the screen from the two
  `verdict`s: any not running, then too few days, then before the review, then worse, then better (both or one), else no
  clear difference. Proposed; the backend can publish it instead if the judge prefers.
- Never shown: how a family forecasts (its inputs, rules or prompts); only what it said and how it scored (owner,
  13 Oct 2026). The yardsticks are public research yardsticks and are explained in plain words.

## Things the owner should know (brutally honest)

1. **No real date for the first score can be given today.** It is 10 or 20 trading days after the first forecast, and
   the first forecast waits for G1 (in review), G2 and G3 (not started). Any date now would be a guess (reasoning only).
2. **Expect "not proven yet" for a long time.** In the review Example, Hybrid has smaller misses than the yardsticks on
   all five questions, yet only 3 of its 10 yardstick tests come out proven: with about 125 days, 20-day overlapping
   windows and 45 tests at once, only large gaps pass (strong evidence: computed on the Example with the protocol's own
   test). Real gaps are likely smaller.
3. **The verdict date is tied to paper trading, not to forecasts.** The first review is after 6 months of the three
   families paper trading together (design 12.8). Forecasts start earlier (design 12.11), so the screen may show
   "not proven yet" for many months. The contract leaves `review.date` empty until slice 3 sets it.
4. **Rule-based will probably sit close to the yardsticks.** By the draft protocol (section 5) its forecasts are built
   from the yardsticks themselves, so "no clear difference" is the likely result, not a failure. The screen does not
   say how it forecasts (internals stay private); this note does, so the owner is not surprised.
5. **History back-fill is an open question.** G2 can back-fill the yardsticks (and so Rule-based) from about 2020 with
   close-proxy inputs. Showing that history here would fill the screen years earlier but mix "close proxy" history with
   live forecasts. My recommendation (reasoning only): keep this screen live-only; if wanted, a separate, labelled
   "History (close proxy)" tab later.

## Checks

- `node design/system/check_page.js` at 1280 and 390 px on all 7 states: no console errors, no overflow, no external requests.
- `node design/system/check_text.js design/mockups/37-forecasts/page.html "" ex=start ex=early ex=review "ex=review&q=5" "ex=early&q=4" "ex=review&who=book3_ai"`: 0 findings.
- `python3 design/mockups/37-forecasts/build.py` twice gives the same bytes.
