// The one search box (story W8; 30-shell "Search", design/mockups/_platform/js/4-overlays.js palIndex / palResults):
// stocks, indices, F&O underlyings and contracts, strategies, news and pages of the market. A query matches by words in
// any order ("nifty 22800 call") or by the exchange trading code typed whole ("NIFTY26OCT22800CE"). The market's
// frame data has no F&O instrument outside India (view.ts), so the US finds none. Pure.
import type { MarketShell } from "./contract.ts";
import { isFno } from "./market.ts";
import { allScreens, type NavScreen } from "./nav.ts";

export type SearchGroup = "Recently viewed" | "Stocks" | "Indices" | "F&O underlyings" | "F&O contracts" | "Screens" | "Strategies" | "News" | "Pages";
export const GROUP_ORDER: readonly SearchGroup[] = ["Recently viewed", "Stocks", "Indices", "F&O underlyings", "F&O contracts", "Screens", "Strategies", "News", "Pages"];
const PER_GROUP = 6;

/** What choosing a result does: a quick view of an instrument, a screen of the navigation. */
export type SearchTarget = { kind: "instrument"; id: string } | { kind: "screen"; screen: NavScreen };

export interface SearchRow {
  group: SearchGroup;
  label: string;
  sub: string;
  icon: string;
  code?: string;
  /** Set for an instrument: the row shows its price and, when tradable, B and S. */
  instrumentId?: string;
  target: SearchTarget;
}

const SYNONYM: Record<string, string> = { call: "ce", calls: "ce", put: "pe", puts: "pe", future: "fut", futures: "fut" };
const EXTRA = { screen: ["Screens", "filter_list", "screener"], strategy: ["Strategies", "science", "lab"], news: ["News", "newspaper", "news"] } as const;

/** Every searchable row of a market. */
export function searchIndex(shell: MarketShell): SearchRow[] {
  const screens = allScreens(shell.fno);
  const screen = (id: string) => screens.find((s) => s.id === id) ?? screens[0];
  const rows: SearchRow[] = [];
  for (const it of Object.values(shell.items)) {
    const group: SearchGroup = it.kind === "stock" ? "Stocks" : it.kind === "index" ? "Indices" : "F&O contracts";
    const icon = it.kind === "stock" ? "apartment" : it.kind === "index" ? "monitoring" : "layers";
    rows.push({ group, label: it.sym, sub: it.name + (isFno(it.kind) ? ` · ${it.code}` : ""), icon, code: it.code, instrumentId: it.id, target: { kind: "instrument", id: it.id } });
  }
  if (shell.fno) {
    for (const it of Object.values(shell.items).filter((i) => i.fno)) {
      rows.push({ group: "F&O underlyings", label: `${it.sym} options and futures`, sub: `Option chain · ${it.name}`, icon: "layers", target: { kind: "screen", screen: screen("chain") } });
    }
  }
  for (const x of shell.search_extra) {
    const [group, icon, to] = EXTRA[x.kind];
    rows.push({ group, label: x.label, sub: x.sub, icon, target: { kind: "screen", screen: screen(to) } });
  }
  for (const s of screens) rows.push({ group: "Pages", label: s.label, sub: s.group.label + (s.key ? ` · ${s.key}` : ""), icon: s.icon, target: { kind: "screen", screen: s } });
  return rows;
}

/** A row matches when the trading code contains the query typed whole (3+ characters), or every word is found. */
export function matches(row: SearchRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  const flat = q.replace(/\s+/g, "");
  if (row.code && flat.length > 2 && row.code.toLowerCase().includes(flat)) return true;
  const hay = `${row.label} ${row.sub} ${row.code ?? ""}`.toLowerCase();
  return q.split(/\s+/).map((w) => SYNONYM[w] ?? w).every((w) => hay.includes(w));
}

/** The results of a query, grouped in the fixed order, at most six a group; an empty query lists the recently viewed
 *  instruments and the first pages. */
export function search(shell: MarketShell, query: string): SearchRow[] {
  const index = searchIndex(shell);
  const rows = query.trim()
    ? index.filter((r) => matches(r, query))
    : [
        ...shell.recent.flatMap((id) => index.filter((r) => r.instrumentId === id).map((r) => ({ ...r, group: "Recently viewed" as const }))),
        ...index.filter((r) => r.group === "Pages").slice(0, PER_GROUP),
      ];
  return GROUP_ORDER.flatMap((g) => rows.filter((r) => r.group === g).slice(0, PER_GROUP));
}

/** The empty-result words; in a market without F&O an F&O-looking query says where F&O is. */
export function nothingFound(shell: MarketShell, query: string): string {
  const fnoHint = !shell.fno && /nifty|fut|\bce\b|\bpe\b|option|call|put/i.test(query) ? " F&O is India only: switch the market to India." : "";
  return `Nothing matches “${query}” in the ${shell.label} market.${fnoHint}`;
}
