#!/usr/bin/env bash
# Raise the scheduled check's alert as a GitHub issue in this repository: comment on the open alert issue, or open one.
# GitHub e-mails the repository's watchers (the owner) about it, and the failed workflow run e-mails the owner too.
# Needs only the workflow's own GITHUB_TOKEN (GH_TOKEN) with issues: write; no other secret.
# Usage: alert.sh REPORT_FILE [RUN_URL]
set -eu
report="$1"; run_url="${2:-}"
title="Database check: alert"
case "$(grep '^RESULT: ' "$report")" in
  "RESULT: UNKNOWN"*) what="could NOT check the server (UNKNOWN: nothing below is a pass)" ;;
  *) what="found something to look at (ALERT)" ;;
esac
body="$(printf 'The scheduled database check %s. Issue #2, platform/README.md "Scheduled check".\n\n%s\n\n```\n%s\n```\n' \
  "$what" "${run_url:+Run: $run_url}" "$(cat "$report")")"
number="$(gh issue list --state open --search "\"$title\" in:title" --json number,title \
  --jq "map(select(.title == \"$title\")) | .[0].number // empty")"
if [ -n "$number" ]; then
  gh issue comment "$number" --body "$body"
  echo "alert added to issue #$number"
else
  gh issue create --title "$title" --body "$body"
  echo "alert issue opened"
fi
