# 38 Strategy lab: why it looks like this

- **The owner's end goal first: can I trust it with real money?** The readiness checklist opens the page. Each check
  is a plain sentence with the family's own number beside what is needed, and the bar is each backend's own written
  rule, so nothing is invented by the screen.
- **Like a broker's profit page, in two depths.** Simple cards for a first-time investor (profit after charges, a
  won/lost bar, average win and loss, a running line); a detailed view for a professional (profit factor, per trade,
  worst fall, best and worst trade). Groww- and Zerodha-style: one headline number, colour plus sign plus word.
- **Always against something.** Stocks against the baselines (simple rules such as "always buy"); F&O against holding
  NIFTY with the same money. A profit means little without the alternative.
- **Since the start, then any period.** The top blocks never change with the period; the period block (presets or
  dates) changes its table and chart together, so "who is winning lately" never hides "who is winning overall".
- **Month by month** because a trustworthy family has more green months than red and small red ones; a single number
  hides a bad stretch.
- **Why, from outcomes.** Win rate against the size of wins and losses, what moved the trades (market, sector, news, the
  stock alone), calm against stormy, the best and worst trade as sentences. Never how a family decides.
- **Every case visible:** ready, nearly ready, losing, break-even, not running, no trade yet (real), all labelled.
- **Stocks and F&O as tabs**, the same layout twice, so the user compares like with like; in India one total line per family adds both books (owner's choice (a)), never a combined ranking.
- Reused design-system parts only: `.mb-pagehead`, `.mb-ap`, `.mb-mark`, `.mb-label`, `.mb-fact`, `.md-segmented`,
  `.md-table`, `.quiet`, `svg.plot` with chart tokens.
