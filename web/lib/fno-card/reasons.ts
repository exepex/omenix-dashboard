// Why a card says NO TRADE (contract FnoCard.reason, api/schemas/fno-card.yaml, 2.14.0; story W3i): the list the
// contract allows, in its order. A runtime list, so a test can hold it against the yaml (contract.ts is types only).
export const NO_TRADE_REASONS = [
  "no_approved_strategy", // no strategy version is at paper yet
  "weather_red", // the market weather is RED
  "data_check_failed", // a record the card needs was missing or could not be read
  "risk_bucket_full", // the book's risk limit is full
  "budget_stop", // the AI usage budget reached its stop line
  "cost_wall", // today's costs would eat the expected gain
  "advocate_hard_rule", // the devil's advocate found a hard-rule break
  "trade_fields_not_built", // a version is at paper, but the card cannot show a trade yet (T1)
  "hard_rule_breach", // the desk's own rule checks (C4) refused a book's trade that day (T2)
  "step_problems", // a desk step failed or was refused that day (T1e)
] as const;

export type NoTradeReason = (typeof NO_TRADE_REASONS)[number];
