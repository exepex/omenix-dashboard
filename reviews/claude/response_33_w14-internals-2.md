# Response 33 · W14 internals 2: judge 70's findings (strategy internals still on live screens)

Branch `story/w14-internals-2`, not merged; for the judge first (owner rule: nothing reaches main without a PASS).

Judge 70 found these on live screens:
- **Trade story:** "(its bar: 55%)" and "below its bar".
- **Stock strategies tooltips:** "the strategy's bar (55%)" and "regime rule".
- **Track record:** the threshold of each row.

All are fixed at the root, and two scans now guard the rule: one on every /api/v1 answer and one on every screen.
Evidence: unit tests (461 pass), UI harness cases, and mutation checks. Every claim below has strong evidence unless it
is marked otherwise.

## 1. Root cause

Round 2's allow-list covered only the Strategy lab's `strategies` map. Other endpoints still served settings on other
objects:
- **Predictions:** `threshold`, `model_prob`, `agent_adjustment` and `adjustment_reason`.
- **Track record:** a `threshold` on each back-test row.
- **Forecast history:** how each run was made: score points, drivers, base rate, range inputs, calibration and spread.

The pages also wrote the setting into their own sentences ("its bar: 55%").

## 2. Fix: one public view at every boundary

The public view is `web/lib/ui/public-view.ts`, three steps in order:

```
publicView = withPublicWords(applyDisplayNames(withoutInternals(payload)))
```

1. **`withoutInternals`** (`web/lib/strategy-pages/public-strategies.ts`):
   - A registry entry keeps only its public fields, as before.
   - These setting keys are dropped from any object anywhere in the answer: `threshold`, `bar`, `parameters`,
     `differs_in`, `compared_to`, `model_prob`, `agent_adjustment` and `adjustment_reason`.
   - From a forecast run, the fields that say how it was made are dropped, and they are also removed from the run's
     `changed` list.
   - The back-test sweep's rows are told apart by a neutral variant letter (A for the lowest threshold) instead of the
     threshold itself.
2. **`applyDisplayNames`:** the neutral names from round 3.
3. **`withPublicWords`** (new, `web/lib/ui/public-words.ts`):
   - In the backend's free-text sentences, "regime" becomes "market mood" and "bars" becomes "daily prices".
   - A sentence that still names a bar, a threshold or a number tied to a rule is replaced whole by
     "(withheld: this text said how a strategy decides)".
   - Codes (strings without a space, such as `strategy_regime`) are left as they are.

The public view is applied in five places:
- the MCP and Slack read tools (new, section 7);
- the API's read routes (`lib/data/handler.ts` respond, now for every page spec: the stock page, lifecycle, stock
  strategies, track record and the rest);
- the page read client;
- the fixture adapters;
- the example reader.

## 3. Texts removed or reworded

| Where | Before | Now |
|---|---|---|
| Trade story | Chance of a rise 62% (its bar: 55%) | Chance of a rise 62% |
| Lifecycle help | below the strategy's bar | an up call the strategy does not buy |
| Stock strategies | at or above the strategy's own bar; regime rule | the strategy would buy; no rule text |
| Legend | an up call at or above the strategy's bar | an up call the strategy buys |
| Track record | threshold column | Variant column (A, B, …) |
| Forecast history | "How it was calculated" fold; "new calibration"; "range inputs changed" | removed; only what changed in the forecast; "market mood calm → trending" |
| Strategy lab, Rule vs AI | By market regime; Family × regime | By market mood; Family × market mood |
| Help glossary | "Rule strategies either sit out the last two or not; AI traders lower their chances in them." | removed (it said how they decide) |
| Market-mood tip | "Some strategies sit out the busy and jumpy days." | the four moods only |
| Picks panel, portfolios | no candidate clears the bar; no rule strategy cleared its bar | no strategy picks it today; no rule strategy bought today |
| Go-live, luck chart, candles | go-live bar, luck bar, thin or thick bar, Bars stored, Why bars | go-live test, luck line, thin or thick line, Daily prices stored, Why it moved |

