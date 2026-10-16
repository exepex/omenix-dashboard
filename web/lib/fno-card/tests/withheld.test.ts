// Contract 2.12.0 (owner, 16 Oct 2026, "hold the card only, and say so on screen"): when today's card is held back, the
// page carries the previous session's card, under a red notice with both dates, and the screen's own words never call
// it today's. A card on record that is not from an earlier session is a contract error: only the notice is shown.
import assert from "node:assert/strict";
import { test } from "node:test";
import { cardExample } from "../fixture-source.ts";
import { headerOf, heldBackOf, PREVIOUS_CARD } from "../view.ts";

const held = cardExample("getFnoCard_india_withheld");
const normal = cardExample("getFnoCard_india_trade");

test("a held-back day: the owner's sentence, today's date, and the card below dated as the previous session's", () => {
  assert.deepEqual(heldBackOf(held), {
    reason: "Today's card was held back: a risk rule was broken",
    rest: " (Mon 16 Nov 2026). Below is the card of Fri 13 Nov 2026, not today’s.",
    showCard: true,
  });
});

test("its verdict line says the previous session's card and dates the card's own reason, never 'today' as its own", () => {
  const h = headerOf(held);
  assert.ok(h.detail.startsWith(`${PREVIOUS_CARD} · Fri 13 Nov 2026 · `), h.detail);
  assert.ok(!/A paper trade today|Nothing to do today/.test(h.detail));
  assert.equal(h.why, "On Fri 13 Nov 2026: No new trade today: the weather is RED");
});

test("a normal day has no notice and its usual words", () => {
  assert.equal(heldBackOf(normal), null);
  assert.ok(headerOf(normal).detail.startsWith("A paper trade today · "));
  assert.equal(headerOf(normal).why, normal.reason_text);
});

test("a card on record that is not earlier than the held-back session is never shown as today's", () => {
  for (const session of ["2026-11-16", "2026-11-17"]) {
    const h = heldBackOf({ ...held, session });
    assert.equal(h?.showCard, false, session);
    assert.match(h!.rest, /The card on record is not from an earlier session, so it is not shown\.$/);
  }
});
