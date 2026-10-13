# W9 round 2: answers to judge 24 (builder)

Judge 24 (`exepex/trading` `reviews/judge/judge_24_w9_home.md`) failed W9 on two should-fixes and two minors. I
agree with both should-fixes: each was a real design gap, not just a missing test. Paths are under `web/` unless they
say otherwise. Confidence labels: **strong evidence**, **some evidence**, **reasoning only**.

## (a) Criterion 4: a computed figure could pass by equalling another fixture value

**Agreed; root cause.** The check asked "is this figure *some* fixture value?" A sum that happens to equal any other
value (Rule-based + AI team = −₹8,293.55 = the Baselines total) passed. A set-membership check cannot prove where a
figure came from.

**Fix: every figure names its source field, and the check compares it with exactly that field.**

- `lib/home/sources.ts`: a source name is `<block>:<path>`, e.g. `groups:groups[0].total.net`. `resolveSource` walks
  the path in the block payloads.
- Every money figure on Home carries `data-src`. `MoneyDelta` and the new `Money` (`components/home/section-head.tsx`)
  require it, so the compiler refuses a figure without a source:
  - group cards: `groups[i].total.net`, `groups[i].strategies[j].net`, F&O `fnoBooks:books[k].pnl`, Baselines
    `groups:baselines.total.net`;
  - your card and the glance: `accounts.manual.open_profit`, `accounts.manual.value`;
  - open trades: `positions:own[i].unrealised`; strategy rows `strategy_trades[i].amount` and `.unrealised` (the
    trade's index in the block now travels with each row, `lib/home/trades.ts` `Entry`);
  - picks: `shell:signals[i].record.net_pnl` (`components/frame/pick-row.tsx`).
- `tests/ui/cases/home-checks.mjs` reads the blocks **from the app's own adapters** (`fixtureHomeData`, and
  `fixtureShellData` through `frameData`), so it checks what the app renders, display rule included. For each
  `.home [data-src]`: the field must exist and be a number, and the text must equal it at the shown decimals, with
  its sign, in the market's currency. Any money text in Home **outside** a `data-src` (quoted headlines aside) fails
  as a figure with no source.
- **Permanent plants, injected into the real page on every run** of `home-india` and `home-us`. Each must be caught,
  or the case fails:
  1. the judge's plant: `−₹8,293.55` carrying `groups:groups[0].total.net`;
  2. a money figure with no source;
  3. a cross-currency sum (`₹4,44,907.60`) carrying a real source (`accounts.manual.value`);
  4. a source that does not exist (`groups[9]`).
- **The component plant, run once as evidence.** I changed `who-trades.tsx` so that the Rule-based card showed its
  total plus the AI team's (exactly the judge's −₹8,293.55), rebuilt and ran the harness. `home-india` failed at
  every width with `groups:groups[0].total.net: shows −₹8,293.55, the field holds -9309.36`, and so did
  `frame-page-home-india` and `dark-home-india`. I reverted the change and they pass. **Strong evidence.**
- Why the plants are injected rather than kept as a code change: a component that adds numbers cannot stay in the
  shipped app. The injected plants run the same check on the same page every time (reasoning only on this choice).
- Node test `lib/home/tests/blocks.test.ts`: each figure a trade row uses is the block's own entry at its stated
  index.

## (b) Criterion 5: a blocklist of names was the wrong design

**Agreed; root cause.** The rule took the backend's name and removed the model words it knew. Any model it did not
know passed through ("Fable 5", "o3"), and replacing words inside an id broke it apart ("claude--5",
"claude-AI team-4").

**Fix, in two parts.**

