// The fields a reader may see of each kind of record that says what a strategy decided (owner, 13 Oct 2026: screens
// and APIs show what a strategy decided, never how). Allow-lists, so a setting a backend adds later, under any name,
// stays private until it is added here on purpose (judge 76). Each list is the fields the screens and the assistant read
// (the typed read-model contracts, lib/**/types.ts), checked against every stored mockup and real stored page
// (lib/strategy-pages/tests/public-view.test.ts: each stored field is listed here or named private there). Left out on purpose: the
// chance threshold, the model's chance and an AI trader's adjustment, and how a check was computed (its z-scores,
// spread, adjusted ranges, elapsed share, notes).

/** A strategy registry entry (any value of a `strategies` map): who it is, which holds, its paper test, its count. */
export const REGISTRY_FIELDS = ["id", "family", "name", "horizons", "live", "live_from", "settled_trades"] as const;

/** A record of one strategy's decision or result (any object with a `strategy_id`): a prediction, pick, check, trade,
 *  scoreboard row, heatmap cell or AI reason. */
export const DECISION_FIELDS = [
  "id", "strategy_id", "strategy", "family", "name", "kind", "market", "ticker", "currency", "account", "paper", "view", "basis", "scope",
  "dimension", "column", "week", "iso_week", "horizon", "horizon_days", "pick_rule", "pick_rules", "rank", "ranking", "candidates",
  "strongest_basis", "status", "state", "flags", "flagged", "band", "agree", "record", "regime", "quality", "confidence", "direction",
  "qualifies", "prob_up", "made_at", "created_at", "computed_at", "as_of", "as_of_date", "session_date", "session_number", "check_at",
  "check_id", "check_row_id", "prediction_id", "trade_id", "entry_date", "exit_date", "exit_date_actual", "settled_at", "first_entry",
  "last_exit", "exit", "sessions", "sessions_held", "sessions_left", "base_close", "target_price", "lo50", "hi50", "lo80", "hi80", "range_widen",
  "entry_price", "entry_price_source", "exit_price", "exit_or_last_price", "last_price", "last_price_date", "last_price_time", "last_time",
  "last_price_source", "price_pending", "amount", "qty", "quantity", "side", "costs", "costs_pct", "gross_pnl", "net_pnl", "pnl_market",
  "pnl_your", "return_pct", "return_pct_market", "return_pct_your", "unrealised", "unrealised_pct", "unrealised_pnl", "ret_since_entry_pct",
  "to_target_pct", "check", "outcome", "why", "high_since_entry_pct", "low_since_entry_pct", "target_reached", "target_reached_session", "range_hit",
  "max_favourable_pct", "max_adverse_pct", "move_pct", "market_pct", "sector_pct", "news_pct", "company_pct", "loss_pct",
  "exp_gain_pct", "expected_gain_pct", "reason", "reason_code", "reason_codes", "reason_detail", "not_entered_reason", "text",
  "cited_ids", "evidence_ids", "news_ids", "trades", "wins", "win_rate", "avg", "mean_return_pct", "net_pnl_your", "avg_target_error_pct",
  "target_error_pct", "target_reached_rate", "range_hit_rate", "median_reached_session", "max_drawdown", "worst_losing_streak",
  "drawdown_within_limit", "sample_badge", "luck_test", "your_cost", "go_live", "settled_trades",
] as const;

/** A row of the signal model's back-test sweep (track record `backtest.strategy`); `variant` stands in for the
 *  threshold that tells the rows apart. */
export const SWEEP_FIELDS = ["key", "variant", "baseline", "positions", "dates", "mean_pct", "ci95_pct", "verdict"] as const;

/** A stored forecast run (forecast_history, B12), by its list: what it forecast and what changed, never how it was made
 *  (no score points, drivers, base rate or inputs; no range model inputs, calibration or spread). */
export const RUN_FIELDS: Readonly<Record<"ranges" | "scores", readonly string[]>> = {
  ranges: ["id", "ticker", "made_at", "as_of_date", "session_date", "exit_date", "horizon_days", "base_close", "target_price", "lo50", "hi50", "lo80", "hi80", "regime", "run", "change"],
  scores: ["id", "ticker", "computed_at", "as_of_date", "entry_date", "exit_date", "horizon_days", "prob_up", "model_version", "model_id", "trained_until", "news_items", "news_ids", "run", "change"],
};
export const RUN_CHANGE_FIELDS: Readonly<Record<"ranges" | "scores", readonly string[]>> = {
  ranges: ["from_id", "from_made_at", "target_pct", "width80_pct", "changed"],
  scores: ["from_id", "from_computed_at", "prob_up", "news_added", "news_dropped", "changed"],
};

/** Settings dropped wherever else they appear (an object of no kind above): a second line behind the allow-lists. */
export const SETTING_KEYS = ["threshold", "bar", "parameters", "differs_in", "compared_to", "model_prob", "agent_adjustment", "adjustment_reason"] as const;
