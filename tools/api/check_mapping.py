"""Story W10 criteria 1 and 2: every element of the signed-off notes.md contracts maps to the block endpoints' fields,
and every endpoint field serves an element (zero gaps both ways); each endpoint states the blocks it feeds.

  1. api/catalog/elements.yaml equals notes.md: the same element rows and prose sections, the same field tokens
     (as multisets), every token classified as a field or as "other" with a reason.
  2. Every field key of every element is implemented by exactly one schema node (x-notes); no x-notes key is unknown.
  3. Every endpoint field names the elements it serves (x-element, inherited); every element that needs data is
     served, and no static element is.
  4. Every block operation's x-feeds equals the elements its payload fields serve.
Exit 1 on any problem. Usage: python3 tools/api/check_mapping.py"""

from __future__ import annotations

import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle  # noqa: E402
from walk import block_fields, block_operations  # noqa: E402

NOTES = {"30-shell": bundle.REPO / "design/mockups/30-shell/notes.md",
         "31-dashboard": bundle.REPO / "design/mockups/31-dashboard/notes.md"}
ELEMENTS = bundle.API / "catalog/elements.yaml"
TOKEN = re.compile(r"`([^`]+)`")
SEPARATOR = re.compile(r"^\|[\s|:-]+\|$")


def cells(line: str) -> list[str]:
    return [c.strip() for c in line.strip().strip("|").split("|")]


def parse_notes(name: str, path: Path) -> list[dict]:
    """The elements of one notes.md: table rows (element cell, tokens of the Fields cell) and prose sections."""
    found, section, columns, prose, has_table = [], None, None, [], False

    def close_section():
        if section is not None and not has_table:
            found.append({"notes": name, "section": section, "row": None, "tokens": Counter(prose)})
        elif prose:
            found.append({"notes": name, "section": section, "row": "<prose in a table section>", "tokens": Counter(prose)})

    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            close_section()
            section, columns, prose, has_table = line[3:].strip(), None, TOKEN.findall(line), False
        elif line.startswith("|") and not SEPARATOR.match(line.strip()):
            row = cells(line)
            if "Element" in row and "Fields" in " ".join(row):
                columns = (row.index("Element"), next(i for i, c in enumerate(row) if c.startswith("Fields")))
                continue
            has_table = True
            found.append({"notes": name, "section": section, "row": row[columns[0]], "tokens": Counter(TOKEN.findall(row[columns[1]]))})
        elif section is not None:
            prose += TOKEN.findall(line)
    close_section()
    if name == "31-dashboard":
        found = [e for e in found if e["row"] != "<prose in a table section>"]  # the "Not on Home any more" list
    return found


def check_elements(declared: list[dict], problems: list[str]) -> None:
    for p in (e for name, path in NOTES.items() for e in parse_notes(name, path)):
        match = next((d for d in declared if d["notes"] == p["notes"] and d["row"] == p["row"]
                      and (p["row"] is not None or (p["section"] or "").startswith(d["section"]))), None)
        if match is None:
            problems.append(f"notes.md element without an entry in elements.yaml: {p['notes']} {p['section']!r} {p['row']!r}")
            continue
        listed = Counter([f["t"] for f in match.get("fields", [])] + [o["t"] for o in match.get("other", [])])
        if listed != p["tokens"]:
            problems.append(f"{match['id']}: tokens differ from notes.md: missing {sorted((p['tokens'] - listed).elements())}, "
                            f"extra {sorted((listed - p['tokens']).elements())}")
        match["_matched"] = True
    for d in declared:
        if not d.pop("_matched", False):
            problems.append(f"elements.yaml entry not in notes.md: {d['id']} ({d['row']!r})")
    problems += [f"{d['id']}: field without a key" for d in declared for t in d.get("fields", []) if not t.get("k")]
    problems += [f"{d['id']}: token {t['t']} has {len(t['k'])} keys but no reason (why)" for d in declared
                 for t in d.get("fields", []) if len(t.get("k", [])) > 1 and not t.get("why")]
    problems += [f"{d['id']}: other token {o['t']} without a reason" for d in declared for o in d.get("other", []) if not o.get("why")]


