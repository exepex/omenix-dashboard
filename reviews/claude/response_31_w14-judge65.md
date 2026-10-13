# Response 31 · W14 round 2: answers to judge 65 (criterion 5 and the strategy-internals breach)

Judge 65 found W14 criteria 1–4 MET and asked for two follow-ups. Both are done. Evidence: the tests named below, all
of which fail on a planted regression (I checked that).

## 1. Criterion 5: the duplicates are removed, and a guard stops new ones — accepted, done (strong evidence)

**I agree with the judge:** I had listed these duplicates myself and left them.

| Duplicate | Was | Now |
|---|---|---|
| Section head (`.sec-head`, its title, line and the `.go` "see all" link) | two app copies (home.css, markets.css), six copies in mockup templates (31, 32, 34, 35, 37, 38), a separate `.head .go` in `_shared/shell.css` | one rule set in `design/system/components.css`. The templates keep only their real overrides (16 px title and line width on 35, 37, 38). |
| Section head markup | `SectionHead` (Home) and `Head` (Markets), plus two inline copies in `hero.tsx` | one component, `components/blocks/section-head.tsx`. Home's head wraps it with its frame link; Markets uses it directly. |
| Sortable table header | three rules: app.css `.md-table th .sort`, watchlist.css `.wl th .sort`, components.css `.mb-scr th button` | one rule in components.css. Watchlist keeps only its phone layout override. |
| Width hook for charts | `price-chart.tsx` → `lib/ui/use-width.ts` (RefObject), and `_b16/parts.tsx` (callback ref) | one hook, `lib/ui/use-width.ts`, the callback-ref design. It measures an element that appears later, which the RefObject version did not. It also returns the element, so the chart zoom attaches its wheel listener to it. |

**The guard** (`web/lib/ui/tests/duplicates.test.ts`) has three tests:
1. **No CSS rule block** (4 or more declarations) may be defined in two files. This covers the app's styles, page CSS and
   component CSS.
2. **The section head and the sortable header** are styled only in the design system.
3. **Every React hook** (`export function useX`) is defined in one module only.

Planted check: I re-added a `.sec-head` block to markets.css and a second `useWidth`; all 3 tests failed. I removed the
plants and all 3 pass.

**Honest limit (strong evidence):** the scan found **38 more inherited duplicate rule blocks** across the older pages.
- Examples: `.ctrls` in three B16 pages; the dialog rules in paper-portfolios.css, company.css and
  company-command-dialog.css; `.rl` in rule-vs-ai.css and company.css.
- Consolidating them means restyling inherited screens. So they are listed in `tools/css_duplicate_allowlist.txt`, one
  line each with the files involved. Like the code-size allowlist, the list may only shrink: a new copy fails the
  test, and an entry no longer duplicated must be removed.

## 2. Strategy internals on the Strategy lab: removed, and the API no longer sends them — accepted, done (strong evidence)

**I agree, and it went further than the chips.** The page also showed:
- each strategy's **description**, for example "Buys when the model gives at least 55% for a rise";
- **"Compared to X, it changes one setting: news weight (1 → 0.5)"**;
- the **"differs in …" / "sees the model score"** note under every name;
- the **regime-filter** wording in a tooltip and in the heatmap help;
- the **back-test texts** naming "news weight at zero" and "walk-forward probabilities".

The Help page reads the same endpoint and showed:
- each description (as a tooltip);
- "differs in …" and "bar 55%" beside each name;
- "the reference strategy's bar is 55%";
- "two see the signal model, two are blind to it".

**What changed:**
- **API:** GET `/api/v1/markets/{market}/strategies` now drops `description`, `parameters`, `threshold`, `differs_in`
  and `compared_to` from every registry entry before the answer leaves the server.
  - The code is `lib/strategy-pages/public-strategies.ts`, applied through a new optional `project` step on the page
    spec in `lib/data/handler.ts`.
  - The OpenAPI contract allows this: only `id`, `family` and `name` are required. `api/paths/strategy-lab.yaml` now
    says so.
  - `tools/api/check_contract.py` passes.
- **Types:** the Strategy lab's `Strategy` type no longer has those fields, so the compiler refuses any page code that
  tries to show them. Help reads the same type.
- **Pages:**
  - Strategy lab shows the name, family, testing status, holds traded, finished trades and every result.
  - Help keeps the family notes, reworded without internals, and the names as links.
  - The dead helpers (`KEYNAME`, `keyName`, `fmtParam`) and their test are deleted.

