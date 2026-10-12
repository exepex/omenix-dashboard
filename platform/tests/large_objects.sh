#!/usr/bin/env bash
# X1 detection for named exceptions 1 and 2 (platform/README.md): counts large objects in EVERY database that accepts
# connections and lists, per database, the large-object functions still open for PUBLIC. A role can create large
# objects in any database it may connect to, so checking omenix alone is blind (judge 5).
# Run as the server admin (PGUSER = the admin; libpq environment from the caller). Prints one line per database.
# Exit 1 if any database holds a large object, or one every role may reach cannot be checked; open functions are
# reported as OPEN, not failures.
set -u
# Each database with whether PUBLIC (so every runtime role) may connect to it.
dbs="$(psql -X -A -t -F ':' -d omenix -c "SELECT datname, has_database_privilege('public', datname, 'CONNECT')
  FROM pg_database WHERE datallowconn ORDER BY datname")" || exit 2
found=0
for entry in $dbs; do
  db="${entry%:*}"; public_connect="${entry##*:}"
  line="$(psql -X -A -t -F ' ' -d "$db" -c "
    SELECT (SELECT count(*) FROM pg_largeobject_metadata),
           coalesce((SELECT string_agg(f, ', ' ORDER BY f)
                     FROM unnest(ARRAY['lo_create(oid)', 'lo_creat(integer)', 'lo_from_bytea(oid,bytea)']) AS f
                     WHERE has_function_privilege('public', 'pg_catalog.' || f, 'EXECUTE')), 'none')" 2>/dev/null)"
  if [ -z "$line" ]; then
    if [ "$public_connect" = t ]; then
      echo "FAIL  database $db: every role may connect but the admin cannot, so its large objects cannot be counted"
      found=1
    else
      echo "SKIP  database $db: neither the admin nor PUBLIC may connect (not reachable by the runtime roles)"
    fi
    continue
  fi
  count="${line%% *}"; open="${line#* }"
  if [ "$count" != 0 ]; then echo "FAIL  database $db: $count large object(s) exist"; found=1
  else echo "PASS  database $db: no large object"; fi
  [ "$open" = none ] || echo "OPEN  database $db: PUBLIC may still create large objects ($open)"
done
[ "$found" -eq 0 ]
