#!/usr/bin/env bash
# X1 end-to-end test on a disposable PostgreSQL 16 (CI service container or a local one). DESTRUCTIVE: drops the
# database "omenix" and the Omenix roles on the target. Never point it at a real server; it refuses a host ending in
# .postgres.database.azure.com.
#
# It proves, in order:
#   1. the owner's original script (sql/reference/azure_setup.sql) yields exactly tests/reference_catalog.txt, and
#      the declared state tests/expected_catalog.txt differs from it only by tests/catalog_difference.txt (the
#      deliberate change: no PUBLIC EXECUTE on the owner roles' functions);
#   2. platform/sql applied on top of that server converges it to expected_catalog.txt;
#   3. platform/sql on an empty server yields the same catalog, and a second run changes nothing (idempotent);
#   4. the role matrix passes for all seven roles;
#   5. the matrix catches drift (each injected drift makes it fail), and platform/sql removes the drift again;
#   6. the named exceptions are real (step 4 confirms them with real attempts); a large object made in another
#      database is detected even when omenix is closed (6a); and they close where the admin is allowed to close them
#      (12_large_objects.sql in every database, 15_server_wide.sql), without locking the admin out (6b).
# Like Azure, the admin is a non-superuser with only CREATEDB and CREATEROLE (role x1_admin, created here).
# Connection: PGHOST/PGPORT of a server where X1_SUPERUSER (default postgres) logs in without a password (trust).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
platform="$(dirname "$here")"
superuser="${X1_SUPERUSER:-postgres}"
case "${PGHOST:-}" in *.postgres.database.azure.com) echo "ci.sh refuses to run against Azure: $PGHOST" >&2; exit 2 ;; esac
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
unset PGDATABASE PGUSER PGPASSWORD

su_sql() { psql -X -q -v ON_ERROR_STOP=1 -U "$superuser" -d postgres "$@"; }
admin() { PGUSER=x1_admin "$@"; }
admin_sql() { local db="$1"; shift; PGUSER=x1_admin psql -X -q -v ON_ERROR_STOP=1 -d "$db" "$@"; }
snapshot() { admin_sql omenix -A -t -f "$here/catalog_snapshot.sql" > "$work/$1.txt"; }
same_as_expected() {
  if diff -u "$here/expected_catalog.txt" "$work/$1.txt"; then echo "ok: $2"; else echo "FAILED: $2" >&2; exit 1; fi
}
reset() {
  su_sql -c "DROP DATABASE IF EXISTS omenix WITH (FORCE)"
  # Undo step 6 of an earlier run: template databases back to the superuser, PostgreSQL's default PUBLIC rights.
  su_sql -c "ALTER DATABASE postgres OWNER TO $superuser" -c "ALTER DATABASE template1 OWNER TO $superuser" \
    -c "GRANT CONNECT, TEMPORARY ON DATABASE postgres TO PUBLIC" -c "GRANT CONNECT ON DATABASE template1 TO PUBLIC"
  for db in postgres template1; do lo_functions "$db" GRANT TO; done
  if [ "$(su_sql -At -c "SELECT count(*) FROM pg_roles WHERE rolname = 'x1_admin'")" = 1 ]; then
    su_sql -c "REVOKE ALL ON DATABASE postgres, template1 FROM x1_admin"
  fi
  for r in stock_owner fno_owner app_owner stock_writer fno_writer dashboard_app stock_inbox_reader x1_admin azure_pg_admin; do
    su_sql -c "DROP ROLE IF EXISTS $r"
  done
  su_sql -c "CREATE ROLE x1_admin LOGIN CREATEDB CREATEROLE"
}
# GRANT/REVOKE EXECUTE on the three large-object-creating functions to/from PUBLIC in one database, as the superuser.
lo_functions() {
  local f
  for f in 'lo_create(oid)' 'lo_creat(integer)' 'lo_from_bytea(oid, bytea)'; do
    su_sql -d "$1" -c "$2 EXECUTE ON FUNCTION pg_catalog.$f $3 PUBLIC"
  done
}
large_objects() { PGUSER=x1_admin "$here/large_objects.sh"; }
apply_platform() { PGOPTIONS="-c client_min_messages=warning" admin "$platform/sql/apply.sh" > /dev/null; }

