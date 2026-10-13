#!/usr/bin/env bash
# Owner step for X1 criterion 4: restore a backup to a scratch server, prove the data came back, then delete it.
# Run on the owner's Mac from the repository root:   X1_RG=<resource group> platform/owner/restore_test.sh
# Takes about 30-60 minutes (most of it Azure working). Cost: the scratch server is billed by the hour while it
# exists (same size as omenix-pg); see platform/README.md "Restore test cost". Steps:
#   1. writes a marker row (a random token and the time) into a new table fno.x1_restore_marker on omenix-pg;
#   2. waits 15 minutes so the marker is in the backed-up log, then restores omenix-pg to a point 5 minutes after the
#      marker, as a new server named omenix-pg-x1restore (point-in-time restore);
#   3. checks on the scratch server: the marker row is there with the same token, and the catalog snapshot equals
#      platform/tests/expected_catalog.txt (roles, schemas, grants and default privileges came back);
#   4. deletes the scratch server (asks you to type its name first) and confirms it is gone;
#   5. drops the marker table on omenix-pg: always, by an EXIT trap in the main shell, even after a stop. A stop
#      after the restore started also prints the command to delete the scratch server, which is never deleted
#      without your typed confirmation.
# It never deletes anything but the server it created, whose name must end in -x1restore.
# Output: platform/evidence/<date>-x1-restore.txt (no secrets).
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/lib.sh"
. "$here/az.sh"
need_psql16
need_az
scratch="${server}-x1restore"
case "$scratch" in *-x1restore) ;; *) die "scratch name must end in -x1restore" ;; esac
[ "$scratch" != "$server" ] || die "scratch server name equals the source"
if az postgres flexible-server show -g "$X1_RG" -n "$scratch" > /dev/null 2>&1; then
  die "$scratch already exists; delete it first (az postgres flexible-server delete -g $X1_RG -n $scratch --yes)"
fi
mkdir -p "$evidence_dir"
out="$evidence_dir/$today-x1-restore.txt"
ask_admin
token="x1-$(date -u +%Y%m%d%H%M%S)-$RANDOM$RANDOM"

utc_plus() {  # minutes -> ISO time (macOS date or GNU date)
  date -u -v+"$1"M '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d "+$1 minutes" '+%Y-%m-%dT%H:%M:%SZ'
}

record_evidence "$out"
marker_written=no; scratch_created=no; scratch_gone=no
on_exit() {
  if [ "$marker_written" = yes ]; then
    if admin_psql -d omenix -c "SET ROLE fno_owner" -c "DROP TABLE IF EXISTS fno.x1_restore_marker"; then
      echo "marker table dropped on $server"
    else
      echo "WARNING: the marker table is still on $server; drop it as admin:"
      echo "  SET ROLE fno_owner; DROP TABLE IF EXISTS fno.x1_restore_marker;"
    fi
  fi
  rm -f "$evidence_dir/.restore.$$"
  if [ "$scratch_created" = yes ] && [ "$scratch_gone" != yes ]; then
    echo "WARNING: the scratch server $scratch may still exist and costs money until deleted:"
    echo "  az postgres flexible-server delete -g $X1_RG -n $scratch --yes"
  fi
}
trap on_exit EXIT
echo "X1 restore test of $server, started $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "backup retention days: $(az postgres flexible-server show -g "$X1_RG" -n "$server" --query backup.backupRetentionDays -o tsv)"
echo "earliest restore point: $(az postgres flexible-server show -g "$X1_RG" -n "$server" --query backup.earliestRestoreDate -o tsv)"

echo; echo "== 1. marker on $server"
admin_psql -d omenix -c "SET ROLE fno_owner" \
  -c "CREATE TABLE IF NOT EXISTS fno.x1_restore_marker (token text PRIMARY KEY, written_at timestamptz NOT NULL DEFAULT now())" \
  -c "INSERT INTO fno.x1_restore_marker (token) VALUES ('$token')" || die "could not write the marker"
marker_written=yes
echo "marker token $token written at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
restore_time="$(utc_plus 5)"

echo; echo "== 2. wait 15 minutes, then restore to $restore_time as $scratch"
sleep 900
started="$(date -u +%s)"
scratch_created=yes   # from here on, a stop warns that the scratch server may exist
echo "restore started $(date -u '+%H:%M:%S UTC')"
az postgres flexible-server restore -g "$X1_RG" -n "$scratch" --source-server "$server" \
  --restore-time "$restore_time" --query "{name:name, state:state, location:location, sku:sku.name}" -o tsv \
  || die "restore failed; nothing to delete unless $scratch shows in the portal"
finished="$(date -u +%s)"
echo "restore finished $(date -u '+%H:%M:%S UTC') after $(( (finished - started) / 60 )) minutes"

echo; echo "== 3. check the scratch server"
rules="$(az_firewall_list "$scratch" --query "[].[startIpAddress, endIpAddress]" -o tsv)" \
  || die "could not read the scratch server's firewall rules"
echo "firewall rules copied to the scratch server: $(printf '%s' "${rules:-none}" | redact_ips)"
if [ -z "$rules" ]; then
  my_ip="$(curl -fsS https://api.ipify.org)" || die "could not find this Mac's public IP to open the scratch firewall"
  az_firewall_create "$scratch" x1-owner-mac "$my_ip" "$my_ip" && echo "opened the scratch firewall to this Mac only"
fi
scratch_host="$scratch.postgres.database.azure.com"
got="$(PGHOST="$scratch_host" admin_psql -d omenix -A -t -c "SELECT token FROM fno.x1_restore_marker WHERE token = '$token'")"
if [ "$got" = "$token" ]; then marker_ok=yes; else marker_ok=no; fi
echo "marker row on the scratch server: $marker_ok"
PGHOST="$scratch_host" admin_psql -d omenix -A -t -f "$platform/tests/catalog_snapshot.sql" > "$evidence_dir/.restore.$$"
echo "-- diff of the scratch server's catalog against expected_catalog.txt (empty = identical)"
diff -u "$platform/tests/expected_catalog.txt" "$evidence_dir/.restore.$$" && catalog_ok=yes || catalog_ok=no
rm -f "$evidence_dir/.restore.$$"
echo "catalog identical: $catalog_ok"

echo; echo "== 4. delete the scratch server"
printf 'Type %s to delete it: ' "$scratch" > /dev/tty; read -r typed < /dev/tty
[ "$typed" = "$scratch" ] || die "name not typed; $scratch NOT deleted (it keeps costing money: delete it in the portal)"
az postgres flexible-server delete -g "$X1_RG" -n "$scratch" --yes || die "delete failed; delete $scratch in the portal"
deleted_at="$(date -u +%s)"
if az postgres flexible-server show -g "$X1_RG" -n "$scratch" > /dev/null 2>&1; then gone=no; else gone=yes; scratch_gone=yes; fi
echo "scratch server gone: $gone; it existed for about $(( (deleted_at - started + 3599) / 3600 )) billed hour(s)"

echo; echo "== 5. the marker on $server is dropped when the script ends (also after a stop; see below)"

echo; echo "RESULT: marker restored: $marker_ok; catalog identical: $catalog_ok; scratch server deleted: $gone"
echo "COST: fill in from Azure Cost Management a day later (resource $scratch): ____"
echo "Saved: $out (the marker drop follows)"
