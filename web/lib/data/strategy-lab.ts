// The Strategy lab page (B13, docs/ws/b13.md): rm.strategies, page_key `_`, served by
// GET /api/v1/markets/{market}/strategies (api/paths/strategy-lab.yaml) without the strategies' internals (owner,
// 13 Oct 2026: screens show what a family decided, never how; lib/strategy-pages/public-strategies.ts). Paper only.
import { withoutInternals } from "../strategy-pages/public-strategies.ts";
import { definePage } from "./handler.ts";

export const STRATEGY_LAB_PAGE = definePage({ table: "strategies", serve: "page", project: withoutInternals });
