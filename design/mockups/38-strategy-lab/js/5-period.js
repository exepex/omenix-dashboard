/* A period the user picks (owner: "last 30 days, last 60 days ... accordingly graph changes also the data changes"):
   who won it, a small table, and one chart with every family and the comparison line, as a running total or as
   bars by week or month. Trades count on the day they closed. */
const RANGES = [['5', '1 week'], ['21', '1 month'], ['63', '3 months'], ['126', '6 months'], ['252', '1 year'], ['all', 'All'], ['custom', 'Pick dates']];
const VIEWS = [['total', 'Running total'], ['week', 'Each week'], ['month', 'Each month']];
const BUCKET = {week: 5, month: 21};

function windowOf(S) {
  const last = S.days;
  if (RANGE === 'custom' && FROM && TO) return [Math.max(1, dayOf(FROM) || 1), Math.min(last, dayOf(TO) || last)];
  return RANGE === 'all' || RANGE === 'custom' ? [1, last] : [Math.max(1, last - +RANGE + 1), last];
}

function periodPart(main, c) {
  const {el} = c, S = state(), fams = families().filter(f => tradesOf(c, f).length);
  const sec = el('section', {class: 'card sec', 'aria-label': 'A period you choose'}, head(c, 'Who is winning in a period you choose', 'pick a period; the table and the chart follow'));
  if (!fams.length) { sec.append(quiet(c, 'Empty: no family trade has closed yet. Here you will pick a period (a week, a month, three months, a year, or your own dates) and see who won it, with every family on one chart.')); main.append(sec); return; }
  const [a, b] = windowOf(S), rows = Object.fromEntries(fams.map(f => [f, within(tradesOf(c, f), a, b)]));
  sec.append(...[seg(c, 'Period', RANGES, RANGE, k => { RANGE = k; if (k === 'custom' && !FROM) { const [x, y] = windowOf(S); FROM = dateOf(x); TO = dateOf(y); } }),
    RANGE === 'custom' ? datePick(c, S) : null].filter(Boolean),
    el('p', {class: 'small', style: 'margin:6px 0 10px'}, el('b', {}, `${dayText(a)} to ${dayText(b)}`), ` · ${b - a + 1} trading days · ${fams.reduce((s, f) => s + rows[f].length, 0)} trades closed`));
  const ranked = fams.map(f => [f, stats(rows[f])]).filter(x => x[1].n).sort((x, y) => y[1].net - x[1].net);
  if (!ranked.length) { sec.append(quiet(c, 'No trade closed in this period.')); main.append(sec); return; }
  const best = ranked[0], worst = ranked.at(-1);
  sec.append(el('p', {class: 'winner'}, c.icon('leaderboard'), el('span', {}, el('b', {}, `${nameOf(best[0])} ${best[1].net >= 0 ? 'won' : 'lost least in'} this period`), ` with ${money(c, best[1].net)}`,
    ranked.length > 1 ? `; ${nameOf(worst[0])} did worst (${money(c, worst[1].net)}).` : '.')),
    periodTable(c, ranked, a, b),
    seg(c, 'Chart', VIEWS, RV, k => { RV = k; }), RV === 'total' ? lines(c, fams, rows, a, b) : bars(c, fams, rows, a, BUCKET[RV]), keys(c, fams),
    howto(c, RV === 'total' ? 'Each line adds up a family’s profit from the first day of the period. Going up: it is making money; going down: losing. The grey line is what it is compared with.'
      : `Each group of bars is one ${RV}: above 0 the family made money that ${RV}, below 0 it lost. Left to right: ${fams.map(nameOf).join(', ')}.`));
  main.append(sec);
}

function datePick(c, S) {
  const {el} = c, lo = dateOf(1), hi = dateOf(S.days);
  const inp = (label, v, set) => el('label', {class: 'mb-field'}, label, el('input', {class: 'mb-input', type: 'date', value: v, min: lo, max: hi, onchange: e => { set(e.target.value); c.rerender(); }}));
  return el('div', {class: 'acts dates'}, inp('From', FROM, v => { FROM = v; }), inp('To', TO, v => { TO = v; }), el('small', {class: 'muted'}, `Trades exist from ${dlabel(lo)} to ${dlabel(hi)}.`));
}

function periodTable(c, ranked, a, b) {
  const {el} = c, max = Math.max(1, ...ranked.map(x => Math.abs(x[1].net))), refRow = refStats(c, a, b);
  const row = (rank, who, s) => el('tr', {}, el('td', {class: 'rk'}, rank), el('td', {}, who), el('td', {'data-k': 'Profit after charges'}, el('span', {class: 'pbar'}, hbar(s.net, max, c), upDown(c, s.net, money(c, s.net)))),
    el('td', {class: 'num', 'data-k': 'Trades'}, String(s.n)), el('td', {class: 'num', 'data-k': 'Won / lost'}, `${s.won} / ${s.lost}`), el('td', {class: 'num', 'data-k': 'Win rate'}, `${Math.round(s.rate)}%`));
  return el('div', {class: 'scroll'}, el('table', {class: 'md-table ptable stack'}, el('thead', {}, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Family'), el('th', {}, 'Profit after charges'), el('th', {class: 'num'}, 'Trades'), el('th', {class: 'num'}, 'Won / lost'), el('th', {class: 'num'}, 'Win rate'))),
    el('tbody', {}, ...ranked.map(([f, s], i) => row(String(i + 1), badge(c, f), s)), refRow ? el('tr', {class: 'ref'}, el('td', {}, ''), el('td', {}, refRow[0]), el('td', {colspan: 4}, refRow[1])) : null)));
}
function hbar(v, max, c) { const w = Math.min(50, Math.abs(v) / max * 50).toFixed(1); return c.el('span', {class: 'hbar', 'aria-hidden': 'true'}, c.el('i', {class: v < 0 ? 'neg' : 'pos', style: v < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`})); }
/* the comparison for the period: the baselines' trades (stocks) or holding NIFTY with the same money (F&O) */
function refStats(c, a, b) {
  const ref = reference();
  if (ref === 'baseline') { const s = stats(within(tradesOf(c, 'baseline', 'stocks'), a, b)); return s.n ? ['Baselines', `${money(c, s.net)} on ${s.n} trades, ${Math.round(s.rate)}% won`] : null; }
  if (ref === 'nifty') { const L = niftyLine(c, a, b); return L.length ? ['Holding NIFTY', `${money(c, L.at(-1)[1])} with the same ${plain(c, mk(c).fno_capital)}`] : null; }
  return null;
}
