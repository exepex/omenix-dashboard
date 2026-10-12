# 31-dashboard (Home): rationale

Mockup order item 2 of `design/PLATFORM_DESIGN.md` section 9 (screen 1: the home page after login). Supersedes the
layout of `01-home` (kept unchanged for the web tests). Status: **third round, for the owner's review** (13 Oct 2026).

Files: `data.json` (composed from the application's own example records: notes.md), `template.html`, `build.py`,
`page.html`, `notes.md` (the data contract). Screenshots: `shot-<width>-full` at 390, 768, 1024, 1280 and 1680 px,
the same for `shot-dark-*` and `shot-us-*`; states `shot-trades-ai-*` (open trades, AI tab), `shot-pick-order-*`
(Buy from a pick, India), `shot-us-pick-order-*` (US). `check_page.js` and `check_text.js` (twelve widths, India,
US, dark): 0 findings.

## Questions the page answers, in the order a user asks them
1. **How am I doing, what is the best move, what needs me?** "Today at a glance": your paper account's open profit,
   the top pick with its Yes/No after costs and a Buy button, and how many items need you.
2. **What is the market doing?** The market band at the top: NIFTY 50 and India VIX (S&P 500 ETF and VIX in the US)
   with the day and 5-day change, the session ("event-heavy", closed, today's close arrives with the 17:45 IST run),
   and how the tracked companies moved. The top bar's index strip is hidden here, so nothing repeats.
3. **What could I buy now, and how good is it really?** Today's buy picks (left panel on desktops; on tablets and
   phones in the page): who picked it, how many of 15 strategies agree, the model's chance, Yes/No after costs, the
   picking strategy's record on that stock, Buy and Sell.
4. **Who trades for me, and how is each doing?** One card per trader: You, Rule strategies, AI traders, Baselines
   (yardsticks) and, in India, the F&O books, each with its own lines (never added together).
5. **What is open?** Your trades first, then each family's trades grouped per stock ("3 trades: Model + news ·
   N+4, N+5 · exits Wed 7 Oct (today), Thu 8 Oct · +₹3,024.00 each trade"), with B and S; tabs by who opened them.
6. **What needs me today?** Trades exiting today, today's close not in yet, a major event today, promotional or
   rumour news on a stock I follow.
7. **What is coming?** The event calendar (results, RBI, holidays, F&O expiry) and the news with how far each story is
   confirmed.

## Self-review (owner's question: "is it the best design you could make?")
Honest answer: better, not best. Open weaknesses, in the order I would fix them:
- No chart of the owner's own account over time (a broker's home usually has one); it needs a daily value history
  of the Manual account, which no backend publishes yet.
- The phone page is still long (all seven sections); a phone may want sections 4-7 folded by default.
- "Who trades" carries descriptions that a returning user does not need every day; they could move into the "?"
  help after the first visit.
- With today's real data the page is thin (2 picks, 3 tracked companies); it is designed to page and scale, but the
  owner sees the sparse truth.

## Fourth round (13 Oct 2026, owner)
"Who trades" is now one card per approach, matching the owner's three-way comparison: You; Rule-based (stocks and F&O
Book 1); AI-based (stocks and F&O Book 3); Hybrid (stocks: planned, empty state for now; F&O Book 2); Baselines as the
comparison line. Each line stays its own account or scoreboard. The market line says open or closed and when that
changes; Buy (green) and Sell (red) are locked while closed. Strategy names never name the AI model.

## Fifth round (13 Oct 2026, owner): three approaches, the AI team, the gallery
- The three approaches carry the owner's exact meanings and order: Rule-based (no AI), Hybrid (the AI team within the
  rules), AI team (fully autonomous, agents with roles). The earlier model-versus-model AI strategies are shown as
  "AI team"; no AI model is named anywhere. Hybrid applies to stocks too (empty state until it exists).
- The US paper account starts at $5,000 (owner).
- Every function of Home has its own picture: `gallery.html` (46 states, desktop and phone), made by
  `design/system/shoot_states.js` from `states.json` and `design/mockups/_platform/gallery.py`.

## Supersedes
`01-home`'s layout (01-home/rationale.md says so).
