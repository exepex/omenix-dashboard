#!/usr/bin/env bash
# X1: tests of the owner scripts' Azure handling without Azure, using a fake "az" on PATH.
#   1. server_evidence.sh works with current az (server = --server-name) and older az (server = --name), and an az
#      failure prints "ERROR, could not read", never a value mismatch with an empty value.
#   2. az_firewall_create uses the current flags, and the older ones only when az rejects the arguments.
#   3. redact_ips replaces IPv4 and IPv6 addresses (the TLS evidence quotes the client's public IP) and keeps times.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
owner="$(dirname "$here")/owner"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
failed=0
check() { if eval "$2"; then echo "ok: $1"; else echo "FAILED: $1"; failed=1; fi; }

# Fake az. FAKE_AZ: new (current flags), old (older flags) or broken (every read fails). Logs each call.
mkdir "$work/bin"
cat > "$work/bin/az" <<'EOF'
#!/usr/bin/env bash
echo "$*" >> "$FAKE_AZ_LOG"
args=" $* "
case "$args" in *" account show "*) echo "subscription"; exit 0 ;; esac
if [ "$FAKE_AZ" = broken ]; then echo "ERROR: (ResourceNotFound) server not found" >&2; exit 1; fi
case "$args" in
  *" firewall-rule "*)
    if [ "$FAKE_AZ" = new ] && [[ "$args" == *" --name omenix-pg"* || "$args" == *" -n omenix-pg"* ]]; then
      echo "ERROR: unrecognized arguments: -n omenix-pg" >&2; exit 2; fi  # the owner's az, 13 Oct 2026
    if [ "$FAKE_AZ" = old ] && [[ "$args" == *" --server-name "* ]]; then
      echo "ERROR: unrecognized arguments: --server-name omenix-pg" >&2; exit 2; fi
    case "$args" in *" create "*) exit 0 ;; esac
    case "$args" in *"[].[name,"*) printf 'AllowAll\t0.0.0.0\t255.255.255.255\n' ;;
                    *) printf '0.0.0.0\t255.255.255.255\n' ;; esac ;;
  *" parameter show "*) echo "on" ;;
  *" show "*)
    case "$args" in
      *" location "*) echo "Central India" ;;           *" sku.name "*) echo "Standard_B1ms" ;;
      *" sku.tier "*) echo "Burstable" ;;               *" version "*) echo "16" ;;
      *" storage.storageSizeGb "*) echo "32" ;;         *" storage.tier "*) echo "P4" ;;
      *" backup.backupRetentionDays "*) echo "14" ;;    *" network.publicNetworkAccess "*) echo "Enabled" ;;
      *" dataEncryption.type "*) echo "SystemManaged" ;; *) echo "x" ;;
    esac ;;
esac
EOF
chmod +x "$work/bin/az"
export PATH="$work/bin:$PATH" X1_RG=rg X1_EVIDENCE_DIR="$work/evidence" FAKE_AZ_LOG="$work/az.log"

for mode in new old; do
  : > "$FAKE_AZ_LOG"
  FAKE_AZ=$mode "$owner/server_evidence.sh" > "$work/$mode.txt" 2>&1
  check "server_evidence.sh with $mode az: 0 differences, 0 unread" \
    "grep -q 'RESULT: 0 difference(s) from platform/README.md; 0 setting(s) could not be read' '$work/$mode.txt'"
  check "server_evidence.sh with $mode az: firewall rule read" \
    "grep -q 'PASS  firewall rules = 0.0.0.0-255.255.255.255' '$work/$mode.txt'"
done
FAKE_AZ=broken "$owner/server_evidence.sh" > "$work/broken.txt" 2>&1
check "broken az: each setting is an ERROR, not a FAIL" \
  "[ \"\$(grep -c '^ERROR .*could not read (ERROR: (ResourceNotFound) server not found)' '$work/broken.txt')\" = 11 ] && ! grep -q '^FAIL' '$work/broken.txt'"
check "broken az: RESULT counts unread settings" "grep -q '0 difference(s) from platform/README.md; 11 setting(s) could not be read' '$work/broken.txt'"

( . "$owner/lib.sh"; . "$owner/az.sh"
  for mode in new old; do
    : > "$FAKE_AZ_LOG"
    FAKE_AZ=$mode az_firewall_create omenix-pg-x1restore x1-owner-mac 192.0.2.7 192.0.2.7 || echo "create failed ($mode)"
    tail -1 "$FAKE_AZ_LOG" > "$work/create_$mode.txt"
  done )
check "firewall create, current az: --server-name and --name" \
  "grep -q -- '--server-name omenix-pg-x1restore --name x1-owner-mac' '$work/create_new.txt'"
check "firewall create, older az: --name and --rule-name" \
  "grep -q -- '--name omenix-pg-x1restore --rule-name x1-owner-mac' '$work/create_old.txt'"

redacted="$( . "$owner/lib.sh"; printf '%s\n' \
  'FATAL:  no pg_hba.conf entry for host "203.0.113.45", user "x1_tls_probe", database "omenix", no encryption' \
  'connection to server at "omenix-pg.postgres.database.azure.com" (198.51.100.20), port 5432 failed' \
  'no pg_hba.conf entry for host "2001:db8:85a3:0:0:8a2e:370:7334"' \
  'no pg_hba.conf entry for host "2001:db8::1"' \
  'X1 TLS check on omenix-pg.postgres.database.azure.com, 2026-10-13 01:38 UTC, at 22:58:01' | redact_ips)"
