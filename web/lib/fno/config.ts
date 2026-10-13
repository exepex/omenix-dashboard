// Where the F&O read path connects (story W2): the dashboard's runtime role on Azure Postgres, from four server-only
// environment variables (Vercel). Discrete settings, not a URL, so nothing in them can weaken TLS (a URL's sslmode
// would). None set: the F&O blocks use the fixtures (development). Some set: a configuration error that names the
// missing variables, never a silent fallback to examples. Pure.
import { AZURE_POSTGRES_ROOTS } from "./azure-roots.ts";

export const FNO_DB_VARIABLES = ["OMENIX_FNO_PG_HOST", "OMENIX_FNO_PG_DATABASE", "OMENIX_FNO_PG_USER", "OMENIX_FNO_PG_PASSWORD"] as const;

export interface FnoDbSettings {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  /** The roots the server's certificate must chain to (Azure's, pinned; a test CA in tests). */
  ca: string;
}

export class FnoConfigError extends Error {
  constructor(missing: string[]) {
    super(`F&O database settings incomplete: set ${missing.join(", ")} (or none, for the fixtures)`);
    this.name = "FnoConfigError";
  }
}

/** The settings, or null when none is set. */
export function fnoDbSettings(env: Record<string, string | undefined> = process.env): FnoDbSettings | null {
  const values = FNO_DB_VARIABLES.map((name) => env[name]?.trim() ?? "");
  if (values.every((v) => !v)) return null;
  const missing = FNO_DB_VARIABLES.filter((_, i) => !values[i]);
  if (missing.length) throw new FnoConfigError(missing);
  const [host, database, user, password] = values;
  return { host, port: Number(env.OMENIX_FNO_PG_PORT?.trim() || 5432), database, user, password, ca: AZURE_POSTGRES_ROOTS };
}
