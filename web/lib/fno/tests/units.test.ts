// Story W2: the F&O read path's pure parts: the pinned roots, the settings, the error classes, the contract version and
// the session calendar (freshness has its own file).
import assert from "node:assert/strict";
import { X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { outcomeOf } from "../../ui/block-outcome.ts";
import { BlockEmpty, BlockIncompatible } from "../../ui/block-states.ts";
import { NoExample } from "../../ui/no-example.ts";
import { AZURE_POSTGRES_ROOTS, AZURE_ROOT_FINGERPRINTS } from "../azure-roots.ts";
import { CalendarUnknown, EXCEPTIONS, nseCalendar, sessionBefore } from "../calendar.ts";
import { FnoConfigError, fnoDbSettings } from "../config.ts";
import { failureOf } from "../db.ts";
import { CONTRACT_MAJOR, checkContractVersion } from "../version.ts";

const repo = join(import.meta.dirname, "..", "..", "..", "..");

test("the pinned roots are exactly the three Azure roots, by SHA-256 of each certificate", () => {
  const pems = AZURE_POSTGRES_ROOTS.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? [];
  const prints = pems.map((p) => new X509Certificate(p).fingerprint256.replaceAll(":", "").toLowerCase());
  assert.deepEqual(prints, [...AZURE_ROOT_FINGERPRINTS]);
  for (const p of pems) assert.ok(new X509Certificate(p).ca, "each is a CA certificate");
});

test("no setting means fixtures; all four mean the database; some is an error naming the missing ones", () => {
  assert.equal(fnoDbSettings({}), null);
  assert.equal(fnoDbSettings({ OMENIX_FNO_PG_HOST: "  " }), null);
  const all = { OMENIX_FNO_PG_HOST: "h", OMENIX_FNO_PG_DATABASE: "d", OMENIX_FNO_PG_USER: "u", OMENIX_FNO_PG_PASSWORD: "p" };
  const s = fnoDbSettings(all);
  assert.equal(s?.port, 5432);
  assert.equal(s?.ca, AZURE_POSTGRES_ROOTS);
  assert.equal(fnoDbSettings({ ...all, OMENIX_FNO_PG_PORT: "6432" })?.port, 6432);
  assert.throws(() => fnoDbSettings({ OMENIX_FNO_PG_HOST: "h", OMENIX_FNO_PG_PASSWORD: "secret-value" }), (e: Error) =>
    e instanceof FnoConfigError && /OMENIX_FNO_PG_DATABASE, OMENIX_FNO_PG_USER/.test(e.message) && !e.message.includes("secret-value"));
});

test("a driver error's class comes from its codes, never its text", () => {
  const cases: [Record<string, unknown>, string][] = [
    [{ code: "28P01", message: 'password authentication failed for user "dashboard_app"' }, "authentication"],
    [{ code: "28000" }, "authentication"],
    [{ code: "42501" }, "permission"],
    [{ code: "42P01" }, "missing_table"],
    [{ code: "3F000" }, "missing_table"],
    [{ code: "SELF_SIGNED_CERT_IN_CHAIN" }, "tls"],
    [{ code: "UNABLE_TO_VERIFY_LEAF_SIGNATURE" }, "tls"],
    [{ code: "ERR_TLS_CERT_ALTNAME_INVALID" }, "tls"],
    [{ code: "ECONNREFUSED" }, "network"],
    [{ code: "ENOTFOUND" }, "network"],
    [{ message: "timeout expired" }, "network"],
    [{ message: "permission denied for table x" }, "other"],
    [{}, "other"],
  ];
  for (const [error, want] of cases) assert.equal(failureOf(error), want, JSON.stringify(error));
  assert.equal(failureOf(null), "other");
});

test("only the app's contract major version is read", () => {
  const openapi = readFileSync(join(repo, "api/openapi.yaml"), "utf8");
  assert.equal(Number(/^ {2}version: (\d+)\./m.exec(openapi)?.[1]), CONTRACT_MAJOR, "the app's major is the contract's");
  for (const v of ["2.4.0", "2.0.0", "2.99.1"]) assert.doesNotThrow(() => checkContractVersion(v));
  for (const v of ["3.0.0", "1.9.0", "", null, "two"]) assert.throws(() => checkContractVersion(v), BlockIncompatible);
  assert.throws(() => checkContractVersion("3.0.0"), /data is version 3\.0\.0; this app reads version 2\.x/);
});

test("the calendar's exceptions are the repository's NSE session file for the covered years", () => {
  const csv = readFileSync(join(repo, "design/mockups/_platform/nse_sessions.csv"), "utf8").trim().split("\n").slice(1);
  const years = new Set(EXCEPTIONS.map(([d]) => d.slice(0, 4)));
  const rows = csv.map((l) => l.split(",").slice(0, 2)).filter(([d]) => years.has(d.slice(0, 4)));
  assert.deepEqual(EXCEPTIONS.map((r) => [...r]), rows);
  assert.ok(years.has("2026"));
});

test("sessions: weekends, holidays, special and muhurat sessions; unknown years are never guessed", () => {
  assert.equal(nseCalendar.isSession("2026-10-12"), true); // Monday
  assert.equal(nseCalendar.isSession("2026-10-10"), false); // Saturday
  assert.equal(nseCalendar.isSession("2026-10-20"), false); // Dussehra
  assert.equal(nseCalendar.isSession("2026-11-08"), true); // muhurat, a Sunday
  assert.equal(nseCalendar.isSession("2026-02-01"), true); // budget Sunday
  assert.equal(sessionBefore("2026-10-13", nseCalendar), "2026-10-12");
  assert.equal(sessionBefore("2026-10-12", nseCalendar), "2026-10-09");
  assert.equal(sessionBefore("2026-10-21", nseCalendar), "2026-10-19");
  assert.throws(() => nseCalendar.isSession("2027-01-04"), CalendarUnknown);
});

test("a part's state never repeats an error's message", () => {
  const raw = Object.assign(new Error('password authentication failed for user "dashboard_app" at db.example:5432'), { code: "28P01" });
  const o = outcomeOf("The results", raw);
  assert.equal(o.kind, "error");
  assert.doesNotMatch(`${o.title} ${o.detail} ${o.log}`, /password|dashboard_app|db\.example|5432/);
  assert.equal(outcomeOf("The results", new BlockEmpty("no_producer", "2026-10-13T04:00:00.000Z")).detail, "No backend publishes this part yet. Checked 2026-10-13 04:00 UTC.");
  assert.equal(outcomeOf("The results", new BlockIncompatible("3.0.0", 2)).kind, "incompatible");
  assert.equal(outcomeOf("The results", new NoExample("x")).kind, "empty");
});
