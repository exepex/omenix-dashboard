"""Story P1 (exepex/trading, owner decision 15 Oct 2026): the F&O data catalog's checks on the bundled contract.

  1. Every F&O screen operation (tag fno-screens) is India only, planned, publisher fno, with its read model, freshness
     and empty state; its examples cover the positive, negative and empty cases.
  2. Every example is labelled Mock, validates against its response schema, carries this contract's version, its
     operation's page_key and the SHA-256 of its payload (exepex/trading's canonical JSON); none is left unreferenced.
  3. Every leaf field has its meaning, unit, visibility (public | owner), x-fill (built | not_built) and catalog entry;
     a built field names its backend record (<record>:<field>, a record listed in RECORDS); every money unit says Paper.
  4. Strategy internals stay private: each page lists what is never sent, and no property or example key is named like a
     rule, threshold, filter, parameter, prompt, weight or feature. Every object is closed (a planted extra field fails).
  5. The card says PAPER ONLY; every mockup built on the catalog shows exactly the catalog's examples (one copy, DRY).
  6. Probes: invalid pages the schema must refuse (fno_rules.py).
Usage: pip install -r tools/api/requirements.txt; python3 tools/api/check_fno_screens.py. Exit 1 on any problem."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle  # noqa: E402
from check_contract import errors  # noqa: E402
from fno_rules import check_owner_paths, check_probes, check_provisional, check_stress  # noqa: E402
from fno_walk import payload_name, response_ref, schema_nodes, screen_leaves, screen_operations  # noqa: E402

EXAMPLES_FILE = "fno-screens.json"
SCHEMA_PREFIX = "fno-"
CASES = {"positive", "negative", "empty"}
VISIBILITY = {"public", "owner"}
FILL = {"built", "not_built"}
CATALOG = ("publisher", "source", "freshness", "story", "status")
PATH_PREFIX = "/api/v1/markets/india/fno/"
RECORD = re.compile(r"^([a-z0-9_]+):([a-z0-9_]+)$")
PRIVATE = re.compile(r"(^|_)(rules?|thresholds?|filters?|params?|parameters|prompts?|weights?|features?|coefficients?|triggers?|lookbacks?|signals?|settings?|conditions?)($|_)")
PAGE = re.compile(r"page (\w+)")
# The backend records a built field may name, and where exepex/trading defines them (its P1 test reads each one)
RECORDS = {
    "ledger_csv": "research/ledger.csv, its header (B4)",
    "forecast_record_v2": "fno/forecast/schema_v2.py RECORD_COLUMNS_V2 (G1, G3)",
    "score_summary": "fno/forecast_scoring/scores.py ScoreSummary (G4)",
    "bootstrap_result": "fno/forecast_scoring/block_bootstrap.py BootstrapResult (G4)",
    "calibration_bin": "fno/forecast_scoring/scores.py CalibrationBin (G4)",
    "check_report": "fno/checks/data_checks.py CheckReport (C3)",
    "scoring_status": "fno/ai/scoring_gate.py ScoringStatus (G5)",
    "book_coverage": "fno/forecast_scoring/coverage.py book_coverage, its keys per book (G4)",
    "paper_account": "fno/books/account.py PaperAccount (E1)",
    "account_state": "fno/books/equity.py AccountState (E1)",
    "equity_history": "fno/books/account.py EQUITY_COLUMNS (E1)",
    "trade_line": "fno/accounting/ledgers.py TradeLine (C1)",
    "desk_event": "fno/desk/records.py DeskEvent (E4)",
}
# Mockups whose data.json is built from the catalog: folder -> the operation whose examples it shows
MOCKUPS = {"39-trade-card": "getFnoCard", "40-weather": "getFnoWeather", "41-paper-books": "getFnoPaperTrades"}


def canonical(payload) -> bytes:
    """exepex/trading's canonical JSON (fno/market_read_models/publication.py), so both sides hash alike."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def op_examples(doc: dict, op: dict) -> dict[str, tuple[str, dict]]:
    """key -> (example name, Example object) of one operation."""
    refs = op["responses"]["200"]["content"]["application/json"].get("examples", {})
    return {key: (ref["$ref"].rsplit("/", 1)[1], doc["components"]["examples"][ref["$ref"].rsplit("/", 1)[1]]) for key, ref in refs.items()}


