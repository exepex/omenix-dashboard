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
| 2 | **Connect to other databases** (`postgres`, `template1`, any Azure adds), create **temporary tables** in `postgres`, and there create **persistent large objects** (exception 1) unless they are closed in that database too | PostgreSQL grants `CONNECT` and `TEMPORARY` to `PUBLIC` on these databases; their owner (not the admin unless Azure makes it so) can revoke | **Disk fill, as for exception 1**: large objects in `postgres` persist; temporary tables use disk until the session ends. Reading `postgres` shows nothing of ours | Storage alert; `tests/large_objects.sh` (every database); `15_server_wide.sql` revokes CONNECT and TEMPORARY when allowed, `12_large_objects.sql` closes large objects per database when allowed |
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
| `sql/00_roles.sql` | the seven roles, attributes, connection limits, timeouts; removes stray memberships; the admin's SET-only membership in the owner roles |
| `sql/10_database.sql` | database `omenix`; only the seven roles may connect |
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
| `tests/ci.sh` | the whole test on a disposable PostgreSQL 16 (CI: `.github/workflows/platform-tests.yml`) |
| `owner/` | the owner's scripts for the real server; checklist in `owner/CHECKLIST_X1.md` |
| `evidence/` | outputs of the owner's scripts, committed by the owner |

## Equivalence with what the owner ran, and the one deliberate difference

`tests/ci.sh` proves on every push that `sql/reference/azure_setup.sql` gives `tests/reference_catalog.txt` (71
lines), that `sql/00..40` gives `tests/expected_catalog.txt` (74 lines) both on an empty server and on top of the
owner's setup, that a second run changes nothing, and that the two listings differ only by
`tests/catalog_difference.txt`:

**Deliberate difference (orchestrator decision, 12 Oct 2026; strong evidence: PostgreSQL grants `EXECUTE` on every new
function to `PUBLIC` by default):** each owner role's default privileges no longer give `PUBLIC` `EXECUTE` on the
functions and procedures it creates. With the original setup, `dashboard_app` could execute any function an owner
role creates in `stock`, `fno` or `app`, and each writer those in its own schema (shown by running the matrix on the
original setup: 9 checks fail). Only a global default (without `IN SCHEMA`) can remove a built-in default, so the
revoke is global per owner role; it adds the three `acl default functions` lines. The real server gets it from
`owner/apply_real.sh`.

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
