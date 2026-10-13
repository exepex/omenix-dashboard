# W8 round 2: the builder's answers to judge 19 (FAIL, one should-fix and three minor findings)

Verdict file: `reviews/judge/judge_19_w8_app_frame.md`, relayed by the orchestrator. Round-1 claims:
`response_3_w8_app_frame.md`. Paths are under `web/` unless they say otherwise.

## Should fix: criterion 5 enforcement (accepted, fixed at the cause)

**What was wrong (reproduced).** The old `importsOf` resolved only `./` and `../` specifiers, and FORBIDDEN matched
names that end in `.ts`. That let three kinds of import through:

- the tsconfig alias `@/lib/shell/fixture-source`;
- an extensionless relative import `../../lib/shell/fixture-source`;
- a re-export through a new helper, because the check was not transitive.

**Fix.**

- **One resolver**, `lib/shell/tests/imports.ts`. Every import form, the `@/` alias included, resolves to one canonical
  module name: web-relative, with no extension and no `/index`. It reads static imports, re-exports, side-effect
  imports, dynamic `import()` and `require`, and ignores comments. `reachable()` walks the import graph through local
  modules.
- **Three rules**, in `lib/shell/tests/import-graph.test.ts`:
  1. The orchestrator's KISS rule: no module of the app except `lib/shell/wiring.ts` imports the adapter or its fixture
     (the adapter itself may read its own JSON). This covers `app`, `components`, `lib` and `middleware.ts`, test code
     aside. A helper that re-exports the adapter is therefore a breach in its own right.
  2. Only the market layout imports the wiring.
  3. A transitive walk from every frame component: nothing reachable through any chain of modules is the adapter, its
     fixture, the wiring, a `lib/data` client (the `Market` type file aside), `lib/tools`, `lib/assistant`,
     `use-api`/`api-client`, `pg`, the Anthropic SDK or `next/server`.
  The AC6 no-submit scan now also covers every module the frame reaches. No `fetch`, XHR, beacon, socket, form,
  `onSubmit` or mutating method anywhere in that closure. API path strings are banned in the frame's own code only,
  because `lib/ui/routes.ts`, reached for page links, builds read paths.
- **Planted tests** (in the test file):
  - the resolver maps `@/…`, `@/….ts`, `../…`, `../….ts` and `…/index.ts` to the same module;
  - the rules catch the `@/` alias, extensionless, `.ts`, dynamic `import()` and JSON imports;
  - a re-export through `lib/shell/helpers-x.ts` is caught twice: rule 1 names the helper, and rule 3 shows the
    component reaching the adapter;
  - a data client through a helper (`lib/shell/reader-x.ts` → `lib/data/handler`) is caught;
  - a component importing the wiring is caught.
- **Real plants, by hand.** I wrote each as a real file under `components/frame/` and ran
  `node --test lib/shell/tests/import-graph.test.ts`. Each plant failed tests 1, 2 and 4; after removing it, all 7
  passed:
  - `import { fixtureShellData } from "@/lib/shell/fixture-source"`;
  - the same import from `"../../lib/shell/fixture-source"`;
  - a real `lib/shell/helpers-x.ts` re-export, used by a component through `@/lib/shell/helpers-x`.

Strong evidence.

## Minor findings

1. **The UI harness is not in CI. Fixed.** `.github/workflows/web-tests.yml` has a new job, `ui`. It installs pinned
   Playwright 1.56.1 and Chromium, builds, and runs `node tests/ui/harness.mjs`, uploading the screenshots and report
   as an artifact. I cannot run GitHub Actions here, so the first CI run on this push is the proof; I will report its
   result. Some evidence until that run is green.
2. **Watchlist "RELIAN / CE" at 1280. Fixed at the cause.** `page.css` puts the KPI row in 4 columns from a 1200 px
   viewport. Inside the frame, the page has about 850 px at 1280. The page area (`.mb-pf-inner`) is now a size
   container, and the row takes 2 columns below 1040 px of page width (`styles/app.css`, end). The KPI cards now read
   "RELIANCE" whole. Every fixed-position part of the frame (tooltip, drawer, veil, menus, snackbar, picks overlay,
   chat slot) sits outside that container, so containment moves nothing. The full harness confirms it: **147 cases,
   0 failed**, the report is in `reviews/claude/w8/ui-report.json`, and the comparison images are refreshed.
3. **"AI combined (Opus)" on the old Rule vs AI page. Noted for W9, with evidence; not fixed here.** It is not a string
   in the app's code: `grep -rn Opus web/app web/components web/lib` (tests aside) finds nothing. It is payload data,
   the strategy display names in the old pages' fixtures. `design/mockups/0*/data.json` holds 20 occurrences, and
   these are the stock backend's published names. The root fix is one of two things:
   - the stock backend publishes display names without model names (the 30 and 31 data already do: "AI team");
   - or one dashboard display-name rule applied by every strategy screen.

   Either one changes the old pages' data path, which W9 and the later screen rebuilds replace. A per-page string
   patch would hide the rule break in one place and leave it in four others. Reasoning plus grep evidence.

## Checks on this push

```
node tools/check_code_size.mjs   -> code size: every file within 350 lines or its listed size
cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build
                                 -> tsc clean; # tests 347 # pass 347 # fail 0; build ok
node tests/ui/harness.mjs        -> 147 cases, 0 failed
```

## Correction to round 1

Doubt (a) and difference 1 in `response_3_w8_app_frame.md`, "locked Buy/Sell grey instead of faded green and red", are
withdrawn. The orchestrator confirmed that grey is the owner's signed-off rule (design `e8cd360`), and the faded-colour
screenshots are stale. The design CSS is right and the app uses it unchanged.
