// The import graph of the web app, for the structure tests (story W8 AC5). One resolver for every import form: the
// "@/" alias of tsconfig (the web root), relative paths, with or without an extension, and directory index files all
// resolve to one canonical module name (web-relative, no extension, no "/index"). Bare package names stay as written.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

export const web = join(import.meta.dirname, "..", "..", "..");
export type Source = { path: string; text: string };

const CODE = /\.(ts|tsx|mjs)$/;
const SKIP = new Set(["node_modules", ".next"]);

/** Every code file under a web-relative directory (or one file). */
export function sources(dir: string): Source[] {
  const abs = join(web, dir);
  if (!existsSync(abs)) return [];
  if (!statSync(abs).isDirectory()) return CODE.test(dir) ? [{ path: dir, text: readFileSync(abs, "utf8") }] : [];
  return readdirSync(abs).filter((n) => !SKIP.has(n)).flatMap((n) => sources(join(dir, n)));
}

const withoutComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

/** The specifiers a file imports: static imports, re-exports, dynamic imports and requires. */
export function specifiers(text: string): string[] {
  const re = /(?:import|export)\s[^'";]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)/g;
  return [...withoutComments(text).matchAll(re)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4]);
}

/** A web-relative path in canonical form: no extension, no trailing "/index". */
export const canonical = (path: string) => normalize(path).replace(/\.(tsx?|mjs|js|json)$/, "").replace(/\/index$/, "");

/** The module a specifier names, seen from `from` (a web-relative file path). */
export function resolve(spec: string, from: string): string {
  if (spec.startsWith("@/")) return canonical(spec.slice(2));
  if (spec.startsWith("./") || spec.startsWith("../")) return canonical(join(dirname(from), spec));
  return spec;
}

export const importsOf = (file: Source): string[] => specifiers(file.text).map((s) => resolve(s, file.path));

/** Every module reachable from `start` through the files of `all` (local modules are followed, packages listed). */
export function reachable(start: Source[], all: Source[]): Set<string> {
  const byModule = new Map(all.map((f) => [canonical(f.path), f]));
  const seen = new Set<string>();
  const queue = start.map((f) => canonical(f.path));
  while (queue.length) {
    const mod = queue.pop() as string;
    if (seen.has(mod)) continue;
    seen.add(mod);
    const file = byModule.get(mod);
    if (file) queue.push(...importsOf(file));
  }
  return seen;
}
