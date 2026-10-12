#!/usr/bin/env bash
# Owner step for X1 criterion 5 (and the tier, region and backup facts in platform/README.md): the server's settings
# and firewall rules from az, checked against what the README states.
# Run on the owner's Mac from the repository root:   X1_RG=<resource group> platform/owner/server_evidence.sh
# Only named fields are queried: no IDs, subscription, admin name or connection details.
# Output: platform/evidence/<date>-x1-server.txt
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/lib.sh"
need_az
mkdir -p "$evidence_dir"
out="$evidence_dir/$today-x1-server.txt"
q() { az postgres flexible-server show -g "$X1_RG" -n "$server" --query "$1" -o tsv; }
expect() {  # name, actual, expected
  if [ "$2" = "$3" ]; then echo "PASS  $1 = $2"; else echo "FAIL  $1 = $2 (README says $3)"; fails=$((fails + 1)); fi
}
{
  fails=0
  echo "X1 server settings of $server, $(date -u '+%Y-%m-%d %H:%M UTC') (az CLI)"
  echo
  echo "== server"
  expect "location" "$(q location)" "Central India"
  expect "sku" "$(q sku.name)" "Standard_B1ms"
  expect "tier" "$(q sku.tier)" "Burstable"
  expect "PostgreSQL version" "$(q version)" "16"
  expect "storage GiB" "$(q storage.storageSizeGb)" "32"
  expect "storage performance tier" "$(q storage.tier)" "P4"
  expect "backup retention days" "$(q backup.backupRetentionDays)" "14"
  expect "public network access" "$(q network.publicNetworkAccess)" "Enabled"
  expect "data encryption" "$(q dataEncryption.type)" "SystemManaged"
  echo "info  geo-redundant backup = $(q backup.geoRedundantBackup)"
  echo "info  high availability = $(q highAvailability.mode)"
  echo "info  storage auto-grow = $(q storage.autoGrow)"
  echo "info  password authentication = $(q authConfig.passwordAuth); Entra authentication = $(q authConfig.activeDirectoryAuth)"
  echo "info  earliest restore point (UTC) = $(q backup.earliestRestoreDate)"
  echo "info  state = $(q state)"
  echo
  echo "== firewall rules (name, start, end)"
  rules="$(az postgres flexible-server firewall-rule list -g "$X1_RG" -n "$server" \
           --query "[].[name, startIpAddress, endIpAddress]" -o tsv)"
  echo "$rules"
  expect "number of firewall rules" "$(printf '%s\n' "$rules" | grep -c .)" "1"
  expect "rule range" "$(printf '%s\n' "$rules" | awk -F '\t' 'NR==1 {print $2 "-" $3}')" "0.0.0.0-255.255.255.255"
  echo
  echo "== TLS parameters"
  for p in require_secure_transport ssl_min_protocol_version; do
    echo "info  $p = $(az postgres flexible-server parameter show -g "$X1_RG" -s "$server" -n "$p" --query value -o tsv)"
  done
  expect "require_secure_transport" "$(az postgres flexible-server parameter show -g "$X1_RG" -s "$server" -n require_secure_transport --query value -o tsv | tr 'A-Z' 'a-z')" "on"
  echo
  echo "RESULT: $fails difference(s) from platform/README.md"
} 2>&1 | tee "$out"
echo "Saved: $out"
