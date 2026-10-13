/* Overview: the price chart, the key numbers explained with small pictures, and results as a chart */
function overview(main, c, S) {
  main.append(c.el('div', {class: 'grid2'}, chartCard(c, S), keyNumbers(c, S)), c.el('div', {class: 'sec'}, resultsCard(c, S)));
}

/* "Key numbers, explained": where the stock stands today, each with a small visual. Not a forecast. */
function keyNumbers(c, S) {
  const {el} = c, St = S.stats, V = S.valuation, R = S.risk, pos = Math.round((S.quote.close - St.lo52) / (St.hi52 - St.lo52) * 100);
  const rsiWords = St.rsi == null ? '' : St.rsi < 30 ? 'fell fast lately (often read as oversold)' : St.rsi > 70 ? 'rose fast lately (often read as overbought)' : 'not stretched up or down';
  const maxVol = Math.max(R.vol || 0, R.bench_vol || 0), ratio = R.vol && R.bench_vol ? R.vol / R.bench_vol : null;
  /* coloured readings, each with a glyph and a word (never colour alone): descriptions of today, not verdicts */
  const posLvl = pos < 34 ? ['bad', '▼ near the year’s low'] : pos > 66 ? ['good', '▲ near the year’s high'] : ['mid', '● in the middle of the year’s range'];
  const rsiLvl = St.rsi == null ? null : St.rsi < 30 ? ['bad', '▼ fell fast'] : St.rsi > 70 ? ['bad', '▲ rose fast'] : ['good', '● normal range'];
  const volLvl = ratio == null ? null : ratio < 0.9 ? ['good', '▼ calmer than the market'] : ratio > 1.2 ? ['bad', '▲ more jumpy than the market'] : ['mid', '● about as jumpy as the market'];
  const lvl = L => L ? el('span', {class: 'lvl ' + L[0]}, L[1]) : null;
  return el('section', {class: 'card', 'aria-label': 'Key numbers, explained'}, head(c, 'Key numbers, explained'),
    el('p', {class: 'muted small', style: 'margin:-4px 0 12px'}, 'Where the stock stands today. Not a forecast.'),
    el('div', {class: 'kn'}, el('span', {class: 'k'}, '52-week range ', lvl(posLvl)),
      el('div', {class: 'mb-pos52 wide zones', role: 'img', 'aria-label': `${pos}% of the way from the 52-week low to the high`}, el('small', {}, fmt(St.lo52)), el('span', {class: 'track'}, el('i', {style: `left:${pos}%`})), el('small', {}, fmt(St.hi52))),
      el('small', {}, `Today ${fmt(S.quote.close)} is ${pos}% of the way from the year’s low to its high.`),
      el('small', {class: 'legend'}, 'Red part: near the year’s low. Green part: near its high. It shows where the price sits, not risk.')),
    el('div', {class: 'kn two'}, el('div', {}, el('span', {class: 'k'}, 'RSI 14 ', lvl(rsiLvl)), rsiDial(c, St.rsi), el('small', {}, el('b', {}, St.rsi == null ? '—' : fmt(St.rsi, 0)), ` of 100: ${rsiWords}.`), el('small', {class: 'legend'}, 'Green (30 to 70): a normal pace. Red: the price moved fast, down below 30 or up above 70; a fast move often slows or turns. Not a risk score.')),
      el('div', {}, el('span', {class: 'k'}, `Against ${S.chart.bench_name} `, lvl(volLvl)),
        el('div', {class: 'cmp'}, el('span', {}, 'Volatility, 1 year'), vbar(c, R.vol, maxVol, S.ticker, volLvl ? volLvl[0] : ''), vbar(c, R.bench_vol, maxVol, S.chart.bench_name, 'idx')),
        el('small', {}, R.beta == null ? '' : `Beta ${fmt(R.beta)}: when the index moves 1%, this stock has moved about ${fmt(R.beta, 1)}%.`),
        el('small', {class: 'legend'}, 'Volatility is how much the price swings in a year. Red: it swings more than the market, so bigger ups and downs (more risk). Green: it swings less (calmer).'))),
    el('div', {class: 'facts', style: 'margin-top:12px'},
      fact(c, 'P/E (ours)', V.pe == null ? '—' : fmt(V.pe, 1), V.pe == null ? 'not enough filed quarters' : `price is ${fmt(V.pe, 1)} times the last four quarters’ earnings (${cur(c, V.eps_ttm)} a share)`),
      fact(c, 'Daily swing', St.atr_pct == null ? '—' : `${fmt(St.atr_pct * 100, 1)}%`, 'its usual day’s range (ATR 14)'),
      fact(c, 'Average volume', fmt(St.vol_avg20, 0), 'shares a day, last 20 sessions'),
      S.corporate.delivery ? fact(c, 'Delivery', `${fmt(S.corporate.delivery.at(-1).pct, 0)}%`, `of shares traded on ${day(c, S.corporate.delivery.at(-1).date)} were taken for keeping`) : fact(c, 'Results', St.days_to_results == null ? '—' : `in ${St.days_to_results} days`, 'next quarterly results')));
}