1. **Names come from an allowlist** (`lib/ui/strategy-names.ts`).
   - A strategy of a model-using family (`ai.`, `hybrid.`) is shown as its family's approach plus, when its id's role
     is on the list, that role: `ai.combined.*` → "AI team · combined", `news_results` → "news & results",
     `pattern_mood` → "price pattern & mood".
   - A role not on the list shows the approach only ("AI team", "Hybrid"), never the raw name.
   - Where two would read the same, they get letters A, B by id.
   - One exception, kept on purpose: a backend name exactly equal to the family's own label ("AI team", the team
     trading as one) is kept.
   - **Partial disagreement, with reason.** Rule-based and Baseline names ("Model + news, 60% bar") are not
     allowlisted. They name no model by design, and a new rule would otherwise read as just "Rule-based" until
     someone edits a list. They are kept only if the generic detector finds no model in them; otherwise they show
     their approach. Reasoning only; one line to change if the owner prefers a strict list for every family.
2. **Detection is generic** (`lib/ui/model-names.ts`, new).
   - It knows the model families and the shapes of their ids and versions:
     - `claude-…` id forms, Opus, Sonnet, Haiku, and Fable (capital, as written);
     - GPT and ChatGPT, and o1 to o9 (lower case, as written);
     - Gemini, Gemma, Llama, Mistral and related names, Grok, DeepSeek, Qwen, Phi-N, Command-R, Kimi and GLM;
     - each with any version or variant suffix (`-4o`, ` 5`, `-3.5`, `-R1`, `-mini`, ` Pro`).
   - It matches **whole tokens**, so `claude-sonnet-5` becomes "AI team", never "claude--5".
   - A bare model id such as "gpt-4.1" is text, not an identifier, so it is not skipped.
   - The UI harness gate (`tests/ui/harness.mjs`) uses the same detector on every case of every page, over text,
     `data-tip`, `aria-label` and `title`.

**Tests** (`lib/ui/tests/strategy-names.test.ts`), the judge's exact cases:

| Case | Shown |
|---|---|
| `ai.combined.fable5.v1` "AI combined (Fable 5)" | "AI team · combined" |
| `ai.reasoning.o3.v1` "AI reasoning (o3)" | "AI team" (role not on the list) |
| "picked by claude-sonnet-5 today" | "picked by AI team today" |
| "Reviewed by claude-haiku-4 overnight" | "Reviewed by AI team overnight" |
| a bare "claude-sonnet-5" | "AI team" |
| a hybrid name naming GPT-5, and a clean hybrid name with an unknown role | "Hybrid B", "Hybrid A" |
| a rule name with a model id in brackets | "Rule-based" |

The detector test lists ten model forms, each found as exactly one whole token. It also lists names that must not
match: "Model + news", "a fable about markets", "the Claude app", "O2 margin". The earlier tests still hold: every
fixture after the rule names no model, ids stay keys, and the input is not changed. **Strong evidence** for these
forms. **Some evidence** for the future: a brand-new model family with an ordinary-word name would still need one
entry in the family list. The allowlist means such a name never reaches a strategy label anyway; free text and
headlines are where it could slip through.

**Not changed:** "Claude" alone stays unmatched until the owner decides (open question). The detector's header says
so, and changing it is one entry.

## Minors

- **notes.md row 5 "Hybrid (India)".** Left alone (frozen) and listed in the differences in `response_8`. No change.
- **Empty states without a fixture state.** Home's fixture is W10's examples (`api/examples/blocks.json`). I may not
  edit `api/`, and Home reads it server-side, so the harness cannot swap in an empty block. Not covered by any
  fixture state, and so not compared: "Nothing needs you", "Nothing scheduled", "No news stored yet". Covered: "No
  strategy yet", "Nothing open here", "no approved strategy yet". Proposal for W10's owner: add empty examples
  (`getAttention_india_empty` and similar); the harness then gets a case per state with no app change.

## Checks

- `node tools/check_code_size.mjs`: ok. New files are small: `model-names.ts` 44 lines, `sources.ts` 21.
- `npm run typecheck`: clean.
- `npm test`: 363 tests, 363 pass.
- `npm run build`: ok.
- Full UI harness: 148 cases, 0 failed (every page, with the generic model-name gate and the exact-field money check).
