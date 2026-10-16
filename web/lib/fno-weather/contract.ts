// The market weather's read model (story W3a; contract FnoWeather, api/schemas/fno-weather.yaml, P1): what the page
// `weather` of exepex/trading's F&O publication carries. It holds no colour threshold (owner, 16 Oct 2026: the screen
// shows the colour, the input values and the reason only). Types only.
export type WeatherColour = "GREEN" | "AMBER" | "RED";

export interface MissingInput {
  input: string;
  story: string;
  detail: string;
}

export interface WeatherDriver {
  driver: "vix_level" | "vix_change" | "recent_big_moves" | "realised_volatility" | "us_overnight" | "scheduled_event";
  text: string;
  push: "calmer" | "riskier";
}

export interface IntradayUpgrade {
  at: string;
  from: "AMBER";
  to: "RED";
  why: string;
}

export interface RecentSession {
  session: string;
  colour: WeatherColour | null;
  big_move: boolean | null;
}

export interface RedShare {
  sessions: number;
  red_sessions: number;
  share: number | null;
  max_share: number;
  over_alarming: boolean;
}

export interface WeatherScore {
  question: "V6_1d" | "V6_5d";
  baseline: "base_rate" | "v0_checklist";
  status: "scoring" | "not_enough_data";
  n_scored: number;
  n_needed: number;
  brier: number | null;
  brier_baseline: number | null;
  skill: number | null;
  verdict: "better" | "worse" | "no_difference" | "not_tested";
}

export interface PriceOfCalm {
  month: string;
  status: "not_measured_yet" | "measured" | "nothing_blocked";
  blocked_trades: number | null;
  risk_avoided: number | null;
  shadow_net: number | null;
}

export interface FnoWeather {
  session: string;
  status: "published" | "not_published";
  missing_inputs: MissingInput[];
  model_version: string;
  colour: WeatherColour | null;
  blocks_new_entries: boolean;
  p_big_1d: number | null;
  p_big_5d: number | null;
  base_rate_1d: number | null;
  base_rate_5d: number | null;
  times_usual_1d: number | null;
  times_usual_5d: number | null;
  drivers: WeatherDriver[];
  intraday: IntradayUpgrade[];
  recent: RecentSession[];
  red_share: RedShare;
  scores: WeatherScore[];
  price_of_calm: PriceOfCalm;
}
