// M1's colour levels, copied from exepex/trading at 89ad2175 (the last change to them; main 90b4902d, 16 Oct 2026) for
// the no-threshold test only (story W3a): the screen must never show them (owner, 16 Oct 2026). Sources:
// fno/weather/constants.py (WEATHER_RED_FLOORS, WEATHER_AMBER_FLOORS, WEATHER_RED_MULTIPLE, WEATHER_AMBER_MULTIPLE)
// and fno/weather/checklist_v0.py (RED_LIMITS, AMBER_LIMITS: VIX ratio, VIX 5-day change, 5-day move, 10-day
// realised volatility). A new weather version with new levels is a new copy here, with its commit.
export const M1_LEVELS = {
  redFloors: [0.1, 0.35],
  amberFloors: [0.06, 0.2],
  multiples: [2.5, 1.5],
  v0Red: [1.3, 0.2, 0.02, 0.25],
  v0Amber: [1.1, 0.1, 0.0125, 0.18],
} as const;

/** The event the weather forecasts is a 2% move (the contract's question, p_big_1d and p_big_5d): saying "2% move" names
 *  the question, not a level, although v0's 5-day-move limit happens to be 2% too. */
export const QUESTION_SIZE = 0.02;

export const ALL_LEVELS: number[] = Object.values(M1_LEVELS).flat();
