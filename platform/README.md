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

`owner/server_evidence.sh` reads all of this from the server with `az` and marks any difference.

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
`CanNotDelete` lock on the server (deleting a server deletes its backups) and an email alert when there are more than
10 failed connections in 15 minutes (metric `connections_failed`; it counts every failed connection and does not say
who failed). Later: narrow the rule if the clients ever get fixed addresses.

## Roles and who holds which credential

| Role | Can do | Credential lives in (environment variable name only) |
|---|---|---|
| `stock_writer` | read and write rows in `stock` tables | `STOCK_DB_URL`, stock backend's cloud environment |
| `fno_writer` | read and write rows in `fno` tables | `FNO_DB_URL`, `exepex/trading`'s cloud environment |
| `dashboard_app` | read `stock` and `fno`; read, insert and update `app` (no delete) | `OMENIX_DB_URL`, the dashboard's Vercel projects |
| `stock_inbox_reader` | read `app` | `STOCK_INBOX_DB_URL`, stock backend's cloud environment |
| `stock_owner`, `fno_owner`, `app_owner` | create and change tables in their own schema | nowhere: the owner's password manager only, used by hand for migrations |
| server admin | create roles and databases | nowhere: the owner's password manager only |

No runtime role can create anything (no `CREATE` on the database, `public` or any schema, no temporary tables),
change or drop a table, switch to another role, read a schema it was not given, or execute a function an owner role
created (PostgreSQL's default `EXECUTE` for `PUBLIC` is revoked for the owner roles; grant it per function when one is
really needed). Limits: 5 connections for each
writer and the inbox reader, 20 for the dashboard; statement timeouts 60 s (writers), 15 s (dashboard), 30 s (inbox).

URL format: `postgresql://<role>:<password>@omenix-pg.postgres.database.azure.com:5432/omenix?sslmode=verify-full`
(set by the owner in each environment's settings; see `exepex/trading` `docs/migration/README.md`).

**Rule for every table migration (P3, K1, W2 and later):** create tables as the schema's owner role (log in as it,
or `SET ROLE` to it). Only then do the default privileges below give the runtime roles their access. A table created
by the admin itself gets no grants and stays invisible to the runtime roles.

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
| `sql/20_schemas.sql` | schemas `stock`, `fno`, `app` and their owners; no `CREATE` on `public` |
| `sql/30_grants.sql` | schema `USAGE` for exactly the runtime roles that need it |
| `sql/40_default_privileges.sql` | grants every future table and sequence gets from its owner role; no `EXECUTE` for anyone else on its functions |
| `sql/apply.sh` | runs 00-40 in order as the admin; idempotent, converges drift, never touches passwords or rows |
| `sql/reference/azure_setup.sql` | the script the owner ran on 12 Oct 2026 (copy of `exepex/trading` `docs/migration/azure_setup.sql` at `a8cdad4`, sha256 `7315f0ac…3491`) |
| `tests/role_matrix.txt` | the matrix: 365 checks over 7 roles (allowed, forbidden, expected values) |
| `tests/role_matrix.sh` | runs the matrix, one connection per role; `X1_REQUIRE_TLS=1` adds a TLS check |
| `tests/catalog_snapshot.sql`, `tests/expected_catalog.txt` | normalised listing of roles, memberships, ACLs and default privileges, and its declared content |
| `tests/reference_catalog.txt`, `tests/catalog_difference.txt` | the listing the original script gives, and the only allowed difference from it |
| `tests/fixtures_up.sql`, `tests/fixtures_down.sql` | probe table `x1_probe` and function `x1_probe_f` in each schema, created by the owner roles |
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
