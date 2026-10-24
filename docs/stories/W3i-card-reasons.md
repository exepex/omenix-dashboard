# Story W3i: the card's reason codes the backend already gives (contract 2.14.0)

**Repository:** exepex/omenix-dashboard · **Lane:** 1 (`api/`, `.ts`; part B also `design/`, which rides in this
lane-1 story) · **Size:** S (part A), S (part B) · **Asked by:** the orchestrator, 24 Oct 2026, for exepex/trading's
T1e (owner, 24 Oct 2026, DESK_DECISIONS "The card warns when any step failed") · **Branch:** `story/fno-card-reasons`
· **Status:** text round 1, to the judge

**Description:** As the owner, I want every reason the F&O backend can put on the daily card to be allowed by the
dashboard's contract, so that a real card day never fails validation and never drops out of my dashboard, and, once I
allow screen work again, I want a day whose desk run had a failed or refused step to show on the card screen as a
plain warning, never hidden.

## Why (strong evidence unless marked; read 24 Oct 2026)

- The card's `reason` is a closed list (`api/schemas/fno-card.yaml:39`, contract 2.13.0): `no_approved_strategy,
  weather_red, data_check_failed, risk_bucket_full, budget_stop, cost_wall, advocate_hard_rule, null`.
- exepex/trading pins a copy (`contracts/omenix-dashboard/pin.json`: commit `d53cefe`, 2.13.0) and validates every
  committed delivery record against it (`tests/market_read_models/test_p1_t1_card.py`,
  `test_every_committed_delivery_record_fits_the_catalogs_card`; the delivery's `reason_code` becomes the card's
  `reason`, line 42).
- The backend's card can give five codes (`fno/constants.py:331-334` on main, plus T1e's new one):

  | Code | Backend meaning, in its own words | In the 2.13 enum |
  |---|---|---|
  | `no_approved_strategy` | "no playbook version is at `paper`" (T1) | yes |
  | `trade_fields_not_built` | "a version is at `paper`; card v1 has no trade fields (slice B)" (T1) | **no** |
  | `data_check_failed` | "a record the status needs could not be read" (T1), or C3's execution snapshot `valid: false` (T2) | yes |
  | `hard_rule_breach` | "T2: C4 refused a book's proposed trade today (its committed rows)" (`validity_failures.csv` rows dated that day) | **no** |
  | `step_problems` | T1e (branch `story/t1e-card-warning`, `b673e0ddd`): "a desk step failed or was refused today", by O1's `problem_steps` on the committed run log | **no** |

- **Three codes are missing, not two.** The orchestrator named `hard_rule_breach` and `step_problems`. T1e's round-2
  text found `trade_fields_not_built` the same way, and its criterion 10 test
  (`test_every_reason_the_card_can_give_is_in_the_pinned_contract`) reads all codes from `fno/constants.py`, so it
  stays red, and T1e cannot merge, unless all three are in the enum. This story adds all three. If the orchestrator
  wants only two, T1e must first drop or map `trade_fields_not_built`; I recommend adding it (strong evidence: the
  constant exists and is returned by `fno/cards/status.py`).
- **`hard_rule_breach` is not `advocate_hard_rule`.** T1e allows mapping one onto the other. Rejected, with reason:
  `advocate_hard_rule` is tied by the schema to `advocate.verdict: hard_rule_breach` (`fno-card.yaml:193`), the
  devil's advocate's verdict (T3). T2's code is C4's refusal in the desk, a different source, on a card whose advocate
  is `not_needed`. Mapping would make every C4 refusal day invalid, or claim an advocate verdict that never happened.
- **No screen shows the `reason` code today.** The card screen shows `reason_text`, the backend's sentence
  (`web/lib/fno-card/view.ts:51`); `NoTradeReason` (`web/lib/fno-card/contract.ts:10`) is a type only. Mockup 39 uses
  the code only in its state picker's label (`design/mockups/39-trade-card/js/2-top.js:22`, `reasonShort`), a mockup
  tool, not the product. So part A changes nothing on any screen.
- **No real card reaches the dashboard yet.** No page builder in `fno/market_read_models/` publishes the `card` page
  (searched: no `getFnoCard`/`card` page builder); the only live consumer of the enum is the backend's delivery test.
- **The owner paused screen work** (exepex/trading DESK_DECISIONS, 16 Oct 2026: "don't design the screen ... I didn't
  like UI mockups": the F&O mockups 37 and 39-46 are not approved, "no agent designs screens until the owner says
  so", "nothing more is built on" the W3 screens; 21 Oct: "UI paused"). The 24 Oct T1e decision is about the Slack
  card, not the dashboard screen. So this story is split:
  - **Part A, now:** the contract and the typed read-model contract only. No new UI surface.
  - **Part B, only after the owner says so:** the warning on the card screen and mockup 39's new state. The orchestrator
    asks the owner (question 1). Specified in full below so that it is ready.

## Part A: the contract (built now)

Scope, in:
1. `api/schemas/fno-card.yaml`: `reason`'s enum gains `trade_fields_not_built`, `hard_rule_breach` and
   `step_problems`, in that order after `advocate_hard_rule` (before `null`). Its description lists each code's
   meaning in the backend's words above (one plain line each), and says the backend owns which code wins
   (T2/T1e order: `data_check_failed` > `hard_rule_breach` > `step_problems` > T1's reason).
2. **No new `allOf` rule** for the three codes. Reason: no card field records C4's refusals, the run log's steps or
   the registry rung, so any rule would invent a relation the backend does not send; and the backend's test builds
   each real card from the `none` example with only `reason` swapped (`test_p1_t1_card.py:35-48`), so a rule would
   fail real days.
3. **Version 2.14.0**, additions only: every 2.13 payload stays valid. `api/openapi.yaml` `info.version` and one
   "Version 2.14" paragraph (what was added and why, that the card page is not published yet); `api/README.md`'s
   versioning line; every F&O example's `schema_version` (36 in `api/examples/fno-screens.json`, required by
   `check_fno_screens.py:103`), regenerated with the repository's tools, never by hand, and with them the generated
   fixture `web/lib/fixtures/fno-screens.generated.json` and the F&O mockups' `data.json` (`check_mockups`: a
   mockup's data must equal the examples). Only `schema_version` changes in those files; build scripts are
   deterministic. If a mockup's page shows the version, its screenshots are re-shot; otherwise not.
4. `api/catalog/fno-screens.md`, regenerated (`render_fno_catalog.py`).
5. `web/lib/fno-card/contract.ts`: `NoTradeReason` gains the three codes, with a one-line meaning each.
6. A dashboard reader on 2.13 that receives a new code still works: it checks the major version only and renders
   `reason_text`, never the code (reasoning from `view.ts:51`; tested in part A test 3).

Out, with where it goes:
- **The re-pin in exepex/trading** (`python -m fno market contract-check`, copy, `pin.json`): the backend's own change
  after this merges. This repository never writes there.
- **New `reason_text` sentences:** the backend writes them; the dashboard shows them as sent.
- **Mock examples with the new codes:** an example forces a new state in mockup 39 (`check_mockups`), which is screen
  design under the pause. They come with part B. Until then the three codes have no example: a known gap, stated
  here and in the 2.14 paragraph.
- **Found, not this story's:** the backend's `card_from_delivery` keeps the `none` example's
  `data_checks.passed: true`, so a real `data_check_failed` delivery would fail the existing rule at
  `fno-card.yaml:189` (`passed: false`, `missing_inputs` at least 1). That is a test-fidelity bug in exepex/trading
  (some evidence: read, not run). Reported to the orchestrator; no change here.

Acceptance criteria (part A):
- A1. The enum is exactly the 2.13 list plus `trade_fields_not_built`, `hard_rule_breach`, `step_problems`, and
  `null`. A NO TRADE card with each new code validates; a card with an unknown code (`new_reason`) still fails.
- A2. A TRADE or WATCH card with any non-null reason still fails (the existing `allOf`, unchanged).
- A3. `info.version` is 2.14.0 and every F&O example says 2.14.0; every 2.13 example payload, with only its version
  changed, still validates (additions only).
- A4. `NoTradeReason` in `web/lib/fno-card/contract.ts` equals the yaml enum without `null`, checked by a test that
  reads the yaml, so a future code added to one and not the other fails.
- A5. No screen, component or view file changes in part A (`git diff --stat` lists none under `web/components/`,
  `web/app/` or `web/lib/fno-card/view.ts`); mockups change only in `schema_version` inside `data.json`.
- A6. The gates: `node tools/check_code_size.mjs`; `python3 tools/api/check_contract.py`,
  `python3 tools/api/check_fno_screens.py`, `python3 tools/api/render_fno_catalog.py --check`; then
  `cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build`. All pass.

Test plan (part A):
1. `tools/api/fno_rules.py` gains probes: the `none` example with `reason` set to each new code validates (positive);
   `new_reason` fails (negative, kept); `trade` with `reason: step_problems` fails (negative).
2. `web/lib/fno-card/tests/reasons.test.ts` (new): reads `api/schemas/fno-card.yaml`, takes `reason`'s enum, and
   compares it with a runtime list exported beside `NoTradeReason` (`NO_TRADE_REASONS`, `as const`, the type derived
   from it, so type and list cannot differ). Plant: drop `step_problems` from the list; the test must fail and name
   it.
3. `headerOf` on the `none` example with `reason: step_problems` gives the same `why` (its `reason_text`): no screen
   output depends on the code in part A.
4. Plants, each must fail a named check and be restored: P1 a new code left out of the yaml (test 2 and probe 1);
   P2 one example left at 2.13.0 (`check_fno_screens`); P3 a mockup `data.json` left unregenerated
   (`check_mockups`).

## Part B: the card screen's reason line and warning (only after the owner allows it)

Built only when the owner lifts the 16 Oct pause for the card screen (question 1). Until then nothing below is built.

Scope, in:
1. **One label per code**, in `web/lib/fno-card/view.ts`, as a `Record<NoTradeReason, ...>`, so TypeScript fails the
   build if a future code has no label. Plain words for a beginner, each with a one-line "what this means":

   | Code | Label | What this means |
   |---|---|---|
   | `no_approved_strategy` | No strategy approved yet | No strategy has passed its tests, so nothing can be traded |
   | `trade_fields_not_built` | Trade details not built yet | A strategy is approved, but this card version cannot show a trade yet |
   | `weather_red` | Market weather RED | The market is too stormy for new trades today |
   | `data_check_failed` | Data check failed | Data the card needs was missing or could not be read |
   | `risk_bucket_full` | Risk limit full | The book already holds as much risk as its limit allows |
   | `budget_stop` | AI budget stopped | The AI usage budget reached its stop line |
   | `cost_wall` | Costs too high | Today's trading costs would eat the expected gain |
   | `advocate_hard_rule` | Devil's advocate found a hard-rule break | The checker that attacks each trade found a broken hard rule |
   | `hard_rule_breach` | A risk rule refused the trade | The desk's own rule checks refused a book's trade today |
   | `step_problems` | Warning: part of the desk run did not work | A step of the desk's daily run failed or was refused; the card still went out, but something it relies on may be missing |

   The label shows on the verdict as "Why: <label>" under the backend's `reason_text`, never replacing it.
2. **The warning for `step_problems`:** above the verdict, the design system's warning alert (`mb-alert`, its default
   warn tone; no page-local colour) with the `warning` icon and the word **Warning**, bold: "Warning: part of the desk
   run on <day> did not work." Then: "Each failed step's alert in #fno-desk gives the reason." Then the "how to read
   it" line: "The card is still the desk's real result for the day; check the alerts before trusting it." Glyph, word
   and text together; never colour alone. `role="alert"`. On a held-back day (`withheld`), the day is the card's own
   session, never "today".
3. **One Example payload per new code** in `api/examples/fno-screens.json` (labelled Mock, as every catalogue example):
   `getFnoCard_india_steps` (step_problems), `getFnoCard_india_refused` (hard_rule_breach) and
   `getFnoCard_india_unbuilt` (trade_fields_not_built), each `reason_text` taken word for word from the backend's
   status sentences at the merged T1e/T2 heads. This is a contract change too (2.15.0 or folded into 2.14.0 if part B
   is allowed before part A merges).
4. **Mockup 39:** the three examples become states (good: the existing ones; bad: refused and steps; empty: none),
   `reasonShort` gains the three codes, `notes.md` names the source of each, `rationale.md` says why the warning sits
   above the verdict; screenshots at 1280 and 390 px from `check_page.js` (no console errors, no external requests,
   no horizontal overflow). F&O stays India only: the US has no card route (unchanged).

Acceptance criteria (part B):
- B1. Every code has a label and a meaning; a code without one fails `npm run typecheck`.
- B2. A `step_problems` card shows the warning with the `warning` icon, the word "Warning" and the sentence; no other
  code shows it; it is `role="alert"`.
- B3. The backend's `reason_text` is shown unchanged on every card; the label is added beside it, never instead.
- B4. A held-back `step_problems` card dates the warning by the card's own session.
- B5. Mockup 39 shows the new states; `check_fno_screens.py` (mockups equal the examples) and `check_page.js` pass.
- B6. The gates of A6.

Test plan (part B): view tests for each label and for the warning's presence only on `step_problems` (positive,
negative, empty: no reason on TRADE); a held-back example; plants: the warning shown for `hard_rule_breach`, the word
dropped, the glyph dropped, the label replacing `reason_text`, each caught by a named test.

## Known limits (honest)

- **The screen can warn only when `step_problems` wins.** The backend ranks `data_check_failed` and
  `hard_rule_breach` above it, and on such a day the Slack card still warns about failed steps, but the contract has
  no field for them, so the screen cannot. Closing this needs a new field (for example `step_warning`: the steps and
  their statuses, no reason text) from the backend: a separate story for both repositories (question 2).
- **TRADE and WATCH days:** the contract requires `reason: null`, so a failed step on a trade day cannot be carried.
  Card v1 is always NO TRADE (T1 slice B), so this does not happen yet; question 2's field would also cover it.
- Part A adds codes without examples (see Out).

## Questions for the orchestrator (to the owner where marked)

1. **(owner)** May the card screen and mockup 39 get part B's warning now, or does the 16 Oct "no screen design" stay?
   Recommendation: part A now (reasoning only: it unblocks T1e and changes no screen); part B when the owner reviews
   the F&O mockups.
2. Should the backend send a separate `step_warning` field so the screen can warn on every day the Slack card does?
   Recommendation: yes, with part B (reasoning only: today the screen would miss the warning on exactly the worst days).
3. Confirm adding `trade_fields_not_built` (recommended above, strong evidence).

**Depends:** nothing in this repository; exepex/trading re-pins after part A merges, then T1e can merge ·
**Judge verifies:** the criteria above, the backend meanings against `fno/constants.py` and `T-cards.md` (T2, T1e),
and that part A changes no screen.
