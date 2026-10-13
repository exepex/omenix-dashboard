# Response 29: W9-F&O, Home and the frame read the F&O tool's blocks (builder claims)

Owner request through the orchestrator (13 Oct 2026; exepex/trading `docs/DESK_DECISIONS.md`, "Home shows real F&O
data now"): Home and the frame read the **F&O-owned blocks** from Azure through W2's adapter:
- the India market band (indices, session);
- the F&O book lines in "Who trades";
- the F&O picks;
- the NIFTY expiry events in "Coming up".

Stock blocks stay on the labelled examples, the two are never mixed in one figure, the US shows no F&O element, and
empty or stale parts carry their reason.

**P10 is not published yet.** I built against W10's schemas, with test pages shaped like W10's examples. With no
database setting, nothing changes on screen. With one, each F&O part shows P10's page, or the reason it has none.
Nothing deployed.

Evidence levels: **tested** means a test in this commit fails if the claim breaks; **checked** means I ran it once;
**reasoning** means neither.

## The pages Home and the frame read (for the P10 builder)

Every page is in `fno.pages_history`, product `fno`, market `india`, behind the same pointer as P6's
(`fno.current_publication`). Schema version 2.x (major 2, checked as in W2). Page keys are W10's own:

| page_key | Payload (W10 schema) | Read by |
|---|---|---|
| `session` | `Session` (session_date, open_utc, close_utc, next_open_utc, regime, post_close_at, exchange, zone) | the frame's market status and lock; Home's market line, "today" in Open trades and Coming up |
| `indices` | `Indices` (NIFTY 50 and India VIX as `IndexLevel`) | Home's market band and the top bar's index strip |
| `today` | `FnoPicks` (fno_state, rows, baskets) | the picks panel's F&O note, and F&O rows once a book is approved |
| `risk` | `FnoBooks` (Books 1, 2 and 3) | the F&O line of Rule-based, Hybrid and AI team in "Who trades" |
| `events` | `Events`, **F&O expiry rows only** (kind `fno_expiry`) | "Coming up", beside the stock tool's events |

## What was built

| Part | Where | Evidence |
|---|---|---|
| The five page keys added to the F&O reader | `web/lib/fno/blocks.ts` | tested on a real TLS PostgreSQL (`lib/fno/tests/integration.test.ts`, the two W9-F&O tests) |
| Home's adapter: India's session, the books and expiry dates from the F&O publication; every stock block (groups, trades, accounts, positions, attention, stock events, news, tracked moves, the US session) is the stock adapter's own method | `web/lib/home/azure-source.ts`, `wiring.ts` | tested (`lib/home/tests/fno-home.test.ts`): stock methods are the same functions, and the US never reads the F&O publication |
| The frame's F&O parts over the examples: India's index levels (`live`), session times, F&O note and rows; the clock becomes the read time, so the lock follows the real session; the US slice untouched | `web/lib/shell/fno-overlay.ts`, `azure-source.ts`, `wiring.ts` | tested (`lib/shell/tests/fno-overlay.test.ts`) |
| "Coming up" from two publishers: the F&O expiry rows replace the stock list's own expiry rows (never shown twice, and no example expiry), the rest merge by date, each row keeps its source | `web/lib/home/events.ts` | tested, including an empty F&O list still hiding the example expiry |
| A missing F&O block never blanks the stock parts beside it: each F&O read is settled on its own, and the part shows its reason in place ("Session: …", "Index levels: …", "F&O picks: …", "F&O expiry dates: …", "F&O: total profit / loss · No data") | `web/lib/ui/block-outcome.ts` (`settle`), Home's loaders, `components/home/*`, `components/frame/fno-picks.tsx` | tested for the frame (unit and real PostgreSQL); Home's markup checked by typecheck and build only |
| Labels: when the F&O parts are real and the stock parts are examples, each stock figure says "Example". This covers the group totals, the tracked companies, the stock picks and the stock events. The Home footer says "stock figures: Example data; F&O figures: the F&O tool's publication", and the quick view of a live index has no "Example data" tag | `components/frame/parts.tsx` (`StockExampleTag`, `ExampleTag`), Home components | reasoning and build; not in a harness case (see gaps) |
| Market status without a published session: NSE's calendar at regular hours (09:15–15:30 IST), said in the chip's tooltip and on Home | `web/lib/fno/session-fallback.ts` | tested (session day, Saturday, Dussehra, after IST midnight) |
| Freshness line on Home (India), the same as W2's | `app/(cockpit)/[market]/_home/home-page.tsx` | build |
| Home's loaders use W2's `blockSection`: empty with reason, the incompatibility screen, errors without their text | `app/(cockpit)/[market]/_home/blocks.tsx` | tested in W2 (`outcomeOf`) |

The rules, one by one:
- **Never mixed in one figure:** the F&O book is its own line, the group total is the stock block's own (unchanged code
  path, `lib/home/groups.ts`), and nothing is added.
- **The US:** no F&O read is made there (tested). `frameData` strips the F&O fields there (tested).
- **No example value for an F&O part when a database is set:** a missing index page removes the index tiles rather than
  showing the example levels. A missing picks page removes the example F&O note (both tested).

