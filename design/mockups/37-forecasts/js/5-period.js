/* Who is winning in a period the user picks (owner: "last 30 days, last 60 days ... the graph changes and the data
   changes"): a leaderboard and the race of all families on one chart, counted by the day each answer came in. */
const RANGES = [['5', 'Last week'], ['10', '2 weeks'], ['21', 'Month'], ['42', '2 months'], ['63', '3 months'], ['all', 'Since the start'], ['custom', 'Pick dates']];
const VIEWS = [['total', 'Running total'], ['day', 'Each day'], ['week', 'Each week'], ['month', 'Each month']];
const BUCKET = {day: 1, week: 5, month: 21};

/* [[answer day, points, right, miss]] of one family, for all five questions or one, answered between a and b */
function rowsIn(fid, rq, a, b) {
  const R = (ov().race || {})[fid] || {}, out = [];
  for (const [qid, rows] of Object.entries(R)) { if (rq !== 'all' && qid !== D.questions[rq].id) continue;
    const h = qOf(qid).days; for (const [d, p, r, m] of rows) if (d + h >= a && d + h <= b) out.push([d + h, p, r, m]); }
  return out.sort((x, y) => x[0] - y[0]);
}
function runningTotal(rows) { const by = {}; for (const [d, p] of rows) by[d] = (by[d] || 0) + p; let run = 0; return Object.keys(by).map(Number).sort((a, b) => a - b).map(d => [d, run += by[d]]); }
function summary(rows) { const n = rows.length; return {n, points: rows.reduce((s, r) => s + r[1], 0), right: n ? 100 * rows.reduce((s, r) => s + r[2], 0) / n : null, miss: n ? rows.reduce((s, r) => s + r[3], 0) / n : null}; }

/* the answered-day window [a, b] the user picked; answers exist from the first prediction's answer to today */
function windowOf(S) {
  const first = 1 + Math.min(...D.questions.map(q => q.days)), last = S.day;
  if (RANGE === 'custom' && FROM && TO) return [Math.max(first, dayOf(FROM) || first), Math.min(last, dayOf(TO) || last)];
  return RANGE === 'all' || RANGE === 'custom' ? [first, last] : [Math.max(first, last - +RANGE + 1), last];
}

function periodPart(main, c) {
  const {el} = c, S = state(), O = ov(), fams = runningFams();
  const sec = el('section', {class: 'card sec', 'aria-label': 'Who is winning in a period'}, head(c, 'Who is winning in a period you choose', 'pick a period; the table and the chart follow'));
  if (!O || !fams.length) { sec.append(quiet(c, 'Empty: no prediction has been answered yet. Here you will pick a period (last week, month, three months, or your own dates) and see who won it, with all families on one chart.')); main.append(sec); return; }
  const [a, b] = windowOf(S);
  sec.append(...[el('div', {class: 'acts'}, seg(c, 'Period', RANGES, RANGE, k => { RANGE = k; if (k === 'custom' && !FROM) { const [x, y] = windowOf(S); FROM = dateOf(x); TO = dateOf(y); } })),
    RANGE === 'custom' ? datePick(c, S) : null].filter(Boolean),
    el('div', {class: 'acts', style: 'margin-top:4px'}, seg(c, 'Predictions', [['all', 'All five'], ...D.questions.map((q, i) => [i, q.short])], RQ, k => { RQ = k; })));
  const rows = Object.fromEntries([...fams.map(f => f.id), O.ref].map(id => [id, rowsIn(id, RQ, a, b)]));
  const total = fams.reduce((s, f) => s + rows[f.id].length, 0);
  sec.append(el('p', {class: 'small', style: 'margin:4px 0 10px'}, el('b', {}, `${dlabel(dateOf(a))} to ${dlabel(dateOf(b))}`), ` · ${b - a + 1} trading days · ${total.toLocaleString('en-IN')} family predictions answered${RQ === 'all' ? '' : ` on “${D.questions[RQ].short}”`}`));
  if (!total) { sec.append(quiet(c, 'No prediction was answered in this period.')); main.append(sec); return; }
  sec.append(el('div', {class: 'grid2 period'}, periodTable(c, O, fams, rows), el('div', {}, seg(c, 'View', VIEWS, RV, k => { RV = k; }),
    RV === 'total' ? raceLines(c, fams, rows) : raceBars(c, fams, rows, a, BUCKET[RV]), raceKeys(c, fams))));
  sec.append(howto(c, RV === 'total' ? 'Each line is a family’s points added up from the first day of the period. Going up: it is beating the past average; going down: it is doing worse. The 0 line is the past average itself.'
    : `Each group of bars is one ${RV} of answers: above 0 the family beat the past average that ${RV}, below 0 it did worse. Left to right in each group: ${fams.map(f => f.name).join(', ')}.`));
  main.append(sec);
}