echo "== 0. owner scripts read their expected server settings from platform/README.md"
"$platform/owner/server_evidence.sh" --list-expected > "$work/settings.txt" \
  || { cat "$work/settings.txt"; echo "FAILED: README server-settings table" >&2; exit 1; }
echo "ok: $(wc -l < "$work/settings.txt" | tr -d ' ') expected settings parsed from README.md"
"$here/owner_scripts_test.sh" > "$work/owner_tests.txt" \
  || { cat "$work/owner_tests.txt"; echo "FAILED: owner script tests" >&2; exit 1; }
echo "ok: owner scripts handle both az flag forms and az errors, and redact IP addresses ($(grep -c '^ok:' "$work/owner_tests.txt") checks)"

echo "== 1. the owner's original script"
reset
admin_sql postgres -f "$platform/sql/reference/azure_setup.sql" > /dev/null
snapshot reference
if diff -u "$here/reference_catalog.txt" "$work/reference.txt"; then
  echo "ok: reference/azure_setup.sql gives reference_catalog.txt"
else echo "FAILED: reference_catalog.txt" >&2; exit 1; fi
# The only allowed difference between the original's effect and platform/sql's is catalog_difference.txt.
diff "$here/reference_catalog.txt" "$here/expected_catalog.txt" | grep '^[<>]' > "$work/difference.txt" || true
if diff -u "$here/catalog_difference.txt" "$work/difference.txt"; then
  echo "ok: platform/sql differs from the original only by catalog_difference.txt"
else echo "FAILED: an undocumented difference from the original script" >&2; exit 1; fi

echo "== 2. platform/sql on top of the owner's server"
apply_platform
snapshot converged
same_as_expected converged "platform/sql on a server set up by the original script gives expected_catalog.txt"

echo "== 2b. the catalog accepts Azure's owner of schema public, and only it"
# On Azure, schema public belongs to azure_pg_admin (PUBLIC USAGE; the owner CREATE and USAGE), not pg_database_owner.
su_sql -c "CREATE ROLE azure_pg_admin NOLOGIN"
su_sql -d omenix -c "ALTER SCHEMA public OWNER TO azure_pg_admin"
snapshot azure
same_as_expected azure "schema public owned by azure_pg_admin (as on Azure) gives expected_catalog.txt"
su_sql -d omenix -c "ALTER SCHEMA public OWNER TO stock_owner"
snapshot other_owner
if diff -q "$here/expected_catalog.txt" "$work/other_owner.txt" > /dev/null; then
  echo "FAILED: schema public owned by stock_owner was not shown as drift" >&2; exit 1
fi
echo "ok: schema public owned by any other role (stock_owner) is shown as drift"
su_sql -d omenix -c "ALTER SCHEMA public OWNER TO pg_database_owner"

echo "== 3. platform/sql on an empty server, twice"
reset
apply_platform
snapshot fresh
same_as_expected fresh "platform/sql on an empty server gives expected_catalog.txt"
apply_platform
snapshot again
same_as_expected again "second run of platform/sql changes nothing"

echo "== 4. role matrix, all seven roles"
admin_sql omenix -f "$here/fixtures_up.sql"
"$here/role_matrix.sh" > "$work/matrix.txt" || { cat "$work/matrix.txt"; echo "FAILED: role matrix" >&2; exit 1; }
grep '^role matrix:' "$work/matrix.txt"
# The named exceptions are real, and the matrix's privilege checks agree with real attempts (same role, same server).
for r in stock_writer dashboard_app; do
  PGUSER=$r psql -X -q -d template1 -c "SELECT 1" > /dev/null 2>&1 || { echo "FAILED: $r expected to reach template1 here" >&2; exit 1; }
  PGUSER=$r psql -X -q -d postgres -c "CREATE TEMP TABLE x1_t (i int)" > /dev/null 2>&1 \
    || { echo "FAILED: $r expected a temp table in postgres here" >&2; exit 1; }
  lo="$(PGUSER=$r psql -X -q -A -t -d omenix -c "SELECT lo_from_bytea(0, 'x1'::bytea)")" \
    || { echo "FAILED: $r expected a large object here" >&2; exit 1; }
  admin_sql omenix -c "SET ROLE $r" -c "SELECT lo_unlink($lo)" > /dev/null 2>&1 \
    || su_sql -d omenix -c "SELECT lo_unlink($lo)" > /dev/null