## Checks

- `node tools/check_code_size.mjs`: passed.
- `npm run typecheck`: passed.
- `npm test`: 427 passed, 0 failed (10 new unit tests here plus 2 new integration tests).
- `npm run build`: passed.
- The UI harness in fixture mode: 183 cases, 0 failed (on the build before the merge that brought the regenerated 33/34 examples, 1e6e576).

## Findings and risks (please weigh these)

- **A contract mismatch to settle (not mine to edit).** `api/` lists `publisher: stock` for India's `session` and
  `indices` (W10 examples and `x-catalog`). The owner's decision now has P10 publish them. Someone who owns `api/` should
  move those two India blocks to publisher `fno`, or split India and US paths as W11 did.
- **Index source label.** `IndexLevel.source` is `close`, whose label in the frame reads "the stock tool's daily close".
  The contract has no NSE-close source. I added a note to each live index ("Published by the F&O tool (NSE's index
  close).") rather than change the contract. A proper fix is a source value in W10 (reasoning only).
- **F&O idea rows have no Buy.** The signed-off frame (30-shell) shows example F&O rows with "Buy basket", but the
  basket order window was never built in the app. Real rows, once a book is approved, show read-only with "Paper". Today
  P10 can only publish "no approved strategy": experiment 1 passed nothing (exepex/trading decision, 13 Oct).
