/* The top: what the lab answers in one line and three steps, which state is shown, the asset tabs (stocks, F&O, and
   both together in India only, in rupees), and where things stand. */
function topPart(main, c) {
  const {el} = c, S = state(), assets = mk(c).assets;
  if (!assets.includes(ASSET)) ASSET = 'stocks';
  main.append(c.pagehead({crumbs: [['Strategies'], ['Strategy lab']], title: 'Strategy lab',
    meta: [c.paperTag(), S.kind === 'example' ? el('span', {class: 'mb-tag mock', 'data-tip': 'Made-up trades on future dates, to show every case; never real results.'}, 'Example') : el('span', {class: 'mb-tag live'}, 'Real today')]}));
  main.append(el('p', {class: 'lede'}, 'Which family of strategies makes money, and can it be trusted with real money? Rule-based, Hybrid and AI team trade on paper every day under the same rules. This page keeps score.'),
    el('div', {class: 'steps3'}, step3(c, 'receipt_long', 'Every trade is recorded', 'Each family buys and sells on paper with the same money per trade and the same market prices.'),
      step3(c, 'payments', 'Every charge is counted', 'Profit is after brokerage, taxes and exchange fees, exactly as a real account would pay.'),
      step3(c, 'verified_user', 'Proven before real money', 'A family must pass every check below, over months of trading, before it is trusted with real money.')),
    el('div', {class: 'acts', style: 'margin-top:14px'}, el('span', {class: 'small muted'}, 'Showing:'), seg(c, 'Showing', [[null, 'Today (real)'], ...Object.entries(EXAMPLES)], EX, k => { EX = k; FROM = TO = null; })),
    el('div', {class: 'md-segmented assets', role: 'tablist', 'aria-label': 'What was traded'}, ...assets.map(a => el('button', {type: 'button', role: 'tab', 'aria-selected': String(ASSET === a), 'aria-pressed': String(ASSET === a), onclick: () => { ASSET = a; c.rerender(); }},
      c.icon(a === 'fno' ? 'layers' : a === 'all' ? 'grid_view' : 'show_chart'), ASSETS[a]))),
    el('p', {class: 'small muted', style: 'margin:6px 0 0'}, ASSET === 'all' ? 'Stocks and F&O added together, India only, in rupees. Each part is shown on its own in its tab; their returns are never mixed.'
      : ASSET === 'fno' ? 'NIFTY and BANKNIFTY futures and options. Each family has its own ₹5 lakh paper account and may lose at most ₹10,000 on one trade.'
      : `Stocks${c.m === 'india' ? ' on NSE' : ' in the US'}: each trade uses ${plain(c, mk(c).per_trade)}. Baselines are simple rules (such as “always buy”) that every family must beat.`));
  main.append(statusBand(c, S));
}
function step3(c, icon, title, text) { return c.el('div', {class: 'step3'}, c.el('span', {class: 'mb-avatar sm info'}, c.icon(icon)), c.el('div', {}, c.el('b', {}, title), c.el('small', {}, text))); }

/* where things stand: since when, how many trades, and for the real state what is still missing */
function statusBand(c, S) {
  const {el} = c, trading = families().filter(f => tradesOf(c, f).length), all = families().flatMap(f => tradesOf(c, f)), base = ASSET !== 'fno' ? tradesOf(c, 'baseline', 'stocks') : [];
  if (S.kind === 'real') {
    const fno = ASSET === 'fno' || ASSET === 'all';
    return el('section', {class: 'card sec', 'aria-label': 'Where things stand'}, head(c, 'Where things stand', `real records up to ${dlabel(S.as_of)}`),
      el('div', {class: 'firsts'}, el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Stock trades settled'), el('b', {}, String(all.length + base.length)),
          el('small', {}, base.length ? `${base.length} from the baselines, the first on ${dlabel(S.as_of)}; no family trade has settled yet` : 'none yet in this market')),
        el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'F&O trades'), el('b', {}, c.m === 'india' ? 'Not started' : 'India only'), el('small', {}, c.m === 'india' ? 'paper trading starts with build slice 3' : 'there is no US F&O')),
        el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First real verdict'), el('b', {}, 'Months away'), el('small', {}, 'stocks need 2 months and about 300 trades; F&O six months'))),
      fno && c.m === 'india' ? el('p', {class: 'small', style: 'margin:10px 0 0'}, S.fno_reason) : null,
      howto(c, 'Every block below shows only real trades. Where there are none yet it says so; the real app never fills a block with example numbers. Pick an Example above to see a full picture.'));
  }
  return el('section', {class: 'card sec status', 'aria-label': 'Where things stand'}, el('div', {class: 'firsts four'},
    el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Trading since'), el('b', {}, dayText(1)), el('small', {}, `${S.days} trading days, to ${dayText(S.days)}`)),
    el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Trades closed'), el('b', {}, all.length.toLocaleString('en-IN')), el('small', {}, `by the three families${base.length ? `, plus ${base.length} by the baselines` : ''}`)),
    el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Made money'), el('b', {}, `${trading.filter(f => stats(tradesOf(c, f)).net > 0).length} of ${trading.length} families`), el('small', {}, `after every charge, since the start${trading.length < 3 ? ' (of those trading)' : ''}`)),
    el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Ready for real money'), el('b', {}, `${trading.filter(f => readyState(c, f) === 'ready').length} of ${trading.length} families`), el('small', {}, 'passed every check below'))));
}
