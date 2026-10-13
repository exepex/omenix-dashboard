#!/usr/bin/env bash
# Owner step for issue #2, the scheduled database check: one run sets everything up, and re-running it rotates the
# monitor's password. Run on the owner's Mac from the repository root:   platform/owner/setup_monitor.sh
#   1. applies platform/sql as the admin (creates the read-only role db_monitor and its CONNECT grants);
#   2. generates a 40-character random password for db_monitor. Nobody types or sees it: it lives only in this
#      script's memory, then in the GitHub secret;
#   3. stores it in the database as a SCRAM-SHA-256 verifier computed on this Mac (owner/scram_verifier.py), so the
#      plain password never reaches the server;
#   4. runs the check once as db_monitor (the first real run, printed below);
#   5. saves the password as the repository secret OMENIX_DB_MONITOR_PASSWORD, and (asked once, hidden) the Slack
#      incoming webhook for #fno-desk as OMENIX_DB_ALERT_WEBHOOK for the private details (CHECKLIST_MONITOR.md says
#      how to create it); sets the variable DB_CHECK_ENABLED=true (from then on a lost secret is UNKNOWN, never a
#      silent pass); starts the workflow once.
# Asks for the admin user name and password and the webhook URL (all hidden; Enter keeps the webhook already saved). Needs psql 16+, python3 and gh (logged in: gh auth login).
# Output: platform/evidence/<date>-monitor-setup.txt: status lines only, never a password, token, verifier or the
# first check's details or the webhook URL (the repository is public; the details are printed on this screen only).
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/lib.sh"
repo="${X1_REPO:-exepex/omenix-dashboard}"
need_psql16
command -v python3 > /dev/null || die "python3 not found (xcode-select --install, or brew install python)"
command -v gh > /dev/null || die "gh not found (brew install gh, then gh auth login)"
gh auth status > /dev/null 2>&1 || die "not logged in to GitHub (run: gh auth login)"
mkdir -p "$evidence_dir"
out="$evidence_dir/$today-monitor-setup.txt"
ask_admin
printf 'Slack webhook URL for #fno-desk (hidden; Enter to keep the one already saved): ' > /dev/tty
read -rs webhook < /dev/tty; echo > /dev/tty
case "$webhook" in
  ""|https://hooks.slack.com/services/*) ;;
  *) die "that is not a Slack incoming webhook URL (it starts with https://hooks.slack.com/services/); nothing was changed" ;;
esac
record_evidence "$out"
echo "Scheduled check setup on $host, $(date -u '+%Y-%m-%d %H:%M UTC')"

echo; echo "== 1. apply platform/sql (creates db_monitor)"
PGUSER="$X1_ADMIN" PGPASSWORD="$admin_password" PGOPTIONS="-c client_min_messages=warning" "$platform/sql/apply.sh" \
  || die "apply failed (each file runs in one transaction, so a failed file changed nothing)"

echo; echo "== 2-3. new password for db_monitor, stored as a SCRAM verifier"
password="$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 40)"
[ "${#password}" -eq 40 ] || die "could not generate a password"
verifier="$(printf '%s' "$password" | python3 -I "$here/scram_verifier.py")" || die "could not compute the verifier"
# The statement goes through psql's stdin, not its arguments; errors are not printed, because they would quote it.
admin_psql -d omenix -f - > /dev/null 2>&1 <<SQL || die "could not set db_monitor's password"
ALTER ROLE db_monitor PASSWORD '$verifier';
SQL
unset verifier
echo "password set"

echo; echo "== 4. first check as db_monitor (details on this screen only, not in the evidence file)"
PGUSER=db_monitor PGPASSWORD="$password" "$platform/monitor/db_check.sh" > /dev/tty 2>&1
check=$?

echo; echo "== 5. GitHub secret and a first workflow run"
if printf '%s' "$password" | gh secret set OMENIX_DB_MONITOR_PASSWORD -R "$repo" > /dev/null; then
  secret_ok=yes; echo "secret OMENIX_DB_MONITOR_PASSWORD saved in $repo"
else
  secret_ok=no; echo "WARNING: the secret was not saved; run this script again (it sets a new password)"
fi
unset password
if [ -n "$webhook" ]; then
  if printf '%s' "$webhook" | gh secret set OMENIX_DB_ALERT_WEBHOOK -R "$repo" > /dev/null; then
    echo "secret OMENIX_DB_ALERT_WEBHOOK saved in $repo"
  else
    secret_ok=no; echo "WARNING: the Slack webhook was not saved; run this script again"
  fi
fi
unset webhook
if [ "$secret_ok" = yes ] && gh variable set DB_CHECK_ENABLED --body true -R "$repo" > /dev/null; then
  echo "variable DB_CHECK_ENABLED=true set: a missing secret is now reported as UNKNOWN"
fi
if [ "$secret_ok" = yes ] && gh workflow run db-check.yml -R "$repo" > /dev/null 2>&1; then
  echo "workflow db-check started: https://github.com/$repo/actions/workflows/db-check.yml"
fi

case "$check" in 0) first=OK ;; 1) first=ALERT ;; *) first=UNKNOWN ;; esac
echo; echo "RESULT: db_monitor ready; first check: $first; GitHub secret saved: $secret_ok"
