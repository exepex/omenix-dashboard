// Today's weather in words (story W3a; design/mockups/40-weather, its 1-base.js and 2-top.js): the colour with its
// glyph and meaning, the two chances against the usual chance, what moved it and the session's upgrades. Every figure
// is the payload's; nothing here knows the level at which a chance turns a colour (owner, 16 Oct 2026). Pure.
import { DASH, fmtDate, fmtLocal, pct } from "../ui/format.ts";
import type { FnoWeather, WeatherColour } from "./contract.ts";

/** The design system's label tones the weather uses (components/ui/primitives.tsx `Label`). */
export type Tone = "success" | "warn" | "danger" | "neutral";

/** India's clock: the payload's times are UTC and India keeps no daylight saving. */
const IST = "+05:30";

export interface ColourLook {
  tone: Tone;
  icon: string;
  verdict: string;
  meaning: string;
}

export const COLOUR: Record<WeatherColour, ColourLook> = {
  GREEN: { tone: "success", icon: "check", verdict: "yes-ok", meaning: "Calm" },
  AMBER: { tone: "warn", icon: "warning", verdict: "watch", meaning: "Take care" },
  RED: { tone: "danger", icon: "block", verdict: "no", meaning: "A big move is much more likely than usual" },
};

/** A colour always with its glyph and its word; no colour is said as such. */
export const colourLabel = (colour: WeatherColour | null) => (colour ? { tone: COLOUR[colour].tone, icon: COLOUR[colour].icon, word: colour } : { tone: "neutral" as Tone, icon: "remove", word: "No colour" });

export type Verdict =
  | { kind: "colour"; colour: WeatherColour; look: ColourLook; detail: string; entries: string }
  | { kind: "missing"; detail: string; entries: string; missing: string[] };

export function verdictOf(w: FnoWeather): Verdict {
  const day = `for ${fmtDate(w.session)} ${w.session.slice(0, 4)}`;
  if (w.status === "not_published" || !w.colour) {
    return {
      kind: "missing",
      detail: `${day}: not published`,
      entries: "No new paper trade today: a missing weather blocks new trades, like RED (owner, 15 Oct 2026).",
      missing: w.missing_inputs.map((m) => `${m.input} (${m.story}): ${m.detail}`),
    };
  }
  const look = COLOUR[w.colour];
  const entries = w.blocks_new_entries ? "No new paper trade today. Open positions follow their exit plans." : "New paper trades are allowed today.";
  return { kind: "colour", colour: w.colour, look, detail: `${look.meaning} · ${day} · ${w.model_version}`, entries };
}

export interface Chance {
  label: string;
  value: string;
  /** Bar widths on a scale that ends at 50% (the mockup's), as percentages of the track. */
  bar: number | null;
  usualAt: number | null;
  usual: string;
  aria: string;
}

const onScale = (p: number | null) => (p === null ? null : Math.min(100, Math.round(p * 2000) / 10));

function chance(label: string, p: number | null, base: number | null, times: number | null): Chance {
  const usual = base === null ? "" : `Usually ${pct(base, 1)} (last 750 sessions)` + (times === null ? "" : ` · ${times} times the usual chance`);
  return { label, value: pct(p, 1), bar: onScale(p), usualAt: onScale(base), usual, aria: `${label}: ${pct(p)}, usually ${pct(base, 1)}` };
}

export const chancesOf = (w: FnoWeather): Chance[] => [
  chance("A 2% move next session", w.p_big_1d, w.base_rate_1d, w.times_usual_1d),
  chance("A 2% move within 5 sessions", w.p_big_5d, w.base_rate_5d, w.times_usual_5d),
];

export interface DriverLine {
  tone: Tone;
  icon: string;
  push: string;
  text: string;
}

/** What moved it, strongest first as sent: the way it pushed and the backend's words (values only, never a level). */
export const driversOf = (w: FnoWeather): DriverLine[] =>
  w.drivers.map((d) => (d.push === "riskier" ? { tone: "danger", icon: "trending_up", push: "Riskier", text: d.text } : { tone: "success", icon: "trending_down", push: "Calmer", text: d.text }));

export interface UpgradeLine {
  at: string;
  from: WeatherColour;
  to: WeatherColour;
  why: string;
}

export const upgradesOf = (w: FnoWeather): UpgradeLine[] => w.intraday.map((u) => ({ at: fmtLocal(u.at, "india", IST), from: u.from, to: u.to, why: u.why }));

export const NO_DRIVERS = "Nothing to show: no weather was worked out today.";
export const NO_UPGRADES = "No change during the session.";
export const NO_FIGURE = DASH;
