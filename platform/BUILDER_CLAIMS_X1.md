# Builder's claims: story X1 (Azure PostgreSQL: server, schemas, roles and tests)

Builder: a Claude Code session, 12 Oct 2026. Repository `exepex/omenix-dashboard`, directory `platform/`, workflow
`.github/workflows/platform-tests.yml`. The builder never connected to the real server; every real-server claim below
waits on the owner's run (`platform/owner/CHECKLIST_X1.md`), whose output lands in `platform/evidence/`.

## Per acceptance criterion

| # | Criterion | Proven in CI (disposable postgres:16, admin a non-superuser with CREATEDB and CREATEROLE like Azure's) | Waits on the owner |
|---|---|---|---|
| 1 | Role matrix passes for every role | `tests/ci.sh` step 4: 428 checks over all 7 roles: 372 passed, 0 failed, 56 OPEN (the 8 named exceptions per role, listed, never counted as passes). Allowed and forbidden row operations on each schema, DDL (create, alter, index, drop, truncate), cross-schema reads and writes, sequences, executing another role's functions, `SET ROLE` to every other role, temporary tables, `pg_authid`, server files, schema `USAGE`, role attributes, memberships, timeouts and connection limits. A denial counts only with SQLSTATE 42501, so a typo or missing table cannot pass as "denied". Step 5 shows the matrix is not vacuous: 15 injected drifts each make it fail, two of them made by the role itself (`ALTER ROLE CURRENT_USER SET statement_timeout = 0`), and the catalog snapshot shows a 16th, latent one; `sql/apply.sh` removes each. On the original setup the matrix fails 9 function checks, which is why step 1 of the checklist applies `platform/sql` first. | `owner/run_real_matrix.sh`: the same matrix for the 4 runtime credentials (312 checks, with TLS required), after `owner/apply_real.sh`, plus the catalog snapshot diff. Strong evidence locally; real server unproven until run. |
| 2 | A runtime role cannot create an object anywhere | **Met inside `omenix` for every schema object; NOT met in full, with named exceptions.** Each runtime role is refused a table, view, sequence, function and type in `public`, `stock`, `fno` and `app`, an index on each schema's table, a schema, a role and a temporary table (all 42501). **Open (judge 3, confirmed in CI step 4 by real attempts):** large objects in `omenix`, connecting to `postgres`/`template1`, temporary tables in `postgres`; also self-changes (own timeout, own password). They are `known:` checks: OPEN while allowed, never a pass. `sql/15_server_wide.sql` tries to close the first group on every apply; CI step 6 shows they close where the admin owns the objects and that the admin cannot lock itself out. A non-superuser admin (CI, possibly Azure) cannot close them. Mitigations: storage alert, strict "no large object exists" check, failed-connection alert. | `owner/apply_real.sh` records whether Azure's admin may close them; `owner/run_real_matrix.sh` reports how many stay OPEN. The story owner accepts the remaining named exceptions or not (`platform/README.md`, "Named exceptions"). |
| 3 | TLS required, non-TLS refused | Only the mechanism (RESULT now also requires `require_secure_transport` = on): locally, with a TLS-only `pg_hba.conf`, `owner/check_tls.sh` reported the plain-text connection refused ("no encryption") and a TLS 1.3 connection; the matrix's TLS check failed on a plain connection and passed on TLS. CI itself has no TLS. | `owner/check_tls.sh` against `omenix-pg`: az parameters, plain-text attempt refused by the server, verified-TLS connection. |
| 4 | Backups with stated retention; one restore tested and recorded | README states 14 days. Nothing about Azure backups can be proven in CI. | `owner/restore_test.sh`: marker row, point-in-time restore to `omenix-pg-x1restore`, marker and catalog verified there, scratch server deleted, cost recorded a day later. Not run by the builder (no az here); the az commands follow Microsoft's CLI reference but are **reasoning only until the owner runs them**. |
| 5 | Firewall and public-access policy written down and matching the server | Policy and reasons in `platform/README.md` ("Network"). | `owner/server_evidence.sh`: az output of the firewall rules and settings, compared with the values it reads from the README's `server-settings` table (CI step 0 checks the table parses, with every key). Mitigations: `owner/protect_server.sh` (CanNotDelete lock; email alerts on `connections_failed` and `storage_percent`). |

## Equivalence with what the owner ran

`sql/reference/azure_setup.sql` is byte-identical to `exepex/trading` `docs/migration/azure_setup.sql` at `a8cdad4`
(sha256 `7315f0ac0c110d607708f5e650a37440bcff9c95e5bbfa3de1e728a3be0c3491`). The earlier version `f557817` differs
only in being run in two parts (`\c omenix` by hand); same statements, same effect. CI proves on every push that the
reference gives `tests/reference_catalog.txt`, that `sql/00..40` gives `tests/expected_catalog.txt` (fresh, on top of
the reference, and on a second run), and that the two differ only by `tests/catalog_difference.txt`.

**Deliberate difference from the original's effect** (orchestrator decision, 12 Oct 2026): the owner roles' default
privileges revoke `EXECUTE` on new functions from `PUBLIC` (three global default-privilege lines). It must be global:
a per-schema `REVOKE` cannot remove PostgreSQL's built-in default. The real server needs `owner/apply_real.sh` once.
Every other difference acts only on drift; listed in `platform/README.md`.

## Doubts and limits (stated plainly)

