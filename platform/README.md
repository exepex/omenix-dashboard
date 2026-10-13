# Platform: the shared Azure PostgreSQL database (story X1)

The one database both backends publish to and the dashboard reads from. Story X1 in `exepex/trading`
(`docs/stories/X-cross-repository.md`), design section 13.3 of `docs/DESK_DESIGN.md`. Research and paper trading
only. **Nothing here holds a password, token or connection string; never add one.**

## The server (owner, 12 Oct 2026)

| Setting | Value |
|---|---|
| Service | Azure Database for PostgreSQL Flexible Server `omenix-pg`, PostgreSQL 16 |
| Region | Central India |
| Compute | Burstable B1ms (1 vCore, 2 GiB) |
| Storage | 32 GiB, performance tier P4 |
| Backups | automatic, **14-day retention** (point-in-time restore to any moment in the last 14 days, RPO up to about 5 minutes); backup redundancy as set at creation (shown by `owner/server_evidence.sh`) |
| Encryption at rest | service-managed key |
| TLS | required (`require_secure_transport` = on, the Azure default); clients use `sslmode=verify-full` |
| Database | `omenix`, schemas `stock`, `fno`, `app` |

Expected values, read by `owner/server_evidence.sh` (it compares each with the server's `az` output; change them
only here):

<!-- server-settings:start -->
| Check | Expected |
|---|---|
| location | Central India |
| sku | Standard_B1ms |
| tier | Burstable |
| PostgreSQL version | 16 |
| storage GiB | 32 |
| storage performance tier | P4 |
| backup retention days | 14 |
| public network access | Enabled |
| data encryption | SystemManaged |
| require_secure_transport | on |
| firewall rules | 0.0.0.0-255.255.255.255 |
<!-- server-settings:end -->

## Network: public access, one firewall rule open to every address

**Policy:** public access is on, with one firewall rule `0.0.0.0` - `255.255.255.255`. Every IPv4 address can reach
port 5432.

