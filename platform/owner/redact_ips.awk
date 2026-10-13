# Replace IPv4 and IPv6 address literals with <IP address> in text bound for an evidence file (a server's refusal quotes
# the client's public IP; psql's errors quote the server's). POSIX awk, so it runs the same on macOS, Linux and
# busybox. A candidate counts only as a whole word that is a valid address:
#   - IPv4: four octets 0-255, not touching a letter, digit or dot (so 1.2.3.4.5 and v1.2.3.4 stay as they are);
#     0.0.0.0 and 255.255.255.255 stay visible: they are range bounds (the public firewall rule), not anyone's address;
#   - IPv6: hex groups of at most 4 digits, with "::" (once) or exactly 8 groups, not touching a letter, digit, colon
#     or dot. So PostgreSQL casts such as 'x1'::bytea or x::date (a letter follows) and times such as 22:58:01 stay.
# The first version (sed) also ate "::bytea" and the range bounds (judge 30).

function ipv4_ok(t,    n, o, i) {
  if (t == "0.0.0.0" || t == "255.255.255.255") return 0
  n = split(t, o, ".")
  if (n != 4) return 0
  for (i = 1; i <= 4; i++) if (o[i] == "" || length(o[i]) > 3 || o[i] + 0 > 255) return 0
  return 1
}

function ipv6_ok(t,    rest, n, g, i, groups, double) {
  if (t !~ /[0-9A-Fa-f]/) return 0
  rest = t; double = gsub(/::/, ":", rest)
  if (double > 1) return 0
  sub(/^:/, "", rest); sub(/:$/, "", rest)
  n = split(rest, g, ":")
  groups = 0
  for (i = 1; i <= n; i++) {
    if (g[i] == "" || length(g[i]) > 4) return 0
    groups++
  }
  if (double == 1) return groups <= 7
  return groups == 8 && t !~ /^:/ && t !~ /:$/
}

# Replace every match of re in s that passes ok_kind (4 or 6) and has a clean boundary on both sides.
function scan(s, re, kind, edge,    out, tok, before, after) {
  out = ""
  while (match(s, re)) {
    tok = substr(s, RSTART, RLENGTH)
    before = (RSTART > 1) ? substr(s, RSTART - 1, 1) : (length(out) ? substr(out, length(out), 1) : "")
    after = substr(s, RSTART + RLENGTH, 1)
    out = out substr(s, 1, RSTART - 1)
    if (before !~ edge && after !~ edge && ((kind == 4 && ipv4_ok(tok)) || (kind == 6 && ipv6_ok(tok))))
      out = out "<IP address>"
    else
      out = out tok
    s = substr(s, RSTART + RLENGTH)
  }
  return out s
}

{
  line = scan($0, "[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+", 4, "[0-9A-Za-z.]")
  print scan(line, "[0-9A-Fa-f]*:[0-9A-Fa-f:]*", 6, "[0-9A-Za-z:.]")
}
