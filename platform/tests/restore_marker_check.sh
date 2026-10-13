#!/usr/bin/env bash
# X1: does platform/owner/restore_test.sh drop its marker table on omenix-pg on every ending, on bash 3.2 (macOS)?
# A dry run of the real script with psql, az, sleep and curl replaced by stubs that log their calls (no Azure, no
# database, nothing deleted), in Docker's bash 3.2 image, under a pseudo-terminal for its typed prompts (password, the
# scratch name). Four endings: a normal end; a stop before the restore (restore fails); a stop at the delete prompt
# (wrong name typed); Ctrl-C during the 15-minute wait. Each passes when the stubbed psql received the
# DROP TABLE IF EXISTS fno.x1_restore_marker after the marker was written, and the evidence file says so.
# Run from the repository root on a machine with Docker and util-linux `script`:  platform/tests/restore_marker_check.sh
# (W14 follow-up, 13 Oct 2026; the CI image runs no pseudo-terminal, so this is a documented check, not a CI step.)
set -u
repo="$(cd "$(dirname "$0")/../.." && pwd)"
image="${BASH32_IMAGE:-mirror.gcr.io/library/bash:3.2}"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
mkdir -p "$work/stubs"

cat > "$work/stubs/psql" <<'STUB'
#!/bin/sh
echo "psql $*" >> /work/calls.log
case "$*" in
  *--version*) echo "psql (PostgreSQL) 16.4" ;;
  *"INSERT INTO fno.x1_restore_marker"*) echo "$*" | sed -n "s/.*VALUES ('\([^']*\)').*/\1/p" > /work/token ;;
  *"SELECT token"*) cat /work/token ;;
  *catalog_snapshot.sql*) cat /repo/platform/tests/expected_catalog.txt ;;
esac
exit 0
STUB
cat > "$work/stubs/az" <<'STUB'
#!/bin/sh
echo "az $*" >> /work/calls.log
case "$*" in
  "account show"*) echo "subscription" ;;
  *"flexible-server show"*"-n omenix-pg-x1restore"*) [ -f /work/scratch ] && echo "{}" || exit 3 ;;
  *"flexible-server show"*) echo "7" ;;
  *"flexible-server restore"*) [ "${FAIL_AT:-}" = restore ] && { echo "restore refused (stub)" >&2; exit 1; }; touch /work/scratch; echo "omenix-pg-x1restore Ready" ;;
  *"firewall-rule list"*) printf '192.0.2.7\t192.0.2.7\n' ;;
  *"flexible-server delete"*) rm -f /work/scratch ;;
esac
exit 0
STUB
cat > "$work/stubs/sleep" <<'STUB'
#!/bin/sh
# the 15-minute wait: short, so Ctrl-C can land in it
exec /bin/sleep "${STUB_SLEEP:-1}"
STUB
cat > "$work/stubs/curl" <<'STUB'
#!/bin/sh
echo "192.0.2.7"
STUB
chmod +x "$work/stubs/"*

failed=0
run() {  # name, typed input (printf format), extra env, ctrl-c delay (0 = none)
  local name="$1" typed="$2" env="$3" ctrlc="$4" dir="$work/$1"
  mkdir -p "$dir/evidence"
  local cmd="docker run --rm -it -v $repo:/repo:ro -v $dir:/work -v $work/stubs:/stubs:ro -w /repo \
    -e PATH=/stubs:/usr/local/bin:/usr/bin:/bin -e X1_RG=rg-test -e X1_ADMIN=admin -e X1_EVIDENCE_DIR=/work/evidence $env \
    $image bash -c 'echo bash \$BASH_VERSION; bash platform/owner/restore_test.sh'"
  if [ "$ctrlc" != 0 ]; then
    { printf "$typed"; sleep "$ctrlc"; printf '\003'; sleep 3; } | script -qec "$cmd" /dev/null > "$dir/terminal.txt" 2>&1
  else
    { printf "$typed"; sleep 30; } | script -qec "$cmd" /dev/null > "$dir/terminal.txt" 2>&1
  fi
  local marker drop
  marker="$(grep -c "INSERT INTO fno.x1_restore_marker" "$dir/calls.log" 2>/dev/null)"
  drop="$(grep -c "DROP TABLE IF EXISTS fno.x1_restore_marker" "$dir/calls.log" 2>/dev/null)"
  local said; said="$(grep -h "marker table dropped" "$dir"/evidence/*-x1-restore.txt 2>/dev/null | head -1)"
  local bash_v; bash_v="$(grep -m1 -o 'bash 3[^ ]*' "$dir/terminal.txt")"
  if [ "${marker:-0}" -ge 1 ] && [ "${drop:-0}" -ge 1 ] && [ -n "$said" ]; then
    echo "ok: $name ($bash_v): marker written, DROP TABLE sent on exit, evidence says \"$said\""
  else
    echo "FAILED: $name ($bash_v): marker writes ${marker:-0}, drops ${drop:-0}, evidence line \"${said}\""
    tail -15 "$dir/terminal.txt"; failed=1
  fi
}

run normal          'pw\nomenix-pg-x1restore\n' ""                  0
run stop-at-restore 'pw\n'                      "-e FAIL_AT=restore" 0
run wrong-name      'pw\nnot-the-name\n'        ""                  0
run ctrl-c-in-wait  'pw\n'                      "-e STUB_SLEEP=30"  6
[ "$failed" -eq 0 ] && echo "restore marker check: all 4 endings drop the marker"
exit "$failed"
