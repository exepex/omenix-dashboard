#!/usr/bin/env bash
# Issue #2: each condition the scheduled check watches is planted in the test database, and the alert must fire
# (monitor/run.sh exits non-zero, opens or comments a GitHub issue through a fake gh, and sends the details to Slack
# through a fake curl). The public outputs (run log, issue) must carry no details (judge 36). Also: a clean server
# gives no alert; a lost secret is UNKNOWN once enabled; the weekly heartbeat; a refused Slack message; keep-alive.
# Run by ci.sh step 7 after platform/sql is applied. Connection: PGHOST/PGPORT of the disposable server; roles log in
# without a password there (PGPASSWORD is set to a dummy only because run.sh treats an empty one as "no secret").
set -u
here="$(cd "$(dirname "$0")" && pwd)"
platform="$(dirname "$here")"
superuser="${X1_SUPERUSER:-postgres}"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
failed=0
fail() { echo "FAILED: $*"; failed=1; }

mkdir "$work/bin"
cat > "$work/bin/gh" <<'GH'
#!/usr/bin/env bash
echo "gh $*" >> "$FAKE_GH_LOG"
case "$1 $2" in
  "issue list") [ -f "$FAKE_GH_LOG.open" ] && echo 7 ;;
  "issue create") touch "$FAKE_GH_LOG.open" ;;
esac
exit 0
GH
cat > "$work/bin/curl" <<'CURL'
#!/usr/bin/env bash
{ echo "curl $*"; echo "stdin: $(cat)"; } >> "$FAKE_SLACK_LOG"
if [ -f "$FAKE_SLACK_LOG.refuse" ]; then echo 'no_service'; else echo 'ok'; fi
CURL
chmod +x "$work/bin/gh" "$work/bin/curl"
export FAKE_GH_LOG="$work/gh.log" FAKE_SLACK_LOG="$work/slack.log" PATH="$work/bin:$PATH"
export OMENIX_DB_ALERT_WEBHOOK="https://hooks.slack.com/services/T0TEST/B0TEST/webhooksecret" X1_HEARTBEAT=0

monitor() {
  : > "$FAKE_GH_LOG"; : > "$FAKE_SLACK_LOG"
  PGUSER=db_monitor PGPASSWORD="${1-dummy}" X1_LO_MAX_BYTES=262144 \
    "$platform/monitor/run.sh" "https://example.invalid/run/1" > "$work/out.txt" 2>&1
}
apply() { PGUSER=x1_admin PGOPTIONS="-c client_min_messages=warning" "$platform/sql/apply.sh" > /dev/null 2>&1; }
# Details that must never reach the public log or issue (names, settings, sizes, catalog lines).
public_clean() {
  ! grep -qE 'dashboard_app|stock_writer|statement_timeout|database postgres|large object|bytes|acl |role setting|webhooksecret|hooks.slack' \
    "$work/out.txt" "$FAKE_GH_LOG"
}
expect_alert() {  # name, exit code, pattern the private Slack message must contain
  monitor "${X1_TEST_PASSWORD-dummy}"; local code=$?
  [ "$code" -eq "$2" ] || { fail "$1: exit $code, expected $2"; cat "$work/out.txt"; return; }
  grep -q "gh issue" "$FAKE_GH_LOG" || { fail "$1: no GitHub alert"; return; }
  grep -q -- "$3" "$FAKE_SLACK_LOG" || { fail "$1: the private Slack message lacks the detail ($3)"; return; }
  public_clean || { fail "$1: details leaked into the public log or issue"; grep -hE 'dashboard_app|statement_timeout|database postgres|large object|bytes|acl |role setting|webhooksecret|hooks.slack' "$work/out.txt" "$FAKE_GH_LOG"; return; }
  echo "ok: $1: alert raised in public with counts only; details went to the Slack sender"
}

monitor
[ $? -eq 0 ] && [ ! -s "$FAKE_GH_LOG" ] && [ ! -s "$FAKE_SLACK_LOG" ] && grep -q '^Database check OK: 0 finding' "$work/out.txt" \
  && echo "ok: clean server: OK, nothing raised or sent" || { fail "clean server"; cat "$work/out.txt"; }

lo="$(PGUSER=dashboard_app psql -X -q -A -t -d postgres -c "SELECT lo_from_bytea(0, decode(string_agg(md5(g::text) || md5((g * 7)::text), ''), 'hex')) FROM generate_series(1, 20000) g")"
expect_alert "640 kB of large objects in postgres" 1 "FAIL  database postgres: 1 large object(s) using"
grep -q "gh issue create" "$FAKE_GH_LOG" && echo "ok: first alert opens an issue" || fail "no issue opened"
psql -X -q -U "$superuser" -d postgres -c "SELECT lo_unlink($lo)" > /dev/null

