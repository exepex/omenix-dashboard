#!/usr/bin/env bash
# Owner step for X1 criteria 1 and 2 on the real server: the role matrix with each runtime credential over verified
# TLS, plus the catalog snapshot compared with tests/expected_catalog.txt.
# Run on the owner's Mac from the repository root:   platform/owner/run_real_matrix.sh
# It asks for the admin user name and password (for the probe tables and the snapshot), then psql asks for each
# runtime role's password once. Set X1_INCLUDE_OWNERS=1 to also run the three owner roles (asks their passwords).
# It creates the probe tables stock/fno/app.x1_probe and always drops them again, even after a failure.
# Output: platform/evidence/<date>-x1-real-matrix.txt (no secrets: no passwords, admin name shown as <admin>).
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/lib.sh"
need_psql16
mkdir -p "$evidence_dir"
out="$evidence_dir/$today-x1-real-matrix.txt"
ask_admin

cleanup() { admin_psql -d omenix -f "$platform/tests/fixtures_down.sql" && echo "probe tables dropped"; }
trap cleanup EXIT

{
  trap 'rm -f "$evidence_dir/.snapshot.$$" "$evidence_dir/.snapshot.$$.matrix"' EXIT
  echo "X1 role matrix on $host, $(date -u '+%Y-%m-%d %H:%M UTC'), sslmode=$PGSSLMODE, repository commit $(git -C "$platform" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  echo
  echo "== catalog snapshot compared with platform/tests/expected_catalog.txt (no output between the markers = identical)"
  admin_psql -d omenix -A -t -f "$platform/tests/catalog_snapshot.sql" > "$evidence_dir/.snapshot.$$" || die "snapshot failed"
  echo "-- diff start"
  diff -u "$platform/tests/expected_catalog.txt" "$evidence_dir/.snapshot.$$" && snapshot_ok=yes || snapshot_ok=no
  echo "-- diff end"
  rm -f "$evidence_dir/.snapshot.$$"
  echo "snapshot identical: $snapshot_ok"
  echo
  echo "== large objects in every database (named exceptions 1 and 2)"
  PGUSER="$X1_ADMIN" PGPASSWORD="$admin_password" "$platform/tests/large_objects.sh" && lo_ok=yes || lo_ok=no
  echo
  admin_psql -d omenix -f "$platform/tests/fixtures_up.sql" || die "could not create the probe tables"
  roles="stock_writer fno_writer dashboard_app stock_inbox_reader"
  if [ "${X1_INCLUDE_OWNERS:-0}" = "1" ]; then roles="stock_owner fno_owner app_owner $roles"; fi
  X1_REQUIRE_TLS=1 "$platform/tests/role_matrix.sh" $roles | tee "$evidence_dir/.snapshot.$$.matrix"
  if [ "${PIPESTATUS[0]}" -eq 0 ]; then matrix_ok=yes; else matrix_ok=no; fi
  open_count="$(grep -c '^OPEN  ' "$evidence_dir/.snapshot.$$.matrix")"
  rm -f "$evidence_dir/.snapshot.$$.matrix"
  echo
  echo "RESULT: matrix passed: $matrix_ok; snapshot identical: $snapshot_ok; no large objects anywhere: $lo_ok; open named exceptions: $open_count (see platform/README.md)"
} 2>&1 | tee "$out"
echo "Saved: $out  (read it, then commit it: git add platform/evidence && git commit -m 'X1 evidence: real-server role matrix')"
