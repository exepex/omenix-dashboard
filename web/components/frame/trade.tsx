"use client";
// The only manual Buy and Sell controls of the frame (story W8 AC4): search results, picks, hover card and quick view
// all render these, so one rule decides them. Buy is always green and Sell always red, with the word (or B / S and
// its label); while the market is closed they are disabled, faded, with the lock's reason (lib/shell/market.ts).
// Pressing one opens the order window's preview; nothing here submits an order.
import { tradable } from "../../lib/shell/market.ts";
import type { Side } from "../../lib/shell/order.ts";
import { useFrame } from "./frame-context.tsx";

const WORD: Record<Side, string> = { buy: "Buy", sell: "Sell" };

/** One Buy or Sell: "small" is a labelled button, "letter" the compact B / S of a result row. */
export function TradeButton({ id, side, variant = "small", before }: { id: string; side: Side; variant?: "small" | "letter"; before?: () => void }) {
  const { item, lock, openOrder } = useFrame();
  const it = item(id);
  if (!it || !tradable(it.kind)) return null;
  const label = `${WORD[side]} ${it.sym}`;
  return (
    <button
      className={variant === "letter" ? `mb-bs ${side}` : `md-btn small ${side}`}
      type="button"
      disabled={lock !== null}
      data-trade={side}
      aria-label={lock ? `${label}: ${lock}` : label}
      data-tip={variant === "letter" ? lock ?? WORD[side] : undefined}
      onClick={(e) => {
        e.stopPropagation();
        before?.();
        openOrder(id, side);
      }}
    >
      {variant === "letter" ? WORD[side][0] : WORD[side]}
    </button>
  );
}

/** Buy and Sell side by side; the wrapper carries the lock's reason as its tooltip (a disabled button takes no hover). */
export function TradePair({ id, variant = "small", className, before }: { id: string; variant?: "small" | "letter"; className?: string; before?: () => void }) {
  const { lock } = useFrame();
  return (
    <span className={className ?? "mb-bs-pair"} data-tip={lock ?? undefined} data-lock={lock ? "closed" : undefined}>
      <TradeButton id={id} side="buy" variant={variant} before={before} />
      <TradeButton id={id} side="sell" variant={variant} before={before} />
    </span>
  );
}