done
large_objects > "$work/lo.txt" || { cat "$work/lo.txt"; echo "FAILED: large objects found" >&2; exit 1; }
echo "ok: named exceptions confirmed by real attempts (template1 connect, temp table in postgres, large object)"
echo "ok: no large object in any database; open per database: $(grep -c '^OPEN' "$work/lo.txt")"

echo "== 5. drift is caught (catalog and matrix) and removed by platform/sql"
# Each drift: who applies it (an owner role via SET ROLE, the admin, or login:<role> = the role itself) | SQL | the role
# whose matrix must then fail ("-": a latent drift with no effect a role
# can exercise today, e.g. a default grant on a schema the role cannot enter; only the catalog shows it)
drifts='stock_owner|GRANT CREATE ON SCHEMA stock TO stock_writer|stock_writer
app_owner|ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT DELETE ON TABLES TO dashboard_app|dashboard_app
fno_owner|ALTER DEFAULT PRIVILEGES GRANT SELECT ON TABLES TO stock_writer|-
fno_owner|ALTER DEFAULT PRIVILEGES GRANT DELETE ON TABLES TO dashboard_app|dashboard_app
stock_owner|GRANT USAGE ON SCHEMA stock TO fno_writer|fno_writer
x1_admin|GRANT TEMPORARY ON DATABASE omenix TO stock_inbox_reader|stock_inbox_reader
x1_admin|GRANT CREATE ON SCHEMA public TO PUBLIC|fno_writer
x1_admin|GRANT stock_owner TO stock_writer|stock_writer
x1_admin|GRANT dashboard_app TO stock_inbox_reader|stock_inbox_reader
x1_admin|ALTER ROLE fno_writer CONNECTION LIMIT 50|fno_writer
x1_admin|ALTER ROLE dashboard_app SET statement_timeout = 0|dashboard_app
x1_admin|ALTER ROLE app_owner CREATEDB|app_owner
stock_owner|ALTER DEFAULT PRIVILEGES IN SCHEMA stock GRANT EXECUTE ON FUNCTIONS TO dashboard_app|dashboard_app
fno_owner|ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO PUBLIC|fno_writer
login:dashboard_app|ALTER ROLE CURRENT_USER SET statement_timeout = 0|dashboard_app
login:stock_writer|ALTER ROLE CURRENT_USER SET statement_timeout = 0|stock_writer'
while IFS='|' read -r who sql victim; do
  case "$who" in
    x1_admin) admin_sql omenix -c "$sql" ;;
    login:*) PGUSER="${who#login:}" psql -X -q -v ON_ERROR_STOP=1 -d omenix -c "$sql" ;;  # the role itself
    *) admin_sql omenix -c "SET ROLE $who" -c "$sql" ;;
  esac
  # Recreate the probe tables so drifted default privileges reach them.
  admin_sql omenix -f "$here/fixtures_down.sql"
  admin_sql omenix -f "$here/fixtures_up.sql"
  admin_sql omenix -f "$here/fixtures_down.sql"
  snapshot drifted
  if diff -q "$here/expected_catalog.txt" "$work/drifted.txt" > /dev/null; then
    echo "FAILED: the catalog snapshot did not show drift: $sql" >&2; exit 1
  fi
  admin_sql omenix -f "$here/fixtures_up.sql"
  if [ "$victim" = "-" ]; then
    echo "ok: catalog shows latent drift: $sql"
  elif "$here/role_matrix.sh" "$victim" > "$work/drift.txt"; then
    cat "$work/drift.txt"; echo "FAILED: the matrix did not notice drift: $sql" >&2; exit 1
  else
    echo "ok: catalog shows drift and matrix fails ($(grep -c '^FAIL' "$work/drift.txt") checks of $victim): $sql"
  fi
  apply_platform
  admin_sql omenix -f "$here/fixtures_down.sql"
  snapshot repaired
  same_as_expected repaired "platform/sql removed the drift"
  admin_sql omenix -f "$here/fixtures_up.sql"
  "$here/role_matrix.sh" > "$work/matrix.txt" || { cat "$work/matrix.txt"; echo "FAILED: matrix after repair" >&2; exit 1; }
