#!/usr/bin/env bash
# Issue #2: each condition the scheduled check watches is planted in the test database, and the alert must fire
# (monitor/run.sh exits 1 and raises a GitHub issue through a fake gh); a clean server must give no alert.
# Run by ci.sh step 7 after platform/sql is applied. Connection: PGHOST/PGPORT of the disposable server; roles log in
# without a password there. Needs X1_SUPERUSER (default postgres) to clean up large objects.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
platform="$(dirname "$here")"
superuser="${X1_SUPERUSER:-postgres}"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
failed=0

# Fake gh: records every call; "issue list" answers with the open alert issue once one was created.
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
chmod +x "$work/bin/gh"
export FAKE_GH_LOG="$work/gh.log" PATH="$work/bin:$PATH"

monitor() { PGUSER=db_monitor X1_LO_MAX_BYTES=262144 "$platform/monitor/run.sh" "https://example.invalid/run/1" > "$work/out.txt" 2>&1; }
apply() { PGUSER=x1_admin PGOPTIONS="-c client_min_messages=warning" "$platform/sql/apply.sh" > /dev/null 2>&1; }
expect_alert() {  # name, grep pattern that the report must contain
  if monitor; then echo "FAILED: no alert for: $1"; cat "$work/out.txt"; failed=1; return; fi
  if ! grep -q "$2" "$work/out.txt"; then echo "FAILED: alert for $1 does not name it ($2)"; cat "$work/out.txt"; failed=1; return; fi
  if ! grep -q "$2" "$FAKE_GH_LOG"; then echo "FAILED: the GitHub alert for $1 does not carry the finding"; failed=1; return; fi
  echo "ok: alert fires for $1 (report and GitHub issue name it)"
}

: > "$FAKE_GH_LOG"
if monitor; then echo "ok: clean server, no alert"; else echo "FAILED: alert on a clean server"; cat "$work/out.txt"; failed=1; fi
[ -s "$FAKE_GH_LOG" ] && { echo "FAILED: gh called on a clean server"; failed=1; }

# 1. Large objects above the limit, in a database other than omenix (about 640 kB of incompressible data).
lo="$(PGUSER=dashboard_app psql -X -q -A -t -d postgres -c "SELECT lo_from_bytea(0, decode(string_agg(md5(g::text) || md5((g * 7)::text), ''), 'hex')) FROM generate_series(1, 20000) g")"
expect_alert "640 kB of large objects in postgres" "FAIL  database postgres: 1 large object(s) using"
grep -q "gh issue create" "$FAKE_GH_LOG" && echo "ok: first alert opens an issue" || { echo "FAILED: no issue opened"; failed=1; }
psql -X -q -U "$superuser" -d postgres -c "SELECT lo_unlink($lo)" > /dev/null

# 2. A runtime role switches off its own statement timeout persistently (named exception 3).
PGUSER=dashboard_app psql -X -q -d omenix -c "ALTER ROLE CURRENT_USER SET statement_timeout = 0"
expect_alert "persistent statement_timeout = 0 on dashboard_app" "> role setting dashboard_app in (all databases): statement_timeout=0"
grep -q "gh issue comment 7" "$FAKE_GH_LOG" && echo "ok: a later alert comments on the open issue" || { echo "FAILED: no comment on the open issue"; failed=1; }
apply

# 3. Any other drift, e.g. a schema grant.
psql -X -q -U x1_admin -d omenix -c "SET ROLE stock_owner" -c "GRANT CREATE ON SCHEMA stock TO stock_writer"
expect_alert "a CREATE grant on schema stock" "> acl schema stock: stock_writer CREATE granted by stock_owner"
apply

# 4. Password changes cannot be detected read-only: the report must say so, not stay silent.
monitor
check_line="INFO  not detectable read-only"
grep -q "$check_line" "$work/out.txt" && echo "ok: the report states that password changes are not detectable" \
  || { echo "FAILED: password limitation not stated"; failed=1; }
grep -q '^RESULT: OK$' "$work/out.txt" && echo "ok: clean again after cleanup" || { echo "FAILED: not clean after cleanup"; failed=1; }

[ "$failed" -eq 0 ] && echo "monitor tests: all passed"
