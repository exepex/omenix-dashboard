// The weather's history in words (story W3a part 2; design/mockups/46-weather-history, its 2-counts.js and
// 3-sessions.js): how often each colour, as numbers, shares and one bar; how many sessions were made live and how many
// rebuilt from history; then every session by month, oldest first. Colour and label only: the chances stay on the
// weather page. Every figure is the payload's. Pure.
import { fmtDate } from "../ui/format.ts";
import type { FnoWeatherHistory, HistorySession } from "./contract.ts";
import { colourLabel } from "./view.ts";

export interface CountFact {
  label: string;
  value: string;
  note: string;
}

/** One part of the colour bar: its design-system tone class, its width in percent and its word. */
export interface MixPart {
  tone: "g" | "a" | "r" | "n";
  width: number;
  word: string;
}

export type CountsView = { kind: "none"; text: string } | { kind: "counted"; facts: CountFact[]; mix: MixPart[]; aria: string; live: string; rebuilt: string };

export const NO_HISTORY = "No weather record yet: the first colour appears after the first session the weather runs.";

const share = (n: number, total: number) => `${Math.round((n / total) * 100)}%`;

export function countsOf(h: FnoWeatherHistory): CountsView {
  const n = h.counts;
  const total = n.green + n.amber + n.red + n.not_scored;
  if (!total) return { kind: "none", text: NO_HISTORY };
  const parts: [MixPart["tone"], number, string, string, string | null][] = [
    ["g", n.green, "GREEN", "GREEN (calm)", null],
    ["a", n.amber, "AMBER", "AMBER (take care)", null],
    ["r", n.red, "RED", "RED (no new trades)", null],
    ["n", n.not_scored, "not scored", "Not scored", "An input was missing; blocks like RED"],
  ];
  return {
    kind: "counted",
    facts: parts.map(([, c, , label, note]) => ({ label, value: String(c), note: note ?? share(c, total) })),
    mix: parts.filter(([, c]) => c).map(([tone, c, word]) => ({ tone, width: Math.round((c / total) * 10000) / 100, word })),
    aria: parts.map(([, c, word]) => `${c} ${word}`).join(", "),
    live: `${n.live} made live`,
    rebuilt: `${n.backfill} rebuilt from history (exploratory)`,
  };
}

export interface HistoryTile {
  day: string;
  label: ReturnType<typeof colourLabel>;
  mark: "live" | "rebuilt";
}

export interface MonthStrip {
  month: string;
  tiles: HistoryTile[];
}

const monthOf = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

const tileOf = (s: HistorySession): HistoryTile => ({ day: fmtDate(s.session, false), label: colourLabel(s.colour), mark: s.label === "backfill_exploratory" ? "rebuilt" : "live" });

/** Every session, one strip per month, oldest first whatever order the payload sends. */
export function monthsOf(h: FnoWeatherHistory): MonthStrip[] {
  const strips: MonthStrip[] = [];
  for (const s of [...h.sessions].sort((a, b) => a.session.localeCompare(b.session))) {
    const month = monthOf(s.session);
    if (strips.at(-1)?.month !== month) strips.push({ month, tiles: [] });
    strips.at(-1)!.tiles.push(tileOf(s));
  }
  return strips;
}
