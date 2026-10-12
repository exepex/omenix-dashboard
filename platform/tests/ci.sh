#!/usr/bin/env bash
# X1 end-to-end test on a disposable PostgreSQL 16 (CI service container or a local one). DESTRUCTIVE: drops the
# database "omenix" and the Omenix roles on the target. Never point it at a real server; it refuses a host ending in
# .postgres.database.azure.com.
#
# It proves, in order:
#   1. the owner's original script (sql/reference/azure_setup.sql) yields exactly tests/expected_catalog.txt;
#   2. platform/sql applied on top of that server changes nothing (same catalog);
#   3. platform/sql on an empty server yields the same catalog, and a second run changes nothing (idempotent);
#   4. the role matrix passes for all seven roles;
#   5. the matrix catches drift (each injected drift makes it fail), and platform/sql removes the drift again.
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
  for r in stock_owner fno_owner app_owner stock_writer fno_writer dashboard_app stock_inbox_reader x1_admin; do
    su_sql -c "DROP ROLE IF EXISTS $r"
  done
  su_sql -c "CREATE ROLE x1_admin LOGIN CREATEDB CREATEROLE"
}
apply_platform() { PGOPTIONS="-c client_min_messages=warning" admin "$platform/sql/apply.sh" > /dev/null; }

echo "== 1. the owner's original script"
reset
admin_sql postgres -f "$platform/sql/reference/azure_setup.sql" > /dev/null
snapshot reference
same_as_expected reference "reference/azure_setup.sql gives expected_catalog.txt"

echo "== 2. platform/sql on top of the owner's server"
apply_platform
snapshot converged
same_as_expected converged "platform/sql changes nothing on a server set up by the original script"

echo "== 3. platform/sql on an empty server, twice"
reset
apply_platform
snapshot fresh
same_as_expected fresh "platform/sql on an empty server gives the same catalog as the original script"
apply_platform
snapshot again
same_as_expected again "second run of platform/sql changes nothing"

echo "== 4. role matrix, all seven roles"
admin_sql omenix -f "$here/fixtures_up.sql"
"$here/role_matrix.sh" > "$work/matrix.txt" || { cat "$work/matrix.txt"; echo "FAILED: role matrix" >&2; exit 1; }
tail -1 "$work/matrix.txt"

echo "== 5. drift is caught (catalog and matrix) and removed by platform/sql"
# Each drift: who applies it | SQL | the role whose matrix must then fail ("-": a latent drift with no effect a role
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
x1_admin|ALTER ROLE app_owner CREATEDB|app_owner'
while IFS='|' read -r who sql victim; do
  if [ "$who" = x1_admin ]; then admin_sql omenix -c "$sql"
  else admin_sql omenix -c "SET ROLE $who" -c "$sql"; fi
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

admin_sql omenix -f "$here/fixtures_down.sql"
echo "X1 platform tests: all passed"
