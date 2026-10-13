// No duplicated styles or hooks (W14, judge 65; CLAUDE.md: DRY). (1) A CSS rule block (4 or more declarations) is
// defined in one file only: a second copy fails, unless it is one of the inherited copies listed in
// tools/css_duplicate_allowlist.txt, a list that may only shrink (an entry no longer duplicated must be removed, as
// with the code-size allowlist). (2) A React hook (export function useX) is defined in one module only.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

const web = join(import.meta.dirname, "..", "..", "..");
const repo = join(web, "..");
const walk = (dir: string, ext: RegExp): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (f === "node_modules" || f.startsWith(".")) return [];
    return statSync(p).isDirectory() ? walk(p, ext) : ext.test(f) ? [p] : [];
  });

/** Every rule block of the app's stylesheets, keyed by its sorted declarations: key -> the files defining it. */
function cssBlocks(): Map<string, Set<string>> {
  const files = ["styles/app.css", "styles/components.css", "styles/page.css"].map((f) => join(web, f)).concat(walk(join(web, "app"), /\.css$/), walk(join(web, "components"), /\.css$/));
  const blocks = new Map<string, Set<string>>();
  for (const file of files) {
    const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
      const decls = m[2].split(";").map((d) => d.trim().replace(/\s+/g, " ").replace(/\s*:\s*/, ":")).filter(Boolean).sort();
      if (decls.length < 4) continue;
      const key = decls.join(";");
      if (!blocks.has(key)) blocks.set(key, new Set());
      blocks.get(key)!.add(relative(web, file));
    }
  }
  return blocks;
}

const id = (key: string) => createHash("sha256").update(key).digest("hex").slice(0, 12);

test("no CSS rule block is copied into a second file (inherited copies listed, the list only shrinks)", () => {
  const allowed = new Set(readFileSync(join(repo, "tools", "css_duplicate_allowlist.txt"), "utf8").split("\n").map((l) => l.split(" ")[0]).filter((l) => /^[0-9a-f]{12}$/.test(l)));
  const dupes = [...cssBlocks()].filter(([, files]) => files.size > 1);
  const fresh = dupes.filter(([key]) => !allowed.has(id(key))).map(([key, files]) => `${id(key)} ${[...files].join(" | ")}: {${key.slice(0, 80)}…}`);
  assert.deepEqual(fresh, [], "a rule block is defined in two files: move it to design/system/components.css (or app.css) and use it from there");
  const gone = [...allowed].filter((h) => !dupes.some(([key]) => id(key) === h));
  assert.deepEqual(gone, [], "these allowlisted duplicates are gone: remove their lines from tools/css_duplicate_allowlist.txt");
});

test("the section head, the sortable header and the see-all link are styled once, in the design system", () => {
  for (const [key, files] of cssBlocks()) {
    if (/^align-items:baseline;display:flex;flex-wrap:wrap;gap:4px 12px;margin-bottom:10px$/.test(key)) assert.deepEqual([...files], ["styles/components.css"]);
  }
  const pageCss = walk(join(web, "app"), /\.css$/).map((f) => [relative(web, f), readFileSync(f, "utf8")] as const);
  for (const [file, css] of pageCss) {
    assert.ok(!/\.sec-head\s*\{/.test(css) && !/\.sec-head \.go\s*\{/.test(css), `${file} styles the section head again`);
    assert.ok(!/th \.sort\s*\{[^}]*all:\s*unset/.test(css), `${file} styles the sortable header again`);
  }
});

test("every React hook is defined in one module only", () => {
  const sources = ["app", "components", "lib"].flatMap((d) => walk(join(web, d), /\.tsx?$/)).filter((f) => !/[/\\]tests[/\\]/.test(f));
  const where = new Map<string, string[]>();
  for (const file of sources) {
    for (const m of readFileSync(file, "utf8").matchAll(/export (?:function|const) (use[A-Z]\w*)/g)) where.set(m[1], [...(where.get(m[1]) ?? []), relative(web, file)]);
  }
  const twice = [...where].filter(([, files]) => files.length > 1).map(([hook, files]) => `${hook}: ${files.join(", ")}`);
  assert.deepEqual(twice, []);
});
