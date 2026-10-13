// What the frame of one market receives (story W8): that market's slice of the payload and the market labels for the
// switch. F&O is India only: in a market without F&O every F&O element is removed here, by one rule, so no component
// can show one (absent, not empty). Pure.
import type { Market } from "../data/constants.ts";
import type { FrameData, Instrument, MarketShell, ShellPayload } from "./contract.ts";
import { isFno } from "./market.ts";

/** A market's shell with every F&O element removed when the market has no F&O. */
export function withoutFno(shell: MarketShell): MarketShell {
  if (shell.fno) return shell;
  const items: Record<string, Instrument> = {};
  for (const [id, item] of Object.entries(shell.items)) if (!isFno(item.kind)) items[id] = { ...item, fno: false };
  const kept = (id: string) => id in items;
  const { fno_state: _fnoState, fno_rows: _fnoRows, fno_live: _fnoLive, short_option_margin_per_lot: _margin, ...rest } = shell;
  return {
    ...rest,
    items,
    indices: shell.indices.filter(kept),
    recent: shell.recent.filter(kept),
    signals: shell.signals.filter((s) => kept(s.id)),
    next_quotes: { stock: shell.next_quotes.stock },
  };
}

export function frameData(payload: ShellPayload, market: Market): FrameData {
  const marketLabels = Object.fromEntries(Object.entries(payload.markets).map(([m, s]) => [m, s.label])) as Record<Market, string>;
  return {
    market,
    now: payload.now,
    example: payload.example,
    sources: payload.sources,
    families: payload.families,
    pick_rules: payload.pick_rules,
    limits_note: payload.limits_note,
    marketLabels,
    shell: withoutFno(payload.markets[market]),
    notifications: payload.notifications[market] ?? [],
  };
}
