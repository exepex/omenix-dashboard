/* The contracts: pick an expiry, see its future and the option chain near today's price (every contract with its NSE
   code), pick a strike, then see the call and the put with Buy / Sell and what buying one would make or lose at expiry. */
let KIND = 'ce';   /* the option side drawn in the "what if" chart */

function contractsCard(c, S) {
  const {el} = c, F = S.fno, ch = F.chain[EXP], fut = F.expiries[EXP], B = BUILD[fut.buildup], near = ch.rows.filter(r => Math.abs(r.strike - ch.atm) <= 50);
  if (SEL == null || !ch.rows.some(r => r.strike === SEL)) SEL = ch.atm;
  const bs = code => el('span', {class: 'acts', 'data-tip': c.tradeLock()}, el('button', {class: 'md-btn buy small', type: 'button', disabled: !!c.tradeLock(), onclick: () => c.openOrder(code, 'buy')}, 'Buy'),
    el('button', {class: 'md-btn sell small', type: 'button', disabled: !!c.tradeLock(), onclick: () => c.openOrder(code, 'sell')}, 'Sell'));
  const side = o => o ? [el('td', {class: 'num' + (o.traded ? '' : ' stale'), 'data-tip': o.traded ? `${o.code}: ${fmt(o.contracts, 0)} contracts traded` : `${o.code}: not traded today (last recorded price)`}, fmt(o.price), el('small', {}, o.traded ? (o.iv == null ? '' : `IV ${fmt(o.iv, 1)}%`) : 'not traded')),
    el('td', {class: 'num'}, fmt(o.oi / 1e5, 1), el('small', {}, 'lakh'))] : [el('td', {}, '—'), el('td', {}, '—')];
  const table = el('table', {class: 'md-table chain'}, el('thead', {}, el('tr', {}, el('th', {class: 'num'}, 'Call price'), el('th', {class: 'num'}, 'Call open'), el('th', {class: 'num strike'}, 'Strike'), el('th', {class: 'num'}, 'Put price'), el('th', {class: 'num'}, 'Put open'))),
    el('tbody', {}, ...near.map(r => { const call = side(r.ce), put = side(r.pe);
      return el('tr', {class: (r.strike === SEL ? 'sel' : '') + (r.strike === ch.atm ? ' atm' : ''), tabindex: '0', role: 'button', 'aria-label': `Strike ${r.strike}`, onclick: () => { SEL = r.strike; c.rerender(); },
        onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); SEL = r.strike; c.rerender(); } }},
        ...call, el('td', {class: 'num strike'}, el('b', {}, fmt(r.strike, 0)), r.strike === ch.atm ? el('small', {}, '≈ today') : null), ...put); })));
  return el('section', {class: 'card', 'aria-label': 'Contracts'}, head(c, `${S.ticker} contracts`, `lot ${fmt(F.lot, 0)} shares · prices at NSE’s close of ${day(c, F.date)}`),
    el('div', {class: 'acts', style: 'margin-bottom:10px'}, seg(c, 'Expiry', F.expiries.map((x, i) => [i, dm(x.expiry)]), EXP, k => { EXP = k; SEL = null; })),
    el('div', {class: 'futrow'}, el('span', {}, el('span', {class: 'md-chip'}, 'Future'), ' ', el('b', {}, fut.code), el('small', {class: 'muted', style: 'display:block'}, `${fmt(fut.fut)} `, c.delta(fut.chg_pct), ` · ${fmt(fut.oi / 1e7, 2)} crore shares open · `, el('span', {class: 'mb-label ' + B[1], 'data-tip': B[2]}, B[0]))), bs(fut.code)),
    el('div', {class: 'grid2 chainwrap'}, el('div', {class: 'scroll'}, table,
        el('p', {class: 'muted small', style: 'margin:6px 0 0'}, 'Tap a strike to see its call and put. Open: contracts held, in lakh shares. Grey: not traded today.')),
      pickedPanel(c, S, ch, bs)));
}

