#!/usr/bin/env bash
# X1 role matrix runner: logs in as each role (one connection per role) and runs every check of role_matrix.txt that
# names it. Prints one line per check and exits 1 if any check fails or a role cannot connect.
#
# Usage: platform/tests/role_matrix.sh [role ...]        (default: all seven roles)
# Connection: libpq environment variables set by the caller (PGHOST, PGPORT, PGSSLMODE, PGSSLROOTCERT); PGUSER is set
# here to each role in turn and the database is "omenix" (X1_DATABASE overrides it). psql asks for each role's password
# once unless the caller uses ~/.pgpass or a trust connection (CI). Never pass a password as an argument.
# X1_REQUIRE_TLS=1 adds a check to every role that its own connection is encrypted.
# Expectation "known:<x>": a named exception (platform/README.md). Met = PASS; not met only because the action
# succeeded = OPEN (printed and counted, not a pass, does not fail the run); any other error = FAIL.
# The probe tables of fixtures_up.sql must exist. Every check runs in BEGIN ... ROLLBACK.
# Written for bash 3.2 and the BSD awk of macOS as well as Linux.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
database="${X1_DATABASE:-omenix}"
all_roles="stock_owner fno_owner app_owner stock_writer fno_writer dashboard_app stock_inbox_reader db_monitor"
if [ "$#" -gt 0 ]; then roles="$*"; else roles="$all_roles"; fi
for role in $roles; do
  case " $all_roles " in *" $role "*) ;; *) echo "unknown role: $role" >&2; exit 2 ;; esac
done

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# One normalised check per line: number <TAB> roles <TAB> expect <TAB> sql <TAB> why.
{
  cat "$here/role_matrix.txt"
  if [ "${X1_REQUIRE_TLS:-0}" = "1" ]; then
    echo "${all_roles// /,} | value=true | SELECT ssl::text AS v FROM pg_stat_ssl WHERE pid = pg_backend_pid() | this connection is encrypted (TLS)"
  fi
} | awk '
  /^[[:space:]]*(#|$)/ { next }
  {
    n = split($0, f, / \| /)
    if (n != 4) { print "role_matrix.txt: bad line: " $0 > "/dev/stderr"; bad = 1; next }
    for (k = 1; k <= 4; k++) { gsub(/^[[:space:]]+|[[:space:]]+$/, "", f[k]) }
    e = f[2]; sub(/^known:/, "", e)
    if (e != "allow" && e != "deny" && e !~ /^value=/) { print "unknown expectation: " f[2] > "/dev/stderr"; bad = 1 }
    i++; printf "%d\t%s\t%s\t%s\t%s\n", i, f[1], f[2], f[3], f[4]
  }
  END { if (bad) exit 2 }' > "$work/checks" || exit 2

total=0; failed=0; opened=0
for role in $roles; do
  # This role's checks, and the psql script that runs them.
  awk -F '\t' -v role="$role" '("," $2 ",") ~ ("," role ",")' "$work/checks" > "$work/$role.checks"
  awk -F '\t' '
    BEGIN { print "\\set ON_ERROR_STOP 0"; print "\\o /dev/null" }
    {
      if ($3 ~ /^(known:)?value=/) {
        print "\\unset x1_v"; print "BEGIN;"; print $4 " \\gset x1_"
        print "\\echo X1RESULT " $1 " :SQLSTATE :x1_v"; print "ROLLBACK;"
      } else {
        print "BEGIN;"; print $4 ";"; print "\\echo X1RESULT " $1 " :SQLSTATE"; print "ROLLBACK;"
      }
    }' "$work/$role.checks" > "$work/$role.sql"
  PGUSER="$role" PGDATABASE="$database" PGAPPNAME="x1_role_matrix" \
    psql -X -q -f "$work/$role.sql" > "$work/$role.out" 2> "$work/$role.err"
  rc=$?
  echo "== $role (psql exit $rc)"
  # Join each check with its result line and judge it.
  awk -F '\t' -v role="$role" '
    FILENAME == ARGV[1] { if ($0 ~ /^X1RESULT /) { split($0, w, " "); st[w[2]] = w[3]; v = $0
                          sub(/^X1RESULT [0-9]+ [^ ]+ ?/, "", v); val[w[2]] = v; seen[w[2]] = 1 } ; next }
    {
      id = $1; e = $3; q = $4; why = $5; ok = 0
      known = (e ~ /^known:/); x = e; sub(/^known:/, "", x)
      s = (id in seen) ? st[id] : "no-result"
      if (x == "allow" && s == "00000") ok = 1
      if (x == "deny" && s == "42501") ok = 1
      if (x ~ /^value=/ && s == "00000" && val[id] == substr(x, 7)) ok = 1
      total++
      shown = s; if (x ~ /^value=/ && s == "00000") shown = s " value=" val[id]
      if (ok) printf "PASS  %-18s %-11s %-9s %s\n", role, e, s, q
      else if (known && s == "00000") {
        # A named exception (platform/README.md): the server does not enforce it; listed, never silent.
        opn++
        printf "OPEN  %-18s %-11s got %-15s %s   (known exception: %s)\n", role, e, shown, q, why
      } else {
        failed++
        printf "FAIL  %-18s %-11s got %-15s %s   (%s)\n", role, e, shown, q, why
      }
    }
    END { printf "%d %d %d\n", total, failed, opn + 0 > "/dev/stderr" }' "$work/$role.out" "$work/$role.checks" 2> "$work/$role.count"
  read -r t f o < "$work/$role.count"
  total=$((total + t)); failed=$((failed + f)); opened=$((opened + o))
  if [ "$rc" -ne 0 ]; then
    echo "psql error output for $role:"; sed 's/^/    /' "$work/$role.err" | head -20
    failed=$((failed + 1))
  fi
done
echo "role matrix: $total checks, $((total - failed - opened)) passed, $failed failed, $opened open known exceptions (roles: $roles)"
if [ "$opened" -gt 0 ]; then
  echo "OPEN = a named exception the server does not enforce (platform/README.md, \"Named exceptions\"); not a pass."
fi
[ "$failed" -eq 0 ]
