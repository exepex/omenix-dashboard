"""Shared builder of the platform mockups (design/PLATFORM_DESIGN.md; folders 30-40 of design/mockups/).

    from platform_build import run      # design/mockups/_platform on sys.path
    run(HERE)                           # in design/mockups/<nn-name>/build.py

Reads the page's `data.json` (Mock payload, hand-kept: there is no backend catalogue for these screens yet) and the
shell's `30-shell/data.json` (watchlists, index strip, accounts, search, notifications), and writes `page.html` next
to the page's `template.html`: the design system (design/system/, light tokens plus tokens-dark.css for the theme
switch), the page layout helpers (design/mockups/_shared/shell.css) and the platform runtime (js/*.js of this
folder, concatenated in file order) are inlined. Markers: `<!--@@SYSTEM_CSS@@-->`, `<!--@@ICONS@@-->`, `<!--@@SHARED_CSS@@-->`,
`<!--@@PLATFORM_JS@@-->`, `/*__SHELL__*/null` and `/*__DATA__*/null`. Deterministic: nothing reads the wall clock
(the payloads carry their own `now`), so two builds give the same bytes. No request leaves the page.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MOCKUPS = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(MOCKUPS))
sys.path.insert(0, os.path.join(REPO, "design", "system"))
from system import inline_system  # noqa: E402

SHELL_DATA = os.path.join(MOCKUPS, "30-shell", "data.json")
MARKS = ("<!--@@SHARED_CSS@@-->", "<!--@@PLATFORM_JS@@-->", "/*__SHELL__*/null", "/*__DATA__*/null")


def read(path: str) -> str:
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def runtime() -> str:
    """The platform runtime: design/mockups/_platform/js/*.js concatenated in file order (one closure, split by purpose)."""
    folder = os.path.join(HERE, "js")
    return "".join(read(os.path.join(folder, name)) for name in sorted(os.listdir(folder)) if name.endswith(".js"))


def payload(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def render(template: str, shell: dict, data: dict | None) -> str:
    html = (template
            .replace("<!--@@SHARED_CSS@@-->", f"<style>\n{read(os.path.join(MOCKUPS, '_shared', 'shell.css'))}\n</style>")
            .replace("<!--@@PLATFORM_JS@@-->", f"<script>\n{runtime()}\n</script>")
            .replace("/*__SHELL__*/null", payload(shell))
            .replace("/*__DATA__*/null", payload(data)))
    for mark in MARKS:
        assert mark not in html, mark
    return inline_system(html, dark=True)


def run(here: str, summary=None) -> None:
    parser = argparse.ArgumentParser(description="Build this platform mockup into page.html")
    parser.add_argument("--out", default=here)
    args = parser.parse_args()
    shell = json.loads(read(SHELL_DATA))
    own = os.path.join(here, "data.json")
    data = shell if os.path.abspath(own) == os.path.abspath(SHELL_DATA) else json.loads(read(own))
    assert data.get("_mock") is True, "every platform payload is labelled Mock"
    html = render(read(os.path.join(here, "template.html")), shell, None if data is shell else data)
    os.makedirs(args.out, exist_ok=True)
    out = os.path.join(args.out, "page.html")
    with open(out, "w", encoding="utf-8") as handle:
        handle.write(html)
    if summary:
        print(summary(shell, data))
    print(out, len(html), "bytes")
