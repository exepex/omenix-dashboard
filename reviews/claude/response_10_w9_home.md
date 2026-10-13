# W9 follow-up: judge 29's minors and the owner's "remove Claude" decision (builder)

Judge 29 (`exepex/trading` `reviews/judge/judge_29_w9_home_rejudge.md`) passed W9 and listed minors. This push
closes them, together with the owner's decision of 13 Oct 2026 to remove "Claude" from every screen (first pushed
in 3243782). Paths are under `web/` unless they say otherwise. Confidence labels: **strong evidence**, **some
evidence**, **reasoning only**.

## Minor 1: the detector missed some shapes and over-matched ordinary words

**Agreed; root cause.** The detector mixed two ideas: family names matched in any case even when they are plain
words ("magnum opus"), while case-sensitive families ("Fable") and separators other than "-" were missed
("fable-5", "FABLE 5.1", "claude_opus_4").

**Fix: match model-like shapes** (`lib/ui/model-names.ts`, rewritten, 55 lines).

- **A family followed by its version, size or variant**, in any case and with any of `-`, `_`, `.` or a space:
  "fable-5", "FABLE 5.1", "claude_opus_4", "GPT-4o-mini", "llama3-70b". Inside dotted ids too:
  `acc:ai.combined.claude_opus_4.v1:x` and `ai.combined.opus.v1`.
- **Families that are also ordinary words** (opus, sonnet, haiku, fable, gemini, gemma, llama, mistral, grok, phi,
  bard, kimi, glm) count only in that shape, or alone in brackets ("AI combined (Opus)"). "a magnum opus of a
  quarter", "Shakespeare's sonnet", "a haiku on rates", "the fable of the ant" and "(magnum opus)" stay.
- **Brands that are no ordinary word** count alone: Claude (owner decision), ChatGPT, GPT, DeepSeek, Qwen,
  Mixtral, Codestral, Ministral, Command-R.
- **The o-series counts in lower case only** ("o3", "o4-mini"; "O2 margin" stays).
- **Keys are not words.** `claude_app` is not matched, because "_app" is not a version, variant or family.
- Tests (`lib/ui/tests/strategy-names.test.ts`) cover both directions:
  - each case above is found as exactly its whole token;
  - each ordinary-word case is not matched, and a headline with "magnum opus" passes the display rule unchanged.

**Limit, reasoning only.** An ordinary word followed by a number ("Opus 1" in a music headline) would be read as a
model. I judged that rarer and cheaper than missing "Fable 5".

## Minor 2: the rule and baseline names policy, proved

`base.llm_only.v1` named "claude_opus_4 only" now shows as "Baseline", both in its field and where a sentence quotes
it ("Beaten by Baseline today"). Nothing in the output names a model. Test: "judge 29, minor 2". **Strong
evidence.**

## Minor 3: a group card's sources come from its own group index

**Root cause.** The card's sources were built in the component, from an index passed in next to the group. Nothing
tied the two together.

**Fix.** `lib/home/groups.ts`:
- `groupCard(block, at, books)` reads the group at `at` and names every source from that same index: `totalSrc`,
  `bookSrc` and each `ran[i].src`. `groupCards(block, books)` builds all of them.
- The component only renders `c.totalSrc` and the others; it no longer builds a source name.

Evidence:
- Node test: in both markets, each card source resolves to exactly the figure the card shows, and the AI team's
  source does not resolve to the Rule-based figure.
- UI check: a new permanent plant on every run puts the real Rule-based total under the AI team's source, in the
  market's own currency. It must be caught.

**Strong evidence.**

## No vendor names either (orchestrator, for the owner)

- The Spend tip now says "the AI provider's console", not "the Anthropic console".
- The detector also counts the AI vendors' names (Anthropic, OpenAI) as brands, so the gate fails on them on every
  page. Tests added.

## A flaky-looking failure, root-caused (some evidence)

One full harness run failed `home-open` once, with React error #418 (hydration text mismatch) and the trade controls
still locked. Repeated runs did not reproduce it: 3 alone and 6 in parallel under load.

- **Cause (reasoning, from the code).** The `#clock=open` hash is read in an effect and applied as an urgent update.
  The clock time, market status and trade lock all derive from it. Home's sections stream in after the frame. If one
  arrives after that update, React hydrates it against the open clock, while its server HTML was rendered closed:
  a text mismatch.
- **Fix** (`components/frame/use-frame-state.ts`). The hash state is applied in `startTransition`, React's
  documented way to let pending sections hydrate before an update reaches them.
- **Evidence.** The full harness passes after the fix. I cannot force the race on demand, so the cause is not proven
  by reproduction. If it recurs, the report will show it.

## Note: Home's events

Not touched. The judge is checking W11's fixture resync (b23daca).

## Checks

- `node tools/check_code_size.mjs`: ok.
- Typecheck clean.
- `npm test`: 367 tests, 367 pass.
- Build ok.
- Full UI harness: see the orchestrator report.
