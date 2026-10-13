"""Walk the block endpoints of the bundled contract and list every field with its catalog entry (api/catalog/README.md).

A field is a property of a block payload (or of the block envelope's own fields). Catalog keys are inherited downward
(x-catalog, x-element); a property's own keys override. A field's identity is the JSON pointer of the schema node that
defines it, so a schema used in two places (GroupTotal) is one field with one catalog entry."""

from __future__ import annotations

from dataclasses import dataclass, field

CATALOG_KEYS = ("publisher", "source", "freshness", "story", "status")
BLOCK_TAG = "blocks"
# Who serves the envelope's block fields (publisher, freshness, paper): the read path of each product
ENVELOPE_STORY = {"stock": "W6", "fno": "W2", "dashboard": "W8", "nse_ingest": "NSE1-proposed"}
METHODS = ("get", "put", "post", "delete", "patch")


@dataclass
class Field:
    op: str                      # operationId
    path: str                    # human path, e.g. payload.signals[].agree.buy
    pointer: str                 # JSON pointer of the defining schema node
    leaf: bool
    catalog: dict
    elements: list
    unit: str | None
    notes: list = field(default_factory=list)
    price: bool = False
    aggregate: str | None = None
    market: str | None = None


def resolve(doc: dict, ref: str):
    if not ref.startswith("#/"):
        raise ValueError(f"only local refs are allowed: {ref}")
    node = doc
    for part in ref[2:].split("/"):
        part = part.replace("~1", "/").replace("~0", "~")
        node = node[int(part)] if isinstance(node, list) else node[part]
    return node


def block_operations(doc: dict):
    """(path, method, operation) of every operation tagged `blocks`."""
    for path, item in doc["paths"].items():
        for method in METHODS:
            op = item.get(method)
            if op and BLOCK_TAG in op.get("tags", []):
                yield path, method, op


def payload_schema_name(doc: dict, op: dict) -> str:
    """The payload schema of a block operation: the second allOf part of its 200 response schema."""
    ref = op["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]
    response = resolve(doc, ref)
    return response["allOf"][1]["properties"]["payload"]["$ref"].rsplit("/", 1)[1]


def _inherit(base: dict, node: dict) -> dict:
    out = {"catalog": dict(base["catalog"]), "elements": list(base["elements"]), "scope": base.get("scope")}
    out["catalog"].update(node.get("x-catalog", {}))
    if "x-element" in node:
        out["elements"] = list(node["x-element"])
    return out


def _is_constraint_only(node: dict) -> bool:
    """A refinement such as {const: stock} inside an allOf: not a field of its own."""
    return not any(k in node for k in ("type", "$ref", "oneOf", "anyOf", "allOf", "properties", "items"))


def walk(doc: dict, op_id: str, node: dict, pointer: str, path: str, base: dict, out: list, seen: set) -> None:
    ctx = _inherit(base, node)
    notes = list(node.get("x-notes", []))
    unit, price, agg, market = node.get("x-unit"), node.get("x-price", False), node.get("x-aggregate"), node.get("x-market")
    target, tpointer = node, pointer
    while "$ref" in target:
        tpointer = target["$ref"]
        target = resolve(doc, tpointer)
        ctx = _inherit(ctx, target) if "x-catalog" in target or "x-element" in target else ctx
        unit = unit or target.get("x-unit")
    children = []
    for key, child in (target.get("properties") or {}).items():
        if not _is_constraint_only(child):
            children.append((child, f"{tpointer}/properties/{key}", f"{path}.{key}"))
    items = target.get("items")
    if isinstance(items, dict):
        children.append((items, f"{tpointer}/items", f"{path}[]"))
    extra = target.get("additionalProperties")
    if isinstance(extra, dict):
        children.append((extra, f"{tpointer}/additionalProperties", f"{path}.*"))
    for i, branch in enumerate(target.get("oneOf") or []):
        if "$ref" in branch or "properties" in branch:
            children.append((branch, f"{tpointer}/oneOf/{i}", path))
    identity = pointer if (notes or "$ref" not in node) else tpointer
    leaf = not children
    # a field serves only the blocks its operation feeds (x-feeds): a shared schema (one quote row read by three blocks)
    # names every block that reads it; a field left with no element fails check_mapping
    noted = [n.split(":", 1)[0] for n in notes]
    elements = [e for e in dict.fromkeys(ctx["elements"] + noted) if ctx["scope"] is None or e in ctx["scope"]]
    out.append(Field(op_id, path, identity, leaf, ctx["catalog"], elements, unit, notes, price, agg, market))
    if tpointer in seen and "$ref" in node:
        return  # a shared schema is walked once per operation path only through its first use
    seen.add(tpointer)
    for child, cpointer, cpath in children:
        walk(doc, op_id, child, cpointer, cpath, ctx, out, seen)


def block_fields(doc: dict) -> list[Field]:
    """Every field of every block operation (payload and the envelope's block fields)."""
    out: list[Field] = []
    for _, _, op in block_operations(doc):
        name = payload_schema_name(doc, op)
        seen: set = set()
        # a schema shared by two markets' operations takes its publisher and source from the operation
        base = {"catalog": dict(op.get("x-catalog", {})), "elements": [], "scope": set(op["x-feeds"]) if "x-feeds" in op else None}
        walk(doc, op["operationId"], {"$ref": f"#/components/schemas/{name}"}, f"#/components/schemas/{name}", "payload", base, out, seen)
        envelope = {"catalog": {"story": ENVELOPE_STORY[op["x-publisher"]]}, "elements": []}
        walk(doc, op["operationId"], {"$ref": "#/components/schemas/BlockMetaFields"}, "#/components/schemas/BlockMetaFields", "envelope", envelope, out, seen)
        if op.get("x-publisher") == "fno":
            fno_part = "#/components/schemas/FnoBlockMeta/allOf/2"
            walk(doc, op["operationId"], {"$ref": fno_part}, fno_part, "envelope", envelope, out, seen)
    return out