**Tests:**
- `lib/strategy-pages/tests/public-strategies.test.ts` checks:
  - the projection drops every internal field and keeps all results;
  - an API answer built from the mockup registry contains none of the keys and none of "news_weight",
    "regime_filter", "sees_model_score" or "Buys when the model gives".
- Harness cases `w14-no-internals-lab` and `w14-no-internals-help` load the pages with fixture data that **still
  carries** the internals, so they prove the page never draws them even if an answer did. They check:
  - five selected strategies (the reference, the 60%, calm-markets and no-news ones, and the AI team);
  - the whole page HTML, tooltips included;
  - 14 patterns ("news weight", "regime filter", "chance of a rise is at least", "differs in", "bar NN%" and others);
  - the start of every description.

**File size:**
- `strategy-lab-page.tsx` went from 607 lines to 70. The page is now `strategy-lab-page.tsx` plus six parts: shared,
  controls, leaderboard, detail, cumulative and heatmaps, the largest at 143 lines.
- It is off `tools/code_size_allowlist.txt`.
- `help-page.tsx` shrank from 475 to 464 lines; the allowlist was updated (it may only shrink).

## Still open (you should know; not fixed here, outside this request)

1. **Strategy names carry internals.** Examples: "Model + news, 60% bar", "Model + news, calm markets only",
   "Model + confirmed news only". These display names (`lib/ui/strategy-names.ts`, the registry's names) appear on
   every page, so this is the owner's call (some evidence: the rule says screens show what a family decided, and a
   name like "60% bar" says how).
2. **Other endpoints still carry thresholds:**
   - the stock-strategies page shows "same as the main rule strategy except: …";
   - the trade story shows the strategy's chance bar;
   - the track record shows bars per band.

   They read other endpoints (`stocks/{ticker}/strategies`, `lifecycle`, `track-record`). The judge asked about the
   Strategy lab; these need the same treatment in their own story. I have not changed them, to keep this change to
   what was asked.
3. **The tools layer (MCP, Slack) reads the registry from MotherDuck separately.** I have not checked what it returns
   about strategy settings.

## Checks run

- `node tools/check_code_size.mjs`: pass.
- `cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build`: pass (448 tests).
- `tools/api/check_contract.py`, `check_mapping.py` and `render_catalog.py --check`: pass.
- UI harness, all cases: **209 cases, 0 failed** (including `w14-no-internals-lab` and `-help`).
- The 7 signed-off mockups (rebuilt) and 37-forecasts (template changed): `check_page.js` finds no console errors, no
  external requests and no overflow. `check_text.js` finds 0 on the 7 signed-off ones.

## 3. Restore test on bash 3.2: verified at HEAD, no change needed (strong evidence)

This was asked after round 2: verify that `platform/owner/restore_test.sh` at HEAD drops `fno.x1_restore_marker` on
bash 3.2. The fix itself (a0bb4bb: the body stays in the main shell; `record_evidence` uses `exec > >(tee …)`) was
already in place.

**How I checked:** a new dry run, `platform/tests/restore_marker_check.sh`.
- It runs the real script in Docker's `mirror.gcr.io/library/bash:3.2` image (bash 3.2.57, the macOS version), under a
  pseudo-terminal for the password and name prompts.
- `psql`, `az`, `sleep` and `curl` are stubs that log their calls. There is no Azure and no database, and nothing is
  deleted.

| Ending | At HEAD | At 742443d (before the fix) |
|---|---|---|
| Normal end | DROP sent; evidence says "marker table dropped on omenix-pg" | **no DROP**: the 13 Oct failure, reproduced |
| Stop before the restore (restore fails) | DROP sent, recorded | DROP sent, recorded |
| Stop at the delete prompt (wrong name) | DROP sent, recorded | DROP sent, recorded |
| Ctrl-C during the 15-minute wait | DROP sent, recorded | DROP sent, **not recorded** in the evidence file |

The check is not a CI step. The CI bash 3.2 container has no pseudo-terminal, and the script reads its prompts from
`/dev/tty`. CI's `bash32_trap_test.sh` covers the same trap pattern without a terminal. Run the check before the next
quarterly restore test (reminder 11 Jan 2027), from the repository root, on a machine with Docker and util-linux
`script`.
