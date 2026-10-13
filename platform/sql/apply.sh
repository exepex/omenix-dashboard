#!/usr/bin/env bash
# Apply platform/sql/00..40 in order as the server admin (12 in every database it can reach, the rest once). Idempotent: safe to re-run; it converges the server to the
# declared roles, schemas and grants and never touches a password or a table's rows.
# Connection comes from libpq environment variables set by the caller (PGHOST, PGPORT, PGUSER = the admin,
# PGSSLMODE, PGSSLROOTCERT); psql prompts for the password unless the caller set PGPASSWORD or uses ~/.pgpass.
# Usage: platform/sql/apply.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
run() { psql -X -q -v ON_ERROR_STOP=1 -d "$1" -f "$here/$2"; }
run postgres 00_roles.sql
run postgres 10_database.sql
# Step 12 runs in every database the admin may connect to (function rights are per database). A database the admin
# cannot reach (e.g. one Azure keeps for itself) is reported and skipped; any SQL error still stops the run.
# The list goes into a variable first: set -e checks a plain assignment, not a $(...) inside a "for ... in" list.
dbs="$(psql -X -A -t -d omenix -c "SELECT datname FROM pg_database WHERE datallowconn AND has_database_privilege(datname, 'CONNECT') ORDER BY datname")"
for db in $dbs; do
  rc=0
  psql -X -q -A -t -v ON_ERROR_STOP=1 -d "$db" -f "$here/12_large_objects.sql" || rc=$?
  if [ "$rc" -eq 2 ]; then echo "database $db: not reachable by the admin, large objects not checked"
  elif [ "$rc" -ne 0 ]; then exit "$rc"; fi
done
run omenix 15_server_wide.sql
run omenix 20_schemas.sql
run omenix 30_grants.sql
run omenix 40_default_privileges.sql
echo "applied platform/sql 00-40 to database omenix on ${PGHOST:-local socket}"
