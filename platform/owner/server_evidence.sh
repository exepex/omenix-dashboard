#!/usr/bin/env bash
# Owner step for X1 criterion 5 (and the tier, region and backup facts in platform/README.md): the server's settings
# and firewall rules from az, checked against the expected values in platform/README.md (the table between
# "server-settings:start" and "server-settings:end"; the README is the only place they are written).
# Run on the owner's Mac from the repository root:   X1_RG=<resource group> platform/owner/server_evidence.sh
# "platform/owner/server_evidence.sh --list-expected" only prints the README values (no az; used by CI).
# Only named fields are queried: no IDs, subscription, admin name or connection details.
# Output: platform/evidence/<date>-x1-server.txt
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/lib.sh"

# Each check: name in the README table | az JMESPath query on "flexible-server show" (or a special source).
checks='location|location
sku|sku.name
tier|sku.tier
PostgreSQL version|version
storage GiB|storage.storageSizeGb
storage performance tier|storage.tier
backup retention days|backup.backupRetentionDays
public network access|network.publicNetworkAccess
data encryption|dataEncryption.type
require_secure_transport|@parameter
firewall rules|@firewall'

expected_values() {  # prints "name|value" for each row of the README table
  awk '/server-settings:start/ {on = 1; next} /server-settings:end/ {on = 0}
       on && /^\| / && !/^\| *(Check|---)/ {
         split($0, c, "|"); gsub(/^ +| +$/, "", c[2]); gsub(/^ +| +$/, "", c[3]); gsub(/`/, "", c[3]); print c[2] "|" c[3] }' \
    "$platform/README.md"
}
expected_of() { expected_values | awk -F '|' -v k="$1" '$1 == k {print $2; found = 1} END {if (!found) exit 1}'; }

missing=0
while IFS='|' read -r name query; do
  expected_of "$name" > /dev/null || { echo "README server-settings table has no row: $name" >&2; missing=1; }
done <<< "$checks"
if [ "${1:-}" = "--list-expected" ]; then expected_values; exit "$missing"; fi
[ "$missing" = 0 ] || die "platform/README.md server-settings table is incomplete"

need_az
mkdir -p "$evidence_dir"
out="$evidence_dir/$today-x1-server.txt"
{
  fails=0
  echo "X1 server settings of $server, $(date -u '+%Y-%m-%d %H:%M UTC') (az CLI), compared with platform/README.md"
  echo
  while IFS='|' read -r name query; do
    want="$(expected_of "$name")"
    case "$query" in
      @parameter)
        got="$(az postgres flexible-server parameter show -g "$X1_RG" -s "$server" -n require_secure_transport --query value -o tsv | tr 'A-Z' 'a-z')" ;;
      @firewall)
        echo "firewall rules (name, start, end):"
        az postgres flexible-server firewall-rule list -g "$X1_RG" -n "$server" --query "[].[name, startIpAddress, endIpAddress]" -o tsv
        got="$(az postgres flexible-server firewall-rule list -g "$X1_RG" -n "$server" --query "[].[startIpAddress, endIpAddress]" -o tsv \
               | awk -F '\t' '{printf "%s%s-%s", (NR > 1 ? ", " : ""), $1, $2}')" ;;
      *)
        got="$(az postgres flexible-server show -g "$X1_RG" -n "$server" --query "$query" -o tsv)" ;;
    esac
    if [ "$got" = "$want" ]; then echo "PASS  $name = $got"; else echo "FAIL  $name = $got (README says $want)"; fails=$((fails + 1)); fi
  done <<< "$checks"
  echo
  q() { az postgres flexible-server show -g "$X1_RG" -n "$server" --query "$1" -o tsv; }
  echo "info  geo-redundant backup = $(q backup.geoRedundantBackup)"
  echo "info  high availability = $(q highAvailability.mode)"
  echo "info  storage auto-grow = $(q storage.autoGrow)"
  echo "info  password authentication = $(q authConfig.passwordAuth); Entra authentication = $(q authConfig.activeDirectoryAuth)"
  echo "info  earliest restore point (UTC) = $(q backup.earliestRestoreDate)"
  echo "info  ssl_min_protocol_version = $(az postgres flexible-server parameter show -g "$X1_RG" -s "$server" -n ssl_min_protocol_version --query value -o tsv)"
  echo "info  state = $(q state)"
  echo
  echo "RESULT: $fails difference(s) from platform/README.md"
} 2>&1 | tee "$out"
echo "Saved: $out"
