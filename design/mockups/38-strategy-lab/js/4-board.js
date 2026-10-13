/* Since the start: every family ranked by its profit after charges. Simple view for a first-time investor (one card
   each: profit, wins and losses, a small line of how it grew); detailed view for a professional (one table with
   win rate, average win and loss, profit factor, worst fall, best and worst trade). */
function returnOf(c, s) {
  if (!s.n) return null;
  return ASSET === 'stocks' ? {v: s.ret, word: 'average return a trade'} : {v: 100 * s.net / (mk(c).fno_capital), word: `on its ${plain(c, mk(c).fno_capital)} account`};
}

function boardPart(main, c) {
  const {el} = c, S = state(), fams = families(), rows = fams.map(f => [f, stats(tradesOf(c, f))]).sort((a, b) => (b[1].n ? b[1].net : -Infinity) - (a[1].n ? a[1].net : -Infinity));
  const sec = el('section', {class: 'card sec', 'aria-label': 'Since the start'}, head(c, 'Who made the most, since the start', S.days ? `${dayText(1)} to ${dayText(S.days)} · ${ASSETS[ASSET]}` : ASSETS[ASSET]),
    seg(c, 'View', [['simple', 'Simple'], ['pro', 'Detailed']], VIEW, k => { VIEW = k; }));
  if (!rows.some(([, s]) => s.n)) { sec.append(quiet(c, emptyText(c)), refNote(c)); main.append(sec); return; }
  sec.append(VIEW === 'simple' ? el('div', {class: 'cards3'}, ...rows.map(([f, s], i) => simpleCard(c, f, s, s.n ? i + 1 : null))) : proTable(c, rows), refNote(c));
  main.append(sec);
}
function emptyText(c) { return ASSET === 'fno' ? `Empty: no F&O paper trade yet. ${state().fno_reason || ''}` : 'Empty: no family trade has closed yet. Each family will get its profit after charges, its wins and losses, and a line of how it grew.'; }

function simpleCard(c, f, s, rank) {
  const {el} = c, r = returnOf(c, s);
  if (!s.n) return el('article', {class: 'leader idle'}, el('div', {class: 'lh'}, badge(c, f)), el('b', {class: 'big muted'}, f === 'hybrid' && ASSET === 'stocks' ? 'No stock strategy yet' : 'No closed trade yet'),
    el('small', {}, f === 'hybrid' && ASSET === 'stocks' ? 'Hybrid trades F&O only for now. Never counted as zero.' : 'Shown once its first trade closes. Never counted as zero.'));
  return el('article', {class: 'leader' + (rank === 1 && s.net > 0 ? ' first' : '')}, el('div', {class: 'lh'}, el('span', {class: 'rank'}, `${rank}${['st', 'nd', 'rd'][rank - 1]}`), badge(c, f)),
    el('div', {class: 'big'}, upDown(c, s.net, money(c, s.net))), el('small', {}, s.net >= 0 ? 'profit after every charge' : 'loss after every charge', r ? ` · ${pct(r.v, 2)} ${r.word}` : ''),
    curveSpark(c, f), winLoss(c, s),
    el('div', {class: 'lfacts'}, fact(c, 'Average win', money(c, s.avgWin), 'on a winning trade'), fact(c, 'Average loss', money(c, s.avgLoss), 'on a losing trade')));
}
function fact(c, k, v, s) { return c.el('div', {class: 'mb-fact'}, c.el('span', {class: 'k'}, k), c.el('b', {}, v), c.el('small', {}, s)); }
/* won and lost trades as one bar, with the counts written */
function winLoss(c, s) {
  const {el} = c, w = s.n ? 100 * s.won / s.n : 0;
  return el('div', {class: 'wl'}, el('span', {class: 'wlbar', role: 'img', 'aria-label': `${s.won} won, ${s.lost} lost`}, el('i', {class: 'won', style: `width:${w.toFixed(1)}%`}), el('i', {class: 'lost', style: `width:${(100 - w).toFixed(1)}%`})),
    el('small', {}, el('b', {}, `${Math.round(w)}% of trades won`), ` · ${s.won} won · ${s.lost} lost`));
}
function curveSpark(c, f) {
  const T = [...tradesOf(c, f)].sort((a, b) => a[1] - b[1]); if (T.length < 2) return null;
  let run = 0; const v = T.map(t => run += t[3]), W = 240, H = 42, lo = Math.min(0, ...v), hi = Math.max(0, ...v), X = i => i / (v.length - 1) * W, Y = x => 3 + (hi - x) / (hi - lo || 1) * (H - 6);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot spark', role: 'img', 'aria-label': `Running profit, ending at ${money(c, v.at(-1))}`});
  svg.append(c.svgEl('line', {class: 'zero', x1: 0, x2: W, y1: Y(0), y2: Y(0)}), c.svgEl('polyline', {class: 'line ' + LINE[f], points: v.map((x, i) => `${X(i).toFixed(1)},${Y(x).toFixed(1)}`).join(' ')}));
  return svg;
}

