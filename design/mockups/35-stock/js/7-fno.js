/* F&O (India only): NSE's market data for this stock, not your position. The three listed monthly futures, the near
   future's price with open interest over three months, IV against its 3-month range, and your own paper F&O apart. */
function fnoTab(main, c, S) {
  const {el} = c, F = S.fno, B = BUILD[F.buildup];
  main.append(el('p', {class: 'note small'}, c.icon('info'), 'Market data from NSE’s daily F&O file, not your position. Stock F&O has monthly expiries only (no weeklies); NSE lists the near, next and far month.'),
    el('div', {class: 'grid2 even'},
      el('section', {class: 'card', 'aria-label': 'Listed futures'}, head(c, `${S.ticker} futures`, `NSE close of ${day(c, F.date)} · lot ${fmt(F.lot, 0)} shares`),
        el('div', {class: 'scroll'}, el('table', {class: 'md-table stack'}, el('thead', {}, el('tr', {}, el('th', {}, 'Expiry'), el('th', {class: 'num'}, 'Future'), el('th', {class: 'num'}, 'Open interest'), el('th', {}, 'Build-up'))),
          el('tbody', {}, ...F.expiries.map(x => { const b = BUILD[x.buildup];
            return el('tr', {}, el('td', {'data-k': 'Expiry'}, day(c, x.expiry)), el('td', {class: 'num', 'data-k': 'Future'}, fmt(x.fut), el('small', {}, c.delta(x.chg_pct))), el('td', {class: 'num', 'data-k': 'Open interest'}, fmt(x.oi, 0), el('small', {}, `${pct(x.oi_chg_pct)} today`)),
              el('td', {'data-k': 'Build-up'}, el('span', {class: 'mb-label ' + b[1], 'data-tip': b[2]}, b[0]))); })))),
        el('div', {class: 'facts', style: 'margin-top:12px'},
          fact(c, 'Put-call ratio (near month)', F.pcr == null ? '—' : fmt(F.pcr), F.pcr < 1 ? 'more calls than puts open' : 'more puts than calls open'),
          fact(c, 'Move priced in', `±${F.move_pct}%`, `by ${day(c, F.expiry)} (at-the-money call + put)`)),
        el('div', {class: 'acts', style: 'margin-top:12px'}, el('button', {class: 'md-btn outlined small', type: 'button', onclick: () => c.snack(`${S.ticker} option chain: the same page as the NIFTY chain, for this stock.`)}, c.icon('layers'), 'Option chain'),
          el('a', {class: 'md-btn outlined small', href: '../33-screener/page.html#tab=fno'}, c.icon('filter_list'), 'F&O screener'))),
      el('div', {}, el('section', {class: 'card', 'aria-label': 'Three months'}, head(c, 'The last three months', `near-month future, ${day(c, F.history.dates[0])} to ${day(c, F.history.dates.at(-1))}`),
          futOiChart(c, F.history), el('div', {class: 'axis'}, el('span', {}, el('i', {class: 'key fut'}), `Future ${fmt(Math.min(...F.history.fut))}–${fmt(Math.max(...F.history.fut))}`),
            el('span', {}, el('i', {class: 'key oi'}), `Open interest, all futures: ${fmt(F.history.oi.at(-1) / 1e7, 1)} crore shares now`))),
        el('section', {class: 'card sec', 'aria-label': 'Implied volatility'}, head(c, 'Implied volatility (ours)', 'at the money, near month'), ivGauge(c, F)),
        el('section', {class: 'card sec', 'aria-label': 'Your F&O'}, head(c, `Your paper F&O on ${S.ticker}`), ownFno(c, S)))));
}

/* the future's price as a line over the open interest as bars, one shared time axis */
function futOiChart(c, H) {
  const W = 640, Hh = 170, n = H.dates.length, fut = H.fut, oi = H.oi, flo = Math.min(...fut), fhi = Math.max(...fut), ohi = Math.max(...oi);
  const s = c.svgEl('svg', {viewBox: `0 0 ${W} ${Hh}`, preserveAspectRatio: 'none', class: 'plot', role: 'img', style: `height:${Hh}px`,
    'aria-label': `Future from ${fmt(fut[0])} to ${fmt(fut.at(-1))}; open interest from ${fmt(oi[0], 0)} to ${fmt(oi.at(-1), 0)}`});
  const x = i => i / (n - 1) * W, bw = Math.max(1, W / n * 0.6);
  oi.forEach((v, i) => s.append(c.svgEl('rect', {class: 'oi', x: x(i) - bw / 2, y: Hh - v / ohi * (Hh * 0.45), width: bw, height: v / ohi * (Hh * 0.45)})));
  s.append(c.svgEl('polyline', {class: 'futl', points: fut.map((v, i) => `${x(i).toFixed(1)},${(Hh * 0.52 - (v - flo) / (fhi - flo || 1) * (Hh * 0.48) + 4).toFixed(1)}`).join(' '), 'vector-effect': 'non-scaling-stroke'}));
  return s;
}

/* today's IV inside its 3-month low-high range */
function ivGauge(c, F) {
  const {el} = c;
  if (F.iv == null || F.iv_hi <= F.iv_lo) return el('p', {class: 'muted'}, 'Not enough traded options to compute it.');
  const at = Math.round((F.iv - F.iv_lo) / (F.iv_hi - F.iv_lo) * 100);
  return [el('div', {class: 'mb-pos52 wide', role: 'img', 'aria-label': `IV ${F.iv}%, ${at}% of the way from its 3-month low ${F.iv_lo}% to its high ${F.iv_hi}%`},
      el('small', {}, `${F.iv_lo}%`), el('span', {class: 'track'}, el('i', {style: `left:${at}%`})), el('small', {}, `${F.iv_hi}%`)),
    el('p', {class: 'small', style: 'margin:8px 0 0'}, `Today ${F.iv}%: ${at < 25 ? 'near the low end, options are cheap for this stock' : at > 75 ? 'near the high end, options are dear for this stock' : 'in the middle of its range'} (3 months).`)];
}

/* your own paper F&O, kept apart from the market data above */
function ownFno(c, S) {
  const acc = Object.values(SHELL.markets.india.accounts).find(a => a.kind === 'manual'), open = acc ? acc.open_structures || 0 : 0;
  return c.el('p', {class: 'small', style: 'margin:0'}, open ? `${open} open paper F&O structure${open === 1 ? '' : 's'} in your account (the records do not split them by stock).` : `None: your paper account holds no F&O on ${S.ticker}.`, ' ', c.el('span', {class: 'mb-tag paper'}, 'Paper'));
}
