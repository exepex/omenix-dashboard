// Owner's engineering standard (CLAUDE.md, Code): no file over 350 lines; break it down instead of squeezing it.
// Scans tracked code files. Inherited files over the limit are listed in code_size_allowlist.txt with their size at
// listing time; they may shrink, never grow, and leave the list once under the limit. Exit 1 on any breach.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const LIMIT = 350;
const CODE = /\.(ts|tsx|js|mjs|cjs|py)$/;
const EXEMPT = [/\/vendor\//, /\.generated\.ts$/, /(^|\/)node_modules\//];
const ALLOWLIST = new URL("./code_size_allowlist.txt", import.meta.url);

function allowlist() {
  const entries = new Map();
  for (const line of readFileSync(ALLOWLIST, "utf8").split("\n")) {
    const text = line.trim();
    if (!text || text.startsWith("#")) continue;
    const [size, path] = [text.slice(0, text.indexOf(" ")), text.slice(text.indexOf(" ") + 1)];
    entries.set(path, Number(size));
  }
  return entries;
}

function lineCount(path) {
  const text = readFileSync(path, "utf8");
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n");
const allowed = allowlist();
const problems = [];
for (const path of tracked.filter((p) => CODE.test(p) && !EXEMPT.some((r) => r.test(p)))) {
  const lines = lineCount(path);
  const ceiling = allowed.get(path);
  if (ceiling !== undefined && lines <= LIMIT) problems.push(`${path}: now ${lines} lines, remove it from the allowlist`);
  else if (ceiling !== undefined && lines > ceiling) problems.push(`${path}: ${lines} lines, grew past its listed ${ceiling}`);
  else if (ceiling === undefined && lines > LIMIT) problems.push(`${path}: ${lines} lines, over ${LIMIT}: break it down`);
}
for (const path of allowed.keys()) if (!tracked.includes(path)) problems.push(`${path}: listed but not tracked`);
console.log(problems.length ? problems.join("\n") : `code size: every file within ${LIMIT} lines or its listed size`);
process.exit(problems.length ? 1 : 0);