function proTable(c, rows) {
  const {el} = c, ref = reference(), td = (k, v, cls) => el('td', {class: 'num' + (cls ? ' ' + cls : ''), 'data-k': k}, v);
  const line = (rank, who, s, r) => el('tr', {}, el('td', {class: 'rk'}, rank), el('td', {}, who), td('Profit after charges', upDown(c, s.net, money(c, s.net))), td('Return', r ? pct(r.v, 2) : '—'),
    td('Trades', String(s.n)), td('Won / lost', `${s.won} / ${s.lost}`), td('Win rate', s.rate == null ? '—' : `${Math.round(s.rate)}%`), td('Average win', money(c, s.avgWin)), td('Average loss', money(c, s.avgLoss)),
    td('Profit factor', s.pf == null ? '—' : s.pf.toFixed(2)), td('Per trade', money(c, s.per)), td('Worst fall', money(c, s.dd)), td('Best / worst trade', s.n ? `${money(c, s.best[3])} / ${money(c, s.worst[3])}` : '—'));
  const body = rows.map(([f, s], i) => s.n ? line(String(i + 1), badge(c, f), s, returnOf(c, s)) : el('tr', {}, el('td', {}, ''), el('td', {}, badge(c, f)), el('td', {colspan: 12, class: 'muted'}, 'no closed trade yet')));
  if (ref === 'baseline') { const s = stats(tradesOf(c, 'baseline', 'stocks')); if (s.n) body.push(line('', el('span', {class: 'muted'}, 'Baselines (reference)'), s, returnOf(c, s))); }
  return el('div', {}, el('div', {class: 'scroll'}, el('table', {class: 'md-table pro stack'}, el('thead', {}, el('tr', {}, ...['#', 'Family', 'Profit after charges', 'Return', 'Trades', 'Won / lost', 'Win rate', 'Average win', 'Average loss', 'Profit factor', 'Per trade', 'Worst fall', 'Best / worst trade'].map((h, i) => el('th', {class: i > 1 ? 'num' : ''}, h)))),
    el('tbody', {}, ...body))), howto(c, 'Profit factor: money won divided by money lost (above 1 makes money). Worst fall: the biggest drop from a high point of the running profit. Per trade: the average profit of one trade after charges.'));
}

/* the line every family is compared with */
function refNote(c) {
  const ref = reference(), S = state();
  if (ref === 'baseline') { const s = stats(tradesOf(c, 'baseline', 'stocks')); return howto(c, s.n ? `For comparison, the baselines (simple rules such as “always buy”) made ${money(c, s.net)} on ${s.n} trades, ${Math.round(s.rate)}% won. A family is only worth using if it does better.` : 'The baselines (simple rules such as “always buy”) are the bar every family must beat; none of their trades has closed yet.'); }
  if (S.index) { const L = niftyLine(c, 1, S.days); return howto(c, `For comparison, simply holding NIFTY with the same ${plain(c, mk(c).fno_capital)} would have made ${money(c, L.at(-1)[1])} over the same time.`); }
  return howto(c, `For comparison: holding NIFTY with the same ${plain(c, mk(c).fno_capital)}, shown once trades exist.`);
}
