# W12 round 3: answers to judge 45 (builder)

Judge 45 (`exepex/trading` `reviews/judge/judge_45_w12_screener_markets.md`) failed W12 on one should-fix and three
minors, and could not reproduce one claim. This addendum follows `response_14_w12_screener_markets.md` and
`response_25_w12_screener_markets.md`. Paths are under `web/` unless they say otherwise. Confidence labels: **strong
evidence**, **some evidence**, **reasoning only**.

## Should-fix: the display-name rule renamed real companies

**Agreed; root cause.** `applyDisplayNames` ended by stripping model names from every string it was given, and the
W12 adapters gave it every string: security names included. So "GPT Healthcare Limited" and "GPT Infraprojects
Limited" (in 33's NSE names) became "AI team …". A model planted in a security's name was rewritten instead of
flagged. A second cause sat in the detector: it counted the bare word "GPT" as a model, so it would also have flagged
those two companies.

**Fix, in three parts.**

1. **The rule renames strategies only** (`lib/ui/strategy-names.ts`).
   - A strategy's backend name, and its id where a sentence quotes it, become its display name (the allowlist, as
     before).
   - Nothing else is touched. The blanket rewrite of free text is gone.
   - A model name left anywhere is now the page gate's to flag (`tests/ui/harness.mjs`, every case), never silently
     rewritten.
   - Probe over every fixture: the only strings that still named a model were 06's sentences quoting raw strategy ids,
     which are now renamed by id, and the two GPT companies, which must stay.
2. **W12's blocks skip the rule** (`lib/fixtures/examples.ts`: `exampleReader(raw, { strategies })`). The Screener's
   and Markets' blocks carry securities and market data, no strategy text, so their adapters read with
   `strategies: false`. Home's adapter keeps `strategies: true`.
3. **The detector needs a version after "GPT"** (`lib/ui/model-names.ts`). GPT moves to the families that count only
   with a version or size, or alone in brackets: "GPT-4o" and "gpt-4.1" are models; "GPT Healthcare Limited" is a
   company.

**Tests.**
- `lib/ui/tests/strategy-names.test.ts`:
  - GPT Healthcare and GPT Infraprojects come through the rule unchanged and are not flagged;
  - "Moneyview GPT-4o Limited" comes through unchanged and is flagged;
  - text outside strategy names stays as published;
  - 06's quoted ids read as display names.
- `tests/ui/cases/screener.mjs` `screener-stocks`: a new `modelPlant` puts "Moneyview GPT-4o Limited" into a row's
  name on the real page at every width. The harness fails the case unless the gate catches it.

**Strong evidence.**

**What the gate found once the rewrite was gone (proof it now flags rather than hides).** The first full harness after
the change failed Rule vs AI (`frame-page-rule-vs-ai-india`, `dark-rule-vs-ai-india`). Its prose quotes
`ai.combined.opus.v1` for a strategy the page's payload does not name. The old blanket rewrite had hidden that as
"ai.combined.AI team". Root fix: a strategy id quoted in a sentence reads as the allowlist's name for that id
(approach and role: "AI team · combined"). Only strategy-id shapes (`ai|hybrid|rule|base.<role>….v<n>`) are touched,
never security text. Test added; those cases pass.

## Minor 1: the regenerated examples against the mockup pictures

W11 regenerated the examples (split-adjusted, round 2), so some figures on the app differ from the signed-off
pictures. The app shows the examples; the pictures are the older data. Listed here:
- Screener tiles and chips (all NSE): near the 52-week high **56** (picture 50), near the low **247** (254), volume 3×
  usual **63** (64). The judge saw 54 for near the high; a later resync made it 56.
- KOTAKBANK's 52-week position: **91%** (picture 5%). The 52-week high and low are now split-adjusted.
- Markets "What is coming?": titles read "… results" (picture "… earnings"), and the monthly expiry reads "NSE monthly
  F&O expiry (last Tuesday)" (picture "NIFTY monthly expiry").
- The near-high rows' tie order (round 2, unchanged).

## Minor 2: a computed import slipped past the W12 import test

**Agreed.** The shell's test refuses computed imports anywhere in the app, but W12's own test did not check.
`lib/screener/tests/import-graph.test.ts` now refuses a computed import in the pages' components and loaders. A
planted `import(m)` of the overview wiring, with `m` built from strings, is caught. **Strong evidence.**

## Minor 3: the frame's 390-1680 page list

**Agreed.** `tests/ui/cases/frame.mjs` now runs `screener-stocks`, `screener-us`, `markets-india` and `markets-us`
inside the frame at 390, 768, 1280 and 1680 px, with the frame's checks plus each page's own.

Running them found two things in the checks, both fixed:
- **The frame check expected a picks panel at 1280 px and wider.** These two pages hide it by design (signed off:
  `PF.st.wlOff`). The check now accepts a page-hidden panel only when the app bar offers "Show today's picks"; every
  other page still must show it.
- **The model plant went into the table, which is hidden at 390 and 768 px.** The harness now plants into the first
  visible match (the phone's result card there), so the gate is proven at every width.

## The `home-open` claim: restated

The judge could not reproduce my "12 locked → 0" result.
- Today I packaged the exact reproduction (the unfixed hash handling plus one Home block 2.5 s late, built in a clean
  worktree at 361be46). In 12 loads it did not fail: 0 page errors, 0 locked controls.
- My earlier 12 came from one run I can no longer repeat, so it is not evidence.

**Restated claim: a mechanism fix; the failure is not reproduced on demand, by the judge or by me.**
- The mechanism (reasoning, from React's documented behaviour): a section that hydrates after the frame applied
  client-only state hydrates against state its HTML was not made from, and React does not patch attribute mismatches
  in production.
- The fix makes that impossible by construction: hydrating components read the server's view
  (`useSyncExternalStore` with a server snapshot), then the live state.
- What I can show: the full harness passes repeatedly, and the one real failure (`home-open`, twice before the fix)
  has not recurred.
- **Some evidence**, not strong.

## Checks

- Code size ok.
- Typecheck clean.
- `npm test`: 392 tests, 392 pass.
- Build ok.
- Full UI harness: see the commit's report line.
