# W2: moving the omenix-dashboard Vercel project to this repository, with real F&O data (owner checklist)

Owner decision (13 Oct 2026, through the orchestrator): no separate preview project. The existing Vercel project
**omenix-dashboard** (behind Vercel Authentication, unused today) switches its Git source from the stock repository's
`web/` to **exepex/omenix-dashboard**, root `web/`. Releases go there. Claude deploys nothing; each step is yours.
Variable names only: values never go in a file or a chat.

## 1. Git connection and root directory

In Vercel, project **omenix-dashboard**, Settings:

- [ ] **Git → Connected Git Repository:** Disconnect `contactexepex/agentic-stock-prediction`, then Connect
      `exepex/omenix-dashboard`. The Vercel GitHub app needs access to that repository; GitHub asks if it doesn't.
- [ ] **Git → Production Branch:** `main`.
- [ ] **Build and Deployment → Root Directory:** `web`. Leave "Include files outside the root directory" at its
      default; the build reads nothing outside `web/`.
- [ ] **Deployment Protection → Vercel Authentication:** stays on (Standard Protection or stricter). This is what keeps
      the dashboard private.

## 2. Build settings

Settings → Build and Deployment:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Install Command | default (`npm install`), or `npm ci` to match CI |
| Build Command | default (`npm run build`, which runs `next build`) |
| Output Directory | default (Next.js) |
| Node.js Version | 22.x (`web/package.json` asks for 22.18 or newer) |

## 3. Environment variables (Settings → Environment Variables, Production)

**Keep everything the project has today.** This repository's `web/` reads the same names as the stock repository's
frozen `web/`, plus three optional new ones. I compared the names read by both code trees on 13 Oct 2026; the stock
code's list is a subset of ours. The names the dashboard needs, from `contactexepex/agentic-stock-prediction`
`docs/ws/b5.md` (the app project):

| Name | Needed for | If missing |
|---|---|---|
| `MOTHERDUCK_READ_TOKEN` | every stock page that reads `/api/v1` (companies, stock pages, strategies, paper portfolios, rule vs AI, track record, watchlist, news, strategy lab, help) and the read tools | those pages show their error state |
| `MOTHERDUCK_INBOX_TOKEN` | dashboard writes (inbox, command log) and the assistant's conversation store | writes and the chat history fail |
| `GITHUB_DISPATCH_TOKEN` | dispatches `onboard.yml` in the stock repository after a dashboard write | the dispatch fails (reported as such) |
| `SLACK_BOT_TOKEN` | owner reports for refused writes | no Slack report |
| `REVALIDATE_SECRET` | `/api/v1/internal/revalidate` | every call is refused as unauthorised |
| `ANTHROPIC_API_KEY` | the chat panel and the assistant page | the assistant says it is not set up |
| `MB_GATEWAY` | **must stay unset here** (`1` turns the app into the gateway: every dashboard page becomes a 404) | — |

**New, for the F&O read (all four or none):**

| Name | What it holds |
|---|---|
| `OMENIX_FNO_PG_HOST` | the Azure server's host name (`<server>.postgres.database.azure.com`, not an IP: the certificate is checked against this name) |
| `OMENIX_FNO_PG_DATABASE` | the database name |
| `OMENIX_FNO_PG_USER` | `dashboard_app` (the read-only role with SELECT on `fno.pages_history` and `fno.current_publication`) |
| `OMENIX_FNO_PG_PASSWORD` | that role's password |
| `OMENIX_FNO_PG_PORT` | optional; leave unset for 5432 |

If only some of the four are set, the Screener and Markets pages stop with an error naming the missing variables
(never a silent fallback to examples). If none are set, they show the examples (labelled "Example data") as today.
There is no TLS setting: the app always uses TLS with Azure's three pinned root certificates and checks the host name
(the equivalent of `sslmode=verify-full`).

Optional, not needed on the dashboard: `MB_CONTACT_EMAIL` and `MB_GOOGLE_SITE_VERIFICATION` (the gateway's public
pages). The F&O variables are not needed on **omenix-gateway**: the gateway answers 404 to the Screener and Markets
(`web/lib/tools/gateway.ts`).

## 4. Let Vercel reach Azure PostgreSQL

- [ ] Azure's firewall must admit the connections from Vercel's functions. Standard Vercel plans have no fixed
      outgoing addresses, so the choice is yours: Vercel's static outgoing IPs (a paid add-on) added to the firewall,
      or a wider rule. The app only reads, as `dashboard_app`.

## 5. Deploy by hand (automatic deployments stay off)

`web/vercel.json` holds `{ "git": { "deploymentEnabled": false } }`, so a push to `main` deploys nothing.

- [ ] Deployments → Create Deployment → branch `main` (or the commit you want), Production. Or `vercel deploy --prod`
      from `web/` on your Mac with the Vercel CLI.
- [ ] Do not change `web/vercel.json`.

## 6. Smoke test after the deploy

India (`/india/screener`, `/india/markets`):

- [ ] Under the page heading, the freshness line names the latest session P6 published (12 Oct 2026 when this was
      written; later after newer runs): "F&O data: NSE close of 12 Oct 2026, up to date". On another day, "Updating…"
      (07:10–08:30 IST) or "Out of date: …" with the missing day are correct states, not faults.
- [ ] Screener, Stocks tab: "Prices: close of 12 Oct" in the sources note; the count of stocks is the real day's
      (2,924 in the examples; the real number may differ); a screen (for example "Near 52-week high") changes the rows.
- [ ] Screener, F&O tab: the build-up tiles and the F&O rows, with "NSE F&O close of 12 Oct".
- [ ] Markets: the indices and sector indices show 12 Oct.
- [ ] Expected empty parts, saying "No backend publishes this part yet": the stock tool's column and its two screens
      ("Our strategies: 3+ buy", "Results within 7 days"), the session reading, flows, the world, events. They are not faults.
- [ ] No part says "data not available". If one does, Vercel's function logs show one line per failed part with the
      class only, for example `block failed: The results: FnoUnavailable (network)`: network means the firewall (step 4);
      authentication, the user or password; tls, the host name (it must be the Azure name); permission or
      missing_table, the role's grant or P6's tables.

US (`/us/screener`, `/us/markets`):

- [ ] No F&O tab, no F&O tiles, no freshness line, no volatility and index-options card. F&O is absent, not empty.
- [ ] With the F&O database set, the US screener and markets blocks say "No backend publishes this part yet"
      (nothing publishes US screener data yet).

The stock pages (a check that nothing else moved):

- [ ] Companies, a stock page, paper portfolios and track record load their real data as before.
- [ ] **Home and the frame (its instruments, signals and paper account) show "Example data".** This repository's
      Home (W9) and frame (W8) read the signed-off examples until their own backend stories (W2 for the rest, W6)
      land. The stock repository's old Home read live data. This is a visible step back on Home, known and labelled,
      not a breakage.

## To go back

Remove the four `OMENIX_FNO_PG_*` variables and redeploy: Screener and Markets return to the examples. To return the
whole project, reconnect the stock repository with root `web/` and redeploy.
