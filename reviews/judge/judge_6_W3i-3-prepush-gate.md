# Judge 6: W3i-3, the F&O page check joins the pre-push gates (`story/w3i-3-prepush-gate` at 11867a5f7)

**PASS**, lane 1 (a rule document, `CLAUDE.md`). Base is `main` at 2bfed71, one commit. Judged by reading, plus a run on
a clean checkout.

## Criteria

| Check | Result | Judge's evidence |
|---|---|---|
| Matches the owner's decision | MET | exepex/trading `docs/DESK_DECISIONS.md:337` at fa60529 (owner: "2 - yes"): "Before every push" gains `python3 tools/api/check_fno_screens.py` so a design edit that breaks a page "fails before the push, not in CI"; the new text adds exactly that command, with the same reason and the date |
| Nothing else in `CLAUDE.md` changes | MET | `git diff 2bfed71...11867a5 --stat`: `CLAUDE.md` +4/-1 only; the -1 is the old line ending "... shrink) and", now "... shrink)," so the list continues |
| No lane-1 rule or hard line narrowed | MET | the change only adds a gate; lanes, hard lines, judge rules and the other gates (`check_code_size`, `npm ci`, typecheck, test, build) are unchanged and still "must pass" |
| `AGENTS.md` defers to `CLAUDE.md` | MET | `AGENTS.md:4` "follows the same rules (see `CLAUDE.md`)", `:64` "the checks in `CLAUDE.md` pass before every push"; no gate list of its own to update |
| `docs/JUDGE.md:11` is the judge's own procedure | MET | it lists what the judge runs for evidence ("run what can be run (...)"), not the builder's pre-push gates, so leaving it unchanged is right |
| The command runs as written on a clean checkout | MET | fresh clone of 11867a5, a new venv, `pip install -r tools/api/requirements.txt`, then `python3 tools/api/check_fno_screens.py`: "fno screens: every rule holds", exit 0, `git status` clean afterwards; the branch carries W3i-2's `check_pages` (one `def check_pages`) |

## Findings

None blocking or should fix.

## Plants

None of my own. A rule-text change has no code to break; the command's own behaviour was planted and judged in
judge 5 (6/6).

## Notes (not findings)

- "fails here, not in CI" reads as if CI no longer catches it. CI still runs the check (`api-contract.yml:32`); the
  point is that it fails first, before the push. That is the owner's own phrasing, so it is left as is.
- The orchestrator merges with "Lane 1:" after this PASS, per `CLAUDE.md` "Branch".