- **Session times without P10:** regular hours on every session day. A muhurat or special session would show the wrong
  hours until P10 publishes its session block (the tooltip says the times are the calendar's).
- **Freshness of P10's parts uses the publication's freshness** (W2's run-window rule, 07:10–08:30 IST). If P10's picks
  and books come from the 3 pm run in a separate publication, that rule is wrong for them. Now that P7 publishes
  `fno.run_status`, freshness should read it (follow-up, both W2 and W9-F&O).
- **The live-mode labels are not in a UI harness case.** The harness runs on the fixtures, and the app cannot reach a
  local database because the Azure root certificates are pinned. The labels' logic is two small components; their
  markup is checked by typecheck and build only.

## Story text for exepex/trading `docs/stories/X-cross-repository.md`

I have no write access there, and the rules forbid writing to a backend repository. Text for the orchestrator to add:

> **W9-F&O (dashboard): Home and the frame read the F&O tool's blocks.** Depends on W2 (adapter) and P10 (pages). Home
> and the frame read India's `session`, `indices`, `today` (F&O picks), `risk` (F&O books) and `events` (F&O expiry
> rows only) pages from the F&O product's current publication, through W2's publication-aware adapter; stock blocks
> stay the labelled examples until the stock tool publishes. Acceptance:
> 1. Each F&O part shows P10's page, or its reason when the page is missing (never an example value).
> 2. Stock and F&O figures are never combined; the F&O book is its own line; each stock figure next to real F&O figures
>    is labelled Example.
> 3. The US shows no F&O element.
> 4. Without a published session, market hours come from NSE's calendar at regular hours, said as such.
>
> Built 13 Oct 2026 in exepex/omenix-dashboard (claims: `reviews/claude/response_29_w9-fno.md`); judged once P10
> publishes.

## Addendum: contract 2.5, India's market blocks published by exepex/trading (owner, 14 Oct 2026)

Owner decision, relayed by the orchestrator: India's NSE market blocks are published by the F&O backend
(`x-publisher: fno`); the US equivalents stay with the stock tool. This covers the market band, the `fno_expiry`
events, and FII/DII flows. I made the contract change in `api/`; the reasoning for each choice is below. I then moved
the app's reads onto it. Nothing deployed.

### The blocks exepex/trading publishes (exact names, for the trading-side builder)

All are in `fno.pages_history`, product `fno`, market `india`, behind `fno.current_publication`. The envelope is
`FnoBlockMeta`, the schema version 2.5.x, and every payload is validated against the response schema named.

| operationId | Path (URL unchanged) | page_key | Response schema | Payload fields |
|---|---|---|---|---|
| `getSessionIndia` (new; was `getSession`) | `GET /api/v1/markets/india/session` | `session` | `SessionIndiaResponse` | `Session`: `exchange`, `zone` (IST), `session_date`, `open_utc`, `close_utc` (both null on a non-trading day), `next_open_utc`, `regime` (nullable: null until the F&O tool records one), `post_close_at` (nullable), optional `major_event_names[]` |
| `getIndicesIndia` (new; was `getIndices`) | `GET /api/v1/markets/india/indices` | `indices` | `IndicesIndiaResponse` | `Indices`: `indices[]` exactly 2 (NIFTY 50 `role: benchmark`, INDIA VIX `role: vol_index`), each `id`, `sym`, `name`, `role`, `last`, `chg_pct`, `chg_5d_pct`, `as_of`, `source` |
| `getFnoEvents` (new) | `GET /api/v1/markets/india/fno/events` | `fno_events` | `FnoEventsResponse` | `Events`: `events[]`, each `date`, `title`, `kind` (only `fno_expiry` or `weekly_expiry`), `major`, `inst` (always null). The stored page is the whole expiry calendar; the route applies `kinds`, `from` and `limit` |
| `getFlows` (publisher moved) | `GET /api/v1/markets/india/overview/flows` | `flows` | `FlowsResponse` | `Flows`: `currency` (INR), `totals.{d1,w1,m1,m3,y1}` (`days_in_period`, `days`, `complete`, `fii`, `dii`: both null unless `complete`), `days[]` (`date`, `fii` and `dii` each `buy`, `sell`, `net`, `provisional`), `nsdl[]` (`date`, `net`) |
| `getFnoBooks` (page key now P10's) | `GET /api/v1/markets/india/fno/books` | `fno_books` | `FnoBooksResponse` | unchanged |
| `getFnoPicks` (page key now P10's) | `GET /api/v1/markets/india/fno/picks` | `fno_picks` | `FnoPicksResponse` | unchanged |

The US keeps `getSessionUs` and `getIndicesUs` (stock, `SessionResponse` and `IndicesResponse`, now US-only) and
`getEvents` (stock). In India, `getEvents` (stock) must carry no `fno_expiry` or `weekly_expiry` row; the schema
rejects one (`IndiaStockEventsRule`).

### Contract changes and why (no signed-off field shape changed)

- **Split by market, like W11's blocks:** session and indices now have an India path and a US path, sharing one schema.
  The URLs are unchanged.
  - Each path carries its own `x-catalog`. I moved the stock-only field sources (`rm.status payload.regime`,
    `LevelBlock.close`, …) from the shared schemas into the US path's catalog, so India's fields no longer claim a stock
    source. A shared schema cannot carry two sources for one field.
- **Expiries as their own India block (`getFnoEvents`).** Expiries came from a calendar both screens query, so moving
  them meant one calendar per publisher.
  - Each screen merges the two calendars and applies its own query again. The query keeps market-wide rows first, then
    takes the nearest rows up to a limit, so merging two lists that were each cut the same way gives exactly what the
    single calendar gave. Reasoning, then tested: `check_home_events` and `lib/home/tests/fno-home.test.ts` show the
    merged Home list equals the signed-off 31 "Coming up", and the merged Markets list equals the view of the joined
    calendars.
  - Weekly expiries (`weekly_expiry`) moved with the monthly one. Reasoning only: both are NSE F&O expiries, and the
    owner's "fno_expiry events" most likely means expiries in general. Tell me if weekly expiries should stay with the
    stock tool.
- **`getFlows` moved to `fno`.** Its story is P8 (status planned), and the period-total source no longer names the
  stock tool.
- **Books and picks page keys aligned with what P10 publishes** (`fno_books`, `fno_picks`, from exepex/trading
  `fno/market_read_models/home_blocks.py`). W10's examples said `risk` and `today`, P1's old page names, and my W9-F&O
  code read those. One source of truth now: the contract's `x-read-model` names P10's keys, and the app reads the same
  keys.
- **Version and checks:**
  - `info.version` is 2.5.0 with a change note.
  - `stories.yaml` gains P8, P10 and `TR-MARKET-proposed`, the story the trading side needs for session, indices and
    expiries.
  - Four new planted breaks, all caught: India's session in the stock envelope; the US indices served for India; an
    expiry in India's stock calendar; a company row in the expiry calendar. That makes 64 planted breaks.
  - `check_mapping`, `check_contract` and `render_catalog --check` are green, and the examples were regenerated.

### The app on 2.5

- **Fixtures** read the new example names (`getSessionIndia_india`, `getSessionUs_us`, `getFnoEvents_india`,
  `getFnoEvents_india_markets`). They stay the source for the US and every stock part. US F&O stays absent, because no
  F&O read is made in the US (tested).
- **With the database set, from exepex/trading's publication:**
  - Home: India's session, the F&O books, the expiries.
  - Frame: India's indices, session and F&O picks.
  - Markets: India's session, flows and expiries, beside W2's indices and sectors.
- **"Coming up" (Home) and "What is coming?" (Markets)** merge the two calendars with the contract's query. That is
  ported to TypeScript as `eventsView` in `lib/home/events.ts`; a test holds it equal, row for row, to every `x-query`
  example. Each publisher's part shows its own reason when it has no data.
- **Checks:**
  - `npm test`: 429 passed, 0 failed, including the parity test and real-Postgres reads of `flows`, `session`,
    `fno_events`, `fno_books` and `fno_picks`.
  - Typecheck, build and code size: passed.
  - UI harness: the result is in the commit message.

### Still open

- Until the trading side publishes `session`, `indices`, `fno_events` and `flows`, each of those parts shows "The
  current publication has no page for this part" when the database is set. Tested with today's P6-only publication.
- Markets in database mode still shows no stock example parts (W2's rule); Home shows labelled stock examples (W9-F&O's
  rule). The orchestrator set both rules; I kept each as given. Say if they should match.
- `api/catalog/README.md` still says "37 small read endpoints"; there are 46. That count was already stale before this
  change.
