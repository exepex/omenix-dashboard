// The F&O read path's database connection (story W2): node-postgres with TLS always on and verified against the pinned
// roots, the server's name checked (verify-full), a 10 s connect and 5 s statement limit, one connection, no retries.
// A failure leaves this module as FnoUnavailable with a class only (network, TLS, authentication, permission, missing
// table, other): never the driver's message, which can name the host and the user.
import pg from "pg";
import type { FnoDbSettings } from "./config.ts";

export type FailureClass = "network" | "tls" | "authentication" | "permission" | "missing_table" | "other";

export class FnoUnavailable extends Error {
  readonly failure: FailureClass;
  constructor(failure: FailureClass) {
    super(`F&O data unavailable (${failure})`);
    this.name = "FnoUnavailable";
    this.failure = failure;
  }
}

const TLS_CODES = /^(CERT_|UNABLE_TO_|SELF_SIGNED|DEPTH_ZERO|ERR_TLS|ERR_SSL|HOSTNAME_MISMATCH|ERR_TLS_CERT_ALTNAME_INVALID)/;

/** The class of a driver error, from its codes only (SQLSTATE, Node's error code), never its message text. */
export function failureOf(error: unknown): FailureClass {
  const code = String((error as { code?: unknown })?.code ?? "");
  if (code === "28P01" || code === "28000") return "authentication";
  if (code === "42501") return "permission";
  if (code === "42P01" || code === "3F000") return "missing_table";
  if (TLS_CODES.test(code)) return "tls";
  if (["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNRESET", "EHOSTUNREACH"].includes(code)) return "network";
  if (/timeout/i.test(String((error as Error)?.message ?? ""))) return "network";
  return "other";
}

export type Query = (text: string, values: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

export function fnoQuery(settings: FnoDbSettings): Query {
  let pool: pg.Pool | null = null;
  return async (text, values) => {
    pool ??= new pg.Pool({
      host: settings.host, port: settings.port, database: settings.database, user: settings.user, password: settings.password,
      ssl: { ca: settings.ca, rejectUnauthorized: true, servername: settings.host },
      max: 1, statement_timeout: 5000, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000,
    });
    pool.on("error", () => {}); // an idle connection's error must not crash the server; the next query reports it
    try {
      const result = await pool.query(text, values);
      return { rows: result.rows as Record<string, unknown>[] };
    } catch (error) {
      throw new FnoUnavailable(failureOf(error)); // the driver's text (host, user) never leaves this function
    }
  };
}
