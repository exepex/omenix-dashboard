# Shared settings for the owner scripts (sourced, not run). Nothing secret lives here or is ever written to disk:
# passwords are typed at a hidden prompt and kept only in this shell process's memory.
set -u
platform="$(cd "$(dirname "$0")/.." && pwd)"
server="${X1_SERVER:-omenix-pg}"                               # Azure server name (not a secret)
host="${X1_HOST:-$server.postgres.database.azure.com}"
export PGHOST="$host" PGPORT="${X1_PORT:-5432}"
export PGSSLMODE="${X1_SSLMODE:-verify-full}"                  # verified TLS, as the apps will use it
export PGSSLROOTCERT="${X1_SSLROOTCERT:-system}"               # the Mac's trusted roots (needs libpq 16 or later)
[ "$PGSSLROOTCERT" != "none" ] || unset PGSSLROOTCERT           # X1_SSLROOTCERT=none: only for a local test copy
evidence_dir="$platform/evidence"
today="$(date +%Y-%m-%d)"

die() { echo "STOPPED: $*" >&2; exit 1; }

need_psql16() {
  command -v psql > /dev/null || die "psql not found (brew install libpq, then add its bin folder to PATH)"
  local major
  major="$(psql --version | sed -E 's/[^0-9]*([0-9]+).*/\1/')"
  [ "$major" -ge 16 ] || die "psql $major is too old for sslrootcert=system; need 16 or later (brew upgrade libpq)"
}

need_az() {
  command -v az > /dev/null || die "az not found (brew install azure-cli, then az login)"
  az account show --query name -o tsv > /dev/null 2>&1 || die "not logged in to Azure (run: az login)"
  [ -n "${X1_RG:-}" ] || die "set X1_RG to the server's resource group name first (export X1_RG=...)"
}

# Ask for the admin user name and password once; both stay in memory only. Admin psql calls use admin_psql.
ask_admin() {
  if [ -z "${X1_ADMIN:-}" ]; then printf 'Azure admin user name: ' > /dev/tty; read -r X1_ADMIN < /dev/tty; fi
  printf 'Password for %s (hidden): ' "$X1_ADMIN" > /dev/tty; read -rs admin_password < /dev/tty; echo > /dev/tty
}
admin_psql() { PGUSER="$X1_ADMIN" PGPASSWORD="$admin_password" psql -X -q -v ON_ERROR_STOP=1 "$@"; }
