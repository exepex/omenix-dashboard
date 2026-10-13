"""Write (or check) the block examples: one OpenAPI Example per block operation and market, every payload taken from
the mockups' data and wrapped in the publisher's envelope.
  api/examples/blocks.json        the frame and Home (30-shell, 31-dashboard; examples_payloads.py, examples_home.py);
                                  web/ copies it as Home's fixture, so W11 never changes it
  api/examples/blocks-33-34.json  the screener and the Markets overview (33-screener, 34-markets; examples_screens.py)

  python3 tools/api/examples.py          rewrite both (deterministic: same input, same bytes)
  python3 tools/api/examples.py --check  exit 1 if a file differs from what the mockups' data gives"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle  # noqa: E402
import examples_home as home  # noqa: E402
import examples_chain as chain  # noqa: E402
import examples_payloads as frame  # noqa: E402
import examples_pages as pages  # noqa: E402
import examples_screens as screens  # noqa: E402

SHELL = bundle.REPO / "design/mockups/30-shell/data.json"
HOME = bundle.REPO / "design/mockups/31-dashboard/data.json"
SCREENER = bundle.REPO / "design/mockups/33-screener/data.json"
MARKETS = bundle.REPO / "design/mockups/34-markets/data.json"
CHAIN = bundle.REPO / "design/mockups/32-option-chain/data.json"
OUT = bundle.API / "examples/blocks.json"
OUT_SCREENS = bundle.API / "examples/blocks-33-34.json"
OUT_CHAIN = bundle.API / "examples/blocks-32.json"
# the data each example comes from: its mockup folder, the source_commit its envelope names (the "signed off ... as of
# commit" of its notes.md) and the description
DATA = {"shell": ("30-shell", "cadf1d2", "signed off as of cadf1d2"), "home": ("31-dashboard", "e8cd360", "signed off as of e8cd360"),
        "screener": ("33-screener", "e28b43d", "signed off as of e28b43d; real NSE files and stock-tool records of 12 Oct 2026"),
        "markets": ("34-markets", "59b606d", "signed off as of 59b606d; real NSE files and stock-tool records of 12 Oct 2026"),
        "chain": ("32-option-chain", "9d9c401", "signed off as of 9d9c401; real NSE files of 12 Oct 2026")}
SCHEMA_VERSION = {"blocks": "2.1.0", "screens": "2.2.0", "chain": "2.3.0"}
RULE = {"stock": "stock_age", "fno": "fno_calendar", "dashboard": "static"}
BUILDERS = {  # operationId -> (builder, page_key, which mockup's data, markets)
    "getFrameMarkets": (frame.frame_markets, "markets", "shell", ["_all"]),
    "getApproaches": (frame.approaches, "approaches", "shell", ["india", "us"]),
    "getPriceSources": (frame.price_sources, "price_sources", "shell", ["india", "us"]),
    "getSession": (frame.session, "session", "shell", ["india", "us"]),
    "getIndices": (frame.indices, "indices", "shell", ["india", "us"]),
    "getNotifications": (frame.notifications, "notifications", "shell", ["india", "us"]),
    "searchInstruments": (frame.search, "search_index", "shell", ["india", "us"]),
    "getInstrument": (frame.instrument, "instrument", "shell", ["india", "us"]),
    "getAccounts": (frame.accounts, "accounts", "home", ["india", "us"]),
    "getPositions": (frame.positions, "positions", "home", ["india", "us"]),
    "getOrderRules": (frame.order_rules, "order_rules", "shell", ["india", "us"]),
    "getPicks": (home.picks, "picks", "shell", ["india", "us"]),
    "getTrackedMoves": (frame.tracked_moves, "tracked_moves", "shell", ["india", "us"]),
    "getGroups": (home.groups, "groups", "home", ["india", "us"]),
    "getStrategyTrades": (home.strategy_trades, "strategy_trades", "home", ["india", "us"]),
    "getAttention": (home.attention, "attention", "home", ["india", "us"]),
    "getEvents": (lambda x, m: screens.home_events(x.screens, m, x.H, x.S), "events", "home", ["india", "us"]),  # one calendar
    "getTopNews": (home.top_news, "top_news", "home", ["india", "us"]),
    "searchFnoContracts": (frame.fno_search, "contracts", "shell", ["india"]),
    "getFnoPicks": (home.fno_picks, "today", "shell", ["india"]),
    "getFnoContract": (frame.fno_contract, "quotes", "shell", ["india"]),
    "getFnoOrderRules": (frame.fno_order_rules, "order_rules", "shell", ["india"]),
    "getFnoBooks": (home.fno_books, "risk", "home", ["india"]),
}
SCREEN_BUILDERS = {  # the same, for api/examples/blocks-33-34.json
    "getScreenerSummaryIndia": (screens.screener_summary, "screener_summary", "screener", ["india"]),
    "getScreenerSummaryUs": (screens.screener_summary, "screener_summary", "screener", ["us"]),
    "getScreenerStocksIndia": (pages.screener_stocks, "screener_stocks", "screener", ["india"]),
    "getScreenerStocksUs": (pages.screener_stocks, "screener_stocks", "screener", ["us"]),
    "getScreenerTools": (screens.screener_tools, "screener_tools", "screener", ["india", "us"]),
    "getFnoScreenerSummary": (screens.fno_screener_summary, "fno_screener_summary", "screener", ["india"]),
    "getFnoScreenerRows": (pages.fno_screener_rows, "fno_screener_rows", "screener", ["india"]),
    "getOverviewIndicesIndia": (screens.overview_indices, "overview_indices", "markets", ["india"]),
    "getOverviewIndicesUs": (screens.overview_indices, "overview_indices", "markets", ["us"]),
    "getIndiaSectors": (screens.india_sectors, "overview_sectors", "markets", ["india"]),
    "getUsSectors": (screens.us_sectors, "overview_sectors", "markets", ["us"]),
    "getFlows": (screens.flows, "flows", "markets", ["india"]),
    "getRates": (screens.rates, "rates", "markets", ["us"]),
    "getWorld": (screens.world, "world", "markets", ["india", "us"]),
    "getEvents": (lambda x, m: screens.events(x, m, x.home), "events", "markets", ["india", "us"]),
}
CHAIN_BUILDERS = {  # the same, for api/examples/blocks-32.json (India only)
    "getChainUnderlying": (chain.underlying, "chain_underlying", "chain", ["india"]),
    "getChainExpiries": (chain.expiries, "chain_expiries", "chain", ["india"]),
    "getChainRows": (chain.rows, "chain_rows", "chain", ["india"]),
    "getChainHistory": (chain.history, "chain_history", "chain", ["india"]),
    "getContractHistory": (chain.contract_history, "chain_contract", "chain", ["india"]),
    "getChainSources": (chain.sources, "chain_sources", "chain", ["india"]),
}


def canonical(payload) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def envelope(publisher: str, market: str, page_key: str, data: str, clock: tuple, version: str, payload: dict) -> dict:
    as_of, cutoff = clock
    meta = {"market": market, "page_key": page_key, "as_of": as_of, "cutoff": cutoff, "built_at": cutoff,
            "schema_version": version, "source_commit": DATA[data][1],
            "payload_sha256": hashlib.sha256(canonical(payload)).hexdigest(), "publisher": publisher,
            "freshness": {"state": "fresh", "rule": RULE[publisher], "built_at": cutoff, "age_minutes": 0, "reason": None},
            "paper": "Paper"}
    if publisher == "fno":
        meta.update(product="fno", publication_id="mock-2026-10-07")
    return {**meta, "payload": payload}


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def build(builders: dict, mock, clock: tuple, version: str) -> dict:
    doc = bundle.bundle()
    ops = {op["operationId"]: op for item in doc["paths"].values() for op in item.values() if isinstance(op, dict) and "operationId" in op}
    out = {}
    for op_id, (builder, page_key, data, markets) in builders.items():
        publisher = ops[op_id]["x-publisher"]
        for market in markets:
            for suffix, (summary, payload, *query) in builder(mock, None if market == "_all" else market).items():
                name = f"{op_id}_{market.strip('_')}{suffix}"
                key = page_key if op_id != "getInstrument" else f"instrument:{payload['id']}"
                out[name] = {"summary": f"Mock ({market.strip('_')}): {summary}",
                             "description": f"Taken from design/mockups/{DATA[data][0]}/data.json ({DATA[data][2]})",
                             "value": envelope(publisher, market, key, data, clock, version, payload)}
                if query:  # a view of a shared record: the query that gives it (check_contract recomputes it)
                    out[name]["x-query"] = query[0]
    return out


def rendered() -> dict[Path, str]:
    shell = frame.Mock(load(SHELL), load(HOME))
    screen = screens.Screens(load(SCREENER), load(MARKETS))
    shell.screens, screen.home = screen, shell.H  # the events calendar joins 31's and 34's records
    files = {OUT: build(BUILDERS, shell, ("2026-10-06", shell.S["now"]), SCHEMA_VERSION["blocks"]),
             OUT_SCREENS: build(SCREEN_BUILDERS, screen, (screen.C["day"], screen.C["clock"]["now"]), SCHEMA_VERSION["screens"])}
    opt = chain.Chain(load(CHAIN))
    files[OUT_CHAIN] = build(CHAIN_BUILDERS, opt, (opt.C["day"], opt.C["clock"]["now"]), SCHEMA_VERSION["chain"])
    return {path: json.dumps(value, indent=1, ensure_ascii=False) + "\n" for path, value in files.items()}


def is_current() -> bool:
    return all(path.exists() and path.read_text(encoding="utf-8") == text for path, text in rendered().items())


def main() -> int:
    if "--check" in sys.argv:
        same = is_current()
        print("examples: api/examples/*.json match the mockups' data" if same else "examples: api/examples/*.json are out of date (run tools/api/examples.py)")
        return 0 if same else 1
    for path, text in rendered().items():
        path.write_text(text, encoding="utf-8")
        print(f"examples: wrote {path.relative_to(bundle.REPO)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
