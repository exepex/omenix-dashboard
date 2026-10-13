/* The header: who, the price and how old it is, our tools' one-line reading, your position, Buy and Sell */
function header(main, c, S, it) {
  const {el} = c, q = S.quote, held = it.held, res = S.stats.days_to_results;
  const pnl = held ? ((q.check ? q.check.price : q.close) - held.avg) * held.qty : null;
  main.append(c.pagehead({crumbs: [['Research'], ['Stock page'], [S.ticker]], title: S.name,
    meta: [el('span', {class: 'md-chip'}, S.ticker), el('span', {class: 'md-chip'}, `${S.exchange} · ${S.sector}`), S.fno ? el('span', {class: 'mb-tag', 'data-tip': 'Has futures and options on NSE'}, 'F&O') : null,
      el('span', {class: 'mb-tag paper', 'data-tip': 'Followed by our tools'}, 'Ours')]}));
  main.append(el('section', {class: 'card head', 'aria-label': 'Price'},
    el('div', {}, el('div', {class: 'price'}, fmt(q.close), c.delta(q.chg_pct), el('span', {class: 'muted small'}, `close of ${day(c, q.date)}`)),
      quickLine(c, S),
      el('div', {class: 'chips'}, q.check ? el('span', {class: 'mb-asof', 'data-tip': 'The stock tool’s intraday price check: the price at that time, not live.'}, c.icon('schedule'), `Price check ${c.when(q.check.at)}: ${fmt(q.check.price)} `, c.delta(q.check.chg_pct)) : el('span', {class: 'mb-asof'}, c.icon('schedule'), 'No price check since the close'),
        res != null && res <= 14 ? el('span', {class: 'mb-label warn'}, c.icon('event'), `Results in ${res} day${res === 1 ? '' : 's'}`) : null,
        el('span', {class: 'small'}, held ? ['Your paper position: ', el('b', {}, `${fmt(held.qty, 0)} shares at ${fmt(held.avg)}`), ' · ', c.moneyDelta(pnl, 2)] : 'No paper position in your account'))),
    el('div', {class: 'acts', 'data-tip': c.tradeLock()}, el('button', {class: 'md-btn buy', type: 'button', disabled: !!c.tradeLock(), onclick: () => c.openOrder(S.ticker, 'buy')}, 'Buy'),
      el('button', {class: 'md-btn sell', type: 'button', disabled: !!c.tradeLock(), onclick: () => c.openOrder(S.ticker, 'sell')}, 'Sell'))));
}

/* Our tools' reading in one neutral line. It stays grey: the verdict colours wait until the evidence is proven
   (today the model gives every company about the same chance, so a coloured signal would mislead). */
function quickLine(c, S) {
  const h1 = S.tools.horizons[0], buy = S.families.reduce((n, f) => n + f.votes[0].buy, 0), of = S.families.reduce((n, f) => n + f.n, 0);
  const A = S.tools.ai_team, ai = A ? (A.decision_1d === 'abstain' ? 'no buy or sell today' : A.decision_1d || '—') : 'no view recorded';
  return c.el('p', {class: 'quick', 'data-tip': `For the next session (N+1, exit ${day(c, h1.target_date)}). Grey on purpose: nothing here is proven yet, so no green or red verdict is shown. “No buy or sell today”: the AI team looked at the stock and chose not to trade.`},
    c.icon('query_stats'), `Our tools today: ${buy} of ${of} strategies buy · model ${h1.prob == null ? '—' : fmt(h1.prob * 100, 0) + '%'} (not proven) · AI team: ${ai}`);
}
