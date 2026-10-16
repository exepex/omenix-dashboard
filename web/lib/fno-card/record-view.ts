// What the card has on record beyond today's decision (story W3f; design/mockups/39-trade-card, its 5-record.js and
// T1's sections): paper trades so far per book (counts, never money added across books), the overnight stress line
// (owner only), every question's house forecast with its live and back-fill records apart, and the gaps and earlier
// misses the card names. Every figure is the payload's. Pure.
import { money } from "../ui/format.ts";
import type { FnoCard } from "./contract.ts";
import { BOOK, dayLabel, ist } from "./view.ts";
import { pct, trackText } from "./why-view.ts";

const rs = (x: number) => money("INR", x);

export function tradesSoFarOf(c: FnoCard) {
  const t = c.paper_trades_so_far;
  return { books: t.by_book.map((b) => ({ k: BOOK[b.family], v: String(b.trades) })), total: `${t.total} in all. Each book is its own experiment; their money is never added together.` };
}

const moveWords = (n: number, v: number) => `NIFTY ${n > 0 ? "+" : "−"}${Math.abs(n)}%${v ? `, India VIX +${v}%` : ", volatility unchanged"}`;

export function stressOf(c: FnoCard) {
  const s = c.stress;
  return {
    head: `${s.open_positions} open paper position${s.open_positions === 1 ? "" : "s"}; together they can lose at most ${rs(s.max_loss_sum)}.`,
    lines: s.scenarios.map((x) => ({
      words: `${moveWords(x.nifty_move_pct, x.vix_move_pct)}: lose ${rs(x.loss)}`,
      bar: s.max_loss_sum ? Math.round((x.loss / s.max_loss_sum) * 1000) / 10 : 0,
      aria: `${rs(x.loss)} of at most ${rs(s.max_loss_sum)}`,
    })),
  };
}

/** Every forecast on record, or null when no capture exists. */
export function onRecordOf(c: FnoCard) {
  const r = c.forecasts_on_record;
  if (!r) return null;
  return {
    source: `From the live capture of ${dayLabel(r.capture_day)}${r.report_day ? `; records from the score report of ${dayLabel(r.report_day)}` : "; no score report yet"}. ${r.other_forecasters} other forecasters are on the Forecast lab.`,
    late: r.late_generated_at ? ` Generated at ${ist(r.late_generated_at)}, after the 15:15 deadline: these forecasts are not scored.` : null,
    rows: r.questions.map((q) => ({ question: q.question, plain: q.plain, chance: pct(q.probability), live: trackText(q.live), backfill: trackText(q.backfill) })),
  };
}

/** The gaps and earlier misses the card names, or null when there are none. */
export function missesOf(c: FnoCard) {
  if (!c.missing.length && !c.previous_misses.length) return null;
  return { count: String(c.missing.length + c.previous_misses.length), missing: c.missing, earlier: c.previous_misses.length ? c.previous_misses.join("; ") : null };
}
