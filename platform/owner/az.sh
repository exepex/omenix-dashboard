# Azure CLI helpers for the owner scripts (sourced after lib.sh). They keep az version differences and az errors in
# one place.

# Firewall-rule commands changed their flags between az versions: current az names the server --server-name (-s) and
# the rule --name (-n); older az named the server --name (-n) and the rule --rule-name. Try the current form, and use
# the older one only when az rejects the arguments themselves ("unrecognized arguments"); any other error is returned.
az_firewall_list() {  # server, then extra az arguments (e.g. --query ... -o tsv)
  local srv="$1" err rc
  shift
  err="$(mktemp)"
  az postgres flexible-server firewall-rule list -g "$X1_RG" --server-name "$srv" "$@" 2> "$err"
  rc=$?
  if [ "$rc" -ne 0 ] && grep -q "unrecognized arguments" "$err"; then
    az postgres flexible-server firewall-rule list -g "$X1_RG" --name "$srv" "$@"
    rc=$?
  else
    cat "$err" >&2
  fi
  rm -f "$err"
  return "$rc"
}

az_firewall_create() {  # server, rule name, start IP, end IP
  local err rc
  err="$(mktemp)"
  az postgres flexible-server firewall-rule create -g "$X1_RG" --server-name "$1" --name "$2" \
    --start-ip-address "$3" --end-ip-address "$4" -o none 2> "$err"
  rc=$?
  if [ "$rc" -ne 0 ] && grep -q "unrecognized arguments" "$err"; then
    az postgres flexible-server firewall-rule create -g "$X1_RG" --name "$1" --rule-name "$2" \
      --start-ip-address "$3" --end-ip-address "$4" -o none
    rc=$?
  else
    cat "$err" >&2
  fi
  rm -f "$err"
  return "$rc"
}

# Run an az command that prints one value. On failure print "ERROR, could not read (<az's first error line>)" instead,
# so a failed read can never look like a value, and return 1.
az_value() {
  local out err rc
  err="$(mktemp)"
  out="$("$@" 2> "$err")"
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "ERROR, could not read ($(grep -m 1 . "$err" | redact_ips))"
    rm -f "$err"
    return 1
  fi
  rm -f "$err"
  printf '%s\n' "$out"
}
