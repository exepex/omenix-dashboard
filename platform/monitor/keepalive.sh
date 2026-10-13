#!/usr/bin/env bash
# Keep GitHub's scheduled workflows running. GitHub pauses them in a public repository after 60 days without
# repository activity, which would stop the hourly database check silently. Run monthly
# (.github/workflows/keepalive.yml): when the newest commit is X1_KEEPALIVE_DAYS (default 45) or more days old, update
# platform/monitor/keepalive.txt and commit it; otherwise do nothing. Usage: keepalive.sh (inside the repository).
set -eu
days="${X1_KEEPALIVE_DAYS:-45}"
last="$(git log -1 --format=%ct)"
age=$(( ( $(date -u +%s) - last ) / 86400 ))
if [ "$age" -lt "$days" ]; then
  echo "last commit $age day(s) ago (< $days): nothing to do"
  exit 0
fi
here="$(cd "$(dirname "$0")" && pwd)"
date -u '+%Y-%m-%d %H:%M UTC: keep-alive commit, so GitHub keeps the scheduled database check running' > "$here/keepalive.txt"
git add "$here/keepalive.txt"
git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -q -m "Keep-alive: no commit for $age days; keeps GitHub's scheduled checks running (platform/README.md)"
echo "keep-alive commit made (last commit was $age days ago)"
