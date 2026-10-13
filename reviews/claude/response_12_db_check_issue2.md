# Response 12: issue #2, scheduled read-only check for the accepted exceptions (builder's claims)

Builder session (the X1 builder). Issue: `exepex/omenix-dashboard#2`. Design and setup: `platform/README.md`,
section "Scheduled check". The builder never connected to the Azure server.

## Claims per "do" item of the issue

| Issue item | What is built | Proof | Confidence |
|---|---|---|---|
| Large objects above a small threshold in any database | `monitor/db_check.sh` runs `tests/large_objects.sh` (now also reports bytes, limit `X1_LO_MAX_BYTES`, default 50 MiB) in every database that accepts connections. `db_monitor` gets CONNECT on each database where the admin may grant it (`sql/15_server_wide.sql`). | `tests/monitor_test.sh`: 640 kB of incompressible large objects planted by `dashboard_app` in database `postgres`, with a 256 KiB limit, gives `FAIL database postgres: 1 large object(s) using … bytes` and the alert fires. | strong evidence (CI) |
| A runtime role's persistent `statement_timeout`, or another role-level setting, changed | `db_check.sh` compares the full catalog snapshot with `tests/expected_catalog.txt`. The snapshot now gives the same output whoever runs it: the admin is recognised as the owner of database `omenix`, not as `current_user`. Shown: run as the admin and as `db_monitor`, it gives the identical 79 lines. | `dashboard_app` plants `ALTER ROLE CURRENT_USER SET statement_timeout = 0`: the alert names `> role setting dashboard_app in (all databases): statement_timeout=0`. A planted schema grant is caught the same way. | strong evidence (CI) |
| Password changed outside a deployment, where detectable | **Not detectable read-only, so not built.** A plain role is refused `pg_authid` (`permission denied for table pg_authid`, reproduced). Azure's admin is not a superuser either, and PostgreSQL keeps no password-change time. The report states this on every run. A deployment locked out by a changed password shows as failed connections, which the Azure alert `omenix-pg-failed-connections` already covers. | `monitor_test.sh` checks that the report states the limit. | strong evidence |
| Alert the owner (Slack #fno-desk or e-mail) | **E-mail via GitHub**, with no new secret. A failed scheduled run e-mails the owner. `monitor/alert.sh` opens the issue "Database check: alert" (or comments on it if it is open) with the workflow's own token, and repository watchers get that by e-mail. Slack was not used: it would put the F&O bot token into a second repository. | Fake `gh`: the first alert opens an issue, a later one comments on issue #7, and each carries the finding. A clean server makes no `gh` call. | strong evidence (CI); real GitHub e-mail delivery is untested (reasoning only) |
| Read-only, no admin credentials in files | `db_monitor`: LOGIN, 2 connections, 30 s timeout, no schema USAGE, no table or function rights. Its password exists only as the GitHub Actions secret `OMENIX_DB_MONITOR_PASSWORD`. The workflow never runs on pull requests, and the report holds no secret and no IP address. | Role matrix: 94 checks for `db_monitor`, 0 failed, 6 OPEN (the same named exceptions as every role). It cannot enter `stock`/`fno`/`app` or read any table. | strong evidence (CI) |

**Where it runs:** a scheduled GitHub Actions workflow (`.github/workflows/db-check.yml`), hourly at :17 UTC, plus
by hand. Chosen over a Claude cloud routine because it is deterministic, costs nothing on a public repository and
needs no model run. The credential lives in this repository's Actions secrets (an environment setting), and nowhere
else.

**Done when ("each condition is planted in a test database and the alert fires"):** `tests/monitor_test.sh`, run as
`ci.sh` step 7 on every push. It plants large objects, a persistent timeout and a grant drift, checks that the alert
fires for each, and checks that a clean server gives no alert.

## Changes to X1's declared state (deliberate, pinned)

- **`db_monitor`** is added to `sql/00`, `10`, `15`, `30` and `40`, to the snapshot's role list, and to the role
  matrix: it joins every generic deny, known-exception and zero-value check, and has its own checks for timeout,
  connection limit and no schema access. The matrix now has 522 checks, 0 failed.
- **`tests/catalog_difference.txt`** gains its 4 lines (role, timeout, CONNECT, the admin's implicit membership); the
  reference catalog is unchanged.
- **Read-only transactions:** first tried with `default_transaction_read_only = on`, then dropped. It turned every
  permission refusal into "read-only transaction", which hid whether the permissions are right. The role can also
  switch it off itself, and with no privileges at all it needs nothing more.

## Owner steps (once)

`platform/README.md`, "Scheduled check":
1. Run `owner/apply_real.sh`.
2. In psql as admin, run `\password db_monitor`.
3. Add the repository secret `OMENIX_DB_MONITOR_PASSWORD`.
4. Run the workflow by hand and expect `RESULT: OK`.

Until the secret exists, runs only print a notice.

## Doubts

- **Scheduled runs can stop:** GitHub disables scheduled workflows in a public repository after 60 days without
  activity (reasoning only, from GitHub's documented policy; not tested here).
- **First real run:** the workflow has not run against `omenix-pg`, which needs the owner's steps.
  `sslrootcert=system` on the runner relies on Ubuntu's root store containing Azure's root CA; the owner's Mac proved
  the same chain (some evidence).
- **Repeated alerts:** a finding repeats hourly as comments on one issue until it is fixed.
