#!/usr/bin/env bash
# Send the scheduled check's private message (details of a finding, or the weekly heartbeat) to the owner's Slack
# channel #fno-desk. This is the only place the details go: the repository is public, so its run logs and issues are
# too. Uses the secret FNO_SLACK_BOT_TOKEN (the F&O bot, which already posts there). Only this channel, never another.
# Usage: notify_slack.sh MESSAGE_FILE    Exit 0 when Slack accepted the message, 1 otherwise (never prints the token).
set -u
channel="C0C89E8QCCD"   # #fno-desk; fixed here on purpose (exepex/trading fno/constants.py FNO_DESK_CHANNEL_ID)
url="${X1_SLACK_URL:-https://slack.com/api/chat.postMessage}"   # X1_SLACK_URL: only for tests
[ -n "${FNO_SLACK_BOT_TOKEN:-}" ] || { echo "no private channel: the secret FNO_SLACK_BOT_TOKEN is not set"; exit 1; }
payload="$(jq -n --arg channel "$channel" --rawfile text "$1" '{channel: $channel, text: $text}')" || exit 1
# The token goes in a header read from stdin, not on the command line.
answer="$(printf 'Authorization: Bearer %s\n' "$FNO_SLACK_BOT_TOKEN" \
  | curl -sS --max-time 20 -H @- -H 'Content-Type: application/json; charset=utf-8' --data "$payload" "$url")" || exit 1
[ "$(printf '%s' "$answer" | jq -r '.ok')" = true ] || { echo "Slack refused the message: $(printf '%s' "$answer" | jq -r '.error')"; exit 1; }
