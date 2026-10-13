"use client";
// Which stocks, over which period, with which filters (story W12; 33 notes rows 5 and 6). India chooses among all NSE
// stocks, the Nifty 500, the F&O stocks and the followed companies; the US has only the followed companies (the
// stock tool's 20), so it shows that as a fact, not a choice. Delivery is India only.
import { PERIODS, type Period, type Universe } from "../../lib/screener/contract.ts";
import { FILTERS, type FilterKey, type ScreenerState } from "../../lib/screener/state.ts";
import { Icon } from "../ui/icon.tsx";
import { Segmented } from "../ui/controls.tsx";
import { useScreenerNav } from "./controls.tsx";

export const PERIOD_LABEL: Record<Period, string> = { d1: "1D", w1: "1W", m1: "1M", m3: "3M", y1: "1Y" };
export const PERIOD_WORDS: Record<Period, string> = { d1: "today", w1: "in a week", m1: "in a month", m3: "in 3 months", y1: "in a year" };

const UNIVERSES: readonly { value: Universe; label: string; tip?: string }[] = [
  { value: "all", label: "All NSE", tip: "Every stock that traded on NSE today (EQ and BE series)" },
  { value: "n500", label: "Nifty 500" },
  { value: "fno", label: "F&O stocks" },
  { value: "ours", label: "Followed by our tools", tip: "The 20 companies the stock tool follows, with its strategies’ view" },
];

function Filters({ state, india }: { state: ScreenerState; india: boolean }) {
  const to = useScreenerNav(state);
  const set = (k: FilterKey, raw: string) => {
    const filters = { ...state.filters };
    if (raw === "" || !Number.isFinite(Number(raw))) delete filters[k];
    else filters[k] = Number(raw);
    to({ filters, page: 1 });
  };
  return (
    <div className="mb-scr-filters" role="region" aria-label="Your filters">
      {FILTERS.filter(([k]) => india || k !== "dl").map(([k, label]) => (
        <label key={k} className="mb-field">
          <span>{k === "cmin" ? `Change ${PERIOD_WORDS[state.per]} at least %` : label}</span>
          <input className="mb-input" type="number" inputMode="decimal" defaultValue={state.filters[k] ?? ""} onBlur={(e) => set(k, e.target.value)} onKeyDown={(e) => e.key === "Enter" && set(k, e.currentTarget.value)} />
        </label>
      ))}
      <button className="md-btn text small" type="button" onClick={() => to({ filters: {}, page: 1 })}>Clear filters</button>
    </div>
  );
}

export function StocksBar({ state, india }: { state: ScreenerState; india: boolean }) {
  const to = useScreenerNav(state);
  const nf = Object.keys(state.filters).length;
  return (
    <>
      <div className="bar">
        {india ? (
          <Segmented label="Which stocks" options={UNIVERSES} value={state.uni} onChange={(uni) => to({ uni, page: 1 })} light={false} />
        ) : (
          <span className="md-chip" data-tip="The stock tool’s 20 US companies: there is no free whole-market US file."><Icon name="star" />The 20 companies our tools follow</span>
        )}
        <span className="grow" />
        <Segmented label="Change over" options={PERIODS.map((p) => ({ value: p, label: PERIOD_LABEL[p] }))} value={state.per} onChange={(per) => to({ per })} light={false} />
        <button className="md-btn outlined small" type="button" aria-expanded={state.filtersOpen} onClick={() => to({ filtersOpen: !state.filtersOpen })}>
          <Icon name="tune" />
          {`Filters${nf ? ` (${nf})` : ""}`}
        </button>
      </div>
      {state.filtersOpen ? <Filters state={state} india={india} /> : null}
    </>
  );
}
