// GET /terms: the terms of service (lib/legal/legal.ts), public through the gateway; built once per deployment.
import { legalResponse } from "../../lib/legal/legal.ts";

export const dynamic = "force-static";

export function GET(): Response {
  return legalResponse("terms");
}
