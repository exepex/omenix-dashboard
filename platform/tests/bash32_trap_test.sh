#!/usr/bin/env bash
# X1: the owner scripts' cleanup must run on every bash, including bash 3.2 (macOS). On 13 Oct 2026 the restore test's
# EXIT trap, set inside a "{ ...; } | tee" block, did not run on the owner's Mac and left its marker table on
# omenix-pg. This test runs the pattern the owner scripts use now (owner/lib.sh record_evidence: the body stays in the
# main shell) on a normal end and after die, and checks that the trap's output reaches the evidence file.
# CI runs it with the runner's bash and with bash 3.2 (platform-tests workflow).
set -u
here="$(cd "$(dirname "$0")" && pwd)"
lib="$(dirname "$here")/owner/lib.sh"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
failed=0
echo "bash $BASH_VERSION"

for ending in normal die; do
  cat > "$work/script.sh" <<EOF
#!/usr/bin/env bash
. "$lib"
record_evidence "$work/$ending.txt"
cleanup() { echo "cleanup ran"; }
trap cleanup EXIT
echo "body"
[ "$ending" = die ] && die "simulated stop"
echo "end of body"
EOF
  bash "$work/script.sh" > /dev/null 2>&1
  sleep 1   # tee runs in its own process; give it time to finish the file
  if grep -q "cleanup ran" "$work/$ending.txt"; then echo "ok: cleanup ran and was recorded ($ending end)"
  else echo "FAILED: cleanup did not run or was not recorded ($ending end)"; cat "$work/$ending.txt"; failed=1; fi
done

# The old pattern, kept here to document the root cause: on bash 3.2 its trap never runs.
cat > "$work/old.sh" <<'EOF'
{ trap 'echo "cleanup ran"' EXIT; echo "body"; } 2>&1 | cat
EOF
case "$BASH_VERSION" in
  3.*) if bash "$work/old.sh" | grep -q "cleanup ran"; then echo "note: old pattern's trap ran on this bash 3"
       else echo "ok: confirmed root cause: the old pattern's trap does not run on bash $BASH_VERSION"; fi ;;
esac

[ "$failed" -eq 0 ] && echo "trap tests: all passed"