PGUSER=dashboard_app psql -X -q -d omenix -c "ALTER ROLE CURRENT_USER SET statement_timeout = 0"
expect_alert "persistent statement_timeout = 0 on dashboard_app" 1 "role setting dashboard_app in (all databases): statement_timeout=0"
grep -q "gh issue comment 7" "$FAKE_GH_LOG" && echo "ok: a later alert comments on the open issue" || fail "no comment on the open issue"
apply

psql -X -q -U x1_admin -d omenix -c "SET ROLE stock_owner" -c "GRANT CREATE ON SCHEMA stock TO stock_writer"
touch "$FAKE_SLACK_LOG.refuse"
expect_alert "a CREATE grant on schema stock (Slack refusing)" 1 "acl schema stock: stock_writer CREATE granted by stock_owner"
grep -q "Slack channel: no (Slack refused the message: no_service)" "$FAKE_GH_LOG" \
  && echo "ok: when Slack refuses, the public alert says the details were not delivered" || fail "Slack refusal not stated"
rm -f "$FAKE_SLACK_LOG.refuse"
apply

PGPORT=1 PGCONNECT_TIMEOUT=3 expect_alert "an unreachable server (UNKNOWN)" 2 "RESULT: UNKNOWN (could not connect"

monitor ""
[ $? -eq 0 ] && grep -q 'not set up yet' "$work/out.txt" && [ ! -s "$FAKE_GH_LOG" ] \
  && echo "ok: no secret and not enabled: a notice only" || fail "no secret, not enabled"
X1_TEST_PASSWORD="" DB_CHECK_ENABLED=true expect_alert "a lost secret while DB_CHECK_ENABLED=true" 2 "secret OMENIX_DB_MONITOR_PASSWORD is missing"

X1_HEARTBEAT=1 monitor
[ $? -eq 0 ] && grep -q "db-check heartbeat: last successful check" "$FAKE_SLACK_LOG" && [ ! -s "$FAKE_GH_LOG" ] \
  && echo "ok: the weekly heartbeat names the last successful check" || fail "heartbeat"
grep -q "password changes" "$platform/monitor/db_check.sh" && echo "ok: the report states that password changes are not detectable" \
  || fail "password limitation not stated"
grep -q 'stdin: url = "https://hooks.slack.com/services/T0TEST/B0TEST/webhooksecret"' "$FAKE_SLACK_LOG" \
  && ! grep -q 'curl .*webhooksecret' "$FAKE_SLACK_LOG" \
  && echo "ok: the webhook URL travels on stdin, never on curl's command line" || fail "webhook URL on the command line"
echo "detail" > "$work/msg.txt"
notify() { OMENIX_DB_ALERT_WEBHOOK="$1" "$platform/monitor/notify_slack.sh" "$work/msg.txt" > "$work/notify.txt" 2>&1; }
notify "https://example.com/services/webhooksecret"; code=$?
[ "$code" -eq 1 ] && grep -q "not a Slack incoming webhook" "$work/notify.txt" && ! grep -q webhooksecret "$work/notify.txt" \
  && echo "ok: a URL that is not a Slack webhook is refused, and not printed" || fail "non-Slack URL"
notify ""; [ $? -eq 1 ] && grep -q "OMENIX_DB_ALERT_WEBHOOK is not set" "$work/notify.txt" \
  && echo "ok: a missing webhook is reported" || fail "missing webhook"
touch "$FAKE_SLACK_LOG.refuse"
notify "https://hooks.slack.com/services/T0TEST/B0TEST/webhooksecret"; code=$?
[ "$code" -eq 1 ] && grep -q "refused the message: no_service" "$work/notify.txt" && ! grep -q webhooksecret "$work/notify.txt" \
  && echo "ok: a refusal names Slack's error code, never the URL" || fail "refusal output"
rm -f "$FAKE_SLACK_LOG.refuse"

# Keep-alive: commits only when the repository has been idle for 45 days.
repo="$work/repo"; mkdir -p "$repo/platform/monitor"; cp "$platform/monitor/keepalive.sh" "$repo/platform/monitor/"
( cd "$repo" && git init -q && git add . && GIT_COMMITTER_DATE="$(date -u -d '-50 days' '+%Y-%m-%dT%H:%M:%S')" \
    git -c user.name=t -c user.email=t@example.invalid commit -q -m old )
( cd "$repo" && platform/monitor/keepalive.sh > /dev/null ) && [ "$(git -C "$repo" rev-list --count HEAD)" = 2 ] \
  && echo "ok: keep-alive commits after 50 idle days" || fail "keep-alive after 50 days"
( cd "$repo" && platform/monitor/keepalive.sh | grep -q "nothing to do" ) && [ "$(git -C "$repo" rev-list --count HEAD)" = 2 ] \
  && echo "ok: keep-alive does nothing when the repository is active" || fail "keep-alive when active"

[ "$failed" -eq 0 ] && echo "monitor tests: all passed"
