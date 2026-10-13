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

[ "$failed" -eq 0 ] && echo "owner script tests: all passed"