The graphical uses of "bar" were renamed as well. That keeps the scan strict: any "bar" left on a screen fails it, so no
allow-list of harmless uses is needed.

## 4. The scans

One word list, `web/lib/ui/internal-words.ts`, flags:
- bar(s), threshold(s) and regime(s);
- a number tied to a rule, such as "chance at least 55%", "60% or more chance", "buys at 55%" or "score clears 0.6".

Codes such as `rm.bars` or `design/catalogue/bar.json` are ignored. The list is not applied to the data cut-off
("cut-off" means the time, not a strategy setting).

- **API scan** (`web/lib/strategy-pages/tests/public-view.test.ts`):
  - Every mockup payload (17 of them), passed through the public view, carries no setting key, no how-made field and no
    sentence with a listed word.
  - The stock page, lifecycle, stock strategies and track record endpoints are each served from a stored row that has
    been planted with settings, a model chance and adjustment, a "regime" reason and a sentence that states a bar.
    None of these leaks, the backend names do not leak, and "0.55" does not leak.
  - A non-blind check confirms the raw data really carries what the test guards against, including the real stored
    HDFCBANK forecast history.
  - The forbidden keys are written in the test itself, not read from the code's own lists.
- **Screen scan** (`web/tests/ui/cases/w14-internals.mjs`, 24 cases):
  - It reads every text node (closed folds included) and every data-tip, title, aria-label, placeholder and alt.
  - Pages covered: Home (India and US), Markets, Screener (stocks and F&O), the stock page, the dense forecast history,
    stock strategies, lifecycle, the LT trade story, the Strategy lab (India, US and stored, with every strategy clicked),
    portfolios, Rule vs AI (fixture and stored), Track record (fixture and stored), Watchlist, News, Companies, Assistant
    and Help (India and US).
  - Result: 24 of 24 pass.

## 5. Mutation checks: each mutation was applied alone and then reverted

| Mutation | Result |
|---|---|
| `threshold` kept | 5 tests fail |
| No public words step | 4 tests fail |
| No withholding | 5 tests fail |
| `changed` list kept whole | 2 tests fail |
| Range inputs kept | 1 test fails |
| Score groups kept | 1 test fails |
| Scan blind to "regime" | 2 tests fail |
| Scan blind to "bar" | 5 tests fail |
| Screen: legend text restored | strategies-reliance fails |
| Screen: "Market mood (regime)" restored | help-india and help-us fail |

## 6. Checks

- `node tools/check_code_size.mjs`: passes.
- `npm ci --ignore-scripts`, typecheck, `npm test` (461 pass) and build: all pass.
- Full UI harness: see the commit message.

## 7. For the owner: what this costs, and what is still open

- **Lost feature:** the forecast history no longer opens "How it was calculated" (score points, base rate, range
  inputs). You asked for it on 10 Oct, but it shows how the signal model and the range model decide, so the rule of
  13 Oct removes it. If you want it back for the reference model only, that is your call; tell me.
- **AI reasons:** they are free text from the stock tool. "Regime is event-heavy, so the probability stays modest" now
  reads "Market mood is event-heavy, …". It still says how an AI trader weighed the day. Whether reasons should be shown
  at all is your call (reasoning only: they are what the AI trader decided, which the rule allows).
- **Back-end note:** the stock tool's free text may name a bar in the future. If it does, the sentence is withheld whole,
  so the reader sees "(withheld …)" rather than a leak. A clean fix belongs in the stock tool, which this repository
  never writes.
- **MCP and Slack (found while doing this):** the read tools (`web/lib/tools/reads.ts`) served raw read-model payloads,
  internals included, through the public gateway. They now go through the same public view. Evidence: a new test,
  `lib/tools/tests/reads-public.test.ts`; with the view removed, it fails (mutation-checked).
- **Not covered yet:**
  - The mockups in `design/mockups` still use the backend names and words.
  - The MCP tool `record_paper_trade` describes a "stored bar's open or close". That means a price bar, not a setting,
    but its text is generated from the contract and was left for the contract's owner.
