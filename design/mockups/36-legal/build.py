"""Legal pages: the privacy policy and the terms of service (owner, 13 Oct 2026: needed by the Google Cloud Console
OAuth consent screen). One source, two outputs:

    python design/mockups/36-legal/build.py

- `privacy.html` and `terms.html` here: the mockups, linked to each other and to the dashboard mockup;
- `app.json` here: the same pages with the app's links (/privacy, /terms, /), copied into the app by
  web/tools/sync-design.mjs and served without sign-in by web/app/privacy and web/app/terms.

Static HTML (no script), the design system inlined, the logo from the sprite; `@@CONTACT@@` stays in the text and is
filled by the app at request time (MB_CONTACT_EMAIL), or removed. Deterministic: same data, same bytes.
"""
import base64
import html
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "system"))
from system import inline_system  # noqa: E402

BRAND = os.path.join(os.path.dirname(os.path.dirname(HERE)), "brand")

MOCKUP_LINKS = {"privacy": "privacy.html", "terms": "terms.html", "home": "../31-dashboard/page.html", "contact": ""}
# The app fills the contact at request time (web/lib/legal/legal.ts); the mockup shows the text without it.
APP_LINKS = {"privacy": "/privacy", "terms": "/terms", "home": "/", "contact": "@@CONTACT@@"}


def favicon() -> str:
    """The logo tile (design/brand/favicon/tile.svg) as a data URI: the gateway serves no /favicon.ico."""
    with open(os.path.join(BRAND, "favicon", "tile.svg"), "rb") as handle:
        return "data:image/svg+xml;base64," + base64.b64encode(handle.read()).decode()


def read(name: str) -> str:
    with open(os.path.join(HERE, name), encoding="utf-8") as handle:
        return handle.read()


def esc(text: str) -> str:
    return html.escape(text, quote=False)


def section(sec: dict) -> str:
    parts = [f"<h2>{esc(sec['h'])}</h2>"]
    parts += [f"<p>{esc(par)}</p>" for par in sec.get("intro", [])]   # paragraphs before the list
    if sec.get("li"):
        parts.append("<ul>" + "".join(f"<li>{esc(item)}</li>" for item in sec["li"]) + "</ul>")
    parts += [f"<p>{esc(par)}</p>" for par in sec.get("p", [])]
    return "\n".join(parts)


def nav(docs: dict, current: str, links: dict) -> str:
    current_attr = ' aria-current="page"'
    return " ".join(f'<a href="{links[key]}"{current_attr if key == current else ""}>{esc(doc["title"])}</a>'
                    for key, doc in docs.items())


def page(data: dict, key: str, links: dict) -> str:
    doc = data["docs"][key]
    body = "\n".join([f"<h1>{esc(doc['title'])}</h1>", f'<p class="updated">Last updated {esc(data["updated"])}</p>',
                      f"<p>{esc(doc['lead'])}</p>", *(section(s) for s in doc["sections"])])
    out = (read("template.html").replace("<!--@@TITLE@@-->", esc(doc["title"]))
           .replace("<!--@@LEAD@@-->", html.escape(doc["lead"])).replace("<!--@@NAV@@-->", nav(data["docs"], key, links))
           .replace('href="/" aria-label="Omenix home"', f'href="{links["home"]}" aria-label="Omenix home"')
           .replace('<link rel="icon" href="data:,">', f'<link rel="icon" type="image/svg+xml" href="{favicon()}">')
           .replace("<!--@@BODY@@-->", body).replace("@@CONTACT@@", links["contact"]))
    return inline_system(out, icons=[], dark=True)


def main() -> None:
    data = json.loads(read("data.json"))
    app = {}
    for key, doc in data["docs"].items():
        with open(os.path.join(HERE, doc["file"]), "w", encoding="utf-8") as handle:
            handle.write(page(data, key, MOCKUP_LINKS))
        app[key] = page(data, key, APP_LINKS)
    with open(os.path.join(HERE, "app.json"), "w", encoding="utf-8") as handle:
        json.dump(app, handle, ensure_ascii=False, indent=0)
        handle.write("\n")
    print("36-legal:", ", ".join(f"{d['file']} ({len(d['sections'])} sections)" for d in data["docs"].values()), "+ app.json")


if __name__ == "__main__":
    main()