def check_operations(doc: dict, problems: list[str]) -> None:
    for path, op in screen_operations(doc):
        where = op["operationId"]
        if not path.startswith(PATH_PREFIX):
            problems.append(f"{where}: an F&O screen lives under {PATH_PREFIX} (absent in the US), not {path}")
        for key, want in (("x-publisher", "fno"), ("x-status", "planned")):
            if op.get(key) != want:
                problems.append(f"{where}: {key} must be {want}")
        problems += [f"{where}: no {key}" for key in ("x-read-model", "x-freshness", "x-empty") if not op.get(key)]
        cases = {example.get("x-case") for _, example in op_examples(doc, op).values()}
        if not CASES <= cases:
            problems.append(f"{where}: examples miss the case(s) {sorted(CASES - cases)}")


def check_examples(doc: dict, problems: list[str], own: dict) -> None:
    used = set()
    for _, op in screen_operations(doc):
        page = PAGE.search(op.get("x-read-model", ""))
        for name, example in op_examples(doc, op).values():
            used.add(name)
            value = example["value"]
            if not str(example.get("summary", "")).startswith("Mock"):
                problems.append(f"example {name}: its summary must start with Mock")
            if example.get("x-case") not in CASES:
                problems.append(f"example {name}: x-case must be one of {sorted(CASES)}")
            problems += [f"example {name}: {e}" for e in errors(doc, response_ref(op), value)]
            if value.get("schema_version") != doc["info"]["version"]:
                problems.append(f"example {name}: schema_version {value.get('schema_version')} is not {doc['info']['version']}")
            if page and value.get("page_key") != page.group(1):
                problems.append(f"example {name}: page_key {value.get('page_key')} is not {page.group(1)}")
            if value.get("payload_sha256") != hashlib.sha256(canonical(value.get("payload"))).hexdigest():
                problems.append(f"example {name}: payload_sha256 is not the SHA-256 of its payload "
                                f"({hashlib.sha256(canonical(value.get('payload'))).hexdigest()})")
    problems += [f"example {name} ({EXAMPLES_FILE}) is not referenced by an F&O screen operation" for name in sorted(set(own) - used)]


def check_leaves(doc: dict, problems: list[str]) -> list:
    leaves = screen_leaves(doc)
    for leaf in leaves:
        where = f"{leaf.op} {leaf.path}"
        if not leaf.description:
            problems.append(f"{where}: no description (what it means)")
        if not leaf.unit:
            problems.append(f"{where}: no x-unit")
        elif "INR" in leaf.unit and "(Paper)" not in leaf.unit:
            problems.append(f"{where}: a money unit must say Paper (INR (Paper)), not {leaf.unit!r}")
        if leaf.visibility not in VISIBILITY:
            problems.append(f"{where}: x-visibility must be one of {sorted(VISIBILITY)}")
        if leaf.fill not in FILL:
            problems.append(f"{where}: x-fill must be one of {sorted(FILL)}")
        problems += [f"{where}: x-catalog has no {key}" for key in CATALOG if not leaf.catalog.get(key)]
        check_record(where, leaf, problems)
    return leaves


def check_record(where: str, leaf, problems: list[str]) -> None:
    if leaf.fill == "built":
        match = RECORD.match(leaf.record or "")
        if not match:
            problems.append(f"{where}: a built field names its backend record as x-record <record>:<field>")
        elif match.group(1) not in RECORDS:
            problems.append(f"{where}: unknown record {match.group(1)!r} (add it to RECORDS with where the backend defines it)")
    elif leaf.record:
        problems.append(f"{where}: x-record on a field the backend cannot fill yet (x-fill not_built)")


def screen_schemas(folder: Path = bundle.API) -> dict[str, dict]:
    return {name: schema for path in sorted((folder / "schemas").glob(f"{SCHEMA_PREFIX}*.yaml")) for name, schema in bundle.load_yaml(path).items()}


