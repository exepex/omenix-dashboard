#!/usr/bin/env bash
# Scheduled read-only check of omenix-pg for the owner's accepted exceptions (issue #2). Run as db_monitor, which can
# read catalogs and large-object sizes only (platform/README.md, "Scheduled check"). Prints a report and exits 1 when
# anything needs the owner's attention:
#   1. large objects: in any database, more bytes than X1_LO_MAX_BYTES (default 50 MiB) - named exceptions 1 and 2;
#   2. drift: the catalog (roles' attributes and settings such as a persistent statement_timeout, memberships, grants,
#      default privileges) differs from platform/tests/expected_catalog.txt - named exception 3 and any other change;
#   3. password changes: NOT detectable by a read-only role (pg_authid is superuser-only and PostgreSQL keeps no change
#      time); the report says so on every run.
# Connection: libpq environment (PGHOST, PGUSER=db_monitor, PGPASSWORD, PGSSLMODE, PGSSLROOTCERT) set by the caller.
# The report holds no secret; IP addresses (in connection errors) are replaced by <IP address>.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
platform="$(dirname "$here")"
export X1_LO_MAX_BYTES="${X1_LO_MAX_BYTES:-52428800}"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
alerts=0

{
  echo "Database check of ${PGHOST:-local socket} as ${PGUSER:-?}, $(date -u '+%Y-%m-%d %H:%M UTC')"
  echo
  echo "== 1. large objects in every database (limit $X1_LO_MAX_BYTES bytes each)"
  "$platform/tests/large_objects.sh" || alerts=$((alerts + 1))
  echo
  echo "== 2. catalog compared with platform/tests/expected_catalog.txt (lines with < expected, > found)"
  if psql -X -A -t -d omenix -f "$platform/tests/catalog_snapshot.sql" > "$work/catalog.txt" 2> "$work/err.txt"; then
    if diff "$platform/tests/expected_catalog.txt" "$work/catalog.txt" > "$work/diff.txt"; then
      echo "PASS  catalog identical"
    else
      grep '^[<>]' "$work/diff.txt"; echo "FAIL  catalog differs (drift)"; alerts=$((alerts + 1))
    fi
  else
    cat "$work/err.txt"; echo "FAIL  catalog could not be read"; alerts=$((alerts + 1))
  fi
  echo
  echo "== 3. password changes"
  echo "INFO  not detectable read-only (pg_authid is superuser-only; no change time is kept). A deployment locked out"
  echo "      by a changed password shows as failed connections, which the Azure alert omenix-pg-failed-connections covers."
  echo
  if [ "$alerts" -eq 0 ]; then echo "RESULT: OK"; else echo "RESULT: ALERT ($alerts finding(s))"; fi
} 2>&1 | awk -f "$platform/owner/redact_ips.awk" > "$work/report.txt"
cat "$work/report.txt"
grep -q '^RESULT: OK$' "$work/report.txt"
