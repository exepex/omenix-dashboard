// Today's card's top (story W3f; design/mockups/39-trade-card 2-top.js): the TEST note, the verdict (TRADE, NO TRADE,
// WATCH) with its glyph, word and reason, and the card's three times with the delivery. Every word comes from
// lib/fno-card/view.ts.
import type { FnoCard } from "../../lib/fno-card/contract.ts";
import { headerOf, timesOf } from "../../lib/fno-card/view.ts";
import { Icon } from "../ui/icon.tsx";
import { Fact, LookLabel } from "./card-bits.tsx";

export function CardVerdict({ c }: { c: FnoCard }) {
  const h = headerOf(c);
  return (
    <>
      {h.test ? <p className="mb-alert info test" role="note"><Icon name="info" /><span>{h.test}</span></p> : null}
      <section className={`mb-verdict ${h.verdict}`} aria-label="The card">
        <span className="mb-verdict-box" aria-hidden="true"><Icon name={h.icon} /></span>
        <div>
          <div className="mb-verdict-word">{h.status}<small>{h.detail}</small></div>
          <p className="why">{h.why}</p>
        </div>
      </section>
    </>
  );
}

export function CardTimes({ c }: { c: FnoCard }) {
  const { times, delivery } = timesOf(c);
  return (
    <div className="times" role="list" aria-label="The card’s times">
      {times.map((t) => <Fact key={t.k} k={t.k} v={t.v} note={t.note} />)}
      <div className="mb-fact"><span className="k">Delivery</span><b><LookLabel look={delivery} /></b><small>To #fno-desk on your phone</small></div>
    </div>
  );
}
