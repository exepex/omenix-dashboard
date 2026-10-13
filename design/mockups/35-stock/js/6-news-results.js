/* News: the latest stories with how far each is confirmed */
function news(main, c, S) {
  const {el} = c;
  main.append(el('section', {class: 'card', 'aria-label': 'News'}, head(c, 'News', `the ${S.news.length} latest stories of the last 30 days, with how far each is confirmed`),
    el('ul', {class: 'list'}, ...S.news.map(n => { const [word, tone] = STATUS[n.status] || [n.status, 'neutral'];
      return el('li', {}, el('b', {}, n.title), el('span', {class: 'm'}, el('span', {class: 'mb-label ' + tone}, word), `${n.outlets.join(', ')}${n.n > 1 ? ` · ${n.n} items` : ''} · ${c.when(n.last)}`),
        ...n.claims.map(k => el('span', {class: 'm'}, c.icon('info'), `${k.claim_type}: ${k.subject} ${k.predicate}`))); }))));
}

/* Results and filings: the next results, past surprises, and what the exchange or the SEC shows */
function results(main, c, S) {
  const {el} = c, K = S.corporate, india = c.m === 'india', R = K.results, next = R.find(r => r.reported == null);
  const past = R.filter(r => r.reported != null).reverse();
  const res = el('section', {class: 'card', 'aria-label': 'Results'}, head(c, 'Results', next ? `next on ${day(c, next.date)}, expected ${cur(c, next.estimate)} a share` : ''),
    el('ul', {class: 'list'}, ...past.map(r => el('li', {style: 'grid-template-columns:minmax(0,1fr) auto;display:grid'}, el('span', {}, el('b', {}, day(c, r.date)), el('small', {class: 'muted', style: 'display:block'}, `expected ${cur(c, r.estimate)}, reported ${cur(c, r.reported)}`)),
      el('span', {class: 'mb-label ' + (r.surprise_pct >= 0 ? 'success' : 'danger')}, c.icon(r.surprise_pct >= 0 ? 'arrow_upward' : 'arrow_downward'), `${r.surprise_pct >= 0 ? 'Beat' : 'Missed'} by ${fmt(Math.abs(r.surprise_pct), 1)}%`)))),
    el('p', {class: 'muted small', style: 'margin:8px 0 0'}, 'Estimates and reported earnings per share as Yahoo Finance records them (the stock tool’s copy).'));
  const rows = india
    ? [['Promoter pledge', K.pledge ? `${fmt(K.pledge.pledged_pct_of_promoter, 1)}% of promoter shares pledged` : '—', K.pledge ? `promoters hold ${fmt(K.pledge.sdd_promoter_pct, 1)}%, quarter to ${day(c, K.pledge.period_end)} (NSE)` : ''],
       ...K.deals.map(d => [`Block deal, ${day(c, d.date)}`, `${d.side === 'buy' ? 'Bought' : 'Sold'} ${fmt(d.shares, 0)} shares at ${fmt(d.price)}`, d.client]),
       ...K.announcements.map(a => [`Announcement, ${c.when(a.published_at)}`, a.category, a.subject]),
       ['Delivery, last sessions', K.delivery.slice(-5).map(d => `${fmt(d.pct, 0)}%`).join(' · '), 'share of traded shares taken for keeping (NSE)']]
    : [...K.insiders.map(i => [`Insider filing, ${day(c, i.filing_date)}`, `${i.insider_name} (${i.role})`, `${fmt(i.shares, 0)} shares, Form 4 (details in the filing)`]),
       ...K.short.slice(-1).map(s => ['Short interest', `${fmt(s.short_interest / 1e6, 1)} million shares (${c.sgn(s.change_pct)})`, `${fmt(s.days_to_cover, 1)} days of usual volume to cover, as of ${day(c, s.settlement_date)} (FINRA)`]),
       ...K.holders.map(h => [`Holder, 13F to ${day(c, h.period)}`, h.name, `${fmt(h.shares / 1e6, 0)} million shares, ${big(h.value_usd)}`])];
  const filings = el('section', {class: 'card', 'aria-label': 'Filings'}, head(c, india ? 'From the exchange' : 'From the SEC and FINRA', 'as the stock tool records them'),
    el('ul', {class: 'list'}, ...rows.map(([k, v, s]) => el('li', {}, el('span', {class: 'm'}, k), el('b', {}, v), s ? el('small', {class: 'muted'}, s) : null))));
  main.append(financials(c, S), el('div', {class: 'grid2 even sec'}, res, filings));
}
