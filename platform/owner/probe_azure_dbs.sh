#!/usr/bin/env bash
# Owner step for issue #3 (exception 2): does Azure let a runtime role into its own databases? Tries a real connection
# as dashboard_app (psql asks its password, hidden) to azure_maintenance and azure_sys, and records for each whether
# the server refused it. This is needed because pg_hba rules can name users, so db_monitor being refused does not
# prove it for every role. Run on the owner's Mac from the repository root:   platform/owner/probe_azure_dbs.sh
# Output: platform/evidence/<date>-x1-azure-dbs.txt (no secrets; IP addresses replaced by <IP address>).
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/lib.sh"
need_psql16
mkdir -p "$evidence_dir"
out="$evidence_dir/$today-x1-azure-dbs.txt"
role="${X1_PROBE_ROLE:-dashboard_app}"
printf 'Password for %s (hidden): ' "$role" > /dev/tty; read -rs password < /dev/tty; echo > /dev/tty
record_evidence "$out"
echo "Connection probe of Azure's own databases on $host as $role, $(date -u '+%Y-%m-%d %H:%M UTC')"
try() { PGUSER="$role" PGPASSWORD="$password" psql -X -A -t -d "$1" -c "SELECT 'connected'" 2>&1; }
# First prove the password: otherwise a typo would look like a refusal, a false "closed".
[ "$(try omenix)" = connected ] || { unset password; die "$role could not log in to omenix (password?); nothing recorded"; }
open=0; unclear=0
for db in ${X1_PROBE_DBS:-azure_maintenance azure_sys}; do   # X1_PROBE_DBS: only for tests
  answer="$(try "$db")"
  if [ "$answer" = connected ]; then
    echo "OPEN     $db: $role can connect (exception 2 is open here in practice)"; open=$((open + 1))
  elif printf '%s' "$answer" | grep -qE 'no pg_hba\.conf entry|permission denied for database|not permitted to log in|pg_hba\.conf rejects connection'; then
    echo "CLOSED   $db: the server's access rules refuse $role: $(printf '%s' "$answer" | head -1 | redact_ips)"
  else
    echo "UNCLEAR  $db: not a refusal by access rules, so nothing is proven: $(printf '%s' "$answer" | head -1 | redact_ips)"
    unclear=$((unclear + 1))
  fi
done
unset password
total="$(printf '%s\n' ${X1_PROBE_DBS:-azure_maintenance azure_sys} | grep -c .)"
echo; echo "RESULT: Azure databases $role can reach: $open of $total; unclear: $unclear"
