# Judge 5: W3i-2, each F&O mockup page equals its build: text (`story/fno-card-reasons` at 8e425a968)

**FAIL**, lane **1**, not 2: the change edits `tools/api/check_fno_screens.py`, and `CLAUDE.md` puts `tools/` and every
non-CSS code file in lane 1. Judged by reading, with `platform_build.py` on `main` as the base. I formed the three
findings below before reading the code at 807cd2f, and J3 in addendum 1 confirmed finding 2.

## Criteria (text checks)

| Check | Result | Judge's evidence |
|---|---|---|
| Why: judge 4's P5 gap is real | MET | `check_mockups` reads `data.json` only (`check_fno_screens.py:203-215` at 76ef53f) |
| Design: pure `page_html`, `run()` reuses it, `check_pages` builds in memory | MET | sound and DRY; `run()` writes `data.json` before rendering, so running `build.py` from the check would mutate files |
| C1-C5 measurable | MET | each names its check or command |
| Lane | NOT MET | finding 1 |
| Effects on other work stated | NOT MET | finding 2 |
| Plants consistent with the criteria | PARTLY | finding 3 |

## Findings

1. **Should fix: the lane is wrong.** The text says "Lane: 2 (orchestrator, 24 Oct 2026)", and commit 807cd2f is titled
   "Lane 2:". `CLAUDE.md` "Branch": lane 2 covers only CSS, `design/` and new tests; `tools/` and `.py` code are
   lane 1. Expected: the story says lane 1, and the merge message starts "Lane 1:" after a judge PASS.
2. **Should fix: an unstated coupling.** Each page embeds `design/system` (`inline_system`), `_shared/shell.css`,
   `_platform/js/*.js` and 30-shell's data (`platform_build.render`). So any edit to those makes `check_fno_screens`
   red on all nine F&O pages until each is rebuilt. Most of those edits are lane-2 design work, and that check is not
   in `CLAUDE.md`'s pre-push gates, so a CSS commit that passes its local gates can turn CI's `api-contract` red. The
   text's "Out" names only the shell's data. Expected: state the effect, and the remedy (rebuild the nine pages, or
   run `check_fno_screens.py` before pushing design work). Also say that the other platform pages (30-35, 38) stay
   unchecked, so they can still go stale silently.
3. **Minor: the third plant contradicts C2's limit.** "40's `data.json` and `page.html` both left at 2.13.0, which
   `check_mockups` and `check_pages` both report" is wrong. A page built from its own stale data equals its build, so
   only `check_mockups` reports it. The builder's claims (correction 2) state this correctly; the plant line should
   match.

## Addendum 1: code, round 1 (head 807cd2f017802b6b3096c08cf392fb314dc3e7dd)

**FAIL**, but only on the text: the code needs no change. Since 8e425a9, 807cd2f changes `platform_build.py`,
`check_fno_screens.py` and the story file.

| Claim | Result | Judge's evidence |
|---|---|---|
| `page_html` is pure; `run()` output is byte-identical | MET | `--out` builds at a7cadfc and at 807cd2f, compared with `cmp`: 30 and all nine F&O mockups are identical (10/10) |
| `check_pages` builds in memory, never runs `build.py` | MET | it calls `page_html` only; `git status` is clean after the check |
| `planted_page` runs on every check | MET | wired in `check()`; J5 below |
| C1, C5 gates | MET | code size passes (`check_fno_screens.py` 299 lines, `platform_build.py` 95); `check_contract` "every planted break caught"; `check_fno_screens` "every rule holds" (1.9 s); `render_fno_catalog --check` current; typecheck, `npm test` 591/591 (0 fail, 0 skipped), build exit 0 (web is unchanged since a7cadfc, so the same `npm ci` tree was reused) |
| The stated limit | MET | J2 below |

Plants (mine, each restored): 6 planted, 6 behaved as claimed.
- J1, P5 (42 back to 2.13.0): "42-scoreboards/page.html: not its build".
- J2, 40's `data.json` and page stale together: only `check_mockups` reports it (the stated limit).
- J3, one comment added to `design/system/components.css`: all nine pages are reported (finding 2's coupling).
- J4, 39's `template.html` edited: 39 is reported.
- J5, `check_pages` made a no-op: "planted break not caught: 42-scoreboards/page.html ... ([])".
- J6, one byte cut from 45's page: 45 is reported.

Open from the text: findings 1 and 2 (should fix) and 3 (minor). The story's lane line, the merge message, and two
or three sentences of text are all it needs. Round 2 can be judged by reading.
