"""Copy the stock tool's REAL settled paper trades into source/settled.json (run by hand; reads only, never writes to
the stock repository).

    python design/mockups/38-strategy-lab/fetch_trades.py <clone of contactexepex/agentic-stock-prediction> 2026-10-13

Reads data/<market>/paper_trades_settled/YYYY/MM/*.jsonl up to the given day (accuracy view only: one trade per
strategy prediction) and keeps the fields the Strategy lab shows: exit and entry dates, ticker, family, strategy id,
net P&L after market charges, return %, reason code and regime.
"""
import glob
import json
import os
import sys

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source", "settled.json")
KEEP = ("entry_date", "exit_date", "ticker", "family", "strategy_id", "net_pnl", "return_pct", "reason_code", "regime", "currency", "amount")

if __name__ == "__main__":
    repo, until = sys.argv[1], sys.argv[2]
    out = {"until": until, "source": "contactexepex/agentic-stock-prediction data/<market>/paper_trades_settled (published records)", "markets": {}}
    for m in ("india", "us"):
        rows = []
        for f in sorted(glob.glob(os.path.join(repo, "data", m, "paper_trades_settled", "*", "*", "*.jsonl"))):
            if os.path.basename(f)[:10] <= until:
                rows += [json.loads(line) for line in open(f, encoding="utf-8") if line.strip()]
        out["markets"][m] = [{k: r.get(k) for k in KEEP} for r in rows if r.get("view") == "accuracy" and r.get("status") == "settled"]
    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(out, handle, indent=1, ensure_ascii=False)
        handle.write("\n")
    print({m: len(v) for m, v in out["markets"].items()})
