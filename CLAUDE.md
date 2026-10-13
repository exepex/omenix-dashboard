# Project instructions: omenix-dashboard

The owner's one private web dashboard for two research tools: **stock prediction** (`contactexepex/agentic-stock-prediction`,
India and US) and **F&O** (`exepex/trading`, **India only**; there is no US F&O). Research and paper trading only:
nothing here places, modifies or cancels real orders, and every money figure is labelled Paper; buttons say Buy and
Sell only (owner, 13 Oct 2026).

## The three repositories (owner decision, 12 Oct 2026)

| Repository | Role |
|---|---|
| `exepex/omenix-dashboard` (this one) | the **only** dashboard: app (`web/`), design system and **all mockups** (`design/`), the dashboard's API contract (`api/`), shared platform scripts (`platform/`, later) |
| `contactexepex/agentic-stock-prediction` | stock backend: publishes stock read models; no dashboard or mockup work there any more |
| `exepex/trading` | F&O backend: publishes F&O read models; plan and design in `docs/` |

- **One dashboard, one version.** All screen, mockup and design-system changes happen here only. The stock
  repository's `web/` and `design/` are frozen until the cutover (owner decision (a), 12 Oct 2026) and are removed
  after it (`exepex/trading` `docs/MIGRATION_PLAN.md`).
- Backends only publish data; this repository only reads it. Never write to a backend repository or its data.
- Until the cutover, production still deploys from the stock repository's `web/` (frozen, so the two stay identical).

## How to work with the owner (always; same rules as `exepex/trading`)

This is the owner's personal research platform; wrong screens or numbers cost real money later, so:

- **Never hold back.** Share every relevant fact, risk, idea and doubt, including what the owner may not want to hear.
- **Be brutally honest.** Disagree openly and say why. Never agree just to please. Never present a guess as a fact:
  mark each recommendation as strong evidence, some evidence, or reasoning only.
- **Keep it simple, precise and concise.** Plain words, real numbers, short answers; explain any jargon you must use.
- **Get past blockers.** Find another legitimate way (another source, a test, a workaround, a clear question to the
  owner). If it truly cannot be done, say so plainly and why. Never skip it silently or hide it.
- **No patches.** Find the root cause, validate it with data and tests, then fix the design.
- **No blind acceptance or rejection of reviews.** Check every review comment and piece of feedback (owner, Claude,
  ChatGPT, the judge) with your own reasoning and evidence. Every acceptance and rejection states its reason and
  evidence; partial agreement is fine.
- **Everything for the other AI goes in the repository:** ChatGPT writes `reviews/chatgpt/review_<n>_<name>.md`,
  Claude `reviews/claude/response_<n>_<name>.md`, each folder with a README index.
- **Own limits too.** If a limit shapes an answer, say so openly and give everything that can be given.
- **Every built story is judged** by the independent judge (`docs/JUDGE.md`); done only on PASS.
- Hard lines: no real orders, nothing illegal, secrets never in files or chat.
- Keep a conversation log in `conversations/YYYY-MM-DD.md` (IST date): quote the owner's messages as written,
  condense replies, keep "Decisions so far" and "Open questions"; commit and push. Never include e-mail addresses,
  API keys or tokens.
- AI agents other than Claude read `AGENTS.md` (same rules, plus the roles).

## Branch

Work on `main`; `git pull --no-rebase origin main` before every push (several sessions push here in parallel).

## Design rules (from `design/system/README.md`; it is the reference)

- Use only the design system's tokens and components; no page-local colours.
- Owner's colour rules: verdict NO is red, YES is green (darker when strong); never colour alone (glyph and word too);
  **Paper** on every signal and money figure, but **buttons say Buy and Sell only** (owner, 13 Oct 2026: the app says once,
  in the brand and in the order window, that no real order is placed).
- Every mockup: `design/mockups/<nn-name>/` with `data.json` (example payload, labelled Mock), `template.html`,
  `build.py` (deterministic), `notes.md` (data used and where it comes from), `rationale.md`, and screenshots at
  1280 and 390 px from `node design/system/check_page.js` (no console errors, no external requests, no horizontal
  overflow).
- Mixed screens never merge numbers that belong to separate experiments: each paper account, book and scoreboard is
  shown on its own; currencies are never summed (INR and USD apart); scoreboards of the two backends are never
  combined into one figure. One exception (owner, 13 Oct 2026): Home shows each group's (Rule-based, Hybrid, AI team,
  Baselines) total stock profit or loss, the sum of that group's own strategies' paper results, labelled as a total;
  groups are never added together, and the F&O book stays its own line.
- F&O appears only in the India market; in the US market every F&O element is absent (not empty, absent).

## Code

- **Engineering standards (owner, mandatory for every agent and every session):** SOLID, DRY, KISS and clean code
  (clear names, small single-purpose functions, components and classes, no duplication, no dead code, comments only for
  the "why"). **No file and no class over 350 lines** (TypeScript, JavaScript, Python; generated files such as
  `registry.generated.ts` excepted). Anything that would pass 350 lines is broken down, never squeezed. Files inherited
  over the limit are broken down when their screen is rebuilt; new or rewritten files must meet it.
- **Design for change (owner, 12 Oct 2026):** flexible, modular, scalable, production quality; high cohesion and loose
  coupling through design patterns. Every data source (each backend's read models, the database driver, Slack, the
  assistant's model) sits behind an interface, so swapping it is one new adapter, not edits across screens; screens
  depend on typed read-model contracts, never on SQL or a vendor SDK. Choose the simplest pattern that keeps parts
  swappable (KISS).
- Before every push: `node tools/check_code_size.mjs` (the 350-line limit; inherited files over it are listed in
  `tools/code_size_allowlist.txt` with their current size, which may only shrink) and
  `cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build` must pass.
- Secrets only in Vercel's environment variables. Automatic deployments are off (`web/vercel.json`); the owner
  deploys by hand.
