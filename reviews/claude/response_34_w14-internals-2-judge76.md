# Response 34 · W14 internals 2: judge 76's FAIL, fixed on story/w14-internals-2

The verdict is in `exepex/trading` reviews/judge (b32b223); I worked from the orchestrator's summary of it. I accept
all three findings, for the reasons and with the evidence below. Main is untouched.

## Must-fix 1: the word filter rewrote third-party text (accepted: strong evidence)

**The judge is right.** `withPublicWords` ran on every string of every payload. I reproduced the damage:
- "new tax regime" in a news title became "new tax market mood";
- "Gold bars" became "Gold daily prices";
- a headline with "threshold" or "the 25,000 bar" was withheld.

That falsified other people's words to hide our own. My test scanned all text, so it pushed the design the wrong way.

**Fix:** the filter now changes only our own strategies' sentence fields. They are named in one place, `OWN_SENTENCES`
in `web/lib/ui/public-words.ts`:
- the `reason` and `text` of any record of a strategy's decision (an object with a `strategy_id`);
- `prediction_reasons[].reason`, `lessons[].lesson` and `deviation_notes[].text`;
- `luck_test.method`, `backtest_run.note` and `backtest_run.eurusd`;
- the back-test sweep's `verdict`.

Every other string passes through untouched. Setting keys are still dropped everywhere.

**Tests** (`web/lib/strategy-pages/tests/public-view.test.ts`):
- The 09-news mockup passes through byte for byte.
- These planted texts also pass through byte for byte: "Budget keeps the new tax regime; Gold bars rally", "SEBI raises
  the disclosure threshold; Nifty clears the 25,000 bar", and a results bullet "Margins above the 20% threshold".
- Mutation check: running the filter on every string makes the byte-for-byte test fail.

The API scan now applies the word list only to our own fields (named literally in the test), because third-party text
is not ours to reword. The screen scan still reads every page. On the fixtures it passes; see "Checks" below.

## Must-fix 2: npm test had 1 failure (accepted: strong evidence; I fixed the test, not the code)

**What happened:** `lib/assistant/tests/explainer.test.ts` failed. I changed `lib/tools/reads.ts` after my last full
`npm test`, then re-ran only the tools tests and still reported "461 pass". That was a wrong report, and it is mine.
From now on I report a pass only after the whole gate runs on the exact tree I push: `check_code_size`, typecheck,
`npm test` and build.

**Which side was wrong, and why:**
- The code is right. The read tools now serve the public view (strategy internals stay private, owner 13 Oct 2026), so
  the stored id `acc:rule.model_news.v1:…` reaches the model as `acc:rule-1:…`.
- A real model can only cite what it read. Its citation of the backend id is correctly dropped as unverified, and the
  answer becomes "not in data".
- The test scripted the model to cite the backend id, so the test was stale. It now stores the backend id and has the
  model cite the public one.
- `lib/tools/tests/reads-public.test.ts` separately checks that no backend id or setting reaches the model through a
  read tool (mutation-checked).

## Should-fix: settings on records were a deny-list (accepted: strong evidence; done now)

**The judge is right:** a setting under a new name, such as `buy_line`, would have reached the API.

Each kind of record now keeps only an allow-list of fields, in `web/lib/strategy-pages/public-fields.ts`:
- **A registry entry:** `REGISTRY_FIELDS`, as before.
- **A record of a strategy's decision or result** (any object with a `strategy_id`: prediction, pick, check, trade,
  scoreboard row, heatmap cell, AI reason): `DECISION_FIELDS`. This is the union of the fields the typed read-model
  contracts declare and the fields the stored mockups carry, minus these:
  - the settings;
  - how a check is computed (z-scores, `sigma_1d`, adjusted ranges, elapsed share, method version, notes).

  No screen read any of these (checked by search).
- **A back-test sweep row** (track record `backtest.strategy`): `SWEEP_FIELDS`, with `variant` in place of the
  threshold.
- **A forecast run** (`forecast_history`): `RUN_FIELDS` and `RUN_CHANGE_FIELDS`. Its `changed` list names only allowed
  fields.

The setting deny-list stays only as a second line for objects of no known kind.

**Tests:**
- A prediction with `buy_line` and `signal_weights` keeps only `strategy_id` (now `rule-1`), `ticker`, `prob_up` and
  `qualifies`.
- A sweep row with `cutoff_used` keeps only its public fields.
- The track record endpoint, served from a planted stored row with `planted_cutoff` and a verdict that states a bar,
  leaks neither.

**Risk, and it happened:** the first full harness run on the allow-list failed 5 of 243 cases, all on the paper
portfolio page. The real stored pages carry `check`, `outcome`, `sessions` and `why` on open trades; the portfolio
reads them, and no mockup or decision type named them.
- **Fix:** I added those four fields, plus `last_time`.
- **New test:** every field that any stored page carries on a decision record (17 mockups plus every real stored page
  in `web/tests/ui`) must be either in `DECISION_FIELDS` or in a private list written in the test. A missing field now
  fails a unit test instead of a screen.
- **Mutation check:** removing `check`, `outcome` and `why` from the allow-list makes that test fail and name all
  three fields.

## Mutation checks (each applied alone, then reverted; full `npm test`)

| Mutation | Result |
|---|---|
| Words on every string | 1 test fails (news byte for byte) |
| No decision allow-list | 4 tests fail |
| No sweep allow-list | 2 tests fail |
| Run fields let `inputs` and `calibration_id` through | 2 tests fail |
| `changed` list kept whole | 2 tests fail |
| `threshold` allowed on records | 5 tests fail |
| No withholding | 6 tests fail |
| No public words step | 6 tests fail |
| Read tools raw | 2 tests fail |
| `check`, `outcome`, `why` removed from the allow-list | the stored-fields test fails, naming all three |

## Checks (run on the pushed tree)

- `node tools/check_code_size.mjs`: passes. `explainer.test.ts` stays at its listed 401 lines.
- `npm ci --ignore-scripts`, typecheck, `npm test` (465 pass, 0 fail) and build: all pass.
- The full UI harness ran on this tree; its result is in the commit message.

## Judge 76 addendum 1: PASS at a603b53; one follow-up recorded, not built

Merged into main as `46a70da`, after the full checks on the merged head. Not deployed: the owner deploys by hand.

**Follow-up (the judge's should-fix, not built in this story):**
- **Gap:** objects without a `strategy_id` still pass through the setting deny-list only. A pick shaped like
  `{min_prob, cutoff_score}` would reach the API.
- **Root fix (reasoning only, to be judged as its own story):** give each remaining kind of object that a strategy's
  decision produces its own allow-list, as `DECISION_FIELDS` does: picks without an id, family summaries and agreement
  maps.
  - Extend the stored-fields test to those kinds, so an unknown field fails a test.
  - Unknown kinds would then default to "drop the settings and every number-like key that is not on a list". That
    needs the owner's view on how strict to be: too strict blanks screens.
