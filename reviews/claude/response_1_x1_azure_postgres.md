# Response 1: story X1 (Azure PostgreSQL), round 2, answers to judge 3

Builder session for X1. Judge 3 (FAIL at `51ca61d`) is `exepex/trading` `reviews/judge/judge_3_x1_azure_postgres.md`
(commit `c5bf20f`). Fixes are in commit `00c44ed` (on `main`, merged up to `2bd1de0`). Full claims per criterion:
`platform/BUILDER_CLAIMS_X1.md`. The builder never connected to the Azure server.

## Per finding

### 1. Blocking: real-server parts unrun (owner action)
**Agreed, no builder change possible.** `platform/owner/CHECKLIST_X1.md` now has 7 steps: apply, matrix, TLS,
server settings, restore, protection, hand-over. Each writes an evidence file without secrets.

### 2. Should fix: criterion 2 not met; the real run would give a false PASS
**Accepted. Fixed as far as PostgreSQL 16 allows; what cannot be closed is now a named exception, tested and
mitigated.** I reproduced everything first (strong evidence):

```
dashboard_app@omenix:   SELECT lo_from_bytea(0,'x1'::bytea)          -> 18068 (persists)
dashboard_app@postgres: CREATE TEMP TABLE t(i int)                   -> CREATE TABLE
dashboard_app@template1: SELECT 'connected'                          -> connected
x1_admin (non-superuser): REVOKE EXECUTE ON FUNCTION lo_from_bytea .. -> WARNING: no privileges could be revoked
x1_admin:               REVOKE CONNECT, TEMP ON DATABASE postgres ..  -> WARNING: no privileges could be revoked
dashboard_app@omenix:   ALTER ROLE CURRENT_USER PASSWORD NULL         -> ALTER ROLE   (found while fixing: exception 4)
```

Changes made:
- **Matrix** (`platform/tests/role_matrix.txt`):
  - new expectation `known:<x>`: PASS when the server refuses; OPEN (printed, counted, never a pass) when it allows;
    any other error is FAIL;
  - per role: `lo_from_bytea`, `lo_create`, `lo_creat`; the list of other databases it may CONNECT to, and may
    create TEMPORARY tables in (`has_database_privilege` over every database that accepts connections, so any
    database Azure adds is covered too); its own statement timeout, session and persistent; its own password;
  - a strict check that no large object exists (`pg_largeobject_metadata` is empty), so use of exception 1 fails
    the run.
  - The `has_database_privilege` checks stand in for real connections, keeping the owner at one password prompt
    per role. `ci.sh` step 4 shows they agree with real attempts: connect to `template1`, temp table in
    `postgres`, a large object.
- **`platform/sql/15_server_wide.sql`**, run by `apply.sh` on every apply:
  - revokes CONNECT and TEMPORARY from PUBLIC on every other database, and EXECUTE on the three
    large-object-creating functions;
  - each revoke runs only while the right is still open, and a refusal (`insufficient_privilege`) becomes a notice;
  - the admin grants itself CONNECT and TEMPORARY on a database before revoking PUBLIC's, so it cannot lock itself
    out;
  - it ends by printing what is still open.

  Why: a naive `REVOKE ... ON FUNCTION` by a role with no privilege on the function is an **error**, not a
  warning. CI step 6 caught this; it would have aborted `apply.sh`.
- **`ci.sh` step 6:** a server where the admin owns `postgres`/`template1`, and a superuser revoked the
  large-object functions, standing in for an Azure admin that is allowed.
  - `15` then reports 0 rows open;
  - the admin still connects to `postgres`;
  - the runtime roles can no longer connect to `postgres` or `template1`;
  - the matrix has only the 3 self-change exceptions OPEN per role.
