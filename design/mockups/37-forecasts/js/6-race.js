/* A period you choose (owner, 13 Oct 2026; contract 2.9, page forecast_history): each forecaster's average miss over
   the period, as a race chart and a table. The one sum the screen does is the contract's: the average over a period
   from two running averages. Descriptive only: no test runs over a chosen period (the verdicts above are the tests). */
let HQ = null, PERIOD = 'all', FROM = null, TO = null;
const PERIODS = [['5', 'Last week'], ['21', 'Last month'], ['63', 'Last 3 months'], ['all', 'Since the start']];
const RACE_LINE = {book1_rules: 'l1', book2_hybrid: 'l2', book3_ai: 'l3'};
function hist() { const s = Object.values(D.also.getFnoForecastHistory).find(x => x.case === now().case); return s ? s.value.payload : {questions: []}; }
function raceQ(H) { return H.questions.find(q => q.id === HQ) || H.questions[0]; }
function raceDays(q) {
  const days = [...new Set(q.series.flatMap(s => s.points.map(p => p.session)))].sort();
  return FROM && TO ? days.filter(d => d >= FROM && d <= TO) : PERIOD === 'all' ? days : days.slice(-Number(PERIOD));
}
/* (n2 × m2 − n1 × m1) / (n2 − n1): the average from the period's start to each session */
function periodRace(s, days) {
  const before = s.points.filter(p => p.session < days[0]).at(-1), n0 = before ? before.n : 0, sum0 = before ? before.n * before.mean_loss : 0;
  return s.points.filter(p => p.session >= days[0] && p.session <= days.at(-1)).map(p => [p.session, p.n - n0, (p.n * p.mean_loss - sum0) / (p.n - n0)]);
}
function lineOf(q, f) { return f === q.primary_baseline ? 'line y' : 'line ' + (RACE_LINE[f] || 'l4'); }
function raceChart(c, q, days, rows) {
  const vals = rows.flatMap(r => r.race.map(p => p[2])), lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.08 || 0.01;
  const W = 1000, H = 280, L = 64, R = 16, Y = v => 10 + (hi + pad - v) / (hi - lo + 2 * pad) * (H - 36), X = d => L + days.indexOf(d) / Math.max(1, days.length - 1) * (W - L - R);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot race', role: 'img', 'aria-label': rows.map(r => `${fname(r.f)} ${r.avg.toFixed(3)}`).join('; ')});
  for (const v of [lo, (lo + hi) / 2, hi]) { svg.append(c.svgEl('line', {class: 'grid', x1: L, x2: W - R, y1: Y(v), y2: Y(v)})); const t = c.svgEl('text', {x: L - 6, y: Y(v) + 4, 'text-anchor': 'end'}); t.textContent = v.toFixed(3); svg.append(t); }
  for (const r of rows) svg.append(c.svgEl('polyline', {class: lineOf(q, r.f), points: r.race.map(([d, , v]) => `${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}));
  for (const [d, an] of [[days[0], 'start'], [days.at(-1), 'end']]) { const t = c.svgEl('text', {x: X(d), y: H - 6, 'text-anchor': an}); t.textContent = dshort(d); svg.append(t); }
  return svg;
}
/* the legend names every line with its period average (never colour alone) */
function raceKeys(c, q, rows) {
  return c.el('div', {class: 'keys'}, ...rows.map(r => c.el('span', {}, c.el('i', {class: lineOf(q, r.f).replace('line ', '')}), `${fname(r.f)}${r.f === q.primary_baseline ? ' (yardstick)' : ''} ${r.avg.toFixed(3)}`)));
}
function raceTable(c, q, rows) {
  const {el} = c, yard = rows.find(r => r.f === q.primary_baseline);
  return el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
    el('thead', {}, el('tr', {}, ...['Rank', 'Forecaster', 'Days in the period', 'Average miss (lower is better)', 'Against the yardstick'].map(h => el('th', {scope: 'col'}, h)))),
    el('tbody', {}, ...rows.map((r, i) => el('tr', {}, el('td', {class: 'md-numeric', 'data-k': 'Rank'}, String(i + 1)), el('td', {'data-k': 'Forecaster'}, fname(r.f)),
      el('td', {class: 'md-numeric', 'data-k': 'Days in the period'}, String(r.days)), el('td', {class: 'md-numeric', 'data-k': 'Average miss'}, r.avg.toFixed(3)),
      el('td', {'data-k': 'Against the yardstick'}, !yard || r === yard ? '—' : r.avg < yard.avg ? `Missed less, by ${(yard.avg - r.avg).toFixed(3)}` : r.avg > yard.avg ? `Missed more, by ${(r.avg - yard.avg).toFixed(3)}` : 'Level'))))));
}
function racePickers(c, H, q, all) {
  const {el} = c, pick = (label, opts, cur, set) => el('div', {class: 'md-segmented dense qpick', role: 'group', 'aria-label': label}, ...opts.map(([k, w]) => el('button', {type: 'button', 'aria-pressed': String(k === cur), onclick: () => { set(k); c.rerender(); }}, w)));
  const date = (label, val, set) => el('label', {class: 'small muted dpick'}, label, el('input', {class: 'mb-input', type: 'date', min: all[0], max: all.at(-1), value: val || '', onchange: e => { set(e.target.value || null); c.rerender(); }}));
  return el('div', {class: 'acts'}, H.questions.length > 1 ? pick('Question', H.questions.map(x => [x.id, x.id]), q.id, k => { HQ = k; }) : null,
    pick('Period', PERIODS, FROM && TO ? null : PERIOD, k => { PERIOD = k; FROM = TO = null; }), date('From', FROM, v => { FROM = v; }), date('To', TO, v => { TO = v; }));
}
function racePart(main, c) {
  const {el} = c, H = hist(), q = raceQ(H);
  if (!q) { main.append(el('div', {class: 'stack'}, sec(c, 'A period you choose', el('p', {class: 'empty muted'}, 'No session has been scored yet, so there is no race to show.')))); return; }
  const all = [...new Set(q.series.flatMap(s => s.points.map(p => p.session)))].sort(), days = raceDays(q);
  const rows = q.series.map(s => { const race = days.length ? periodRace(s, days) : []; return {f: s.forecaster, race, days: race.length ? race.at(-1)[1] : 0, avg: race.length ? race.at(-1)[2] : null}; })
    .filter(r => r.race.length).sort((a, b) => a.avg - b.avg);
  main.append(el('div', {class: 'stack'}, sec(c, ['A period you choose', el('small', {class: 'muted', style: 'font-weight:400'}, q.plain)], racePickers(c, H, q, all),
    rows.length ? el('div', {}, raceChart(c, q, days, rows), raceKeys(c, q, rows), raceTable(c, q, rows)) : el('p', {class: 'empty muted'}, 'No scored session in these dates.'),
    howto(c, `Each line is the average miss from the period’s first day to that day (${q.metric === 'brier' ? 'Brier' : 'QLIKE'}, lower is better); the dashed line is the yardstick. A short period mostly shows luck: only the tests above decide who is better.`))));
}
