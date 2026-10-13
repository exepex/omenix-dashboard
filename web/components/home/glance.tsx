"use client";
// Home sections 1 and 2 (story W9; 31 notes.md rows 1-2): "today at a glance" (your paper account's open profit, the
// top pick with Yes or No after costs and its Buy, how many items need you) and the market band (the session line,
// the indices, how the tracked companies moved). The top bar's index strip is hidden on Home, so nothing repeats.
import { asOf, clockTime } from "../../lib/shell/clock.ts";
import type { Accounts, Session, TrackedMoves } from "../../lib/home/contract.ts";
import { signed } from "../../lib/ui/format.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "../frame/frame-context.tsx";
import { Delta, Tk } from "../frame/parts.tsx";
import { TradeButton } from "../frame/trade.tsx";
import { src } from "../../lib/home/sources.ts";
import { Money, MoneyDelta, SectionHead } from "./section-head.tsx";

const REGIME: Record<string, string> = { EVENT_HEAVY: "Event-heavy session", TRENDING: "Trending market", CALM: "Calm market" };

function TopPick() {
  const { shell, lock } = useFrame();
  const best = shell.signals[0];
  if (!best) {
    return (
      <div>
        <span className="mb-avatar neutral"><Icon name="bolt" /></span>
        <span className="l">Top pick</span>
        <span className="v">No pick today</span>
      </div>
    );
  }
  const yes = best.exp_gain_pct > 0;
  return (
    <div>
      <span className={`mb-avatar ${yes ? "success" : "danger"}`}><Icon name="bolt" /></span>
      <span className="l">{`Top pick · ${best.agree.buy} of ${best.agree.of} strategies buy`}</span>
      <span className="v">
        <Tk id={best.id} />
        <span className={`mb-label ${yes ? "success" : "danger"}`}>
          <Icon name={yes ? "check" : "close"} />
          {`${yes ? "Yes" : "No"}: ${signed(best.exp_gain_pct)} after costs`}
        </span>
        <span data-tip={lock ?? undefined}>
          <TradeButton id={best.id} side="buy" />
        </span>
      </span>
    </div>
  );
}

export function Glance({ accounts, needs }: { accounts: Accounts; needs: number }) {
  const { fmt } = useFrame();
  const mine = accounts.accounts.manual;
  return (
    <div className="mb-glance top" role="region" aria-label="Today at a glance">
      <div>
        <span className="mb-avatar paper"><Icon name="account_circle" /></span>
        <span className="l">Your paper account · open profit</span>
        <span className="v">
          <MoneyDelta value={mine.open_profit} src={src("accounts", "accounts.manual.open_profit")} />
          <span className="muted glance-note">value <Money value={mine.value} src={src("accounts", "accounts.manual.value")} /></span>
        </span>
      </div>
      <TopPick />
      <div>
        <span className="mb-avatar warn"><Icon name="notifications_active" /></span>
        <span className="l">Needs you</span>
        <span className="v">
          {`${needs} item${needs === 1 ? "" : "s"}`}
          <a className="md-btn small outlined" href="#needs" onClick={(e) => { e.preventDefault(); document.getElementById("needs")?.scrollIntoView({ behavior: "smooth" }); }}>See</a>
        </span>
      </div>
    </div>
  );
}

export function MarketBand({ session, moves }: { session: Session; moves: TrackedMoves }) {
  const { data, shell, status, fmt, openDrawer } = useFrame();
  const regime = REGIME[session.regime] ?? session.regime;
  const state = status.open ? `open, ${status.text}; prices are the last close until the next price check` : `closed, ${status.text}; today’s close arrives with the ${clockTime(session.post_close_at, shell)} run`;
  const rose = moves.companies.filter((c) => c.chg_pct > 0).length;
  return (
    <section className="sec" aria-label="Market">
      <SectionHead title="Market" sub={`${shell.exchange} · ${regime} · ${state}`} go={["Markets", "markets"]} />
      <div className="mb-mband">
        {shell.indices.map((id) => {
          const it = shell.items[id];
          const a = asOf(it, data);
          return (
            <a key={id} href="#" data-tip={a.tip} onClick={(e) => { e.preventDefault(); openDrawer({ kind: "quick", id }); }}>
              <div className="n">{it.sym}</div>
              <div className="v">{fmt.price(it.last)} <Delta value={it.chg_pct} /></div>
              <small className="muted">{`5 days ${signed(it.chg_5d_pct ?? null)} · ${a.short}`}</small>
            </a>
          );
        })}
        {moves.companies.length ? (
          <div className="brd">
            <div className="n">The stock tool’s companies</div>
            <span className="mv">
              {moves.companies.map((c) => (
                <span key={c.id}>
                  {shell.items[c.id] ? <Tk id={c.id} /> : c.sym} <Delta value={c.chg_pct} />
                </span>
              ))}
            </span>
            <span>{`${rose} of ${moves.companies.length} tracked companies rose on the last close`}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
