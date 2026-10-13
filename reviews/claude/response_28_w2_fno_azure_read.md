# Response 28: W2, the Azure read path for F&O (Screener and Markets blocks), builder claims

Story: exepex/trading `docs/stories/X-cross-repository.md` W2, scoped by the orchestrator to the six pages P6 publishes
(`screener_summary`, `screener_stocks`, `fno_screener_summary`, `fno_screener_rows`, `overview_indices`,
`overview_sectors`), with BUILD_MAP rules 1–2 and ChatGPT review 28's runtime states. Nothing deployed. Evidence
levels: **tested** (a test in this commit fails if the claim breaks), **checked** (I ran it once), **reasoning**.

## What was built

| Part | Where | Evidence |
|---|---|---|
| Settings from four server-only variables; none = fixtures, some = an error naming the missing ones, never a fallback | `web/lib/fno/config.ts` | tested (`lib/fno/tests/units.test.ts`) |
| TLS always on, verified against the three pinned Azure roots and the host name (verify-full); no variable can weaken it | `web/lib/fno/db.ts`, `azure-roots.ts` | tested: fingerprints re-computed from the PEM; a real TLS server is refused with Azure's roots and with a certificate for another name (`integration.test.ts`) |
| Driver errors become a class only (network, tls, authentication, permission, missing_table, other), from SQLSTATE and Node codes, never the message | `web/lib/fno/db.ts` | tested on a real server: wrong password, closed port, revoked grant |
| `AzureFnoRowStore` behind the existing `RowStore` interface: the pointer joined to the history table | `web/lib/fno/store.ts` | tested on a real server |
| Publication reader: empty with a reason (`not_published`, `page_missing`), the contract's major-version check, freshness | `web/lib/fno/blocks.ts`, `version.ts` | tested |
| Freshness by NSE's session calendar and P6's run (cron 07:10 IST every day, due 08:30 IST): fresh, publishing, stale with the reason, unknown outside the calendar | `web/lib/fno/freshness.ts`, `calendar.ts` | tested (`freshness.test.ts`; the calendar is held equal to `design/mockups/_platform/nse_sessions.csv`) |
| The route's query step over the stored tables (filters, screens, sorts, ties, pages), the same semantics as the contract's reference `tools/api/screener_route.py` | `web/lib/screener/query-engine.ts` | tested: every India x-query example rebuilt row by row (12 stock, 5 F&O) |
| Database adapters for the Screener and the Markets overview; blocks no backend publishes are empty with `no_producer` | `web/lib/screener/azure-source.ts`, `web/lib/overview/azure-source.ts` | tested on a real server |
| Composition root chosen by environment; the fixture adapters loaded lazily, only with no database setting | `web/lib/fno/wiring.ts`, `lib/screener/wiring.ts`, `lib/overview/wiring.ts`, `lib/data/lazy.ts` | tested (`no-examples.test.ts`, `import-graph.test.ts`) |
| Runtime states on the page: empty with reason and check time, the incompatibility screen, an error without the error's text; a freshness line under the heading (India only) | `web/lib/ui/block-outcome.ts`, `components/blocks/block-section.tsx`, `components/blocks/freshness-note.tsx`, `components/ui/states.tsx` | tested (outcome text); the line's markup checked by typecheck and build only, not yet in a harness case (see gaps) |
| The owner's steps (variable names only) | `docs/W2_OWNER_STEPS.md` | n/a |

## The three acceptance criteria

1. **During a publication the previous complete one shows with "publishing"; after a failed run, the previous one with
   "stale" and the reason.** Tested on a disposable PostgreSQL 16 with TLS (`web/lib/fno/tests/integration.test.ts`,
   test 1): publication 9 Oct complete, 12 Oct half-written with the pointer unmoved; at 07:40 IST the reader serves
   9 Oct, "publishing"; at 09:15 IST "stale" with "The NSE close of 2026-10-12 should have arrived by 08:30 IST and has
   not; this shows 2026-10-09, the last complete update."; once the run completes and the pointer moves, 12 Oct,
   "fresh". **Partly met, said plainly:** the reason names what is missing and when it was due, not why the run
   failed. There is no `fno.run_status` table, so neither "a run is in progress" nor a failure's cause can be read;
   "publishing" is the run's time window. When P6 publishes its run state, freshness should read it instead (one
   change in `freshness.ts`).
