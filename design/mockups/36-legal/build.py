"""Legal pages: the privacy policy and the terms of service (owner, 13 Oct 2026: needed by the Google Cloud Console
OAuth consent screen), and the public home page they belong to (Google requires one on the same domain). One
source, two outputs:

    python design/mockups/36-legal/build.py

- `index.html`, `privacy.html` and `terms.html` here: the mockups, linked to each other;
- `app.json` here: the same pages with the app's links (/, /privacy, /terms), copied into the app by
  web/tools/sync-design.mjs and served without sign-in on the gateway (web/app/about, privacy, terms; / is /about).

Static HTML (no script), the design system inlined, the logo from the sprite; `@@CONTACT@@` stays in the text and is
filled when the app is built (MB_CONTACT_EMAIL), or removed; `@@VERIFY@@` likewise
becomes the Google Search Console meta tag (MB_GOOGLE_SITE_VERIFICATION), or nothing. Deterministic: same data, same bytes.
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

LOGO = '<svg class="mb-logo" aria-hidden="true"><use href="#mb-logo"/></svg>'
MOCKUP_LINKS = {"privacy": "privacy.html", "terms": "terms.html", "home": "index.html", "contact": "", "verify": ""}
# The app fills the contact and the verification tag when it is built (web/lib/legal/legal.ts); the mockup has neither.
APP_LINKS = {"privacy": "/privacy", "terms": "/terms", "home": "/", "contact": "@@CONTACT@@", "verify": "<!--@@VERIFY@@-->"}


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
                    for key, doc in docs.items() if doc.get("nav", True))


def page(data: dict, key: str, links: dict) -> str:
    doc = data["docs"][key]
    updated = [f'<p class="updated">Last updated {esc(data["updated"])}</p>'] if doc.get("nav", True) else []
    heading = (f'<h1 class="mb-legal-hero"><span class="mb-brand-mark">{LOGO}</span>{esc(doc["title"])}</h1>' if doc.get("hero")
               else f"<h1>{esc(doc['title'])}</h1>")
    body = "\n".join([heading, *updated,
                      f"<p>{esc(doc['lead'])}</p>", *(section(s) for s in doc["sections"])])
    title = "Omenix: research and paper trading" if doc.get("hero") else f"{esc(doc['title'])} · Omenix"
    out = (read("template.html").replace("<!--@@TITLE@@--> · Omenix", title)
           .replace("<!--@@LEAD@@-->", html.escape(doc["lead"])).replace("<!--@@NAV@@-->", nav(data["docs"], key, links))
           .replace('href="/" aria-label="Omenix home"', f'href="{links["home"]}" aria-label="Omenix home"')
           .replace('<link rel="icon" href="data:,">', f'<link rel="icon" type="image/svg+xml" href="{favicon()}">')
           .replace("<!--@@BODY@@-->", body).replace("@@CONTACT@@", links["contact"])
           .replace("<!--@@VERIFY@@-->", links["verify"]))
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
