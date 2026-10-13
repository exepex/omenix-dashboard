"use client";
// Page 05, Strategy lab (B16; design/mockups/05-strategy-lab): every registry strategy on one scoreboard, ranked by
// profit after market cost (decision 50), with the view (accuracy / head-to-head), basis (forward / back-test, never
// pooled), cost view and horizon switches, the KPI picks, the selected strategy's results against the go-live bar,
// the cumulative profit lines and the heatmaps. Reads GET /api/v1/markets/{market}/strategies (B13's rm.strategies,
// served without the strategies' internals: what a family decided, never how; owner, 13 Oct 2026). The selected
// strategy follows the URL hash (#<strategy_id>), as the Help page and the portfolios link it. Its cards: lab-*.tsx.
import { useEffect, useState } from "react";
import { PageFooter, PageHead, SignalsBand } from "../../../../../components/blocks/page-head.tsx";
import { PageState } from "../../../../../components/ui/states.tsx";
import type { Market } from "../../../../../lib/data/constants.ts";
import { fmtDate } from "../../../../../lib/ui/format.ts";
import { usePage } from "../../../../../lib/ui/use-api.ts";
import { defaultSelection, type Slice } from "../../../../../lib/strategy-pages/strategy-lab.ts";
import { Controls, Kpis } from "./lab-controls.tsx";
import { CumulativeCard } from "./lab-cumulative.tsx";
import { Detail } from "./lab-detail.tsx";
import { Heatmaps, Legend } from "./lab-heatmaps.tsx";
import { Leaderboard } from "./lab-leaderboard.tsx";
import type { Payload, View } from "./lab-shared.tsx";
import "./strategy-lab.css";

const hashId = () => (typeof window === "undefined" ? "" : decodeURIComponent(window.location.hash.slice(1)));

export function StrategyLabPage({ market }: { market: Market }) {
  const res = usePage<Payload>(market, "strategies");
  return (
    <div className="p-lab">
      <PageState result={res}>{(p) => <StrategyLab key={p.market} p={p} />}</PageState>
    </div>
  );
}

function StrategyLab({ p }: { p: Payload }) {
  const [v, setV] = useState<View>({ view: "accuracy", basis: "forward", cost: "market", horizon: p.default_horizon ?? "all" });
  // The selection is fixed once: the URL hash, else the first ranked strategy of the opening slice (the mockup keeps it
  // while the switches change); a click or a new hash changes it.
  const [chosen, setChosen] = useState<string>(() => defaultSelection(p, { view: "accuracy", basis: "forward", horizon: p.default_horizon ?? "all" }));
  useEffect(() => {
    const read = () => { const id = hashId(); if (id && p.strategies[id]) setChosen(id); };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [p.strategies]);
  const slice: Slice = { view: v.view, basis: v.basis, horizon: v.horizon };
  const selected = p.strategies[chosen] ? chosen : p.reference_strategy;
  const select = (id: string) => {
    setChosen(id);
    window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
  };
  const all = Object.values(p.strategies);
  const count = (f: string) => all.filter((s) => s.family === f).length;
  return (
    <>
      <PageHead page={p} title="Strategy lab"
        subtitle={`${all.length} strategies on one scoreboard: ${count("rule")} rule strategies, ${count("baseline")} baselines, ${count("ai")} AI traders · ${p.name} · data as of the ${fmtDate(p.as_of, false)} close · research only`} />
      <SignalsBand page={p} goLive={p.go_live} strategies={all.length} />
      <Controls p={p} v={v} set={setV} />
      <Kpis p={p} slice={slice} />
      <div style={{ marginTop: 16 }}><Leaderboard p={p} v={v} selected={selected} onSelect={select} /></div>
      <div className="grid even">
        <Detail p={p} v={v} selected={selected} />
        <CumulativeCard p={p} v={v} selected={selected} />
      </div>
      <div style={{ marginTop: 16 }}><Heatmaps p={p} v={v} /></div>
      <Legend p={p} />
      <PageFooter page={p} endpoint="strategies" />
    </>
  );
}
