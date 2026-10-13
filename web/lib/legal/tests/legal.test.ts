// The legal pages (lib/legal/legal.ts): both pages served whole with the logo, the contact filled or left out, headers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LEGAL_HEADERS, contactHtml, legalHtml, legalResponse } from "../legal.ts";

test("each page is served as static HTML with a strict CSP and the logo, linking to the other page", async () => {
  for (const [page, title, other] of [["privacy", "Privacy policy", "/terms"], ["terms", "Terms of service", "/privacy"]] as const) {
    const response = legalResponse(page);
    assert.equal(response.status, 200);
    for (const [name, value] of Object.entries(LEGAL_HEADERS)) assert.equal(response.headers.get(name), value);
    const html = await response.text();
    assert.match(html, new RegExp(`<h1>${title}</h1>`));
    assert.match(html, /<symbol id="mb-logo"/);
    assert.ok(html.includes(`href="${other}"`), `${page} links to ${other}`);
    assert.ok(!html.includes("<script"), `${page}: no script`);
    assert.ok(!html.includes("@@CONTACT@@"), `${page}: no marker left`);
  }
});

test("the contact is a mailto link only for a plain e-mail address", () => {
  assert.equal(contactHtml("owner@example.com"), '<a href="mailto:owner@example.com">owner@example.com</a>, ');
  for (const bad of [undefined, "", "  ", "not-an-address", "a@b", "x@y.com<script>", "a b@c.d"]) assert.equal(contactHtml(bad), "", String(bad));
  assert.match(legalHtml("privacy", "owner@example.com"), /write to <a href="mailto:owner@example.com">owner@example.com<\/a>, the developer contact/);
  assert.match(legalHtml("terms", undefined), /write to the developer contact/);
});

test("the Google user data section states the Limited Use commitment", () => {
  assert.match(legalHtml("privacy", undefined), /Google API Services User Data Policy, including the Limited Use requirements/);
});