def check_privacy(doc: dict, problems: list[str]) -> None:
    for _, op in screen_operations(doc):
        name = payload_name(doc, op)
        if not doc["components"]["schemas"][name].get("x-never-sent"):
            problems.append(f"{name}: x-never-sent must list the strategy internals the backend never sends")
        for example_name, example in op_examples(doc, op).values():
            problems += [f"example {example_name}: key {key!r} reads like a strategy internal" for key in example_keys(example["value"]["payload"]) if PRIVATE.search(key)]
    for name in screen_schemas():
        for where, node in schema_nodes(doc["components"]["schemas"][name], name):
            problems += [f"{where}: property {key!r} reads like a strategy internal" for key in node.get("properties", {}) if PRIVATE.search(key)]
            if "properties" in node and "$ref" not in node and node.get("additionalProperties") is not False and not where.endswith("/if") and "/allOf/" not in where:
                problems.append(f"{where}: an object of the catalog is closed (additionalProperties: false)")


def example_keys(value):
    if isinstance(value, dict):
        for key, sub in value.items():
            yield key
            yield from example_keys(sub)
    elif isinstance(value, list):
        for sub in value:
            yield from example_keys(sub)


def check_sums(doc: dict, problems: list[str]) -> None:
    """What a schema cannot say: net is gross minus costs, and won plus lost is at most the trades."""
    for _, op in screen_operations(doc):
        for name, example in op_examples(doc, op).values():
            payload = example["value"]["payload"]
            for row in payload.get("results", []) + payload.get("closed", []):
                if abs(row["gross"] - row["costs"] - row["net"]) > 0.5:
                    problems.append(f"example {name}: net is not gross minus costs ({row['gross']} - {row['costs']} != {row['net']})")
                if row.get("won", 0) + row.get("lost", 0) > row.get("trades", row.get("won", 0) + row.get("lost", 0)):
                    problems.append(f"example {name}: won plus lost is more than the trades")


def check_card(doc: dict, problems: list[str]) -> None:
    if doc["components"]["schemas"]["FnoCard"]["properties"]["label"].get("const") != "PAPER ONLY":
        problems.append("FnoCard.label must be the constant PAPER ONLY")


def check_mockups(doc: dict, problems: list[str], mockups: Path = bundle.REPO / "design/mockups") -> None:
    ops = {op["operationId"]: op for _, op in screen_operations(doc)}
    for folder, op_id in MOCKUPS.items():
        path = mockups / folder / "data.json"
        if not path.is_file():
            problems.append(f"{folder}: no data.json")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        want = {key: example["value"] for key, (_, example) in op_examples(doc, ops[op_id]).items()}
        if {key: state["value"] for key, state in data.get("states", {}).items()} != want:
            problems.append(f"{folder}/data.json: its states differ from the catalog's {op_id} examples (rebuild: python3 design/mockups/{folder}/build.py)")


def own_examples(folder: Path = bundle.API) -> dict:
    return json.loads((folder / "examples" / EXAMPLES_FILE).read_text(encoding="utf-8"))


def check(doc: dict, own: dict, problems: list[str]) -> list:
    check_operations(doc, problems)
    check_examples(doc, problems, own)
    leaves = check_leaves(doc, problems)
    check_owner_paths(leaves, problems)
    check_provisional(leaves, problems)
    check_probes(doc, problems)
    check_stress(doc, problems)
    check_privacy(doc, problems)
    check_card(doc, problems)
    check_sums(doc, problems)
    check_mockups(doc, problems)
    return leaves


def main() -> int:
    doc, problems = bundle.bundle(), []
    leaves = check(doc, own_examples(), problems)
    ops = list(screen_operations(doc))
    examples = sum(len(op_examples(doc, op)) for _, op in ops)
    print(f"fno screens: {len(ops)} pages, {examples} Mock examples, {len(leaves)} leaf fields "
          f"({sum(leaf.fill == 'built' for leaf in leaves)} built today)")
    for problem in problems:
        print("  PROBLEM", problem)
    print("fno screens: every rule holds" if not problems else f"fno screens: {len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
