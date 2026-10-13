// The W12 pages' figure check on the running app (story W12 criterion 3, the W9 rule): every element that names its
// source field (`data-src`, lib/ui/sources.ts) must show exactly that field of the blocks the page read: the same
// number at the decimals shown, with its sign (unless `data-abs`), scaled by `data-scale`; a null field shows "—".
// Planted figures are injected into the real page on every run and each must be caught, so the check is proven to bite.
import { resolveSource } from "../../../lib/ui/sources.ts";

const NUMBER = /([+−-])?\s?[₹$]?\s?(\d[\d,]*(?:\.\d+)?)/g;

/** The sourced elements inside `scope` (plants injected first, removed after). */
export async function sourcedFigures(page, scope, plants = []) {
  return page.$eval(scope, (root, plants) => {
    const added = plants.map(({ src, text }) => {
      const n = document.createElement("span");
      n.dataset.src = src;
      n.textContent = text;
      return root.appendChild(n);
    });
    const found = [...root.querySelectorAll("[data-src]")].map((n) => ({ src: n.dataset.src, text: n.textContent.trim(), scale: Number(n.dataset.scale || 1), abs: n.hasAttribute("data-abs") }));
    added.forEach((n) => n.remove());
    return found;
  }, plants);
}

/** What is wrong with the sourced figures, given the page's blocks by name. */
export function sourcedProblems(figures, blocks) {
  const problems = [];
  for (const { src, text, scale, abs } of figures) {
    const value = resolveSource(src, blocks);
    if (value === undefined) problems.push(`${src}: no such field in the data ("${text}")`);
    else if (value === null) {
      if (text !== "—") problems.push(`${src}: the field is empty, the screen shows "${text}"`);
    } else if (typeof value !== "number") problems.push(`${src}: not a number (${JSON.stringify(value)})`);
    else {
      const m = [...text.matchAll(NUMBER)];
      if (m.length !== 1) problems.push(`${src}: "${text}" is not one figure`);
      else {
        const digits = m[0][2];
        const d = digits.split(".")[1]?.length ?? 0;
        const shown = Number(digits.replace(/,/g, "")) * (m[0][1] === "−" || m[0][1] === "-" ? -1 : 1);
        const want = value * scale;
        const sameSize = Math.round(Math.abs(want) * 10 ** d) === Math.round(Math.abs(shown) * 10 ** d);
        const sameSign = abs || Math.round(want * 10 ** d) === 0 || Math.sign(want) === Math.sign(shown);
        if (!sameSize || !sameSign) problems.push(`${src}: shows "${text}", the field holds ${value}`);
      }
    }
  }
  return problems;
}

/** The check plus its plants: each plant must add a problem, or the check itself is reported as broken. */
export async function figureChecks(page, scope, blocks, plants) {
  const problems = sourcedProblems(await sourcedFigures(page, scope), blocks);
  for (const plant of plants) {
    const caught = sourcedProblems(await sourcedFigures(page, scope, [plant]), blocks).length > problems.length;
    if (!caught) problems.push(`the check did not catch ${plant.why}`);
  }
  return problems;
}

/** Elements that must carry a source: `count` matches of `selector`, each with a [data-src] inside or on it. */
export async function unsourced(page, selector) {
  return page.$$eval(selector, (ns) => ns.filter((n) => !n.matches("[data-src]") && !n.querySelector("[data-src]")).map((n) => n.textContent.trim().slice(0, 40)));
}
