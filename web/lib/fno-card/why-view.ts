// The card's "why and how sure" in words (story W3f; design/mockups/39-trade-card, its 4-why.js): the weather, the
// forecast with its record (live and back-fill apart), the devil's advocate, the data checks, how far the strategy has
// come, the price of staying out, what happens if you cannot act and the records behind the card. Every figure is the
// payload's. Pure.
import { DASH, money } from "../ui/format.ts";
import { colourLabel } from "../fno-weather/view.ts";
import type { CardForecast, FnoCard, TrackRecord } from "./contract.ts";
import type { Look } from "./view.ts";

/** A chance in whole percent. */
export const pct = (p: number | null) => (p === null ? DASH : `${Math.round(p * 100)}%`);

/** The weather's colour with its glyph and word ("No weather" when none exists for the session). */
export const weatherOf = (c: FnoCard) => ({ look: c.weather.colour ? colourLabel(c.weather.colour) : { tone: "neutral" as const, icon: "remove", word: "No weather" }, why: c.weather.why });

/** A track record in words: "it said 30% to 40% on 140 days; it happened on 41% (670 scored)." */
export function trackText(r: TrackRecord): string {
  switch (r.status) {
    case "scored":
      return `it said ${pct(r.said_from)} to ${pct(r.said_to)} on ${r.days} days; it happened on ${pct(r.happened_share)} (${r.scored} scored).`;
    case "not_enough_data":
      return `not enough data yet (${r.scored} scored).`;
    case "no_bin":
      return `no record at this level yet (${r.scored} scored).`;
    case "no_report":
      return "no score report yet.";
  }
}

export interface ForecastView {
  plain: string;
  chance: string;
  bar: number;
  aria: string;
  record: string;
}

export const forecastLine = (f: CardForecast): ForecastView => ({
  plain: f.plain,
  chance: pct(f.probability),
  bar: Math.round((f.probability ?? 0) * 1000) / 10,
  aria: `${f.forecaster}: ${pct(f.probability)}`,
  record: `${f.forecaster}. Live: ${trackText(f.live)} Back-fill (made after the fact, not live): ${trackText(f.backfill)}`,
});

export const forecastOf = (c: FnoCard): ForecastView | null => (c.forecast ? forecastLine(c.forecast) : null);
export const NO_FORECAST = "This card rests on no forecast.";

const ADVOCATE: Record<FnoCard["advocate"]["status"], Look> = {
  answered: { tone: "info", icon: "gavel", word: "Answered" },
  advocate_unavailable: { tone: "warn", icon: "timer", word: "Did not answer in time" },
  not_needed: { tone: "neutral", icon: "remove", word: "Not needed" },
};

export function advocateOf(c: FnoCard) {
  const a = c.advocate;
  const empty = a.status === "advocate_unavailable" ? "The card went out with the code checks only; no objection is ever invented." : "No position to object to.";
  const verdict: Look | null = a.verdict === null ? null : a.verdict === "no_hard_rule_breach" ? { tone: "success", icon: "check", word: "No hard-rule breach" } : { tone: "danger", icon: "close", word: "Hard-rule breach" };
  return { head: ADVOCATE[a.status], objections: a.objections, empty, verdict };
}

export function checksOf(c: FnoCard) {
  const k = c.data_checks;
  return {
    head: (k.passed ? { tone: "success", icon: "check", word: "Passed" } : { tone: "danger", icon: "close", word: "Failed" }) as Look,
    inputs: k.missing_inputs.map((m) => ({ story: m.story, input: m.input, detail: m.detail })),
    empty: "Every input was there and checked before the decision.",
  };
}

export const RUNGS = ["Idea", "Its forecast beat the yardstick", "Forward shadow", "Approved to paper", "Real-money gate met"];

export function evidenceOf(c: FnoCard) {
  const e = c.evidence;
  return { rungs: RUNGS.map((word, n) => ({ n, word, on: e.rung === n })), label: e.label, text: e.text, realMoney: { tone: "danger", icon: "block", word: "Real money: not eligible" } as Look };
}

/** The price of staying out (NO TRADE only), or null. */
export function stayOutOf(c: FnoCard): string | null {
  const p = c.price_of_staying_out;
  if (!p) return null;
  if (p.status === "not_measured_yet") return "Not measured yet: the shadow fills of the skipped trade come later.";
  if (p.status === "nothing_skipped") return "Nothing was skipped: no approved strategy wanted a trade.";
  if (!p.shadow_net) return "Staying out made no difference on paper.";
  return `Staying out ${p.shadow_net > 0 ? "cost" : "saved"} ${money("INR", Math.abs(p.shadow_net))} on paper.`;
}

/** The records behind the card: the file name and the first 12 characters of its SHA-256, the full pair as a tip. */
export const hashesOf = (c: FnoCard) => c.footer.record_hashes.map((h) => ({ short: `${h.path.split("/").pop()} ${h.sha256.slice(0, 12)}`, tip: `${h.path} ${h.sha256}` }));
