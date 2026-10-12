#!/usr/bin/env bash
# Apply platform/sql/00..40 in order as the server admin. Idempotent: safe to re-run; it converges the server to the
# declared roles, schemas and grants and never touches a password or a table's rows.
# Connection comes from libpq environment variables set by the caller (PGHOST, PGPORT, PGUSER = the admin,
# PGSSLMODE, PGSSLROOTCERT); psql prompts for the password unless the caller set PGPASSWORD or uses ~/.pgpass.
# Usage: platform/sql/apply.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
run() { psql -X -q -v ON_ERROR_STOP=1 -d "$1" -f "$here/$2"; }
run postgres 00_roles.sql
run postgres 10_database.sql
run omenix 20_schemas.sql
run omenix 30_grants.sql
run omenix 40_default_privileges.sql
echo "applied platform/sql 00-40 to database omenix on ${PGHOST:-local socket}"