def independence(fields, ops, block_of: dict, problems: list[str]) -> int:
    """Each top-level part of a payload feeds a set of screen blocks; two parts feeding disjoint sets would be two
    independent blocks' data in one endpoint. An endpoint whose one record feeds several blocks states why (x-shared)."""
    shared = 0
    for path, _, op in ops:
        parts: dict[str, set] = defaultdict(set)
        for f in fields:
            if f.op == op["operationId"] and f.path.startswith("payload.") and f.path.split(".")[1] not in ("currency", "q"):
                parts[f.path.split(".")[1].rstrip("[]")].update(block_of[e] for e in f.elements)
        names = sorted(parts)
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                if not parts[a] & parts[b]:
                    problems.append(f"{path}: payload parts {a} {sorted(parts[a])} and {b} {sorted(parts[b])} feed independent blocks")
        blocks = set().union(*parts.values()) if parts else set()
        if len(blocks) > 1:
            shared += 1
            if not op.get("x-shared"):
                problems.append(f"{path}: feeds {sorted(blocks)}; state why one record serves them (x-shared)")
    return shared


def main() -> int:
    problems: list[str] = []
    declared = yaml.safe_load(ELEMENTS.read_text(encoding="utf-8"))
    ids = [d["id"] for d in declared]
    problems += [f"duplicate element id {i}" for i, n in Counter(ids).items() if n > 1]
    check_elements(declared, problems)
    doc = bundle.bundle()
    fields = block_fields(doc)
    by_id = {d["id"]: d for d in declared}

    # 2. field keys -> exactly one schema node
    implemented: dict[str, set] = defaultdict(set)
    for f in fields:
        for note in f.notes:
            implemented[note].add(f.pointer)
    wanted = {f"{d['id']}:{k}" for d in declared for t in d.get("fields", []) for k in t["k"]}
    for key in sorted(wanted):
        if len(implemented.get(key, ())) != 1:
            problems.append(f"field key {key}: implemented by {len(implemented.get(key, ()))} schema nodes (want exactly 1)")
    problems += [f"x-notes key {k} is not a field key of elements.yaml" for k in sorted(set(implemented) - wanted)]

    # 3. every field serves an element; every data element is served
    served: dict[str, set] = defaultdict(set)
    for f in fields:
        if not f.elements:
            problems.append(f"{f.op} {f.path}: serves no element (x-element)")
        for e in f.elements:
            if e not in by_id:
                problems.append(f"{f.op} {f.path}: unknown element {e}")
            served[e].add(f.op)
    for d in declared:
        if d.get("static") and served.get(d["id"]):
            problems.append(f"{d['id']} is static but served by {sorted(served[d['id']])}")
        if not d.get("static") and not served.get(d["id"]):
            problems.append(f"{d['id']} needs data but no endpoint field serves it")

    # 4. x-feeds of each operation
    feeds = defaultdict(set)
    for f in fields:
        if f.path.startswith("payload"):
            feeds[f.op].update(f.elements)
    ops = list(block_operations(doc))
    for path, _, op in ops:
        if set(op.get("x-feeds", [])) != feeds[op["operationId"]]:
            problems.append(f"{path}: x-feeds {sorted(op.get('x-feeds', []))} != served {sorted(feeds[op['operationId']])}")

    # 5. independence: one endpoint never carries two independent blocks' data
    block_of = {d["id"]: d.get("block", d["id"]) for d in declared}
    shared = independence(fields, ops, block_of, problems)

    static = sum(1 for d in declared if d.get("static"))
    leaves = sum(1 for f in fields if f.leaf)
    print(f"elements: {len(declared)} ({len(declared) - static} need data, {static} static with a reason); "
          f"field keys: {len(wanted)}; endpoints: {len(ops)}; endpoint fields: {len(fields)} ({leaves} leaves)")
    print(f"elements without an endpoint field: {sum(1 for d in declared if not d.get('static') and not served.get(d['id']))}; "
          f"endpoint fields without an element: {sum(1 for f in fields if not f.elements)}")
    print(f"endpoints feeding more than one screen block (the same record, with x-shared): {shared} of {len(ops)}")
    print("\n".join(problems) if problems else "mapping: zero gaps both ways; no endpoint mixes two independent blocks")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
