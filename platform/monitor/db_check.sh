#!/usr/bin/env bash
# Scheduled read-only check of omenix-pg for the owner's accepted exceptions (issue #2). Run as db_monitor, which can
# read catalogs and large-object sizes only (platform/README.md, "Scheduled check"). Prints a report and exits 0 (OK),
# 1 (ALERT: something needs the owner's attention) or 2 (UNKNOWN: the server could not be checked; never a silent pass):
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
redact() { awk -f "$platform/owner/redact_ips.awk"; }

# Can we check at all? If not, say UNKNOWN at once (short job, and never mistaken for OK).
if ! psql -X -A -t -d omenix -c "SELECT 1" > /dev/null 2> "$work/connect.txt"; then
  { echo "Database check of ${PGHOST:-local socket} as ${PGUSER:-?}, $(date -u '+%Y-%m-%d %H:%M UTC')"
    echo; sed 's/^/      /' "$work/connect.txt"
    echo; echo "RESULT: UNKNOWN (could not connect; nothing was checked)"; } | redact
  exit 2
fi

{
  echo "Database check of ${PGHOST:-local socket} as ${PGUSER:-?}, $(date -u '+%Y-%m-%d %H:%M UTC')"
  echo
  echo "== 1. large objects in every database (limit $X1_LO_MAX_BYTES bytes each)"
  "$platform/tests/large_objects.sh"
  case $? in 0) ;; 1) alerts=$((alerts + 1)) ;; *) echo "UNKNOWN  the database list could not be read"; echo "unknown" > "$work/unknown" ;; esac
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
  if [ "$alerts" -gt 0 ]; then echo "RESULT: ALERT ($alerts finding(s))"
  elif [ -f "$work/unknown" ]; then echo "RESULT: UNKNOWN (part of the check could not run)"
  else echo "RESULT: OK"; fi
} 2>&1 | redact > "$work/report.txt"
cat "$work/report.txt"
case "$(grep '^RESULT: ' "$work/report.txt")" in
  "RESULT: OK") exit 0 ;;
  "RESULT: ALERT"*) exit 1 ;;
  *) exit 2 ;;
esac
