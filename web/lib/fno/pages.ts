// The page of fno.pages_history each contract block is read from (judge 63): the contract's own page_key (its examples'
// envelopes), held equal by lib/fno/tests/pages.test.ts, so the dashboard and exepex/trading cannot drift apart again.
// Pure.
export const FNO_PAGES = {
  getScreenerSummaryIndia: "screener_summary",
  getScreenerStocksIndia: "screener_stocks",
  getFnoScreenerSummary: "fno_screener_summary",
  getFnoScreenerRows: "fno_screener_rows",
  getOverviewIndicesIndia: "overview_indices",
  getIndiaSectors: "overview_sectors",
  getFlows: "flows",
  getSessionIndia: "session",
  getIndicesIndia: "indices",
  getFnoPicks: "today",
  getFnoBooks: "risk",
  getFnoEvents: "fno_events",
  getFnoWeather: "weather",
  getFnoWeatherHistory: "weather_history",
  getFnoForecastLab: "forecast_lab",
  getFnoStrategyLab: "strategy_lab",
  getFnoPaperTrades: "paper_trades",
  getFnoDataHealth: "data_health",
  getFnoBudget: "budget",
  getFnoScoreboards: "scoreboards",
  getFnoCard: "card",
} as const;

export type FnoBlockName = keyof typeof FNO_PAGES;
export type FnoPageKey = (typeof FNO_PAGES)[FnoBlockName];
