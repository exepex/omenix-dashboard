"""NIFTY option chain mockup (design/PLATFORM_DESIGN.md section 4 screen 6; orchestrator brief of 13 Oct 2026).

    python design/mockups/32-option-chain/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

Composes `data.json` from design/mockups/_platform/chain_data.py: REAL NSE data (the daily F&O and index files of
1 Jun to 12 Oct 2026, in source/, fetched once by fetch_nse.py), with IV, Greeks and the figures computed the F&O
tool's way. Inlines it with 30-shell/data.json into `template.html`; writes `page.html`. Deterministic (no network).
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from chain_data import band_items, chain_payload  # noqa: E402
from platform_build import run  # noqa: E402


def compose() -> dict:
    chain = chain_payload()
    return {"_mock": True, "_note": "REAL NSE DATA of 12 Oct 2026 (daily F&O and index files) in the dashboard's proposed chain contract; the F&O "
            "tool does not publish chain rows yet (a publishing story is needed). IV, Greeks and chances are computed here the F&O tool's way. "
            "Research and paper trading only.",
            "page": "chain", "spec": "design/PLATFORM_DESIGN.md section 4 #6; orchestrator brief 13 Oct 2026", "chain": chain, "items": band_items(chain)}


def summary(shell, data):
    c = data["chain"]
    return (f"{c['day']}: NIFTY {c['underlying']['spot']}; " + "; ".join(f"{x['expiry']}{' (monthly)' if x['monthly'] else ''}: {len(x['rows'])} strikes, "
            f"PCR {x['stats']['pcr']}" for x in c["expiries"]) + f"; {len(c['history']['contracts'])} contract histories")


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
