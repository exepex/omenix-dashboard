# Judge 3: W3i card reason codes, story text round 1 (`story/fno-card-reasons` at 6de707e06)

**FAIL**, lane 1 (`api/`, `.ts`). Text judged by reading; `node tools/check_code_size.mjs` passes (no code yet).

## Criteria (story-text checks)

| Check | Result | Evidence |
|---|---|---|
| Backend meaning of each code | MET | trading `fno/constants.py:331-334`; `cards/status.py` REASONS; `cards/rule_checks.py:102` (C4 refusals in `validity_failures.csv`); T1e text `T-cards.md:735-738` at b673e0d |
| Order `data_check_failed` > `hard_rule_breach` > `step_problems` > T1's | MET | `ruled_status.py:19` SEVERITY; `T-cards.md:737` |
| Three codes needed, not two | MET | T1e criterion 10 reads every code from `constants.py` (`T-cards.md:745-757`) |
| Rejecting `hard_rule_breach` -> `advocate_hard_rule` | MET | `fno-card.yaml:193-194` needs `advocate.verdict: hard_rule_breach`; the `none` example the backend copies has verdict `null`, status `not_needed` |
| No screen shows the code; readers check the major only | MET | `view.ts:51` uses `reason_text`; mockup 39 `2-top.js:22` state label only; `fno/version.ts:7-12` |
| Card page not published yet | MET | no card builder in trading `fno/market_read_models/` |
| `data_check_failed` test-fidelity bug | MET | `none` has `data_checks.passed: true`; rule `fno-card.yaml:189` |
| The pause read correctly | NOT MET | finding 1 |
| Version-bump side effects | NOT MET | finding 2 |
| A4 test is buildable as written | PARTLY | finding 3 |
| Lanes | MET | header: lane 1; `design/` rides in it |
| Known limits | MET | screen misses the warning when a higher code wins; TRADE/WATCH need `reason: null` (`fno-card.yaml:186-188`) |
| Gap list complete | NOT MET | findings 1 and 2 |

## Findings

1. **Blocking: Part A is also paused, and the story reads the pause as screens only.** DESK_DECISIONS 16 Oct
   (line 238): "No new mockups, screens **or contract versions** start". Same day (line 244): "No dashboard screens,
   mockups, **contracts** or read-model publishing pages ... are started or extended". 22 Oct (line 294): the UI is
   frozen from Mon 26 Oct. The story cites only line 243 and 21 Oct, and starts contract 2.14.0 on its own reading.
   The 24 Oct row (line 322) is the Slack card, as the story says, so it lifts nothing. Expected: cite lines 238, 244
   and 294; make question 1 cover Part A too (an owner exception for a contract fix that unblocks a backend
   story, and that fixes a C4-refusal day already breaking trading's delivery test, `T-cards.md:752-754`); Part A
   waits for that answer.
2. **Should fix: the bump's side effects are wrong or missing.** (a) `api/examples/fno-screens.json` has no generator
   (only `check_fno_screens.py` and `render_fno_catalog.py` read it), so "regenerated with the repository's tools,
   never by hand" cannot be done: say how the 36 values are changed (a scripted replace) and checked.
   (b) Each F&O mockup's `page.html` embeds its data (9 pages carry `2.13.0`), so A5's "mockups change only in
   `schema_version` inside `data.json`" fails on any rebuild. (c) Visible text says "contract 2.13.0": the data labels
   in `42-scoreboards`, `43-budget`, `44-data-health`, `46-weather-history` `js/9-mount.js:2`, plus `build.py` strings
   (37, 44, 45, 46) and `js/1-base.js` comments. Expected: list every file that changes; decide whether these labels
   change (then the four mockups' screenshots are re-shot) or stay (then say why a 2.14 page may say 2.13); name the
   fixture's regenerator (`web/tools/sync-design.mjs`). Mockup edits under the pause belong in finding 1's question.
3. **Should fix: A4's test cannot read YAML as specified.** `web/package.json` has no YAML parser. Unstated, the
   builder must either add a dependency (a package change) or hand-parse. Expected: name the method (for example
   a narrow read of the single `enum:` line under `reason:`, with a plant proving it fails), or allow a named
   dependency. Also `contract.ts:4` says "Types only"; adding `NO_TRADE_REASONS` changes that. Say so.
4. **Minor: test plan 1's wording.** `fno_rules.py` probes are invalid pages only (file docstring), so the three
   positive checks need another home; no `new_reason` probe and no TRADE-with-reason probe exist today (grep), so
   "kept" is wrong. Expected: say where the positives go, and that both negatives are new.

## Plants

None (text round). The story's plants P1-P3 are judged at code time; P3 relies on `check_mockups`
(`check_fno_screens.py:188`), which exists.

## Notes (not findings)

- The trading `WORK_REGISTER` row for this builder (`T-cards.md:783-784`) is the orchestrator's to add.
- Question 2 (`step_warning`) is sound reasoning only; it is a contract change, so it is paused too (finding 1).
