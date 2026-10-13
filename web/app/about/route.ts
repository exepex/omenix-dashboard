// GET /about: the public home page (lib/legal/legal.ts); the gateway serves it as / too. Built once per deployment.
import { legalResponse } from "../../lib/legal/legal.ts";

export const dynamic = "force-static";

export function GET(): Response {
  return legalResponse("home");
}
