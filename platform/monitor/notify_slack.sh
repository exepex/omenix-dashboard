#!/usr/bin/env bash
# Send the scheduled check's private message (details of a finding, or the weekly heartbeat) to the owner's Slack
# channel #db-alerts. This is the only place the details go: the repository is public, so its run logs and issues are
# too. Uses the secret OMENIX_DB_ALERT_WEBHOOK, a Slack incoming webhook the owner created for #db-alerts only (owner
# decision, issue #2): Slack binds the channel to the webhook, so a leaked URL can post to #db-alerts and nothing else.
# Usage: notify_slack.sh MESSAGE_FILE    Exit 0 when Slack accepted the message, 1 otherwise.
# The URL is the secret: it reaches curl through a config file on stdin (never its command line) and is never printed;
# curl's own error text is not shown either, because it can quote the URL.
set -u
webhook="${OMENIX_DB_ALERT_WEBHOOK:-}"
[ -n "$webhook" ] || { echo "no private channel: the secret OMENIX_DB_ALERT_WEBHOOK is not set"; exit 1; }
case "$webhook" in
  https://hooks.slack.com/services/*) ;;
  *) echo "the secret OMENIX_DB_ALERT_WEBHOOK is not a Slack incoming webhook (https://hooks.slack.com/services/...)"; exit 1 ;;
esac
case "$webhook" in *'"'*|*'\'*|*[[:space:]]*) echo "the secret OMENIX_DB_ALERT_WEBHOOK has characters a URL cannot hold"; exit 1 ;; esac
payload="$(jq -n --rawfile text "$1" '{text: $text}')" || exit 1
answer="$(printf 'url = "%s"\n' "$webhook" \
  | curl -sS --max-time 20 --config - -H 'Content-Type: application/json; charset=utf-8' --data "$payload" 2> /dev/null)"
code=$?
[ "$code" -eq 0 ] || { echo "Slack could not be reached (curl exit $code)"; exit 1; }
# Slack answers "ok" on success, else a short error code such as invalid_payload or no_service (never the URL).
[ "$answer" = ok ] && exit 0
# Echo the answer only when it is exactly such a code; anything else (HTML, a proxy page) gets a fixed text.
if printf '%s' "$answer" | grep -Eqx '[a-z_]{1,40}'; then echo "Slack refused the message: $answer"
else echo "Slack refused the message: unrecognised answer (not shown)"; fi
exit 1
