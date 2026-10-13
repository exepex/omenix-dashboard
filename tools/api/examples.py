"""Write (or check) api/examples/blocks.json: one OpenAPI Example per block operation and market, every payload taken
from the signed-off mockups' data (examples_payloads.py, examples_home.py) and wrapped in the publisher's envelope.

  python3 tools/api/examples.py          rewrite api/examples/blocks.json (deterministic: same input, same bytes)
  python3 tools/api/examples.py --check  exit 1 if the file differs from what the mockups' data gives"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle  # noqa: E402
import examples_home as home  # noqa: E402
import examples_payloads as frame  # noqa: E402

SHELL = bundle.REPO / "design/mockups/30-shell/data.json"
HOME = bundle.REPO / "design/mockups/31-dashboard/data.json"
OUT = bundle.API / "examples/blocks.json"
SIGNED_OFF = {"shell": "cadf1d2", "home": "e8cd360"}  # "signed off ... as of commit" in each notes.md
SCHEMA_VERSION = "2.1.0"
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
    "getEvents": (home.events, "events", "home", ["india", "us"]),
    "getTopNews": (home.top_news, "top_news", "home", ["india", "us"]),
    "searchFnoContracts": (frame.fno_search, "contracts", "shell", ["india"]),
    "getFnoPicks": (home.fno_picks, "today", "shell", ["india"]),
    "getFnoContract": (frame.fno_contract, "quotes", "shell", ["india"]),
    "getFnoOrderRules": (frame.fno_order_rules, "order_rules", "shell", ["india"]),
    "getFnoBooks": (home.fno_books, "risk", "home", ["india"]),
}


def canonical(payload) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def envelope(publisher: str, market: str, page_key: str, data: str, cutoff: str, payload: dict) -> dict:
    meta = {"market": market, "page_key": page_key, "as_of": "2026-10-06", "cutoff": cutoff, "built_at": cutoff,
            "schema_version": SCHEMA_VERSION, "source_commit": SIGNED_OFF[data],
            "payload_sha256": hashlib.sha256(canonical(payload)).hexdigest(), "publisher": publisher,
            "freshness": {"state": "fresh", "rule": RULE[publisher], "built_at": cutoff, "age_minutes": 0, "reason": None},
            "paper": "Paper"}
    if publisher == "fno":
        meta.update(product="fno", publication_id="mock-2026-10-07")
    return {**meta, "payload": payload}


def build() -> dict:
    doc = bundle.bundle()
    ops = {op["operationId"]: op for item in doc["paths"].values() for op in item.values() if isinstance(op, dict) and "operationId" in op}
    mock = frame.Mock(json.loads(SHELL.read_text(encoding="utf-8")), json.loads(HOME.read_text(encoding="utf-8")))
    cutoff = mock.S["now"]
    out = {}
    for op_id, (builder, page_key, data, markets) in BUILDERS.items():
        publisher = ops[op_id]["x-publisher"]
        for market in markets:
            for suffix, (summary, payload) in builder(mock, None if market == "_all" else market).items():
                name = f"{op_id}_{market.strip('_')}{suffix}"
                key = page_key if op_id != "getInstrument" else f"instrument:{payload['id']}"
                out[name] = {"summary": f"Mock ({market.strip('_')}): {summary}",
                             "description": f"Taken from design/mockups/{'30-shell' if data == 'shell' else '31-dashboard'}/data.json (signed off as of {SIGNED_OFF[data]})",
                             "value": envelope(publisher, market, key, data, cutoff, payload)}
    return out


def rendered() -> str:
    return json.dumps(build(), indent=1, ensure_ascii=False) + "\n"


def is_current() -> bool:
    return OUT.exists() and OUT.read_text(encoding="utf-8") == rendered()


def main() -> int:
    if "--check" in sys.argv:
        same = is_current()
        print("examples: api/examples/blocks.json matches the mockups' data" if same else "examples: api/examples/blocks.json is out of date (run tools/api/examples.py)")
        return 0 if same else 1
    OUT.write_text(rendered(), encoding="utf-8")
    print(f"examples: wrote {OUT.relative_to(bundle.REPO)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
