# W8 round 3: the red CI `ui` job, and judge 21's minor finding

Judge 21 passed round 2 on code (`c36b1a3`) but main was red. The new CI job `ui` failed in run
[38335689110](https://github.com/exepex/omenix-dashboard/actions/runs/38335689110), job 115095122372, step "UI harness".

## The red `ui` job: root cause and fix

**Evidence (the job log).** The run had 147 cases and 3 failed: `gallery`, `dark-gallery` and `frame-page-gallery`.
Every finding was the same page error, `Invalid language tag: en-US@posix`, three per width. Every other case passed in
CI, so fonts, timing, viewport and server start are ruled out. The artifact size (299 MB) did not cause it.

**Cause.**
- The gallery is the only page with the vendored TradingView chart (`components/charts/candles.tsx`). When it is not
  given a locale, the library defaults `localization.locale` to `navigator.language`. That is visible in the vendored
  file: `localization:{locale:vn?navigator.language:"",…}`.
- The CI runner's POSIX locale reaches Chromium as the language tag `en-US@posix`, which `Intl` refuses.
- The sandbox's Chromium reports a valid tag, so the failure never showed here.
- The rest of the app formats numbers in the market's locale (`lib/ui/format.ts`, `LOCALE`: en-IN or en-US), never the
  viewer's. The chart was the one place that broke that rule.

**Reproduced here, then fixed.** I forced `navigator.language = "en-US@posix"` in the page and loaded
`/india/gallery` on the unfixed build: three `Invalid language tag: en-US@posix` page errors, as in CI. The same check
on the fixed build: no page errors.

**Fix.** `Candles` now takes the market's `currency` and passes `localization: { locale: LOCALE[currency] }`, so the
axis numbers follow the market, as everywhere else. The only caller, the gallery, passes it.

**So it cannot come back unseen.**
- A new UI case, `gallery-posix-locale` (`tests/ui/cases/shell.mjs`), runs the gallery with
  `navigator.language = "en-US@posix"` through a new `initScript` option of the harness (`tests/ui/harness.mjs`).
- The CI artifact now uploads only on failure, because the full set is about 300 MB.
- No case was skipped and nothing was retried to green.

## Judge 21 minor: template-literal dynamic import (fixed)

- `lib/shell/tests/imports.ts` now reads ``import(`…`)`` and ``require(`…`)`` template literals without interpolation
  as specifiers, through the same resolver.
- A computed target, such as ``import(`@/lib/shell/${name}`)``, `import(target)` or `require("@/lib/" + x)`, cannot be
  followed by any static check. A new rule (`computedImports`) holds that no app code uses one.
- Planted tests cover the template literal in the resolver and in the breach list, and the computed forms are flagged.
- A real planted file, `components/frame/zz-planted.tsx` containing ``import(`@/lib/shell/fixture-source`)``, fails
  tests 1, 2 and 4. Removed, all 8 pass.

## Checks

The local results and the CI run link for this push are in the orchestrator report. The push is only called done when
the `ui` job is green.
