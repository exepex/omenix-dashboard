#!/usr/bin/env bash
# Detection for named exceptions 1 and 2 (platform/README.md): counts large objects, and the bytes they use, in EVERY
# database that accepts connections, and lists per database the large-object functions still open for PUBLIC. A role
# can create large objects in any database it may connect to, so checking omenix alone is blind (judge 5).
# Run as the server admin or as db_monitor (libpq environment from the caller). Prints one line per database.
# Exit 1 if a database holds large objects (any at all; or, with X1_LO_MAX_BYTES set, more bytes than that, as the
# scheduled check does), or one every role may reach cannot be checked. Open functions are reported as OPEN, not
# failures.
set -u
max_bytes="${X1_LO_MAX_BYTES:-}"
# Each database with whether PUBLIC (so every runtime role) may connect to it.
dbs="$(psql -X -A -t -F ':' -d omenix -c "SELECT datname, has_database_privilege('public', datname, 'CONNECT')
  FROM pg_database WHERE datallowconn ORDER BY datname")" || exit 2
found=0
for entry in $dbs; do
  db="${entry%:*}"; public_connect="${entry##*:}"
  # pg_largeobject_metadata and the size of pg_largeobject are readable by every role (no data is read).
  line="$(psql -X -A -t -F ' ' -d "$db" -c "
    SELECT (SELECT count(*) FROM pg_largeobject_metadata),
           CASE WHEN EXISTS (SELECT 1 FROM pg_largeobject_metadata)
                THEN pg_total_relation_size('pg_catalog.pg_largeobject') ELSE 0 END,
           coalesce((SELECT string_agg(f, ', ' ORDER BY f)
                     FROM unnest(ARRAY['lo_create(oid)', 'lo_creat(integer)', 'lo_from_bytea(oid,bytea)']) AS f
                     WHERE has_function_privilege('public', 'pg_catalog.' || f, 'EXECUTE')), 'none')" 2>/dev/null)"
  if [ -z "$line" ]; then
    if [ "$public_connect" = t ]; then
      echo "FAIL  database $db: every role may connect but this role cannot, so its large objects cannot be counted"
      found=1
    else
      echo "SKIP  database $db: neither this role nor PUBLIC may connect (not reachable by the runtime roles)"
    fi
    continue
  fi
  count="${line%% *}"; rest="${line#* }"; bytes="${rest%% *}"; open="${rest#* }"
  if [ -n "$max_bytes" ]; then
    if [ "$bytes" -gt "$max_bytes" ]; then
      echo "FAIL  database $db: $count large object(s) using $bytes bytes, above the limit of $max_bytes"; found=1
    else echo "PASS  database $db: $count large object(s), $bytes bytes (limit $max_bytes)"; fi
  elif [ "$count" != 0 ]; then echo "FAIL  database $db: $count large object(s) exist ($bytes bytes)"; found=1
  else echo "PASS  database $db: no large object"; fi
  [ "$open" = none ] || echo "OPEN  database $db: PUBLIC may still create large objects ($open)"
done
[ "$found" -eq 0 ]
