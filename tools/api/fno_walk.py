"""Walk the F&O screen pages of the bundled contract (story P1, tag `fno-screens`) and list every leaf field with its
catalog entry: meaning, unit, visibility, whether the backend can fill it today, the backend record behind it, whether
its shape is provisional (x-provisional: it waits for a protocol freeze), and the inherited x-catalog (publisher, source, freshness, story, status). x-catalog, x-visibility, x-fill and x-provisional are inherited
downward; a property's own keys override; x-record and description belong to the field itself."""

from __future__ import annotations

from dataclasses import dataclass

from walk import METHODS, resolve

SCREEN_TAG = "fno-screens"
INHERITED = ("x-visibility", "x-fill", "x-provisional")
MAX_DEPTH = 30


@dataclass
class Leaf:
    op: str
    path: str
    description: str | None
    unit: str | None
    visibility: str | None
    fill: str | None
    record: str | None
    catalog: dict
    provisional: str | None = None


def screen_operations(doc: dict):
    """(path, operation) of every operation tagged fno-screens."""
    for path, item in doc["paths"].items():
        for method in METHODS:
            op = item.get(method)
            if op and SCREEN_TAG in op.get("tags", []):
                yield path, op


def response_ref(op: dict) -> str:
    return op["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]


def payload_name(doc: dict, op: dict) -> str:
    """The payload schema: the `payload` property of the response's second allOf part."""
    return resolve(doc, response_ref(op))["allOf"][1]["properties"]["payload"]["$ref"].rsplit("/", 1)[1]


def _context(base: dict, node: dict) -> dict:
    ctx = {"catalog": {**base["catalog"], **node.get("x-catalog", {})}}
    for key in INHERITED:
        ctx[key] = node.get(key, base.get(key))
    return ctx


def _children(node: dict, path: str, description: str | None) -> list[tuple[dict, str, str | None]]:
    """Each child with its path; a nullable branch (anyOf) is the same field, so it keeps the field's description."""
    kids = [(child, f"{path}.{key}", None) for key, child in (node.get("properties") or {}).items()]
    if isinstance(node.get("items"), dict):
        kids.append((node["items"], f"{path}[]", None))
    if isinstance(node.get("additionalProperties"), dict):
        kids.append((node["additionalProperties"], f"{path}.*", None))
    for branch in (node.get("anyOf") or []) + (node.get("oneOf") or []):
        if branch.get("type") != "null":
            kids.append((branch, path, description))
    return kids


def walk(doc: dict, op_id: str, node: dict, path: str, base: dict, out: list[Leaf], depth: int = 0,
         fallback: str | None = None) -> None:
    if depth > MAX_DEPTH:
        raise ValueError(f"{op_id} {path}: schema nests deeper than {MAX_DEPTH}")
    ctx = _context(base, node)
    description, unit, record = node.get("description") or fallback, node.get("x-unit"), node.get("x-record")
    target = node
    while "$ref" in target:
        target = resolve(doc, target["$ref"])
        ctx = _context(ctx, target) | {k: node[k] for k in INHERITED if k in node}
        ctx["catalog"].update(node.get("x-catalog", {}))
        description, unit = description or target.get("description"), unit or target.get("x-unit")
    children = _children(target, path, description)
    if not children:
        out.append(Leaf(op_id, path, description, unit, ctx["x-visibility"], ctx["x-fill"], record, ctx["catalog"], ctx["x-provisional"]))
        return
    for child, child_path, inherited in children:
        walk(doc, op_id, child, child_path, ctx, out, depth + 1, inherited)


def screen_leaves(doc: dict) -> list[Leaf]:
    """Every leaf field of every F&O screen page, in schema order."""
    out: list[Leaf] = []
    for _, op in screen_operations(doc):
        name = payload_name(doc, op)
        base = {"catalog": {}} | dict.fromkeys(INHERITED)
        walk(doc, op["operationId"], {"$ref": f"#/components/schemas/{name}"}, "payload", base, out)
    return out


def schema_nodes(node, path: str = ""):
    """(path, mapping) of every mapping inside a schema (to scan property names and closed objects)."""
    if isinstance(node, dict):
        yield path, node
        for key, value in node.items():
            yield from schema_nodes(value, f"{path}/{key}")
    elif isinstance(node, list):
        for i, value in enumerate(node):
            yield from schema_nodes(value, f"{path}/{i}")