done <<< "$drifts"

echo "== 6a. exception 1 closed in omenix only, exception 2 open: a large object elsewhere is still caught"
lo_functions omenix REVOKE FROM
grep -q "^PASS  dashboard_app .*lo_from_bytea" <("$here/role_matrix.sh" dashboard_app) \
  || { echo "FAILED: large objects should be closed in omenix now" >&2; exit 1; }
lo="$(PGUSER=dashboard_app psql -X -q -A -t -d postgres -c "SELECT lo_from_bytea(0, 'x1'::bytea)")" \
  || { echo "FAILED: expected dashboard_app to create a large object in postgres" >&2; exit 1; }
if large_objects > "$work/lo6a.txt"; then
  cat "$work/lo6a.txt"; echo "FAILED: a large object in postgres was not detected" >&2; exit 1
fi
grep '^FAIL' "$work/lo6a.txt"
grep -q '^OPEN  database postgres' "$work/lo6a.txt" || { echo "FAILED: postgres should be reported OPEN" >&2; exit 1; }
su_sql -c "SELECT lo_unlink($lo)" > /dev/null
echo "ok: with omenix closed, a large object made in postgres is detected"

echo "== 6b. where the admin may close them, the named exceptions close"
# Like an Azure admin that owns the template databases; the large-object functions can only be revoked by a
# superuser here (PostgreSQL's bootstrap superuser owns them), standing in for a server where the admin can.
su_sql -c "ALTER DATABASE postgres OWNER TO x1_admin" -c "ALTER DATABASE template1 OWNER TO x1_admin"
for db in postgres template1; do lo_functions "$db" REVOKE FROM; done
PGOPTIONS="-c client_min_messages=warning" admin "$platform/sql/apply.sh" > "$work/apply6.txt"
grep -q '(0 rows)' "$work/apply6.txt" || { cat "$work/apply6.txt"; echo "FAILED: 15_server_wide.sql left something open" >&2; exit 1; }
if grep 'still open for PUBLIC: lo_' "$work/apply6.txt"; then echo "FAILED: 12_large_objects.sql left something open" >&2; exit 1; fi
admin_sql postgres -c "SELECT 1" > /dev/null || { echo "FAILED: the admin locked itself out of postgres" >&2; exit 1; }
for r in stock_writer dashboard_app; do
  if PGUSER=$r psql -X -q -d template1 -c "SELECT 1" > /dev/null 2>&1; then echo "FAILED: $r still reaches template1" >&2; exit 1; fi
  if PGUSER=$r psql -X -q -d postgres -c "SELECT 1" > /dev/null 2>&1; then echo "FAILED: $r still reaches postgres" >&2; exit 1; fi
done
large_objects > "$work/lo6b.txt" || { cat "$work/lo6b.txt"; echo "FAILED: large objects after closing" >&2; exit 1; }
if grep '^OPEN' "$work/lo6b.txt"; then echo "FAILED: large-object functions still open somewhere" >&2; exit 1; fi
"$here/role_matrix.sh" > "$work/matrix6.txt" || { cat "$work/matrix6.txt"; echo "FAILED: matrix after closing" >&2; exit 1; }
open_left="$(grep '^OPEN  ' "$work/matrix6.txt" | grep -v -e 'statement_timeout' -e 'PASSWORD' || true)"
[ -z "$open_left" ] || { echo "$open_left"; echo "FAILED: exceptions still open after closing" >&2; exit 1; }
grep '^role matrix:' "$work/matrix6.txt"
echo "ok: large objects (every database) and other databases closed; only the self-change exceptions stay open"

admin_sql omenix -f "$here/fixtures_down.sql"
reset
echo "X1 platform tests: all passed"
