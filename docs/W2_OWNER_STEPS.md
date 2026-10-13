# W2: switching the Screener and Markets to the real F&O data (owner steps)

What this does: the Screener and the Markets overview (India) read the F&O tool's daily publication from Azure
PostgreSQL (`fno.current_publication` joined to `fno.pages_history`, written by P6) instead of the examples.
Nothing is deployed by Claude; you do each step by hand.

## Before you start

- P6 has published at least once (it has: run 38438666957, publication `nse-2026-10-12-40630e1cd4ec`).
- The `dashboard_app` role has SELECT on both tables (it has).
- Choose the Vercel project that will read the database. Today the dashboard itself (omenix-dashboard) still deploys
  from the stock repository's frozen `web/`, which does not have this code; **omenix-gateway** deploys from this
  repository but is public. Recommendation (reasoning only): wait for the cutover and set the variables on the
  dashboard project, which sits behind Vercel Authentication. Setting them on the public gateway would show F&O data
  on its public screener and markets pages.

## Step 1: Vercel environment variables (names only; values never go in a file or a chat)

In the chosen Vercel project, Settings, Environment Variables, Production (and Preview if you want it there too):

| Name | What it holds |
|---|---|
| `OMENIX_FNO_PG_HOST` | the Azure server's host name (the `....postgres.database.azure.com` name, not an IP address: the certificate is checked against it) |
| `OMENIX_FNO_PG_DATABASE` | the database name |
| `OMENIX_FNO_PG_USER` | `dashboard_app` (the read-only role) |
| `OMENIX_FNO_PG_PASSWORD` | that role's password |
| `OMENIX_FNO_PG_PORT` | optional; leave unset for 5432 |

All four or none: with some set and others missing, the Screener and Markets pages stop with an error naming the
missing variables (never a silent fallback to the examples). With none set, the pages use the examples, as today.

There is no setting for TLS: the connection always uses TLS, checks the server's certificate against the three pinned
Azure root certificates (`web/lib/fno/azure-roots.ts`, the same as P6's) and checks the host name (the equivalent of
`sslmode=verify-full`). Nothing in the variables can weaken it.

## Step 2: let Vercel reach the database

Azure's firewall must admit Vercel's outgoing addresses. Vercel functions do not have fixed addresses on the standard
plans, so the usual options are: allow Azure-hosted and public access with the firewall rule your platform scripts
already manage (X1), or Vercel's static outgoing IPs (a paid add-on) added to the firewall. This is a security
decision for you; the dashboard only needs read access as `dashboard_app`.

## Step 3: deploy and check

1. Deploy by hand (automatic deployments are off).
2. Open `/india/screener` and `/india/markets`. Under the heading you should see one of:
   - "F&O data: NSE close of <day>, up to date";
   - "Updating: ..." between 07:10 and 08:30 IST while the daily run may be in progress;
   - "Out of date: ..." with the missing day, if the run has not published by 08:30 IST.
3. Parts no backend publishes yet say "No backend publishes this part yet" (the stock tool's columns, the session
   reading, flows, the world, events, and the whole US screener and markets). That is expected, not a fault.
4. If a part says "data not available", the database could not be read. The page never shows why (the driver's
   message can name the host and user). Vercel's function logs show one line per failed part with the class only,
   for example `block failed: The results: FnoUnavailable (network)`. network: check the firewall (step 2);
   authentication: the user or password; tls: the host name (it must be the Azure name); permission or missing_table:
   the role's grant or P6's tables.

## To go back

Remove the four variables and redeploy: the pages return to the examples.
