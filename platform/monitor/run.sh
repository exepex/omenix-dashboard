#!/usr/bin/env bash
# Entry point of the scheduled check (.github/workflows/db-check.yml). The repository is public, so this script prints
# to the run log, and puts in the alert issue, only a one-line summary: status, counts and check time. The details
# (what drifted, which database, sizes) go only to the owner's Slack channel (notify_slack.sh).
#   - no secret and DB_CHECK_ENABLED unset: not set up yet; a notice, exit 0;
#   - no secret but DB_CHECK_ENABLED=true: UNKNOWN (a lost secret is never a silent pass), alert, exit 2;
#   - otherwise db_check.sh: OK exit 0 (and the weekly heartbeat to Slack), ALERT exit 1 or UNKNOWN exit 2, alerted.
# Usage: run.sh [RUN_URL]
set -u
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
checked="$(date -u '+%Y-%m-%d %H:%M UTC')"

if [ -z "${PGPASSWORD:-}" ]; then
  if [ "${DB_CHECK_ENABLED:-}" != true ]; then
    echo "::notice::db-check is not set up yet (no secret OMENIX_DB_MONITOR_PASSWORD; see platform/README.md, Scheduled check)."
    exit 0
  fi
  printf 'Database check, %s\nRESULT: UNKNOWN (the secret OMENIX_DB_MONITOR_PASSWORD is missing although DB_CHECK_ENABLED=true)\n' \
    "$checked" > "$work/report.txt"
  code=2
else
  "$here/db_check.sh" > "$work/report.txt" 2>&1
  code=$?
fi

result="$(grep '^RESULT: ' "$work/report.txt" | tail -1)"
findings="$(printf '%s' "$result" | sed -n 's/^RESULT: ALERT (\([0-9]*\) finding.*/\1/p')"
unknown=0; case "$result" in "RESULT: UNKNOWN"*) unknown=1 ;; esac
grep -q '^UNKNOWN ' "$work/report.txt" && unknown=1
case "$code" in 0) status=OK ;; 1) status=ALERT ;; *) status=UNKNOWN ;; esac
summary="Database check $status: ${findings:-0} finding(s), unknown parts: $unknown, checked $checked"
echo "$summary"   # the only line in the public log

if [ "$code" -eq 0 ]; then
  # Weekly heartbeat (Mondays, 03:xx UTC run): its absence tells the owner the hourly check has stopped.
  if [ "${X1_HEARTBEAT:-$(date -u +%u%H)}" = 103 ] || [ "${X1_HEARTBEAT:-}" = 1 ]; then
    printf 'db-check heartbeat: last successful check of omenix-pg %s. If this weekly message stops, the hourly check has stopped (GitHub pauses schedules after 60 days without repository activity).\n' \
      "$checked" > "$work/heartbeat.txt"
    "$here/notify_slack.sh" "$work/heartbeat.txt" > /dev/null || echo "WARNING: weekly heartbeat not delivered to Slack"
  fi
  exit 0
fi

# Never a silent pass: the details go privately, and the public alert says only status, counts and whether they went.
{ echo "Database check of omenix-pg: $status (${1:-})"; echo; cat "$work/report.txt"; } > "$work/private.txt"
if "$here/notify_slack.sh" "$work/private.txt" > "$work/slack.txt" 2>&1; then private="yes"
else private="no ($(head -1 "$work/slack.txt"))"; fi
echo "details sent privately to the owner's Slack channel: $private"
"$here/alert.sh" "$summary. Details sent privately to the owner's Slack channel: $private." "${1:-}" \
  || echo "WARNING: the alert issue could not be raised; the failed run still e-mails the owner"
exit "$code"