1. **Azure-specific catalog lines** (some evidence): the expected catalog was produced on community PostgreSQL 16.
   On Azure the role-creation grants come from Azure's bootstrap superuser (printed as `<superuser>`, so they should
   match), but Azure may differ in details the builder cannot check without the server. The owner's snapshot diff
   decides; a difference is reviewed, not patched.
2. **Function `EXECUTE`**: fixed inside X1 (see above). The original's PUBLIC `EXECUTE` let `dashboard_app` run any
   function an owner role creates; a future function that a runtime role really needs gets a per-function grant.
   The new drift test for this found a real convergence gap (per-schema function grants were not revoked), now fixed.
3. **`public` schema `USAGE`** stays granted to `PUBLIC` (PostgreSQL default, as in the original). Nothing lives there
   today; anything an admin puts there with grants to `PUBLIC` would be readable by every role.
4. **Table-level grants on real tables** are outside X1: the matrix checks probe tables created through the default
   privileges. A migration that grants extra rights on a real table, or a table created by the admin instead of the
   owner role, is not caught by this matrix; each table story (P3, K1, W2) should run the matrix plus its own checks.
5. **Open firewall** (reasoning only): `0.0.0.0-255.255.255.255` lets anyone try passwords. Mitigations: TLS, least
   privilege, long random passwords, and the owner's `protect_server.sh` (CanNotDelete lock, email alert on more than
   10 failed connections in 15 minutes). The alert metric (`connections_failed`, documented by Microsoft for Flexible
   Server, enabled by default) counts every failed connection, not only wrong passwords, and names no user or address;
   the threshold of 10 is reasoning only.
6. **`app` defaults are schema-wide** (owner scope note, 12 Oct 2026): kept exactly as the original script set them;
   no `app` table is created or named and no table-specific grant exists. Narrowing per table is the W7 follow-up in
   `platform/README.md`. The restore test's temporary marker lives in `fno`, not `app`.
7. The restore, apply, protect and az scripts were syntax-checked and their logic (TLS check, matrix, snapshot) run against a local
   TLS-only PostgreSQL 16; the `az` calls themselves were never executed (no Azure access by design).

## Test results (builder)

- `PGHOST=localhost PGPORT=55432 platform/tests/ci.sh` against the `postgres:16` image (16.15): all steps passed,
  428 matrix checks: 372 passed, 0 failed, 56 OPEN named exceptions; 16/16 drifts caught and repaired; step 6: 21 OPEN
  left (only the self-change exceptions) once the admin may close the rest.
- Same against a local PostgreSQL 16.15 cluster: all passed.
- `cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build`: typecheck clean, 303 tests passed, build passed (web/ untouched).

## Answers to judge 3 (FAIL at 51ca61d)

| # | Finding | Answer | Proof |
|---|---|---|---|
| 1 | Real-server parts unrun (blocking, owner action) | Agreed; owner action. Checklist now 7 steps. | `owner/CHECKLIST_X1.md` |
| 2 | Criterion 2 not met: large objects, other databases, temp tables in `postgres`; false PASS on the real run | **Accepted and fixed as far as PostgreSQL allows.** Reproduced first (strong evidence). Matrix: `known:` checks for `lo_from_bytea`, `lo_create`, `lo_creat`, CONNECT and TEMPORARY on every other database (via `has_database_privilege`, which CI step 4 shows agrees with real connection and temp-table attempts), plus a strict "no large object exists" check. `sql/15_server_wide.sql` tries the revokes on every apply (a refusal is reported, not fatal; the admin grants itself CONNECT first so it cannot lock itself out) and prints what stays open; the owner's apply records Azure's answer. README and claims no longer say "cannot create anything"; four named exceptions with harm, mitigation and detection. Storage alert added. Found while fixing: a role can also change or remove its own password (named exception 4). | CI steps 4 and 6; `platform/README.md` "Named exceptions" |
| 3 | Timeouts presented as limits | **Accepted.** README: defaults, not limits; connection limits are the enforced ones. Persistent self-change: catalog snapshot line and failing matrix check, now proven by two drift tests made by the role itself. Enforceable limit: none in PostgreSQL 16 for a role's own setting; proposed (reasoning only, not built) an admin watchdog with `pg_terminate_backend`. | CI step 5 (`login:` drifts); README exception 3 |
| 4 | Stray `.snapshot.32020` | **Accepted.** Removed; `platform/evidence/.gitignore`; every owner script removes its temporary files with a trap inside the subshell. It came from my local test run that stopped mid-way. | a stopped run leaves no temp file (tested with a wrong admin name) |
| 5 | `restore_test.sh` leaves the marker after a stop | **Accepted.** A trap always drops the marker; after the restore started, a stop prints the scratch server's delete command (never deleted without typed confirmation). | `owner/restore_test.sh` (syntax-checked; needs Azure to run) |
| 6 | `check_tls.sh` ignores `require_secure_transport` | **Accepted.** RESULT requires it to be `on`. | `owner/check_tls.sh` |
| 7 | `server_evidence.sh` hard-codes expected values | **Accepted.** It reads them from the README's `server-settings` table; CI step 0 fails if a key is missing (tested by deleting a row). | CI step 0 |

Also fixed while doing this: `REVOKE` on a function by a role with no privilege on it is an **error**, not a
warning, so a naive revoke would have aborted `apply.sh` on a server where `PUBLIC` had already lost `EXECUTE`
(caught by CI step 6); `15_server_wide.sql` revokes only what is still open and turns a refusal into a notice.