2. **A payload of an unexpected major version shows the incompatibility screen.** Tested (integration test 2 and the
   unit tests): a `3.0.0` row raises `BlockIncompatible`; the part shows "data in a newer format … the data is version
   3.0.0; this app reads version 2.x" in its own alert, and the rest of the page works. The app's major is held equal
   to `api/openapi.yaml`'s (2.4.0) by a test.
3. **Database errors never leak driver text or credentials to the browser.** Tested on the real server (test 3): for a
   wrong password, a closed port and a revoked grant, the error, its JSON, the part's title, detail and log line hold
   none of: the role name, host, port, password, "password authentication", "permission denied"; the driver's error is
   not kept as `cause`. Every block failure passes through `outcomeOf`, which never reads `error.message`; the server
   log gets the class only (`block failed: The results: FnoUnavailable (network)`) so the owner can diagnose.

## Each test can fail (checked)

I broke the code three ways and ran the integration test: rethrowing the raw driver error fails tests 5 and 6;
`rejectUnauthorized: false` fails the TLS test; dropping the `as_of::text` cast fails test 1 (the run is in
`TZ=Asia/Kolkata`, where the driver reads a date as local midnight, a day early). The examples guard has a control: with
no database setting the same calls do load the examples, so the "never loaded" assertion is not vacuous.

## Findings and risks (please weigh these)

- **My own bug, fixed before push:** the first calendar table I wrote missed nine 2026 exceptions (14 Apr, 1 May,
  28 May, 26 Jun, 14 Sep, 2 Oct, 20 Oct, the 8 Nov muhurat session, 10 Nov). It would have marked good data stale on
  those days. The table is now generated from the repository's NSE session file and a test keeps them equal.
- **The calendar ends on 31 Dec 2026.** From 1 Jan 2027 the freshness line says "how current it is cannot be told"
  until 2027's rows are added to `nse_sessions.csv` and the table. Never guessed, but it will happen in 11 weeks.
- **In database mode most of the Markets page is empty.** Only indices and sectors are published by P6; session,
  flows, the world, events, and the whole US screener and markets show "No backend publishes this part yet". The stock
  tool's columns and its two screens (picks, results) are empty too; the stock table itself still shows. This follows
  review 28 (Example is not a runtime state) but it is a visible step back from today's example-filled pages.
- **Where to set the variables:** the dashboard project still deploys from the stock repository's frozen copy; the
  gateway project deploys from here but is public. Setting the variables on the gateway would publish F&O data on its
  public pages. Recommendation (reasoning only): wait for the cutover. Written in the owner's steps.
- **Not read from the real Azure server.** The container cannot reach port 5432. The real certificate chain, the host
  name and Vercel's reach through Azure's firewall are unverified; the owner's steps say what to check.
- **Two parts of one page can come from two publications** if the pointer moves between their reads (a few
  milliseconds once a day). Both are complete publications, so no part is ever half-written; I did not add a
  per-request pin (reasoning: the cost is a shared request context through every loader, for a window this small).
- **One value differs between two signed-off files:** HALEOSLABS's 1-year change is empty in
  `api/examples/blocks-33-34.json` (`getScreenerStocksIndia_india_filters`) and 35.18 in
  `design/mockups/33-screener/data.json`. Neither is mine to edit; the query test excludes that one field and names it.
- **The examples guard is a runtime and import-graph check, not a scan of the built bundle.** The fixtures' chunk still
  exists in `.next` (the app runs on it without a database); with a database it is never loaded (tested).
- **The freshness line and the empty and incompatible states are not in a UI harness case.** The harness runs on the
  fixtures, where the line is absent; their words are tested in `lib/ui/block-outcome.ts`'s and `freshness.ts`'s tests,
  their markup only by typecheck and build.
- The Screener and Markets render per request (no prerendered HTML in the build output, checked), so data and
  freshness are read live, not frozen at build.

## Checks run

`node tools/check_code_size.mjs`, `npm ci --ignore-scripts`, `npm run typecheck`, `npm test` (all web tests, including
the new 24 in `lib/fno/tests` and `lib/screener/tests/query-engine.test.ts`), `npm run build`, and the full UI harness
in fixture mode; results in the commit message.