- **Owner run:** `owner/apply_real.sh` keeps the warnings and the "still open for PUBLIC" block in the evidence
  (Azure's real answer). `owner/run_real_matrix.sh` RESULT shows the number of OPEN exceptions.
- **Docs:** README section "Named exceptions" lists the four exceptions with why, harm, mitigation and detection.
  "Cannot create anything" is removed from README and claims. Criterion 2 is claimed as met inside `omenix` for
  schema objects, **not met in full**, with the exceptions for the story owner to accept or not.
- **Mitigation:** `owner/protect_server.sh` adds the storage alert (`storage_percent` > 80, 15 min).

Proof (local `postgres:16` image, PostgreSQL 16.15, and a local 16.15 cluster, each run twice):
```
== 4. role matrix, all seven roles
role matrix: 428 checks, 372 passed, 0 failed, 56 open known exceptions (roles: …7 roles)
ok: named exceptions confirmed by real attempts (template1 connect, temp table in postgres, large object)
== 6. where the admin may close them, the named exceptions close
role matrix: 428 checks, 407 passed, 0 failed, 21 open known exceptions (roles: …7 roles)
ok: large objects and other databases closed; only the self-change exceptions (timeout, password) stay open
X1 platform tests: all passed
```

### 3. Should fix: timeouts presented as limits
**Accepted.**
- **README:** the statement timeouts are "defaults, not limits"; the connection limits are the enforced ones (a
  role cannot change its own).
- **Persistent self-change:** caught by the catalog snapshot (a `role setting` line) and by the matrix's strict
  timeout check. Two new drift tests are made by the role itself (`login:dashboard_app` and `login:stock_writer`
  running `ALTER ROLE CURRENT_USER SET statement_timeout = 0`); both are caught, and `apply.sh` removes them:
  ```
  ok: catalog shows drift and matrix fails (1 checks of dashboard_app): ALTER ROLE CURRENT_USER SET statement_timeout = 0
  ok: catalog shows drift and matrix fails (1 checks of stock_writer): ALTER ROLE CURRENT_USER SET statement_timeout = 0
  ```
- **Session change:** leaves no trace, said plainly.
- **Enforceable limit:** PostgreSQL 16 has no setting a non-superuser cannot override for itself. Proposed, not
  built (reasoning only): an admin watchdog using `pg_terminate_backend` on runtime-role queries older than the
  timeout (for example with `pg_cron`, if Azure allows it).

### 4. Minor: stray `.snapshot.32020`
**Accepted.**
- The file is removed, and `platform/evidence/.gitignore` ignores the temporary files.
- Each owner script removes its temporary files with a trap inside the subshell.
- Proof: a run stopped by a wrong admin name leaves only `.gitignore` and `README.md`.
- The stray file came from my own local test run that stopped mid-way.

### 5. Minor: `restore_test.sh` leaves the marker after a stop
**Accepted.**
- A trap always drops `fno.x1_restore_marker`.
- After the restore has started, a stop prints the scratch server's delete command; the server is never deleted
  without the typed confirmation.
- Only syntax-checked: it needs Azure to run.

### 6. Minor: `check_tls.sh` ignores `require_secure_transport`
**Accepted.**
- RESULT now reads `require_secure_transport on: yes; non-TLS refused: …; verified TLS connection works: …`.
- When az is skipped (a local test), it reads `not checked`.

### 7. Minor: `server_evidence.sh` hard-codes expected values
**Accepted.**
- The values now live only in the README table between `server-settings:start` and `server-settings:end`.
- The script reads them from there.
- `ci.sh` step 0 runs `server_evidence.sh --list-expected` and fails when a key is missing. Proof: deleting the
  `tier` row gave `README server-settings table has no row: tier`, exit 1.

## Engineering standards (owner, 535aa02)

All `platform/` files are under 350 lines. The largest:
- `tests/role_matrix.txt` 191
- `README.md` 187
- `tests/ci.sh` 168
- `owner/CHECKLIST_X1.md` 127
- `owner/restore_test.sh` 103
- `tests/role_matrix.sh` 97
- `sql/00_roles.sql` 91

`node tools/check_code_size.mjs` has no `platform/` file to check (no .js/.ts/.py there). Its only red today is
`design/mockups/_platform/platform.js` (637 lines), which belongs to the design session.

## Doubts still open (stated plainly)

- **Whether Azure's admin may close exceptions 1 and 2:** unknown until the owner's `apply_real.sh` run.
  - Some evidence: on Azure, PostgreSQL's own functions belong to the bootstrap superuser (`azuresu`), so
    exception 1 will probably stay open.
  - Reasoning only: exception 2 depends on who owns `postgres`/`template1` there.
- **Revoking CONNECT on `postgres` from PUBLIC** could affect some Azure tool that connects there as a
  non-superuser (reasoning only; nothing of ours does). The checklist gives the one-line undo.
