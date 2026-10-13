#!/usr/bin/env bash
# Entry point of the scheduled check (.github/workflows/db-check.yml): run db_check.sh; on a finding (exit 1) or when
# the server could not be checked (exit 2), raise the alert (alert.sh) and exit with that code, so the workflow run
# fails, which GitHub also e-mails to the owner.
# Usage: run.sh [RUN_URL]
set -u
here="$(cd "$(dirname "$0")" && pwd)"
report="$(mktemp)"; trap 'rm -f "$report"' EXIT
"$here/db_check.sh" > "$report" 2>&1
code=$?
cat "$report"
[ "$code" -eq 0 ] && exit 0
# 1 = ALERT (a finding), 2 = UNKNOWN (could not check): both are raised, never a silent pass.
"$here/alert.sh" "$report" "${1:-}" || echo "WARNING: the alert could not be raised (see above); the failed run still e-mails the owner"
exit "$code"
