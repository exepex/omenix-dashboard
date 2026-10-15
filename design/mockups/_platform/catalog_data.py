"""The F&O data catalog's examples as a mockup's data (story P1): one copy of the data, in the API contract
(api/examples/fno-screens.json); a mockup built on it never keeps a second copy. tools/api/check_fno_screens.py fails
when a mockup's data.json differs from the catalog.

    from catalog_data import screen_payload      # design/mockups/_platform on sys.path
    screen_payload("getFnoCard", page="card", note="...")
"""
from __future__ import annotations

import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, "tools", "api"))
import bundle  # noqa: E402
from check_fno_screens import op_examples  # noqa: E402
from fno_walk import screen_operations  # noqa: E402

SOURCE = "api/examples/fno-screens.json (the F&O data catalog, exepex/trading story P1)"


def screen_states(op_id: str) -> dict:
    """The operation's examples by key (e.g. india_trade): case, summary, about (the example's description) and the response value."""
    doc = bundle.bundle()
    op = next(op for _, op in screen_operations(doc) if op["operationId"] == op_id)
    return {key: {"case": ex["x-case"], "summary": ex["summary"], "about": ex.get("description", ""), "value": ex["value"]}
            for key, (_, ex) in op_examples(doc, op).items()}


def screen_payload(op_id: str, page: str, note: str) -> dict:
    return {"_mock": True, "_note": note, "page": page, "source": SOURCE, "operation": op_id, "states": screen_states(op_id)}
