// The AI usage and budget in words (story W3g; design/mockups/43-budget, its 2-budget.js): the month's AI book and role
// minutes against the cap with the level, and the minutes by kind of work. Minutes only: no rupees, no model name, no
// session. BG1's shares (the cap's share of the basis, the alert and the stop) are the payload's own (contract 2.11.0),
// never a copy in the screen. Pure.
import type { BudgetLevel, FnoBudget, WorkGroup } from "./contract.ts";

export type Tone = "success" | "warn" | "danger" | "neutral";
export interface Look {
  tone: Tone;
  icon: string;
  word: string;
}

const LEVEL: Record<BudgetLevel, Look> = {
  ok: { tone: "success", icon: "check", word: "Within budget" },
  alert: { tone: "warn", icon: "warning", word: "Alert: close to the cap" },
  stop: { tone: "danger", icon: "block", word: "Stop: the cap is reached" },
  unknown: { tone: "neutral", icon: "help", word: "Unknown" },
};

const GROUP: Record<WorkGroup, string> = {
  ai_books: "AI books (forecasts)",
  ai_roles: "AI roles (desk meeting)",
  post_mortem: "Weekly post-mortem",
  data_routines: "Data routines",
  development: "Building the tool",
};

/** "1,840 min". */
export const minutes = (x: number) => `${Math.round(x).toLocaleString("en-IN")} min`;

/** "November 2026" from "2026-11" (the contract's pattern holds the month to 01-12). */
const monthWords = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export interface CapView {
  level: Look;
  used: { k: string; v: string; note: string };
  cap: { k: string; v: string; note: string };
  bar: number | null;
  /** Where the alert mark sits on the bar, in percent of the cap. */
  tick: number;
  aria: string;
  words: string;
  note: string | null;
  howTo: string;
}

export function capOf(b: FnoBudget): CapView {
  const pct = b.pct_of_cap;
  return {
    level: LEVEL[b.level],
    used: { k: "Used", v: minutes(b.books_and_roles_minutes), note: `in ${monthWords(b.month)}` },
    cap: { k: "Cap", v: minutes(b.cap_minutes), note: `${b.share_pct}% of ${minutes(b.basis_minutes)} ${b.basis === "plan" ? "in your plan" : "measured"}` },
    bar: pct === null ? null : Math.min(100, Math.round(pct * 10) / 10),
    tick: Math.min(100, b.alert_pct),
    aria: pct === null ? "Nothing to measure yet" : `${Math.round(pct)}% of the cap used; the alert is at ${b.alert_pct}%`,
    words: pct === null ? "Nothing to measure yet." : `${Math.round(pct)}% of the cap used. At ${b.alert_pct}% an alert goes out; at ${b.stop_pct}% the AI roles stop, the AI forecasters last.`,
    note: b.note || null,
    howTo: `The budget is counted in minutes of AI sessions, not money. The AI books and roles may use at most ${b.share_pct}% of the basis.`,
  };
}

export interface GroupRow {
  group: string;
  minutes: string;
  runs: string;
}

export const groupsOf = (b: FnoBudget): GroupRow[] => b.groups.map((g) => ({ group: GROUP[g.group], minutes: minutes(g.minutes), runs: String(g.runs) }));

export const NO_GROUPS = "No minutes recorded this month.";