**Why:** the clients have no fixed addresses. Vercel functions (the dashboard) use shared, changing egress IPs (fixed
egress needs Vercel's paid Secure Compute), and the Claude Code cloud routines (stock and F&O publishers) run in
containers with no stable IP. A narrower rule would break them at random. Private networking (VNet) would need a
gateway both of them cannot use. (Some evidence: Vercel and Azure documentation; not re-measured here.)

**What protects the server instead** (each is tested or checked):
1. TLS required for every connection; a plain-text one is refused (criterion 3, `owner/check_tls.sh`).
2. Each runtime credential can do only its own job (role matrix, criteria 1 and 2): a leaked dashboard password can
   read the backends' read models and write the dashboard's own `app` tables, nothing else; a leaked writer password
   can change only its own backend's derived tables, which are rebuilt from the backend repositories.
3. One credential per deployment, long random passwords of letters and digits (so URLs need no encoding).
4. The admin and owner-role passwords are never stored in any deployment.

**Accepted risk (reasoning only):** anyone on the internet can try passwords against the server; a weak or leaked
password is the whole defence for that role. Mitigations set by the owner (`owner/protect_server.sh`): an Azure
`CanNotDelete` lock on the server (deleting a server deletes its backups), an email alert when there are more than
10 failed connections in 15 minutes (metric `connections_failed`; it counts every failed connection and does not say
who failed), and an email alert when storage is above 80 percent (metric `storage_percent`). Later: narrow the rule if the clients ever get fixed addresses.

## Roles and who holds which credential

| Role | Can do | Credential lives in (environment variable name only) |
|---|---|---|
| `stock_writer` | read and write rows in `stock` tables | `STOCK_DB_URL`, stock backend's cloud environment |
| `fno_writer` | read and write rows in `fno` tables | `FNO_DB_URL`, `exepex/trading`'s cloud environment |
| `dashboard_app` | read `stock` and `fno`; read, insert and update `app` (no delete) | `OMENIX_DB_URL`, the dashboard's Vercel projects |
| `stock_inbox_reader` | read `app` | `STOCK_INBOX_DB_URL`, stock backend's cloud environment |
| `db_monitor` | connect and read catalogs and large-object sizes only: no row data, no schema, table or function access (catalog metadata such as table names and row counts is visible, as to every role); limit 2 connections, 30 s timeout | `OMENIX_DB_MONITOR_PASSWORD`, this repository's GitHub Actions secret (the scheduled check below; it also holds `FNO_SLACK_BOT_TOKEN` for the private details) |
| `stock_owner`, `fno_owner`, `app_owner` | create and change tables in their own schema | nowhere: the owner's password manager only, used by hand for migrations |
| server admin | create roles and databases | nowhere: the owner's password manager only |

Inside `omenix` no runtime role can create a table, view, sequence, function, type, index, schema or temporary table
(no `CREATE` on the database, `public` or any schema, no `TEMPORARY`), change or drop a table, switch to another
role, read a schema it was not given, or execute a function an owner role created (PostgreSQL's default `EXECUTE` for
`PUBLIC` is revoked for the owner roles; grant it per function when one is really needed). **Exceptions that
PostgreSQL leaves open to every role are listed below under "Named exceptions"; "cannot create anything" is not true
without them.**

**Connection limits** (enforced: a role cannot change its own): 5 for each writer and the inbox reader, 20 for the
dashboard. **Statement timeouts** 60 s (writers), 15 s (dashboard), 30 s (inbox) are **defaults, not limits**: any
role can switch its own off (named exception 3).

URL format: `postgresql://<role>:<password>@omenix-pg.postgres.database.azure.com:5432/omenix?sslmode=verify-full`
(set by the owner in each environment's settings; see `exepex/trading` `docs/migration/README.md`).

**Rule for every table migration (P3, K1, W2 and later):** create tables as the schema's owner role (log in as it,
or `SET ROLE` to it). Only then do the default privileges below give the runtime roles their access. A table created
by the admin itself gets no grants and stays invisible to the runtime roles.

## Named exceptions (what PostgreSQL lets every role do, and what limits it)

Found by the judge (judges 3 and 5) and confirmed by `tests/ci.sh` step 4 with real attempts. Each is checked by the
role matrix as `known:`: it prints **OPEN** while the server allows it (never counted as a pass) and PASS once closed.
On every apply, `sql/12_large_objects.sql` (run in **every** database the admin can reach, because function rights are
per database) and `sql/15_server_wide.sql` try to close 1 and 2 and print, per database, what is still open; the
owner's `owner/apply_real.sh` records whether Azure's admin may close them. `tests/large_objects.sh` counts large
objects in **every** database that accepts connections (the owner's matrix run includes it). In CI (a non-superuser
admin, like Azure's) they stay open; CI step 6a shows that a large object made in `postgres` is caught even when
`omenix` is closed, and step 6b that they close where the admin owns the objects, without locking the admin out.

| # | Exception | Why it is open | Harm from a leaked runtime credential | Mitigation and detection |
|---|---|---|---|---|
| 1 | Create **large objects** in `omenix` and in every other database it may connect to (`lo_create`, `lo_creat`, `lo_from_bytea`) | PostgreSQL has no privilege for creating large objects; only revoking `EXECUTE` on these functions from `PUBLIC` stops it, **in each database separately**, and the functions belong to the bootstrap superuser (on Azure: `azuresu`), so the admin may not be allowed | Fill the 32 GiB disk (the server stops accepting writes); the objects persist after the session | Storage alert above 80 percent (`owner/protect_server.sh`, a server-wide metric, so it covers every database); `tests/large_objects.sh` counts large objects in every database and fails on any; the matrix's strict check covers `omenix` per role |
| 2 | **Connect to other databases** (`postgres`, `template1`, any Azure adds), create **temporary tables** in `postgres`, and there create **persistent large objects** (exception 1) unless they are closed in that database too | PostgreSQL grants `CONNECT` and `TEMPORARY` to `PUBLIC` on these databases; their owner (not the admin unless Azure makes it so) can revoke | **Disk fill, as for exception 1**: large objects in `postgres` persist; temporary tables use disk until the session ends. A large object made in `template1` is also copied into every database created from it later (`CREATE DATABASE` copies `template1`). Reading `postgres` shows nothing of ours | Storage alert; `tests/large_objects.sh` (every database); `15_server_wide.sql` revokes CONNECT and TEMPORARY when allowed, `12_large_objects.sql` closes large objects per database when allowed |
| 3 | **Switch off its own statement timeout**, for its session (`SET statement_timeout = 0`) or persistently (`ALTER ROLE CURRENT_USER SET statement_timeout = 0`) | `statement_timeout` is a user setting; PostgreSQL 16 has no setting a non-superuser cannot override for itself | Unbounded queries on a 1-vCore server (slow or unavailable dashboard) | The persistent change shows in the catalog snapshot (a `role setting` line) and fails the matrix's timeout check (CI drift test as the role itself); `apply.sh` (`RESET ALL`) removes it. The session change leaves no trace. Enforceable limit, not built (reasoning only): a scheduled watchdog run by the admin (for example `pg_cron`, if allowed on Azure) that ends runtime-role queries older than the timeout with `pg_terminate_backend`; CPU alerting is the cheaper first step |
| 4 | **Change or remove its own password** (`ALTER ROLE CURRENT_USER PASSWORD ...`) | Every role may change its own password in PostgreSQL | Lock its own deployment out (denial of service), not escalate | The deployment's connections then fail, which trips the failed-connection alert; the owner resets the password as admin |

**Real outcome on `omenix-pg` (owner's `apply_real.sh`, 13 Oct 2026; strong evidence, read from the evidence file):**
- Exception 1 stays **open in all 5 databases** (`azure_maintenance`, `azure_sys`, `omenix`, `postgres`,
  `template1`): Azure's admin may not revoke `EXECUTE` on the large-object functions. Mitigation and detection are
  the storage alert and `tests/large_objects.sh`.
- Exception 2 is **closed on `postgres` and `template1`**: the admin revoked `CONNECT` and `TEMPORARY` from
  `PUBLIC` there. It stays **open on `azure_maintenance` and `azure_sys`**, which Azure owns. That is by their access
  rights; whether Azure's own connection rules also let a runtime role in is not yet tested (the role matrix of step
  2 lists them as OPEN either way).
- Exceptions 3 and 4 cannot be closed by any admin (PostgreSQL behaviour); they are unchanged.

The story owner decides whether these exceptions are acceptable; X1 does not claim them away.

**Can exceptions 1 and 2 be closed? (issue #3, checked 13 Oct 2026; re-check at each major-version upgrade)**
- **Exception 1, large objects: no supported way, today or in PostgreSQL 18.**
  - PostgreSQL has no privilege for *creating* a large object (strong evidence: the PostgreSQL 18 docs on large
    objects state privileges only for reading, writing and owner actions). The only lever is revoking `EXECUTE` on
    `lo_create`, `lo_creat` and `lo_from_bytea`, which belong to the bootstrap superuser.
  - PostgreSQL 18's new `ALTER DEFAULT PRIVILEGES … ON LARGE OBJECTS` and `has_largeobject_privilege()` govern
    reading and writing large objects only, not creating them (release notes, "Privileges").
  - `lo_compat_privileges` only relaxes checks; it can never restrict creation. Since PostgreSQL 15 a superuser can let
    another role set it (`GRANT SET ON PARAMETER`), which changes nothing here (judge 39).
  - On Azure the admin is not a superuser (`azure_pg_admin`, "doesn't have full superuser permissions"). Azure's
    access-control and server pages document no parameter or support route for this (some evidence: the docs are
    silent, not explicit).
  - What remains: the storage alert and the scheduled check (large-object bytes in every database). Optional: a
    support request asking Microsoft to run, as the superuser, in every database
    `REVOKE EXECUTE ON FUNCTION pg_catalog.lo_create(oid), pg_catalog.lo_creat(integer), pg_catalog.lo_from_bytea(oid, bytea) FROM PUBLIC;`.
    The answer is unknown; if done, `12_large_objects.sql` would report "none" and the matrix's OPEN count would fall
    by 3 per role.
- **Exception 2, Azure's own databases: may already be closed in practice; now measured.**
  - Azure's docs say of `azure_maintenance` "You don't have access to this database". Yet its access list grants
    `PUBLIC` CONNECT, and the admin did connect to it in step 1. `azure_sys` is not documented for Flexible Server.
  - What decides is whether a *plain* role can connect, and `db_monitor` is one, like the runtime roles. From its
    first run, `tests/large_objects.sh` reports a database the server refuses to it at connection as
    `CLOSED … plain roles cannot reach it`, instead of a failure. The scheduled check and `setup_monitor.sh`'s first
    check will therefore show, per Azure database, whether exception 2 is open in fact or only on paper.
  - `pg_hba` rules can name users, so the monitor's answer does not prove it for every role (judge 39). The owner's
    30-second `owner/probe_azure_dbs.sh` (checklist step 4b) tries a real connection as `dashboard_app` and records
    each Azure database as OPEN, CLOSED or UNCLEAR.
  - The role matrix still counts it OPEN, because its check reads the access list, which is what PostgreSQL grants.

## Scheduled check (issue #2)

What it watches, hourly, read-only (`platform/monitor/`, workflow `.github/workflows/db-check.yml`):
1. **Large objects** (named exceptions 1 and 2): their bytes in every database that accepts connections, against a
   limit of 50 MiB each (`X1_LO_MAX_BYTES`). This is far earlier than the 80 percent storage alert.
2. **Drift** (named exception 3 and anything else): the catalog snapshot against `tests/expected_catalog.txt`. It
   catches a role's persistent `statement_timeout` or other setting, attributes, memberships, grants and default
   privileges.
3. **Password changes: not detectable.** A read-only role cannot see them (strong evidence: `pg_authid` is
   superuser-only, so even Azure's admin cannot read it, and PostgreSQL keeps no change time). The report says so on
   every run. A deployment locked out by a changed password shows as failed connections, which the Azure alert
   `omenix-pg-failed-connections` covers.

**Where it runs and why:** a scheduled GitHub Actions workflow in this repository, chosen over a scheduled Claude
routine. It is deterministic, costs nothing on a public repository and needs no model run.
- **Credentials:** two repository secrets, set by the owner's script.
  - `OMENIX_DB_MONITOR_PASSWORD`: `db_monitor`'s password.
  - `FNO_SLACK_BOT_TOKEN`: the bot that already posts to the owner's #fno-desk, used for the private details.

  Also one repository variable, `DB_CHECK_ENABLED=true`. Host and role name are in the workflow, since they are not
  secret. No admin credential is stored anywhere.
- **Fork safety:** the workflow never runs on pull requests, so a fork cannot reach a secret.

**Public and private (judge 36; the repository is public, so its run logs and issues are world-readable):**
- **Public:** the log and the alert issue carry only one line: status, counts and the check time, e.g.
  `Database check ALERT: 1 finding(s), unknown parts: 0, checked 2026-10-13 11:22 UTC`. They also say whether the
  details reached Slack. They name nothing that would tell an attacker what is misconfigured.
- **Private:** the details (which database, which role, which setting or grant, how many bytes) go only to Slack
  #fno-desk (`C0C89E8QCCD`, fixed in `monitor/notify_slack.sh`; no other channel). The token is sent to Slack in a
  header read from stdin, never on a command line.
- **If Slack refuses** or the token is missing, the public alert says the details were not delivered. The run still
  fails, so it is never a silent pass.
- **Residual risk (reasoning only):** the Slack token now lives in this public repository's Actions secrets as well
  as in `exepex/trading`. Anyone who can change this repository's workflows (only its writers) could read it, and a
  leaked token can post to channels the bot is in. This is the price of a private channel without new
  infrastructure. The alternatives are e-mail through the Azure action group, which Actions cannot reach, or making
  the repository private.

**Alerts, and never a silent pass:**
- **Results:** `RESULT: OK` (exit 0), `RESULT: ALERT` (exit 1, a finding) or `RESULT: UNKNOWN` (exit 2: no
  connection, part of the check could not run, or the secret is missing while `DB_CHECK_ENABLED=true`, which judge 36
  raised as a lost secret going unseen). ALERT and UNKNOWN both fail the run (GitHub e-mails the owner) and open the
  issue "Database check: alert", or comment on it if open.
- **Before setup:** before `DB_CHECK_ENABLED` is set, a run without the secret only prints a notice.
- **Tests:** each condition is planted in a disposable database by `tests/monitor_test.sh` (CI step 7). It checks
  that the alert fires, that nothing in the public log or issue names a detail, and that the details reach the Slack
  sender.

**Is it still running?** A stopped check is a silent pass of another kind:
- **Heartbeat:** every Monday the 03:xx UTC run, when OK, posts a heartbeat to #fno-desk with the time of the last
  successful check. If the Monday message stops coming, the check has stopped.
- **Keep-alive:** GitHub pauses scheduled workflows in a public repository after 60 days without repository
  activity. The monthly workflow `keepalive` (`monitor/keepalive.sh`) commits `platform/monitor/keepalive.txt` only
  when `main` has had no commit for 45 days. It is kept apart from `db-check`, so that `db-check` never has write
  access to the code.

**What `db_monitor` can see:** no row data of any table. Like every PostgreSQL role, it does see catalog metadata:
table and column names, row counts from the statistics views, role names and settings. It cannot enter `stock`,
`fno` or `app`.

**Owner setup, once: one script** (`owner/CHECKLIST_MONITOR.md`). `owner/setup_monitor.sh` asks for the admin name and
password and the #fno-desk bot token, all at hidden prompts; Enter keeps an already saved token. It then:
- applies `platform/sql`, which creates `db_monitor`;
- generates the monitor's 40-character password, which nobody types or sees;
- stores it in the database as a SCRAM-SHA-256 verifier computed on the Mac (`owner/scram_verifier.py`), so the plain
  password never reaches the server;
- runs the first check (details on the screen only, not in the evidence file);
- saves both secrets with `gh` (stdin only), sets `DB_CHECK_ENABLED=true` and starts the workflow.

Re-running it rotates the password.

**Limits (reasoning only unless marked):**
- A finding is reported once an hour while it lasts, each time as a comment on the same issue and a Slack message.
- The check sees a persistent setting, not one switched off for a single session (exception 3).
- A leaked `db_monitor` password has the same named exceptions as any role (it could create large objects), and no
  more.

## Scope: infrastructure only; dashboard tables come later (follow-up for W7)

Owner scope note (12 Oct 2026): the dashboard's screens are being redesigned (`design/PLATFORM_DESIGN.md`: manual
paper orders, a screener, an option chain), so its tables and APIs may still change. X1 therefore creates **no
table** in any schema and **no table-specific grant**. What exists for `app` is only what the owner's original script
set up: the schema, `USAGE` for `dashboard_app` and `stock_inbox_reader`, and default privileges (`dashboard_app`:
SELECT, INSERT, UPDATE; `stock_inbox_reader`: SELECT) for whatever tables `app_owner` creates later. The original
script names no `app` table. `dashboard_app` reads the backends' tables only through the default privileges of
`stock` and `fno`.

**Follow-up for W7 (after the mockups are final):** define the `app` tables (for example the inbox and the assistant
log) and decide, table by table, whether the schema-wide defaults for `app` are right or should become narrower
grants (for example `stock_inbox_reader` reading only the inbox, `dashboard_app` inserting only where it must). Add
those checks to `tests/role_matrix.txt`. The test tables `x1_probe` (created and dropped by the tests) and the
restore test's temporary marker (in `fno`) are not dashboard tables.

## Files

| Path | What |
|---|---|
| `sql/00_roles.sql` | the eight roles (seven from X1, `db_monitor` from issue #2), attributes, connection limits, timeouts; removes stray memberships; the admin's SET-only membership in the owner roles |
| `sql/10_database.sql` | database `omenix`; only the eight roles may connect |
| `sql/12_large_objects.sql` | run in every database the admin can reach: tries to close large-object creation (named exception 1) and prints what stays open there |
| `sql/15_server_wide.sql` | tries to close CONNECT and TEMPORARY for PUBLIC on the other databases (named exception 2) and prints what stays open |
| `sql/20_schemas.sql` | schemas `stock`, `fno`, `app` and their owners; no `CREATE` on `public` |
| `sql/30_grants.sql` | schema `USAGE` for exactly the runtime roles that need it |
| `sql/40_default_privileges.sql` | grants every future table and sequence gets from its owner role; no `EXECUTE` for anyone else on its functions |
| `sql/apply.sh` | runs 00-40 in order as the admin; idempotent, converges drift, never touches passwords or rows |
| `sql/reference/azure_setup.sql` | the script the owner ran on 12 Oct 2026 (copy of `exepex/trading` `docs/migration/azure_setup.sql` at `a8cdad4`, sha256 `7315f0ac…3491`) |
| `tests/role_matrix.txt` | the matrix: 428 checks over 7 roles (allowed, forbidden, expected values, named exceptions) |
| `tests/role_matrix.sh` | runs the matrix, one connection per role; `X1_REQUIRE_TLS=1` adds a TLS check |
| `tests/catalog_snapshot.sql`, `tests/expected_catalog.txt` | normalised listing of roles, memberships, ACLs and default privileges, and its declared content; the owner of schema `public` prints as `<platform default>` when it is `pg_database_owner` (PostgreSQL) or `azure_pg_admin` (Azure), and by name otherwise (CI step 2b tests both) |
| `tests/reference_catalog.txt`, `tests/catalog_difference.txt` | the listing the original script gives, and the only allowed difference from it |
| `tests/fixtures_up.sql`, `tests/fixtures_down.sql` | probe table `x1_probe` and function `x1_probe_f` in each schema, created by the owner roles |
| `tests/large_objects.sh` | counts large objects in every database that accepts connections (as the admin); fails on any |
| `tests/owner_scripts_test.sh` | tests the owner scripts' Azure handling with a fake `az`: both firewall-rule flag forms (current `--server-name`, older `--name`), an az failure shown as "ERROR, could not read", and IP addresses redacted from evidence |
| `owner/az.sh` | az helpers shared by the owner scripts: firewall-rule calls for both az flag forms, and reads that report a failure as an error, never as a value |
| `monitor/db_check.sh`, `monitor/run.sh`, `monitor/alert.sh`, `monitor/notify_slack.sh` | the scheduled check (issue #2): detailed report (OK, ALERT or UNKNOWN); entry point that prints only a summary; public GitHub alert (summary only); private details and weekly heartbeat to #fno-desk |
| `monitor/keepalive.sh` | monthly keep-alive commit when the repository has been idle 45 days (workflow `keepalive`) |
| `owner/setup_monitor.sh`, `owner/scram_verifier.py`, `owner/CHECKLIST_MONITOR.md` | the owner's one-script setup of the check |
| `tests/monitor_test.sh` | plants each watched condition and checks that the alert fires (CI step 7) |
| `tests/ci.sh` | the whole test on a disposable PostgreSQL 16 (CI: `.github/workflows/platform-tests.yml`) |
| `owner/` | the owner's scripts for the real server; checklist in `owner/CHECKLIST_X1.md` |
| `evidence/` | outputs of the owner's scripts, committed by the owner |

## Equivalence with what the owner ran, and the two deliberate differences

`tests/ci.sh` proves on every push that `sql/reference/azure_setup.sql` gives `tests/reference_catalog.txt` (71
lines), that `sql/00..40` gives `tests/expected_catalog.txt` (79 lines) both on an empty server and on top of the
owner's setup, that a second run changes nothing, and that the two listings differ only by
`tests/catalog_difference.txt`:

**Deliberate difference (orchestrator decision, 12 Oct 2026; strong evidence: PostgreSQL grants `EXECUTE` on every new
function to `PUBLIC` by default):** each owner role's default privileges no longer give `PUBLIC` `EXECUTE` on the
functions and procedures it creates. With the original setup, `dashboard_app` could execute any function an owner
role creates in `stock`, `fno` or `app`, and each writer those in its own schema (shown by running the matrix on the
original setup: 9 checks fail). Only a global default (without `IN SCHEMA`) can remove a built-in default, so the
revoke is global per owner role; it adds the three `acl default functions` lines. The real server gets it from
`owner/apply_real.sh`.

**Second deliberate difference (issue #2, 13 Oct 2026):** the monitor role `db_monitor` for the scheduled check. It
adds four lines: the role (with its 2-connection limit), its 30 s `statement_timeout`, its CONNECT on `omenix`, and the
admin's implicit membership from creating it.

Everything else acts only on **drift** and does nothing on the owner's server as set up:
- grants on the database, schemas and default privileges (tables, sequences, functions) are revoked from the other
  Omenix roles and `PUBLIC` before being granted, so extra grants are removed (the original only added);
- role attributes, connection limits and settings are set to the declared values (`RESET ALL` first), and any
  membership of or in an Omenix role other than the admin's is revoked;
- global default privileges of the owner roles on tables and sequences are revoked;
- `SUPERUSER`, `REPLICATION` and `BYPASSRLS` are asserted absent (the Azure admin cannot change them);
- the database and schemas are created only when missing, and a schema's owner is reset if it changed.
The `\du` and `\dn+` listings at the end of the original are not repeated (`tests/catalog_snapshot.sql` is the check).

## Running the tests locally

Needs a throwaway PostgreSQL 16 where `postgres` logs in without a password. **`ci.sh` drops the database `omenix`
and the Omenix roles on its target**, so never point it at a real server (it refuses Azure host names).

```
docker run -d --name x1pg -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres:16
PGHOST=localhost PGPORT=5432 platform/tests/ci.sh
```

## Restore test cost

A point-in-time restore creates a second server of the same size, billed by the hour until it is deleted. Estimate
(some evidence: third-party price lists, not the Azure calculator): B1ms in Central India about USD 18 a month of
compute, about USD 0.025 an hour, plus 32 GiB of storage at roughly USD 0.006 an hour, so about **USD 0.03 an hour**;
a test taking one to two hours costs about **USD 0.03-0.06 (about INR 3-5)**. The actual cost is read from Azure Cost
Management a day later and written into the restore evidence file.