/* a half dial from 0 to 100 with 30 and 70 marked, the needle at today's RSI */
function rsiDial(c, v) {
  const s = c.svgEl('svg', {viewBox: '0 0 120 68', class: 'dial', role: 'img', 'aria-label': v == null ? 'RSI not recorded' : `RSI ${fmt(v, 0)} on a scale of 0 to 100; 30 and 70 marked`});
  const pt = (val, r) => { const a = Math.PI * (1 - val / 100); return [60 + r * Math.cos(a), 62 - r * Math.sin(a)]; };
  const arc = (a, b, cls) => { const [x1, y1] = pt(a, 48), [x2, y2] = pt(b, 48); s.append(c.svgEl('path', {class: cls, d: `M${x1},${y1} A48,48 0 0 1 ${x2},${y2}`})); };
  arc(0, 30, 'hot'); arc(30, 70, 'calm'); arc(70, 100, 'hot');
  for (const m of [30, 70]) { const [x1, y1] = pt(m, 40), [x2, y2] = pt(m, 56); s.append(c.svgEl('line', {class: 'tick', x1, y1, x2, y2})); }
  if (v != null) { const [x, y] = pt(v, 42); s.append(c.svgEl('line', {class: 'needle', x1: 60, y1: 62, x2: x, y2: y}), c.svgEl('circle', {class: 'hub', cx: 60, cy: 62, r: 3.5})); }
  return s;
}
function vbar(c, v, max, label, tone) {
  return c.el('span', {class: 'vbar'}, c.el('small', {}, label), c.el('span', {class: 'track', role: 'img', 'aria-label': `${label}: ${fmt(v, 1)}% a year`}, c.el('i', {class: tone, style: `width:${(v / (max || 1) * 100).toFixed(1)}%`})), c.el('b', {}, `${fmt(v, 1)}%`));
}

