#!/usr/bin/env bash
# Entry point of the scheduled check (.github/workflows/db-check.yml): run db_check.sh; on a finding, raise the alert
# (alert.sh) and exit 1 so the workflow run fails, which GitHub also e-mails to the owner.
# Usage: run.sh [RUN_URL]
set -u
here="$(cd "$(dirname "$0")" && pwd)"
report="$(mktemp)"; trap 'rm -f "$report"' EXIT
if "$here/db_check.sh" > "$report" 2>&1; then
  cat "$report"
  exit 0
fi
cat "$report"
"$here/alert.sh" "$report" "${1:-}" || echo "WARNING: the alert could not be raised (see above); the failed run still e-mails the owner"
exit 1
