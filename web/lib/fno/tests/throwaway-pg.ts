// A disposable PostgreSQL with TLS for the W2 integration tests (the cloud containers cannot reach Azure): a fresh
// cluster in a temporary folder on a random port, a test root CA and a server certificate for "localhost", TLS-only
// password logins for the dashboard's role, P6's two tables (exepex/trading db/fno/migrations/001_read_models.sql) and
// the role's SELECT grant. The tests skip when no PostgreSQL binaries are installed. Test-only.
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";

export const ROLE = "dashboard_app";
export const PASSWORD = "throwaway-test-only";

const DDL = `
create schema fno;
create table fno.pages_history (
  product text not null, page_key text not null, publication_id text not null, market text not null, as_of date not null,
  cutoff timestamptz not null, built_at timestamptz not null, schema_version text not null, source_commit text not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'), payload jsonb not null,
  primary key (product, page_key, publication_id));
create table fno.current_publication (
  product text primary key, publication_id text not null, as_of date not null, published_at timestamptz not null default now());
create role ${ROLE} login password '${PASSWORD}';
grant usage on schema fno to ${ROLE};
grant select on fno.pages_history, fno.current_publication to ${ROLE};`;

/** The folder of PostgreSQL's server binaries, or null. */
export function pgBin(): string | null {
  const root = "/usr/lib/postgresql";
  if (!existsSync(root)) return null;
  const version = readdirSync(root).filter((v) => existsSync(join(root, v, "bin", "initdb"))).sort((a, b) => Number(b) - Number(a))[0];
  return version ? join(root, version, "bin") : null;
}

export interface ThrowawayPg {
  port: number;
  /** The test root CA's certificate (PEM): what the server's certificate chains to. */
  ca: string;
  admin: pg.Client;
  /** Serves the certificate issued for `name` instead (the server reloads it). */
  serveCertFor(name: string): void;
  stop(): Promise<void>;
}

export async function startThrowawayPg(bin: string): Promise<ThrowawayPg> {
  const dir = mkdtempSync(join(tmpdir(), "w2-pg-"));
  const asRoot = process.getuid?.() === 0;
  const run = (cmd: string, args: string[]) => execFileSync(asRoot ? "runuser" : cmd, asRoot ? ["-u", "postgres", "--", cmd, ...args] : args, { stdio: "pipe" });
  const ssl = (args: string[]) => execFileSync("openssl", args, { cwd: dir, stdio: "pipe" });
  ssl(["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "2", "-subj", "/CN=W2 throwaway test root", "-keyout", "ca.key", "-out", "ca.crt"]);
  const issue = (name: string) => {
    ssl(["req", "-newkey", "rsa:2048", "-nodes", "-subj", `/CN=${name}`, "-keyout", `${name}.key`, "-out", `${name}.csr`]);
    writeFileSync(join(dir, `${name}.ext`), `subjectAltName=DNS:${name}\n`);
    ssl(["x509", "-req", "-in", `${name}.csr`, "-CA", "ca.crt", "-CAkey", "ca.key", "-CAcreateserial", "-days", "2", "-extfile", `${name}.ext`, "-out", `${name}.crt`]);
    chmodSync(join(dir, `${name}.key`), 0o600);
  };
  issue("localhost");
  issue("elsewhere.example");
  const data = join(dir, "data");
  if (asRoot) execFileSync("chown", ["-R", "postgres:postgres", dir]);
  run(join(bin, "initdb"), ["-D", data, "-U", "postgres", "--auth-local=trust", "--auth-host=reject", "-E", "UTF8"]);
  const port = 20000 + Math.floor(Math.random() * 20000);
  const conf = (name: string) => `port = ${port}\nlisten_addresses = 'localhost'\nunix_socket_directories = '${dir}'\nssl = on\nssl_ca_file = '${dir}/ca.crt'\nssl_cert_file = '${dir}/${name}.crt'\nssl_key_file = '${dir}/${name}.key'\n`;
  const writeConf = (name: string) => writeFileSync(join(data, "postgresql.auto.conf"), conf(name));
  writeConf("localhost");
  writeFileSync(join(data, "pg_hba.conf"), "local all all trust\nhostssl all all 127.0.0.1/32 scram-sha-256\nhostssl all all ::1/128 scram-sha-256\n");
  run(join(bin, "pg_ctl"), ["-D", data, "-l", join(dir, "log"), "-w", "start"]);
  const admin = new pg.Client({ host: dir, port, user: "postgres", database: "postgres" });
  await admin.connect();
  await admin.query(DDL);
  return {
    port,
    ca: readFileSync(join(dir, "ca.crt"), "utf8"),
    admin,
    serveCertFor(name) {
      writeConf(name);
      run(join(bin, "pg_ctl"), ["-D", data, "reload"]);
      execFileSync("sleep", ["0.5"]);
    },
    async stop() {
      await admin.end();
      run(join(bin, "pg_ctl"), ["-D", data, "-m", "immediate", "-w", "stop"]);
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