function datePick(c, S) {
  const {el} = c, lo = dateOf(1 + Math.min(...D.questions.map(q => q.days))), hi = dateOf(S.day);
  const inp = (label, v, set) => el('label', {class: 'mb-field'}, label, el('input', {class: 'mb-input', type: 'date', value: v, min: lo, max: hi, onchange: e => { set(e.target.value); c.rerender(); }}));
  return el('div', {class: 'acts dates'}, inp('From', FROM, v => { FROM = v; }), inp('To', TO, v => { TO = v; }), el('small', {class: 'muted'}, `Answers exist from ${dlabel(lo)} to ${dlabel(hi)}.`));
}

/* the period's leaderboard: points (a bar), right direction, average miss; the past average as the reference row */
function periodTable(c, O, fams, rows) {
  const {el} = c, s = fams.map(f => [f, summary(rows[f.id])]).sort((x, y) => y[1].points - x[1].points), ref = summary(rows[O.ref]), max = Math.max(1, ...s.map(x => Math.abs(x[1].points)));
  const line = (rank, whoEl, x, isRef) => el('tr', {class: isRef ? 'ref' : ''}, el('td', {class: 'rk'}, rank), el('td', {}, whoEl),
    el('td', {'data-k': 'Points'}, isRef ? el('span', {class: 'muted'}, '0, by definition') : el('span', {class: 'pbar'}, hbar(c, x.points, max), el('b', {class: x.points >= 0 ? 'pos' : 'neg'}, signed(x.points, 0)))),
    el('td', {class: 'num', 'data-k': 'Right direction'}, x.right == null ? '—' : `${Math.round(x.right)}%`), el('td', {class: 'num', 'data-k': 'Average miss'}, miss(x.miss)), el('td', {class: 'num', 'data-k': 'Answered'}, String(x.n)));
  const winner = s[0], loser = s.at(-1);
  return el('div', {}, el('p', {class: 'winner'}, c.icon('leaderboard'), el('span', {}, el('b', {}, `${winner[0].name} won this period`), ` with ${signed(winner[1].points, 0)} points`,
      s.length > 1 && loser[1].points < 0 ? `; ${loser[0].name} did worst (${signed(loser[1].points, 0)}).` : '.')),
    el('div', {class: 'scroll'}, el('table', {class: 'md-table ptable stack'}, el('thead', {}, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Family'), el('th', {}, 'Points'), el('th', {class: 'num'}, 'Right direction'), el('th', {class: 'num'}, 'Average miss'), el('th', {class: 'num'}, 'Answered'))),
      el('tbody', {}, ...s.map(([f, x], i) => line(String(i + 1), c.apBadge(AP[f.id]), x)), line('', who(c, O.ref), ref, true)))));
}
function hbar(c, v, max) { const w = Math.min(50, Math.abs(v) / max * 50).toFixed(1); return c.el('span', {class: 'hbar', 'aria-hidden': 'true'}, c.el('i', {class: v < 0 ? 'neg' : 'pos', style: v < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`})); }
