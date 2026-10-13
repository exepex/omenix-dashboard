#!/usr/bin/env bash
# Owner step for X1 criterion 3: TLS is required and a non-TLS connection is refused.
# Run on the owner's Mac from the repository root:   X1_RG=<resource group> platform/owner/check_tls.sh
# 1. az: the server parameters require_secure_transport and ssl_min_protocol_version.
# 2. psql with sslmode=disable (no encryption) must be refused. It uses a role name that does not exist
#    (x1_tls_probe), so no password is involved at all; the server refuses before authentication.
# 3. psql as dashboard_app with sslmode=verify-full (asks its password) shows the TLS version and cipher in use.
# Output: platform/evidence/<date>-x1-tls.txt (no secrets; every IPv4/IPv6 address, such as this Mac's public IP in
# the server's refusal, replaced by <IP address>). Set X1_SKIP_AZ=1 to skip step 1 (e.g. a local test).
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/lib.sh"
. "$here/az.sh"
need_psql16
[ "${X1_SKIP_AZ:-0}" = "1" ] || need_az
mkdir -p "$evidence_dir"
out="$evidence_dir/$today-x1-tls.txt"
record_evidence "$out"
echo "X1 TLS check on $host, $(date -u '+%Y-%m-%d %H:%M UTC')"
if [ "${X1_SKIP_AZ:-0}" != "1" ]; then
  echo; echo "== 1. server parameters (az)"
  for p in require_secure_transport ssl_min_protocol_version; do
    az postgres flexible-server parameter show -g "$X1_RG" -s "$server" -n "$p" --query "{name:name, value:value}" -o tsv
  done
  if rst="$(az_value az postgres flexible-server parameter show -g "$X1_RG" -s "$server" -n require_secure_transport --query value -o tsv)"; then
    if [ "$(printf '%s' "$rst" | tr 'A-Z' 'a-z')" = on ]; then rst_ok=yes; else rst_ok=no; fi
  else
    rst_ok="$rst"   # "ERROR, could not read (...)": never shown as a value
  fi
else
  rst_ok="not checked (X1_SKIP_AZ=1)"
fi
echo; echo "== 2. connection without TLS (sslmode=disable) must be refused"
# PGSSLROOTCERT is removed for this attempt only: with sslrootcert=system libpq itself refuses sslmode=disable
# before contacting the server, which would prove nothing about the server.
refused="$(env -u PGSSLROOTCERT PGSSLMODE=disable PGUSER=x1_tls_probe PGPASSWORD= psql -X -w -d omenix -c 'SELECT 1' 2>&1)"
rc=$?
echo "psql exit code: $rc"
echo "server answer: $(printf '%s' "$refused" | redact_ips)"   # the refusal quotes this Mac's public IP
case "$refused" in
  *"weak sslmode"*) plain_refused=no ;;   # refused by our own client, not by the server: no proof
  *"no encryption"*|*"SSL off"*|*"SSL connection is required"*|*"SSL is required"*) plain_refused=yes ;;
  *) plain_refused=no ;;
esac
[ "$rc" -ne 0 ] || plain_refused=no
echo "refused because it was not encrypted: $plain_refused"
echo; echo "== 3. verified TLS connection as dashboard_app (sslmode=$PGSSLMODE)"
tls_line="$(PGUSER=dashboard_app psql -X -d omenix -A -F ' ' -t 2>&1 \
  -c "SELECT 'ssl=' || ssl, 'version=' || version, 'cipher=' || cipher FROM pg_stat_ssl WHERE pid = pg_backend_pid()")" \
  && tls_ok=yes || tls_ok=no
printf '%s\n' "$tls_line" | redact_ips   # an error from psql would quote the server's IP
echo; echo "RESULT: require_secure_transport on: $rst_ok; non-TLS refused: $plain_refused; verified TLS connection works: $tls_ok"
echo "Saved: $out"