/* Results: revenue and net profit as bars with the net margin as a line, by quarter or year, with growth */
function resultsCard(c, S) {
  const {el} = c, rows = RES === 'y' ? S.results.years : S.results.quarters, india = c.m === 'india';
  const label = r => RES === 'y' ? `FY to ${quarterOf(r.end)}` : quarterOf(r.end);
  return el('section', {class: 'card', 'aria-label': 'Results'}, head(c, 'Results', india ? 'consolidated, as filed with NSE' : 'as filed with the SEC (a fourth quarter is the year minus nine months)'),
    el('div', {class: 'acts', style: 'margin-bottom:8px'}, seg(c, 'Periods', [['q', 'Quarters'], ['y', 'Years']], RES, k => { RES = k; }),
      el('span', {class: 'small muted'}, el('i', {class: 'key rev'}), `Revenue (${LOC === 'en-IN' ? '₹ thousand crore' : '$ billion'})`, el('i', {class: 'key prof'}), 'Net profit', el('span', {class: 'rm key-m'}, '7.4%'), 'Net margin (profit per 100 of revenue)')),
    resultsChart(c, rows, label),
    el('details', {class: 'nums'}, el('summary', {class: 'small'}, 'All the numbers'), el('div', {class: 'scroll'}, el('table', {class: 'md-table stack'}, el('thead', {}, el('tr', {}, el('th', {}, RES === 'y' ? 'Year' : 'Quarter'), el('th', {class: 'num'}, 'Revenue'), el('th', {class: 'num'}, 'Growth y/y'),
      el('th', {class: 'num'}, 'Net profit'), el('th', {class: 'num'}, 'Growth y/y'), el('th', {class: 'num'}, 'Margin'), el('th', {class: 'num'}, 'Before tax'), el('th', {class: 'num'}, 'To owners'))),
      el('tbody', {}, ...rows.slice().reverse().map(r => el('tr', {}, el('td', {}, el('b', {}, label(r))), el('td', {class: 'num', 'data-k': 'Revenue'}, big(r.revenue)), el('td', {class: 'num', 'data-k': 'Revenue growth y/y'}, r.rev_yoy == null ? '—' : c.delta(r.rev_yoy)),
        el('td', {class: 'num', 'data-k': 'Net profit'}, big(r.profit)), el('td', {class: 'num', 'data-k': 'Profit growth y/y'}, r.profit_yoy == null ? '—' : c.delta(r.profit_yoy)), el('td', {class: 'num', 'data-k': 'Net margin'}, r.margin == null ? '—' : `${fmt(r.margin, 1)}%`),
        el('td', {class: 'num', 'data-k': 'Profit before tax'}, india ? big(r.pbt) : gap(c, 'Profit before tax')), el('td', {class: 'num', 'data-k': 'Profit to owners'}, india ? big(r.owners) : gap(c, 'Profit to owners')))))))),
    el('p', {class: 'small', style: 'margin:10px 0 0'}, 'Debt and cash flow: ', gap(c, 'Debt and cash flow'), ' · history: ', gap(c, 'A three-year history of results')),
    el('button', {class: 'md-btn outlined small', type: 'button', style: 'margin-top:10px', onclick: () => { TAB = 'results'; c.rerender(); }}, c.icon('bar_chart'), 'See the financials in detail'),
    el('p', {class: 'muted small', style: 'margin:4px 0 0'}, `The records hold ${S.results.quarters.length} quarters and ${S.results.years.length} years. Growth y/y compares with the same period a year earlier; “—” where that period is not recorded.`));
}

function resultsChart(c, rows, label) {   /* HTML bars so every number stays readable on a phone; values above the bars */
  const {el} = c, max = Math.max(...rows.map(r => Math.max(r.revenue || 0, Math.abs(r.profit || 0))), 1), h = v => `${(Math.abs(v || 0) / max * 100).toFixed(1)}%`;
  const short = v => v == null ? '—' : fmt(v / (LOC === 'en-IN' ? 1e10 : 1e9), 1);   /* ₹ thousand crore, or $ billion */
  return el('div', {class: 'rchart', role: 'img', 'aria-label': rows.map(r => `${label(r)}: revenue ${big(r.revenue)}, net profit ${big(r.profit)}, margin ${r.margin == null ? '—' : fmt(r.margin, 1) + '%'}`).join('; ')},
    ...rows.map(r => el('div', {class: 'rcol'}, el('div', {class: 'rv'}, el('b', {}, short(r.revenue)), el('small', {}, short(r.profit))),
      el('div', {class: 'rbars'}, el('span', {class: 'rb rev', style: `height:${h(r.revenue)}`}), el('span', {class: 'rb ' + ((r.profit || 0) < 0 ? 'loss' : 'prof'), style: `height:${h(r.profit)}`})),
      el('small', {class: 'rl'}, label(r).replace('FY to ', 'FY ').replace(' 20', " '")), el('span', {class: 'rm'}, r.margin == null ? '—' : `${fmt(r.margin, 1)}%`))));
}
