#!/usr/bin/env bash
# Owner step: protect omenix-pg against deletion and get an email on bursts of failed connections.
#   1. Azure resource lock "omenix-pg-no-delete" (CanNotDelete) on the server only: deleting the server would also delete
#      all its backups, so the lock must be removed by hand before any delete. Changes to the server stay possible.
#   2. Action group "omenix-db-alerts" that emails you (address typed at the prompt, stored only in Azure).
#   3. Metric alert "omenix-pg-failed-connections": total Failed Connections (metric connections_failed, Microsoft's
#      documented Flexible Server metric, enabled by default) above X1_FAILED_THRESHOLD (default 10) in 15 minutes,
#      checked every 5 minutes. The metric counts EVERY failed connection (wrong password, unknown user, non-TLS attempt,
#      connection limit reached), not only password guessing; it does not say who failed. Idempotent: re-running updates.
# Run on the owner's Mac from the repository root:   X1_RG=<resource group> platform/owner/protect_server.sh
# Output: platform/evidence/<date>-x1-protect.txt (no email address, IDs or subscription).
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/lib.sh"
need_az
mkdir -p "$evidence_dir"
out="$evidence_dir/$today-x1-protect.txt"
threshold="${X1_FAILED_THRESHOLD:-10}"
server_id="$(az postgres flexible-server show -g "$X1_RG" -n "$server" --query id -o tsv)" || die "server not found"
printf 'Email address for alerts (stored only in Azure, not shown or saved here): ' > /dev/tty; read -r alert_email < /dev/tty
[ -n "$alert_email" ] || die "no email address typed"
{
  echo "X1 protection of $server, $(date -u '+%Y-%m-%d %H:%M UTC')"
  echo; echo "== 1. delete lock"
  az lock create -g "$X1_RG" --name omenix-pg-no-delete --lock-type CanNotDelete \
    --resource "$server" --resource-type Microsoft.DBforPostgreSQL/flexibleServers \
    --notes "Deleting the server deletes its backups (X1). Remove this lock by hand only on purpose." -o none \
    || die "lock not created"
  az lock list -g "$X1_RG" --resource "$server" --resource-type Microsoft.DBforPostgreSQL/flexibleServers \
    --query "[].[name, level]" -o tsv
  echo; echo "== 2. action group (email)"
  az monitor action-group create -g "$X1_RG" -n omenix-db-alerts --short-name omenixdb \
    --action email owner "$alert_email" -o none || die "action group not created"
  echo "action group omenix-db-alerts: email receivers = $(az monitor action-group show -g "$X1_RG" -n omenix-db-alerts --query 'length(emailReceivers)' -o tsv)"
  echo; echo "== 3. failed-connection alert"
  az monitor metrics alert create -g "$X1_RG" -n omenix-pg-failed-connections --scopes "$server_id" \
    --condition "total connections_failed > $threshold" --window-size 15m --evaluation-frequency 5m \
    --severity 2 --action omenix-db-alerts \
    --description "More than $threshold failed connections to $server in 15 minutes (X1)" -o none \
    || die "alert not created"
  az monitor metrics alert show -g "$X1_RG" -n omenix-pg-failed-connections \
    --query "{name:name, enabled:enabled, severity:severity, window:windowSize, every:evaluationFrequency, metric:criteria.allOf[0].metricName, aggregation:criteria.allOf[0].timeAggregation, operator:criteria.allOf[0].operator, threshold:criteria.allOf[0].threshold}" -o yaml
  echo; echo "RESULT: lock, action group and alert in place"
} 2>&1 | tee "$out"
echo "Saved: $out"
