# Judge 4: W3i part A code, round 1 (`story/fno-card-reasons` at 76ef53ffa)

**PASS**, lane 1 (`api/`, `web/lib`, `tools/`, with `design/` riding in it). Owner's exception (a), "2. Option A",
is recorded in exepex/trading `docs/DESK_DECISIONS.md:331` at c63eb7e0b. Commit 97b9e84 changes only the story text
(`git diff 8b11a5a 97b9e84`: the story file; the judge files arrived through the merge 146848b).

## Criteria

| Criterion | Result | Judge's evidence |
|---|---|---|
| A1 enum = 2.13 list + 3 codes + null; new codes valid, unknown refused | MET | `fno-card.yaml:39`; `check_card_reasons`; probe `new_reason`; plants P1, P3 caught |
| A2 TRADE/WATCH with a reason refused | MET | new probe on `getFnoCard_india_trade`; plant P4 (else branch loses `reason: null`) caught |
| A3 2.14.0 everywhere; examples change only the version | MET | `fno-screens.json` and the fixture: +36/-36 lines each, and with the version masked every changed line in the examples, fixture, nine `data.json` and nine `page.html` is identical (my diff script) |
| A4 TS list equals the yaml, order included; `contract.ts` types only | MET | `reasons.ts`, `reasons.test.ts`; plants P2 (order swap) and P7 (typo: typecheck and test fail) caught |
| A5 no screen change | MET | 0 files under `web/components/` or `web/app/`; `view.ts` unchanged |
| A6 gates | MET | code size passes; `check_contract.py` "every planted break caught"; `check_fno_screens.py` "every rule holds"; `render_fno_catalog.py --check` current; `npm ci`, typecheck, `npm test` 591/591, 0 fail, 0 skipped; `npm run build` exit 0 |
| Item 5: no screen word depends on the code | MET | test 4 (`headerOf` with `step_problems` gives the `none` card's own `why`); `view.ts:51` |
| Mockups rebuilt and re-shot correctly | MET | all nine `build.py` rerun: 0 diff lines; `check_page.js` on all nine: no console errors, no overflow, no external requests; rendered text (Chromium) shows "contract 2.14.0" on 42, 43, 44, 46 and no version on 37, 45, so keeping 37/39/40/41/45's screenshots is right |

## Ruling on the departure

`37/notes.md:35` and `44/notes.md:29` keep "contract 2.13.0". **Accepted.** Both name the version that added a
feature (the unknown answer day; the page holds), the same kind as `44/js/3-holds.js:1`, which the story kept as history
in round 2. My round-2 addendum wrongly passed those two lines as current labels.

## Findings

1. **Minor (not blocking): the story's item 3 table says `check_mockups` checks `page.html`, but it checks `data.json`
   only** (`check_fno_screens.py:203-215` at 76ef53f). My plant P5 survived: `page.html` of 42 set back to 2.13.0, and
   `check_fno_screens`, `check_contract` and the web tests all pass. The committed pages are correct today (a rebuild
   of all nine gives no diff), so this is a pre-existing tooling gap, not a defect in this change. Expected: fix the
   wording, or name a follow-up (a check that each `page.html` equals its `build.py` output). It need not block this
   merge.

## Plants: 7 planted, 6 caught, 1 survivor

P1 `hard_rule_breach` out of the yaml (`check_card_reasons` and `reasons.test.ts`); P2 TS order swap (test); P3 an
`allOf` rule tying `step_problems` to `data_checks.passed: false` (`check_card_reasons`); P4 TRADE's `reason: null`
removed (probe); P6 one fixture value at 2.13.0 (`sync-design.mjs --check` "out of date"); P7 `step_problem` typo in
TS (typecheck and test). Survivor: P5 (finding 1). Each was restored in a scratch worktree.

## Notes

- T1e's `test_every_reason_the_card_can_give_is_in_the_pinned_contract` cannot go green until exepex/trading
  re-pins 2.14.0 after this merges; that is outside this repository, as the story says.
- I can confirm that the owner's words are recorded in the decisions log, not that the owner said them.