/* the strike picked: its call and put with codes and Buy / Sell, and the "what if" chart for buying one lot */
function pickedPanel(c, S, ch, bs) {
  const {el} = c, r = ch.rows.find(x => x.strike === SEL), o = r[KIND] || r.ce || r.pe, kind = r[KIND] ? KIND : (r.ce ? 'ce' : 'pe'), lot = S.fno.lot;
  const be = kind === 'ce' ? r.strike + o.price : r.strike - o.price, cost = o.price * lot;
  const leg = (k, word) => r[k] ? el('div', {class: 'legrow' + (k === kind ? ' on' : '')}, el('button', {class: 'md-chip filter', type: 'button', 'aria-pressed': String(k === kind), onclick: () => { KIND = k; c.rerender(); }}, word),
    el('span', {}, el('b', {}, r[k].code), el('small', {class: 'muted', style: 'display:block'}, `${fmt(r[k].price)} × ${fmt(lot, 0)} = ${cur(c, r[k].price * lot, 0)} to buy one lot`)), bs(r[k].code)) : null;
  return el('div', {class: 'picked', 'aria-label': `Strike ${r.strike}`}, el('h3', {}, `Strike ${cur(c, r.strike, 0)}, ${dm(ch.expiry)}`),
    leg('ce', 'Call (CE)'), leg('pe', 'Put (PE)'),
    el('p', {class: 'small', style: 'margin:10px 0 4px'}, el('b', {}, 'What if you buy one lot of the ' + (kind === 'ce' ? 'call' : 'put') + '?')),
    payoff(c, r.strike, o.price, kind, lot, ch.spot),
    el('p', {class: 'small', style: 'margin:6px 0 0'}, `It makes money at expiry if ${S.ticker} ends ${kind === 'ce' ? 'above' : 'below'} ${cur(c, be)} (strike ${kind === 'ce' ? '+' : '−'} price paid). The most you can lose is ${cur(c, cost, 0)}, what you pay. Today it is ${cur(c, ch.spot)}.`),
    el('p', {class: 'muted small', style: 'margin:4px 0 0'}, 'At expiry only, before charges; not a forecast and not advice.'));
}

/* profit or loss at expiry of buying one lot, over ±12% of today's price: loss capped at the price paid */
function payoff(c, k, prem, kind, lot, spot) {
  const W = 360, H = 150, lo = spot * 0.88, hi = spot * 1.12, n = 60, xs = Array.from({length: n + 1}, (_, i) => lo + (hi - lo) * i / n);
  const pl = s => (Math.max(kind === 'ce' ? s - k : k - s, 0) - prem) * lot, ys = xs.map(pl), ymin = Math.min(...ys), ymax = Math.max(...ys, 1);
  const X = s => (s - lo) / (hi - lo) * W, Y = v => H - 8 - (v - ymin) / (ymax - ymin || 1) * (H - 16);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot bars payoff', role: 'img', 'aria-label': `Buying one lot: the most you can lose is ${fmt(prem * lot, 0)}; it makes money ${kind === 'ce' ? 'above' : 'below'} ${fmt(kind === 'ce' ? k + prem : k - prem)}`});
  svg.append(c.svgEl('rect', {class: 'gain', x: 0, y: 0, width: W, height: Y(0)}), c.svgEl('line', {class: 'zero', x1: 0, x2: W, y1: Y(0), y2: Y(0)}));
  svg.append(c.svgEl('polyline', {class: 'payl', points: xs.map((s, i) => `${X(s).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(' ')}));
  svg.append(c.svgEl('line', {class: 'spot', x1: X(spot), x2: X(spot), y1: 0, y2: H}));
  for (const [v, t, y] of [[ymin, `−${fmt(-ymin, 0)} most you can lose`, Y(ymin) - 4], [ymax, `+${fmt(ymax, 0)} at ${fmt(kind === 'ce' ? hi : lo, 0)}`, Y(ymax) + 12]]) {
    const tx = c.svgEl('text', {x: kind === 'ce' ? 4 : W - 4, y, 'text-anchor': kind === 'ce' ? 'start' : 'end', class: 'lbl'}); tx.textContent = t; svg.append(tx); }
  return svg;
}
