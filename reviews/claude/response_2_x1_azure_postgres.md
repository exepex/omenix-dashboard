# Response 2: story X1 (Azure PostgreSQL), round 3, answers to judge 5

Judge 5 (re-judge, FAIL) is `exepex/trading` `reviews/judge/judge_5_x1_azure_postgres_rejudge.md` (merge `7846936`).
Round 2 is `response_1_x1_azure_postgres.md`. Fixes are in the commit that adds this file. The builder never
connected to the Azure server.

## A. Should fix: exception 2 understates the harm; revokes and detection only in `omenix`

**Accepted.** Function rights are per database, so `15_server_wide.sql` closed large objects in `omenix` only, and
the detection counted only `omenix`. Reproduced (strong evidence): with `omenix` closed, `dashboard_app` created a
large object in `postgres`.

The four expected items:
1. **README rows 1 and 2** now say it. Exception 1 covers every database the role may connect to. Exception 2's harm
   is "disk fill, as for exception 1", because large objects in `postgres` persist. The storage alert is
   server-wide, so it covers every database.
2. **New `platform/sql/12_large_objects.sql`, run by `apply.sh` in every database the admin may connect to.**
   - It revokes EXECUTE on `lo_create`, `lo_creat` and `lo_from_bytea` from PUBLIC, only while open.
   - A refusal becomes a notice, and each database prints one line saying what stays open.
   - A database the admin cannot reach (psql exit 2) is reported and skipped; any SQL error still stops the run.
   - Closing them in `template1` also closes them in databases created later.
   - `15_server_wide.sql` now handles only CONNECT and TEMPORARY on the other databases.
3. **New `platform/tests/large_objects.sh`**, run as the admin. It counts `pg_largeobject_metadata` in every
   database that accepts connections:
   - it fails on any large object;
   - it fails if PUBLIC may connect to a database the admin cannot check;
   - it reports OPEN per database while PUBLIC may still create large objects there.

   It runs in CI step 4 and in `owner/run_real_matrix.sh`, whose RESULT now includes
   `no large objects anywhere: yes/no`.
4. **CI step 6a**, "exception 1 closed, exception 2 open":
   - the large-object functions are revoked in `omenix` only, and the matrix shows those checks PASS there;
   - `dashboard_app` creates a large object in `postgres`;
   - `large_objects.sh` fails, with `FAIL database postgres: 1 large object(s) exist`, and reports `postgres` as
     OPEN.

   Step 6b now closes large objects in every database and asserts that no OPEN line is left.

Proof (`postgres:16` image 16.15, and a local 16.15 cluster run twice):
```
== 4. role matrix, all seven roles
role matrix: 428 checks, 372 passed, 0 failed, 56 open known exceptions
ok: no large object in any database; open per database: 3
== 6a. exception 1 closed in omenix only, exception 2 open: a large object elsewhere is still caught
FAIL  database postgres: 1 large object(s) exist
ok: with omenix closed, a large object made in postgres is detected
== 6b. where the admin may close them, the named exceptions close
role matrix: 428 checks, 407 passed, 0 failed, 21 open known exceptions
ok: large objects (every database) and other databases closed; only the self-change exceptions stay open
X1 platform tests: all passed
```
Owner scripts against a local TLS-only copy:
- `apply_real.sh` printed one large-object line per database (`omenix`, `postgres`, `template1`).
- `run_real_matrix.sh` ended with
  `RESULT: matrix passed: yes; snapshot identical: yes; no large objects anywhere: yes; open named exceptions: 32`.

## B. Minor: `role_matrix.txt:26` names `05_server_wide.sql`

**Accepted.** It now names `sql/12_large_objects.sql` (every database) and `sql/15_server_wide.sql`.
`grep -rn 05_server platform/` finds only the answer line in `BUILDER_CLAIMS_X1.md`.

## Sizes (350-line rule)

Largest `platform/` files:
- `tests/ci.sh` 195
- `README.md` 192
- `tests/role_matrix.txt` 191

All are under 350.
