// The Strategy lab's F&O tab in words (story W3d; design/mockups/45-strategy-lab-fno): the headline, every idea tried
// with how many passes chance alone would give, what each book may trade and why not, the approved strategies' paper
// results after every cost (Paper, never added across books), and the real-money checks (never eligible here). Every
// figure is the payload's. Pure.
import { DASH, MINUS, money } from "../ui/format.ts";
import type { FnoStrategyLab, IdeaStatus, StrategyResult } from "./contract.ts";

export type Tone = "success" | "warn" | "danger" | "neutral";
export interface Look {
  tone: Tone;
  icon: string;
  word: string;
}

const rs = (x: number | null) => money("INR", x);
/** A rupee figure with its sign always shown: "+₹2,300", "−₹41,200", "₹0". */
export const signedRs = (x: number | null) => (x === null ? DASH : (x > 0 ? "+" : x < 0 ? MINUS : "") + money("INR", Math.abs(x)));

export function headlineOf(lab: FnoStrategyLab) {
  const passed = lab.headline.any_passed;
  return { verdict: passed ? "yes-ok" : "watch", icon: passed ? "check" : "timer", word: passed ? "A strategy passed" : "No strategy has passed", text: lab.headline.text };
}

const SPLAIN: Record<IdeaStatus, string> = { idea: "ideas", screened_out: "screened out", exploratory_shadow: "shadow only", registered: "registered", testing: "testing", passed: "passed", failed: "failed", retired: "retired" };
export const ISTATUS: Record<IdeaStatus, Look> = {
  idea: { tone: "neutral", icon: "help", word: "Idea" },
  screened_out: { tone: "neutral", icon: "block", word: "Screened out" },
  exploratory_shadow: { tone: "neutral", icon: "science", word: "Shadow only" },
  registered: { tone: "neutral", icon: "event", word: "Registered" },
  testing: { tone: "warn", icon: "science", word: "Testing" },
  passed: { tone: "success", icon: "check", word: "Passed" },
  failed: { tone: "danger", icon: "close", word: "Failed" },
  retired: { tone: "neutral", icon: "remove", word: "Retired" },
};

/** The factory's count: every try, so one pass among many is not mistaken for skill. */
export function factoryOf(lab: FnoStrategyLab) {
  const f = lab.factory;
  return {
    chips: Object.entries(f.by_status).filter(([, n]) => n > 0).map(([s, n]) => `${n} ${SPLAIN[s as IdeaStatus]}`),
    words: `${f.trials_total} ideas tried. At a pass level of ${(f.pass_level * 100).toFixed(0)}%, about ${f.expected_false_passes.toFixed(1)} would pass by chance alone.`,
    ideas: lab.ideas.map((i) => ({ trial: String(i.trial), title: i.title, restsOn: i.rests_on ?? DASH, gate: i.gate, status: ISTATUS[i.status], label: i.label })),
  };
}

export const booksOf = (lab: FnoStrategyLab) =>
  lab.books.map((b) => ({ family: b.family, approved: b.approved.length ? b.approved.join(", ") : "None", trading: b.trading ? ({ tone: "success", icon: "check", word: "Yes" } as Look) : ({ tone: "neutral", icon: "remove", word: "No" } as Look), whyNot: b.why_not, costs: rs(b.ai_and_data_costs) }));

const RSTATUS: Record<StrategyResult["status"], Look> = { active: { tone: "success", icon: "check", word: "Active" }, paused: { tone: "warn", icon: "timer", word: "Paused" }, retired: { tone: "neutral", icon: "remove", word: "Retired" } };

/** A profit or loss always with its sign, glyph and word, never colour alone. */
export const pnlOf = (x: number): Look => (x > 0 ? { tone: "success", icon: "trending_up", word: `Up ${signedRs(x)}` } : x < 0 ? { tone: "danger", icon: "trending_down", word: `Down ${signedRs(x)}` } : { tone: "neutral", icon: "trending_flat", word: `Flat ${signedRs(x)}` });

export const resultsOf = (lab: FnoStrategyLab) =>
  lab.results.map((r) => ({
    strategy: r.strategy,
    family: r.family,
    rung: `rung ${r.rung}`,
    status: RSTATUS[r.status],
    pauseReason: r.pause_reason,
    trades: String(r.trades),
    wonLost: `${r.won} won · ${r.lost} lost`,
    gross: signedRs(r.gross),
    costs: rs(r.costs),
    net: pnlOf(r.net),
    afterTax: signedRs(r.net_after_tax),
    vsIndex: signedRs(r.vs_index_fund),
  }));

const MET: Record<"true" | "false" | "null", Look> = { true: { tone: "success", icon: "check", word: "Met" }, false: { tone: "danger", icon: "close", word: "Not met" }, null: { tone: "neutral", icon: "remove", word: "Not checked yet" } };

/** The real-money gate: never eligible from this screen (the contract allows only false). */
export const realMoneyOf = (lab: FnoStrategyLab) => lab.real_money.checks.map((c) => ({ look: MET[String(c.met) as "true" | "false" | "null"], plain: c.plain }));
