// The W14 audit of what the owner reported (13 Oct 2026), run in the browser on any page:
//   - a clickable button or link that looks like plain text (no border, no underline, no fill of its own);
//   - a disabled button or link that is not visibly an action (no border) or still looks clickable (pointer cursor);
//   - a plain label that looks clickable (a pointer cursor, or a chip with a solid border that is neither a button
//     nor a link).
// Returns one line per finding, each naming the element by its text or label. Used by cases/w14.mjs and by
// tools/w14-audit.mjs (the before and after counts in reviews/claude/response_29_w14-ui.md).

/** Runs inside the page: findings for every visible interactive element and label. */
function auditInPage() {
  const out = [];
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && el.closest("[aria-hidden='true']") === null;
  };
  const alpha = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return c === "transparent" ? 0 : 1;
    const p = m[1].split(/[ ,/]+/).filter(Boolean);
    return p.length > 3 ? Number(p[3]) : 1;
  };
  const bordered = (s) => ["Top", "Right", "Bottom", "Left"].some((k) => parseFloat(s[`border${k}Width`]) >= 1 && s[`border${k}Style`] !== "none" && alpha(s[`border${k}Color`]) > 0.2);
  const underlined = (s) => /underline/.test(s.textDecorationLine);
  const filled = (s) => alpha(s.backgroundColor) > 0.5;
  const name = (el) => `${(el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || el.tagName).replace(/\s+/g, " ").trim().slice(0, 48)}" (${el.tagName.toLowerCase()}${el.classList.length ? "." + [...el.classList].join(".") : ""})`;
  // Not audited, each for its reason: the frame's navigation (rail, flyouts, phone tabs, menus) is recognisable by
  // place and has its own hover and current states; the logo is the usual home link; a skip link is off screen until
  // focused; a chart's hit areas are read by hover, tap or focus, not drawn as controls.
  const skip = (el) => el.closest(".mb-navrail, .mb-navbar, .mb-skip, .mb-menu, .mb-modal, .mb-rail-fly, .mb-appbar-brand, svg") !== null;
  const disabled = (el) => el.matches(":disabled, [aria-disabled='true']");
  for (const el of document.querySelectorAll("a[href], button, [role='button'], summary")) {
    if (!visible(el) || skip(el)) continue;
    const s = getComputedStyle(el);
    if (disabled(el)) {
      if (!bordered(s)) out.push(`disabled without a border: "${name(el)}`);
      if (s.cursor === "pointer") out.push(`disabled with a pointer cursor: "${name(el)}`);
      continue;
    }
    // A segmented group's options sit on the group's own tile; the group is the visible control.
    if (el.parentElement?.matches(".md-segmented")) continue;
    if (!bordered(s) && !underlined(s) && !filled(s)) out.push(`clickable without a border or underline: "${name(el)}`);
  }
  for (const el of document.querySelectorAll(".md-chip, .mb-label, .mb-tag, .mb-ap, .mb-mkt")) {
    if (!visible(el) || el.matches("a, button, [role='button']") || el.closest("a, button")) continue;
    const s = getComputedStyle(el);
    if (s.cursor === "pointer") out.push(`label with a pointer cursor: "${name(el)}`);
    if (el.matches(".md-chip") && bordered(s) && !/dashed|dotted/.test(s.borderTopStyle)) out.push(`label drawn like a button (solid border): "${name(el)}`);
  }
  return out;
}

/** The findings of the page as it is now (deduplicated, with a count when a finding repeats). */
export async function affordanceFindings(page) {
  const all = await page.evaluate(auditInPage);
  const counts = new Map();
  for (const f of all) counts.set(f, (counts.get(f) ?? 0) + 1);
  return [...counts].map(([f, n]) => (n > 1 ? `${f} ×${n}` : f));
}
