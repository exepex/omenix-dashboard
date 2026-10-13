"""Build a mockup's gallery page: every state of the screen, captioned, desktop and phone side by side.

    python design/mockups/_platform/gallery.py design/mockups/<nn-name>     (gallery.html and screens/NN-*.png)

Run after `node design/system/shoot_states.js design/mockups/<nn-name>`, which writes gallery/<id>-<width>.png from
the folder's states.json. This script compresses those screenshots (256-colour PNG: screen captures lose nothing
visible) and writes gallery.html next to page.html, with the design system inlined (tokens only, no request leaves
the page). Deterministic.
"""
from __future__ import annotations

import html
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "system"))
from system import inline_system  # noqa: E402

CSS = """
body{font-size:14px;line-height:1.5}
main{max-width:1500px;margin:0 auto;padding:24px 24px 64px}
h1{font:700 24px/1.2 var(--md-ref-typeface-plain);margin:0 0 4px} .lede{color:var(--md-sys-color-on-surface-variant);margin:0 0 8px}
nav.toc{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 8px}
h2{font:600 18px/1.3 var(--md-ref-typeface-plain);margin:32px 0 12px;scroll-margin-top:12px}
.st{background:var(--md-sys-color-surface-container-lowest);box-shadow:var(--mb-card-shadow);border-radius:var(--mb-card-radius);padding:16px;margin-top:16px}
.st h3{font:600 15px/1.4 var(--md-ref-typeface-plain);margin:0 0 10px}
.st h3 code{font-size:12px;color:var(--md-sys-color-on-surface-variant);font-weight:400}
.shots{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
figure{margin:0;min-width:0} figure img{display:block;max-width:100%;height:auto;border:1px solid var(--md-sys-color-outline-variant);border-radius:4px;background:var(--md-sys-color-surface)}
figcaption{font-size:12px;color:var(--md-sys-color-on-surface-variant);margin-top:4px}
.w-phone img{width:300px} .w-desk{flex:1 1 640px} .w-desk img{width:100%}
@media (max-width:700px){main{padding:16px}.w-phone img{width:100%}}
"""
LABEL = {390: "phone 390 px", 768: "tablet 768 px", 1024: "laptop 1024 px", 1280: "desktop 1280 px", 1680: "large 1680 px"}


def compress(path: str) -> None:
    image = Image.open(path).convert("RGB")
    image.quantize(colors=256, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)


def figure(state: dict, width: int) -> str:
    src = f"gallery/{state['id']}-{width}.png"
    kind = "w-phone" if width < 600 else "w-desk"
    return (f'<figure class="{kind}"><a href="{src}"><img src="{src}" alt="{html.escape(state["title"])} ({LABEL[width]})" '
            f'loading="lazy"></a><figcaption>{LABEL[width]}</figcaption></figure>')


def build(folder: str) -> str:
    spec = json.load(open(os.path.join(folder, "states.json"), encoding="utf-8"))
    for state in spec["states"]:
        for width in state.get("widths", [1280, 390]):
            compress(os.path.join(folder, "gallery", f"{state['id']}-{width}.png"))
    sections: dict[str, list] = {}
    for state in spec["states"]:
        sections.setdefault(state["section"], []).append(state)
    name = os.path.basename(os.path.abspath(folder))
    body = [f"<h1>{name}: every state of the screen</h1>",
            f'<p class="lede">{len(spec["states"])} states, desktop and phone. Each picture is a link to the full image; '
            f'each state is also a link into the live mockup (<code>page.html#…</code>). Example data from the application\'s '
            f'own records; F&amp;O prices and the paper account\'s starting cash are labelled examples.</p>',
            '<nav class="toc">' + "".join(f'<a class="md-chip assist" href="#s{i}">{html.escape(t)}</a>' for i, t in enumerate(sections)) + "</nav>"]
    for i, (title, states) in enumerate(sections.items()):
        body.append(f'<h2 id="s{i}">{html.escape(title)}</h2>')
        for state in states:
            link = "page.html" + (f"#{state['hash']}" if state.get("hash") else "")
            shots = "".join(figure(state, w) for w in sorted(state.get("widths", [1280, 390]), reverse=True))
            body.append(f'<section class="st"><h3>{html.escape(state["title"])} <code><a href="{html.escape(link)}">{html.escape(link)}</a></code></h3>'
                        f'<div class="shots">{shots}</div></section>')
    page = (f'<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>Omenix · {name} gallery</title><!--@@SYSTEM_CSS@@--><style>{CSS}</style></head><body><!--@@ICONS@@--><main>'
            + "\n".join(body) + "</main></body></html>\n")
    out = os.path.join(folder, "gallery.html")
    with open(out, "w", encoding="utf-8") as handle:
        handle.write(inline_system(page, icons=[]))
    return out


def screens(folder: str) -> int:
    """screens/NN-<state>-<device>.png: the owner's plain pictures in reading order. The first full-page state on desktop,
    its phone page cut into phone-sized screens, then every state on desktop, and on the phone where `phone_screen` is
    set or the state is phone-only."""
    spec = json.load(open(os.path.join(folder, "states.json"), encoding="utf-8"))
    out = os.path.join(folder, "screens")
    os.makedirs(out, exist_ok=True)
    for name in os.listdir(out):
        os.remove(os.path.join(out, name))
    n = 0

    def put(src, label, box=None):
        nonlocal n
        n += 1
        image = Image.open(os.path.join(folder, "gallery", src)).convert("RGB")
        (image.crop(box) if box else image).quantize(colors=256).save(os.path.join(out, f"{n:02d}-{label}.png"), optimize=True)

    first = spec["states"][0]
    put(f"{first['id']}-1280.png", f"{first['id']}-desktop-whole-page")
    phone = Image.open(os.path.join(folder, "gallery", f"{first['id']}-390.png"))
    for i, top in enumerate(range(0, phone.size[1], 1688), 1):
        put(f"{first['id']}-390.png", f"{first['id']}-phone-screen-{i}", (0, top, phone.size[0], min(phone.size[1], top + 1688)))
    for state in spec["states"][1:]:
        widths = state.get("widths", [1280, 390])
        if 1280 in widths:
            put(f"{state['id']}-1280.png", f"{state['id']}-desktop")
        if 390 in widths and (state.get("phone_screen") or 1280 not in widths) and not state.get("full"):
            put(f"{state['id']}-390.png", f"{state['id']}-phone")
    return n


if __name__ == "__main__":
    print(build(sys.argv[1]), screens(sys.argv[1]), "screens")
