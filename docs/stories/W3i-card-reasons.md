# Story W3i: the card's reason codes the backend already gives (contract 2.14.0)

**Repository:** exepex/omenix-dashboard · **Lane:** 1 (`api/`, `.ts`; part B also `design/`, which rides in this
lane-1 story) · **Size:** S (part A), S (part B) · **Asked by:** the orchestrator, 24 Oct 2026, for exepex/trading's
T1e (owner, 24 Oct 2026, DESK_DECISIONS "The card warns when any step failed") · **Branch:** `story/fno-card-reasons`
· **Status:** text round 2 (answers judge 3, below), to the judge. Owner's answer to question 1: (a), part A only
(24 Oct 2026, below). Text PASS (judge 3 addendum 1); part A built, claims at the end, to the judge

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
- **The owner paused screens, mockups and contract versions** (exepex/trading `docs/DESK_DECISIONS.md` on main):
  - line 238, 16 Oct: "No new mockups, screens **or contract versions** start";
  - line 243, 16 Oct: the F&O mockups 37 and 39-46 are not approved; "No agent designs screens until the owner says
    so"; nothing more is built on the W3 screens;
  - line 244, 16 Oct: "No dashboard screens, mockups, **contracts** or read-model publishing pages ... are started or
    extended";
  - line 294, 22 Oct (cut-list): from Mon 26 Oct the UI is frozen.

  The 24 Oct T1e row (line 322) is about the Slack card and lifts none of these. So **both parts wait for the owner**
  (question 1):
  - **Part A** (the contract version, the typed read-model contract, and the mechanical version change in the
    mockups): it needs an owner exception, because it starts contract version 2.14.0. The case for it: it unblocks
    T1e's warning, and it repairs a bug that exists today, since a C4 refusal day (`hard_rule_breach`) already fails
    the backend's delivery test on main (T1e text, `T-cards.md:752-754` at `b673e0ddd`). It adds no screen element.
  - **Part B** (the warning on the card screen, examples and mockup 39's states): screen design, so it waits for the
    owner's review of the F&O mockups. Specified in full below so that it is ready.

## Part A: the contract (allowed by the owner's exception (a), 24 Oct 2026)

Scope, in:
1. `api/schemas/fno-card.yaml`: `reason`'s enum gains `trade_fields_not_built`, `hard_rule_breach` and
   `step_problems`, in that order after `advocate_hard_rule` (before `null`). Its description lists each code's
   meaning in the backend's words above (one plain line each), and says the backend owns which code wins
   (T2/T1e order: `data_check_failed` > `hard_rule_breach` > `step_problems` > T1's reason).
2. **No new `allOf` rule** for the three codes. Reason: no card field records C4's refusals, the run log's steps or
   the registry rung, so any rule would invent a relation the backend does not send; and the backend's test builds
   each real card from the `none` example with only `reason` swapped (`test_p1_t1_card.py:35-48`), so a rule would
   fail real days.
3. **Version 2.14.0**, additions only: every 2.13 payload stays valid. Every file that changes, and how:

   | File(s) | Change | How it is made and checked |
   |---|---|---|
   | `api/openapi.yaml` | `info.version` 2.14.0 and one "Version 2.14" paragraph (what was added and why; the card page is not published yet; the codes have no example until part B) | by hand; `check_contract.py` |
   | `api/README.md` | the versioning line gains 2.14.0 | by hand |
   | `api/examples/fno-screens.json` | the 36 `"schema_version": "2.13.0"` become `"2.14.0"`; nothing else | it has no generator, so one scripted, exact replace of that string; checked by `check_fno_screens.py:103` (every example equals `info.version`) and by `git diff --numstat` showing exactly 36 changed lines |
   | `api/catalog/fno-screens.md` | the enum list | `render_fno_catalog.py`, then `--check` |
   | `web/lib/fixtures/fno-screens.generated.json` | the same 36 values | `node tools/sync-design.mjs` from `web/`; `--check` (and `lib/ui/tests/design-sync.test.ts`) |
   | the nine F&O mockups' `data.json` and `page.html` (37, 39, 40, 41, 42, 43, 44, 45, 46; each `page.html` embeds its data) | `schema_version` | each mockup's own `build.py`, which reads the examples; checked by `check_mockups` (`check_fno_screens.py:188`) |
   | the "contract 2.13.0" labels: `js/9-mount.js` `dataLabel` in 42, 43, 44 and 46 (shown on the page); the `note` strings in `build.py` of 37, 42, 43, 44, 45, 46 (in the data); the header comments in `js/1-base.js` of 37, 42, 43, 44, 45, 46 and `46/build.py:1`; `37/notes.md`, `44/notes.md` | become "contract 2.14.0" | by hand, then each `build.py` again. They change because a page that shows 2.14.0 data must not say 2.13.0. Mentions that name when something was added (for example `44/js/3-holds.js:1`, "contract 2.13, page page_holds") stay as they are, since they are history |
   | screenshots | re-shot (1280 and 390 px, `check_page.js`) for every mockup whose rendered text changes: 42, 43, 44 and 46 for certain (`dataLabel`), and 37 and 45 if their `note` is drawn | the builder compares each page's rendered text before and after; a page whose text is unchanged keeps its screenshots |

   These mockup edits are mechanical (version only, no design change), but they still touch paused mockups, so they
   are part of question 1's exception.
4. **The codes in TypeScript.** `web/lib/fno-card/contract.ts:4` says "Types only", so the runtime list does not go
   there. A new file, `web/lib/fno-card/reasons.ts`, holds `NO_TRADE_REASONS` (`as const`, all ten codes, each with a
   one-line meaning) and `export type NoTradeReason = (typeof NO_TRADE_REASONS)[number]`. `contract.ts` imports the
   type from it and stays types only.
5. A dashboard reader on 2.13 that receives a new code still works: it checks the major version only and renders
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
- A4. `NO_TRADE_REASONS` (`web/lib/fno-card/reasons.ts`) equals the yaml enum without `null`, in the same order,
  checked by a test that reads the yaml (test plan 2), so a code added to one and not the other fails.
  `contract.ts` still holds types only.
- A5. No screen, component or view file changes in part A: `git diff --stat` lists none under `web/components/` or
  `web/app/`, and not `web/lib/fno-card/view.ts`. The only mockup changes are the version values and labels in
  item 3's table, and the screenshots that table names.
- A6. The gates: `node tools/check_code_size.mjs`; `python3 tools/api/check_contract.py`,
  `python3 tools/api/check_fno_screens.py`, `python3 tools/api/render_fno_catalog.py --check`; then
  `cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build`. All pass.

Test plan (part A):
1. **Schema checks, in `tools/api/check_fno_screens.py`** (256 lines now; it stays under 350).
   - Positive, new function `check_card_reasons`: the `none` example with `reason` set to each of the three new
     codes validates. These cannot go in `fno_rules.py`, because its probes are invalid pages only (its docstring).
   - Negative, two new probes in `fno_rules.py` (neither exists today): the `none` example with `reason: new_reason`
     is refused, and the `trade` example with `reason: step_problems` is refused.
2. **`web/lib/fno-card/tests/reasons.test.ts` (new).** `web/` has no YAML parser, and none is added (no package
   change). The test reads `api/schemas/fno-card.yaml` as text, through a small function `reasonEnum(text)` in the
   test file:
   - it finds the line `reason:` at four spaces of indent;
   - it takes the first `enum: [...]` line after it, before the next key at the same indent;
   - it splits the list and drops `null`.

   It throws "reason enum not found" when either line is missing, so a moved or reshaped schema fails loudly and never
   passes as empty. The test compares the result with `NO_TRADE_REASONS`, order included. Plants proving the reader:
   - a text without the `reason:` key throws;
   - a text whose `enum:` line lacks `step_problems` gives a list that fails the comparison, naming `step_problems`;
   - a flow-style enum split over two lines throws, so the reader never reads half a list.

   If the schema is later written in block style, this test fails and its reader is changed with it (stated in a
   comment).
3. `headerOf` on the `none` example with `reason: step_problems` gives the same `why` (its `reason_text`): no screen
   output depends on the code in part A.
4. Plants, each must fail a named check and be restored: P1 a new code left out of the yaml (test 2 and
   `check_card_reasons`); P2 one example left at 2.13.0 (`check_fno_screens`); P3 a mockup `data.json` left unregenerated
   (`check_mockups`).

## Part B: the card screen's reason line and warning (not allowed: the owner chose (a); kept for later)

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

1. **(owner)** The pause (lines 238, 243, 244 and 294) covers contract versions and mockups. May this story have an
   exception?
   - **(a) Part A only.** Contract 2.14.0, the typed list, and the version-only mockup changes of item 3's table. No
     screen element.
   - **(b) Parts A and B.** Also the card screen's warning and mockup 39's states.
   - **(c) Neither.** Then T1e cannot merge, and C4 refusal days keep failing the backend's delivery test.

   Recommendation: (a) (reasoning only). It unblocks T1e and fixes a bug that exists today, and it changes nothing
   the owner sees. Part B waits for the owner's review of the F&O mockups. Nothing is built before the answer.

   **Answered (owner, 24 Oct 2026: "2. Option A"; exepex/trading `docs/DESK_DECISIONS.md` line 331 at `c63eb7e0b`,
   "Dashboard: the contract's reason list only (UI pause exception a)"):** part A only. "No screen change: the 16 Oct
   UI pause stays for screens." Part A changes no app screen; its mockup edits are the version values and labels of
   item 3's table only, as option (a) said. Part B and question 2 stay paused.
2. Should the backend send a separate `step_warning` field, so that the screen can warn on every day the Slack card
   does? This is a contract change, so the pause covers it too. Recommendation: yes, with part B (reasoning only:
   without it, the screen misses the warning on exactly the worst days).
3. `trade_fields_not_built` is included (orchestrator, 24 Oct: all three codes).

## Answers to judge 3 (round 1, `reviews/judge/judge_3_W3i-card-reasons.md`), by number

1. **Accepted** (checked: DESK_DECISIONS lines 238, 244 and 294 say what the judge quotes). I had read the pause as
   covering screens only. Now both parts wait for the owner, and question 1 covers part A as an exception, with its
   case.
2. **Accepted** (checked: no generator reads into `api/examples/fno-screens.json`; nine `page.html` files embed
   `2.13.0`; the `dataLabel` text in 42, 43, 44 and 46; `web/tools/sync-design.mjs:10`). Item 3 is now a table of
   every file, with how each is changed and checked, the decision on the labels (they change), and the screenshots
   rule. A5 is corrected to match it.
3. **Accepted** (checked: `web/package.json` has no YAML parser; `contract.ts:4` says "Types only"). The test reads
   the one `enum:` line with plants, and adds no dependency. The runtime list goes in a new `reasons.ts`, so
   `contract.ts` stays types only.
4. **Accepted** (checked: the `fno_rules.py` docstring says its probes are invalid pages; there is no `new_reason`
   probe and no probe for a TRADE card with a reason). The positive checks move to `check_card_reasons`, and both
   negative probes are marked new.

**Depends:** nothing in this repository; exepex/trading re-pins after part A merges, then T1e can merge ·
**Judge verifies:** the criteria above, the backend meanings against `fno/constants.py` and `T-cards.md` (T2, T1e),
and that part A changes no screen.

## Claims: part A as built (builder, 24 Oct 2026)

Evidence levels: **tested** means a check in this commit fails if the claim breaks; **checked** means I ran it once.

| Criterion | Claim | Evidence |
|---|---|---|
| A1 | The enum is the 2.13 list plus `trade_fields_not_built`, `hard_rule_breach`, `step_problems`, then `null`; the description gives each new code's backend meaning and the backend's order | tested: `check_card_reasons` (the `none` card with each new code validates) and the new probe `new_reason` (refused) |
| A2 | A TRADE card with a reason is still refused | tested: new probe "a TRADE card with a reason" on `getFnoCard_india_trade` |
| A3 | `info.version` 2.14.0; the 36 F&O examples say 2.14.0, and only that changed in them | tested: `check_fno_screens.py:103`; checked: `git diff --numstat api/examples` = 36/36, and no changed line in `api/examples` or `design/` other than a 2.13.0 → 2.14.0 value or label |
| A4 | `NO_TRADE_REASONS` (`web/lib/fno-card/reasons.ts`) equals the yaml enum, order included; `contract.ts` imports the type and stays types only | tested: `web/lib/fno-card/tests/reasons.test.ts` |
| A5 | No file under `web/components/` or `web/app/`, and not `view.ts`, changed | checked: `git diff --stat` |
| A6 | Gates on this tree | checked: `check_code_size` passes; `check_contract.py` "OpenAPI 3.1 valid; examples valid and current; ... every planted break caught"; `check_fno_screens.py` "every rule holds"; `render_fno_catalog.py --check` current; `npm ci --ignore-scripts`, `typecheck`, `npm test` 591/591 with 0 skipped, `npm run build` pass |
| Item 5 | A 2.13 reader shows the same words for a new code | tested: `reasons.test.ts`, `headerOf` with `step_problems` gives the `none` card's own `why` |

**Plants, each run and then restored (checked):**
- P1, `step_problems` taken out of the yaml: `check_card_reasons` reports it, and `reasons.test.ts` fails.
- `step_problems` taken out of `NO_TRADE_REASONS`: `reasons.test.ts` fails, naming it.
- `new_reason` added to the enum: the probe "a card reason outside the contract's list" reports it.
- The TRADE `reason: null` rule removed: the TRADE-with-reason probe reports it.
- P2, one example left at 2.13.0: `check_fno_screens` reports the example, and mockup 39's data differs.
- P3, mockup 40's `data.json` left at 2.13.0: `check_mockups` reports it.
- P4, the rejected mapping (a rule tying `hard_rule_breach` to `advocate.verdict`): `check_card_reasons` reports
  that `hard_rule_breach` is refused.
- Reader plants (in the test): the `reason:` key missing, and the enum split over two lines, both throw "reason enum
  not found".

**Mockups and screenshots (item 3, checked):** the nine F&O mockups were rebuilt with their own `build.py`. I
compared each state's rendered text before and after, in Chromium:
- 37, 39, 40, 41 and 45: no change. Their screenshots are kept.
- 42, 43, 44 and 46: the data label changed. Every state was re-shot with `check_page.js` at 1280 and 390 px,
  including 46's `india_stormy` with `h=5d`. All 13 shots report no console errors, no overflow and no external
  requests.

**One departure from item 3's table, with reason:** `37/notes.md:35` and `44/notes.md:29` still say 2.13.0.
- Both name the version that added a feature: Q1's unknown answer day, and the page holds.
- By the table's own rule, history mentions stay as they are; the table had wrongly listed these two lines as current
  labels.
- The current-version labels did change: `dataLabel` in 42, 43, 44 and 46, the `build.py` notes and 46's docstring,
  and `1-base.js` in 37 and 42-46.

**Next, outside this repository:** exepex/trading re-pins 2.14.0 after this merges. Then T1e's
`test_every_reason_the_card_can_give_is_in_the_pinned_contract` should go green. I could not run it here: it
needs T1e's branch and the re-pin.

**Self-review:**
- The diff matches the claims.
- Every new file is under 350 lines: `check_fno_screens.py` 272, `fno_rules.py` 170, `reasons.ts` 16, and the test
  51.
- No new dependency.
- Judge 3 addendum 1's minor (option (b)'s cost) is moot now that the owner has answered (a).

