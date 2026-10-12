# Project instructions: omenix-dashboard

The owner's one private web dashboard for two research tools: **stock prediction** (`contactexepex/agentic-stock-prediction`,
India and US) and **F&O** (`exepex/trading`, **India only**; there is no US F&O). Research and paper trading only:
nothing here places, modifies or cancels real orders, and every money figure is labelled Paper.

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

## How to work with the owner

Same rules as the backends: never hold back; be brutally honest and mark recommendations as strong evidence, some
evidence or reasoning only; plain words and real numbers; find root causes, never patches; check every review with
evidence before accepting or rejecting it; secrets never in files or chat; keep a conversation log in
`conversations/YYYY-MM-DD.md` (IST date) and commit it.

## Design rules (from `design/system/README.md`; it is the reference)

- Use only the design system's tokens and components; no page-local colours.
- Owner's colour rules: verdict NO is red, YES is green (darker when strong); never colour alone (glyph and word too);
  **Paper** on every signal and money figure.
- Every mockup: `design/mockups/<nn-name>/` with `data.json` (example payload, labelled Mock), `template.html`,
  `build.py` (deterministic), `notes.md` (data used and where it comes from), `rationale.md`, and screenshots at
  1280 and 390 px from `node design/system/check_page.js` (no console errors, no external requests, no horizontal
  overflow).
- Mixed screens never merge numbers that belong to separate experiments: each paper account, book and scoreboard is
  shown on its own; currencies are never summed (INR and USD apart); scoreboards of the two backends are never
  combined into one figure.
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
- `cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build` must pass before pushing.
- Secrets only in Vercel's environment variables. Automatic deployments are off (`web/vercel.json`); the owner
  deploys by hand.
