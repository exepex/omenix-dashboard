#!/usr/bin/env bash
# Owner step: bring omenix-pg to the declared state of platform/sql (00..40) over verified TLS, then show the catalog
# against tests/expected_catalog.txt. Idempotent; never touches a password or a table row.
# On the server as set up on 12 Oct 2026 the only change it makes is tests/catalog_difference.txt: the owner roles'
# new functions are no longer executable by PUBLIC (default privileges).
# Run on the owner's Mac from the repository root:   platform/owner/apply_real.sh
# Output: platform/evidence/<date>-x1-apply.txt (no secrets; the admin shows as <admin>).
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/lib.sh"
need_psql16
mkdir -p "$evidence_dir"
out="$evidence_dir/$today-x1-apply.txt"
ask_admin
{
  echo "X1 apply of platform/sql to $host, $(date -u '+%Y-%m-%d %H:%M UTC'), repository commit $(git -C "$platform" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  admin_psql -d omenix -A -t -f "$platform/tests/catalog_snapshot.sql" > "$evidence_dir/.before.$$" || die "snapshot failed"
  echo "-- changes this apply will make (expected: exactly tests/catalog_difference.txt, or nothing on a second run)"
  diff "$evidence_dir/.before.$$" "$platform/tests/expected_catalog.txt" | grep '^[<>]' || echo "(none)"
  PGUSER="$X1_ADMIN" PGPASSWORD="$admin_password" PGOPTIONS="-c client_min_messages=warning" "$platform/sql/apply.sh" \
    || die "apply failed (each file runs in one transaction, so a failed file changed nothing)"
  admin_psql -d omenix -A -t -f "$platform/tests/catalog_snapshot.sql" > "$evidence_dir/.after.$$" || die "snapshot failed"
  echo "-- diff after apply against expected_catalog.txt (empty = identical)"
  diff -u "$platform/tests/expected_catalog.txt" "$evidence_dir/.after.$$" && ok=yes || ok=no
  rm -f "$evidence_dir/.before.$$" "$evidence_dir/.after.$$"
  echo "RESULT: catalog identical to expected_catalog.txt after apply: $ok"
} 2>&1 | tee "$out"
echo "Saved: $out"
