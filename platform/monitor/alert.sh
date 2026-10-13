#!/usr/bin/env bash
# Raise the scheduled check's alert as a GitHub issue in this (public) repository: comment on the open alert issue,
# or open one. It carries only the summary line (status, counts, check time), never details: those go privately to
# Slack. GitHub e-mails the repository's watchers (the owner) about it; the failed run e-mails the owner too.
# Needs only the workflow's own GITHUB_TOKEN (GH_TOKEN) with issues: write; no other secret.
# Usage: alert.sh SUMMARY [RUN_URL]
set -eu
summary="$1"; run_url="${2:-}"
title="Database check: alert"
body="$(printf '%s\n\n%s\n\nDetails are never posted here (the repository is public); see the Slack message in #fno-desk. Issue #2, platform/README.md "Scheduled check".\n' \
  "$summary" "${run_url:+Run: $run_url}")"
number="$(gh issue list --state open --search "\"$title\" in:title" --json number,title \
  --jq "map(select(.title == \"$title\")) | .[0].number // empty")"
if [ -n "$number" ]; then
  gh issue comment "$number" --body "$body"
  echo "alert added to issue #$number"
else
  gh issue create --title "$title" --body "$body"
  echo "alert issue opened"
fi