check "IPv4 addresses redacted" "! printf '%s' \"\$redacted\" | grep -Eq '203\\.0\\.113\\.45|198\\.51\\.100\\.20'"
check "IPv6 addresses redacted" "! printf '%s' \"\$redacted\" | grep -Eq '2001:db8'"
check "redacted text keeps its shape" "[ \"\$(printf '%s' \"\$redacted\" | grep -c '<IP address>')\" = 4 ]"
check "times and host names kept" "printf '%s' \"\$redacted\" | grep -q '01:38 UTC, at 22:58:01' && printf '%s' \"\$redacted\" | grep -q 'omenix-pg.postgres.database.azure.com'"

# Judge 30: the first (sed) version also ate SQL casts and the public range bounds. Each line must come out unchanged.
kept="SELECT lo_from_bytea(0, 'x1'::bytea) and x::date and y::double precision and z::int
firewall rules = 0.0.0.0-255.255.255.255 (README says 0.0.0.0-255.255.255.255)
version 1.2.3.4.5, v16.4.1.2, 999.1.1.1, 300.1.2.3"
check "SQL casts, range bounds, versions and invalid octets kept" \
  "[ \"\$( . '$owner/lib.sh'; printf '%s\n' \"\$kept\" | redact_ips)\" = \"\$kept\" ]"
check "IPv6 with :: and the loopback ::1 redacted" \
  "[ \"\$( . '$owner/lib.sh'; printf '%s\n' 'host \"::1\" and fe80::1ff:fe23:4567:890a end' | redact_ips)\" = 'host \"<IP address>\" and <IP address> end' ]"

# check_tls.sh end to end with a fake psql: the evidence file is complete (RESULT line written) and holds no IP.
cat > "$work/bin/psql" <<'EOF'
#!/usr/bin/env bash
case " $* " in *" --version "*) echo "psql (PostgreSQL) 16.4"; exit 0 ;; esac
if [ "${PGSSLMODE:-}" = disable ]; then
  echo 'psql: error: connection to server at "omenix-pg.postgres.database.azure.com" (198.51.100.20), port 5432 failed: FATAL:  no pg_hba.conf entry for host "203.0.113.45", user "x1_tls_probe", database "omenix", no encryption' >&2
  exit 2
fi
echo "ssl=true version=TLSv1.3 cipher=TLS_AES_256_GCM_SHA384"
EOF
chmod +x "$work/bin/psql"
FAKE_AZ=new "$owner/check_tls.sh" > /dev/null 2>&1
sleep 1   # tee runs in its own process
tls_file="$(ls "$work"/evidence/*-x1-tls.txt 2>/dev/null | head -1)"
check "check_tls.sh writes a complete evidence file" \
  "[ -n '$tls_file' ] && grep -q 'RESULT: require_secure_transport on: yes; non-TLS refused: yes; verified TLS connection works: yes' '$tls_file'"
check "check_tls.sh evidence holds no IP address" \
  "[ -n '$tls_file' ] && ! grep -Eq '[0-9]{1,3}(\\.[0-9]{1,3}){3}' '$tls_file' && grep -q 'host \"<IP address>\"' '$tls_file'"

# Issue #3: large_objects.sh tells a database the server refuses to plain roles (CLOSED: exception 2 closed in
# practice) from one it cannot count for another reason (FAIL). Fake psql: azure_sys refuses, azure_maintenance times out.
mkdir "$work/lo_bin"
cat > "$work/lo_bin/psql" <<'EOF'
#!/usr/bin/env bash
case " $* " in
  *" -d omenix "*"pg_database"*) printf 'azure_maintenance:t\nazure_sys:t\nomenix:t\n' ;;
  *" -d omenix "*) echo "0 0 none" ;;
  *" -d azure_sys "*) echo 'psql: error: connection to server at "omenix-pg.postgres.database.azure.com" (198.51.100.20), port 5432 failed: FATAL:  no pg_hba.conf entry for host "203.0.113.45", user "db_monitor", database "azure_sys", SSL encryption' >&2; exit 2 ;;
  *" -d azure_maintenance "*) echo 'psql: error: connection to server failed: timeout expired' >&2; exit 2 ;;
esac
EOF
chmod +x "$work/lo_bin/psql"
PATH="$work/lo_bin:$PATH" "$here/large_objects.sh" > "$work/lo.txt" 2>&1; lo_rc=$?
check "a database refused to plain roles is CLOSED, not a failure" "grep -q '^CLOSED  database azure_sys: the server refuses this role' '$work/lo.txt'"
check "a database that cannot be counted for another reason still FAILs" "grep -q '^FAIL  database azure_maintenance' '$work/lo.txt' && [ $lo_rc = 1 ]"
check "the refusal's IP addresses are not printed" "! grep -Eq '203\\.0\\.113|198\\.51\\.100' '$work/lo.txt'"

# setup_monitor.sh (issue #2) must never print or pass on the monitor's password or its verifier except to gh's stdin.
check "setup_monitor.sh never prints the password, its verifier or the Slack token" \
  "! grep -nE '(echo|printf).*\\\$(\\{)?(password|verifier|slack_token)' '$owner/setup_monitor.sh' | grep -vE '\\| (python3 -I .*scram_verifier\\.py|gh secret set )'"
check "setup_monitor.sh sends the password and token only through stdin" \
  "! grep -nE -- '(-c|-v|--body)[^|]*\\\$(\\{)?(password|slack_token)' '$owner/setup_monitor.sh'"

# Every trap must be set in the main shell: no owner script may wrap its body in a "{ ...; } | tee" block, where bash
# 3.2 never runs an EXIT trap (13 Oct 2026: the restore marker stayed on omenix-pg). tests/bash32_trap_test.sh runs it.
check "no owner script pipes a { } block into tee" "! grep -nE '^\\}.*\\|' '$owner'/*.sh"
check "every trap in the owner scripts is set at the top level" "! grep -nE '^[[:space:]]+trap ' '$owner'/*.sh"

[ "$failed" -eq 0 ] && echo "owner script tests: all passed"
