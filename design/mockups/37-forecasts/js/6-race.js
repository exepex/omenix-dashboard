/* A period you choose (owner, 13 Oct 2026; contract 2.9, page forecast_history): each forecaster's average miss over
   the answers that came in during the period, as a race chart and a table. Live and rebuilt-from-history series are
   shown apart, never joined. The one sum the screen does is the contract's: the average between two reports from
   their running averages. Descriptive only: no test runs over a chosen period (the verdicts above are the tests). */
let HQ = null, PERIOD = 'all', FROM = null, TO = null, HLABEL = 'live';
const PERIODS = [['7', 'Last week'], ['30', 'Last month'], ['91', 'Last 3 months'], ['all', 'Since the start']];
const LABELS = [['live', 'Live'], ['backfill_exploratory', 'Rebuilt from history']];
const RACE_LINE = {book1_rules: 'l1', book2_hybrid: 'l2', book3_ai: 'l3'};
function hist() { const s = Object.values(D.also.getFnoForecastHistory).find(x => x.case === now().case); return s ? s.value.payload : {questions: []}; }
function raceQ(H) { return H.questions.find(q => q.id === HQ) || H.questions[0]; }
/* the yardstick is the Forecast lab page's, for the same question (one copy) */
function yardOf(q) { const lab = pay().questions.find(x => x.id === q.id); return lab ? lab.primary_baseline : null; }
function daysBack(iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); }
function raceDays(all) {
  if (FROM && TO) return all.filter(d => d >= FROM && d <= TO);
  return PERIOD === 'all' ? all : all.filter(d => d > daysBack(all.at(-1), Number(PERIOD)));
}
/* (n2 × m2 − n1 × m1) / (n2 − n1): the average over the answers that came in from the period's start to each report */
function periodRace(s, days) {
  const before = s.points.filter(p => p.as_of < days[0]).at(-1), n0 = before ? before.n : 0, sum0 = before ? before.n * before.mean_loss : 0;
  return s.points.filter(p => p.as_of >= days[0] && p.as_of <= days.at(-1) && p.n > n0).map(p => [p.as_of, p.n - n0, (p.n * p.mean_loss - sum0) / (p.n - n0)]);
}
function lineOf(yard, f) { return f === yard ? 'line y' : 'line ' + (RACE_LINE[f] || 'l4'); }
function raceChart(c, yard, days, rows) {
  const vals = rows.flatMap(r => r.race.map(p => p[2])), lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.08 || 0.01;
  const W = 1000, H = 280, L = 64, R = 16, Y = v => 10 + (hi + pad - v) / (hi - lo + 2 * pad) * (H - 36), X = d => L + days.indexOf(d) / Math.max(1, days.length - 1) * (W - L - R);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot race', role: 'img', 'aria-label': rows.map(r => `${fname(r.f)} ${r.avg.toFixed(3)}`).join('; ')});
  const digits = hi - lo < 0.01 ? 4 : 3;
  for (const v of [lo, (lo + hi) / 2, hi]) { svg.append(c.svgEl('line', {class: 'grid', x1: L, x2: W - R, y1: Y(v), y2: Y(v)})); const t = c.svgEl('text', {x: L - 6, y: Y(v) + 4, 'text-anchor': 'end'}); t.textContent = v.toFixed(digits); svg.append(t); }
  for (const r of rows) svg.append(c.svgEl('polyline', {class: lineOf(yard, r.f), points: r.race.map(([d, , v]) => `${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}));
  for (const [d, an] of [[days[0], 'start'], [days.at(-1), 'end']]) { const t = c.svgEl('text', {x: X(d), y: H - 6, 'text-anchor': an}); t.textContent = dshort(d); svg.append(t); }
  return svg;
}
/* the legend names every line with its period average (never colour alone) */
function raceKeys(c, yard, rows) {
  return c.el('div', {class: 'keys'}, ...rows.map(r => c.el('span', {}, c.el('i', {class: lineOf(yard, r.f).replace('line ', '')}), `${fname(r.f)}${r.f === yard ? ' (yardstick)' : ''} ${r.avg.toFixed(3)}`)));
}
function raceTable(c, yard, rows) {
  const {el} = c, Y = rows.find(r => r.f === yard);
  return el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
    el('thead', {}, el('tr', {}, ...['Rank', 'Forecaster', 'Answers in the period', 'Average miss (lower is better)', 'Against the yardstick'].map(h => el('th', {scope: 'col'}, h)))),
    el('tbody', {}, ...rows.map((r, i) => el('tr', {}, el('td', {class: 'md-numeric', 'data-k': 'Rank'}, String(i + 1)), el('td', {'data-k': 'Forecaster'}, fname(r.f)),
      el('td', {class: 'md-numeric', 'data-k': 'Answers in the period'}, String(r.days)), el('td', {class: 'md-numeric', 'data-k': 'Average miss'}, r.avg.toFixed(3)),
      el('td', {'data-k': 'Against the yardstick'}, !Y || r === Y ? '—' : r.avg < Y.avg ? `Missed less, by ${(Y.avg - r.avg).toFixed(3)}` : r.avg > Y.avg ? `Missed more, by ${(r.avg - Y.avg).toFixed(3)}` : 'Level'))))));
}
function racePickers(c, H, q, all, labels) {
  const {el} = c, pick = (label, opts, cur, set) => el('div', {class: 'md-segmented dense qpick', role: 'group', 'aria-label': label}, ...opts.map(([k, w]) => el('button', {type: 'button', 'aria-pressed': String(k === cur), onclick: () => { set(k); c.rerender(); }}, w)));
  const date = (label, val, set) => el('label', {class: 'small muted dpick'}, label, el('input', {class: 'mb-input', type: 'date', min: all[0], max: all.at(-1), value: val || '', onchange: e => { set(e.target.value || null); c.rerender(); }}));
  return el('div', {class: 'acts'}, H.questions.length > 1 ? pick('Question', H.questions.map(x => [x.id, x.id]), q.id, k => { HQ = k; }) : null,
    labels.length > 1 ? pick('Which record', LABELS.filter(([k]) => labels.includes(k)), HLABEL, k => { HLABEL = k; }) : null,
    pick('Period', PERIODS, FROM && TO ? null : PERIOD, k => { PERIOD = k; FROM = TO = null; }), date('From', FROM, v => { FROM = v; }), date('To', TO, v => { TO = v; }));
}
function raceRows(series, days) {
  return series.map(s => { const race = days.length ? periodRace(s, days) : []; return {f: s.forecaster, race, days: race.length ? race.at(-1)[1] : 0, avg: race.length ? race.at(-1)[2] : null}; })
    .filter(r => r.race.length).sort((a, b) => a.avg - b.avg);
}
function racePart(main, c) {
  const {el} = c, H = hist(), q = raceQ(H);
  if (!q) { main.append(el('div', {class: 'stack'}, sec(c, 'A period you choose', el('p', {class: 'empty muted'}, 'No answer has been scored yet, so there is no race to show.')))); return; }
  const labels = LABELS.map(([k]) => k).filter(k => q.series.some(s => s.label === k)), label = labels.includes(HLABEL) ? HLABEL : labels[0];
  /* the newest back-fill only: a rebuilt back-fill is a new series, never joined to the old (live series carry null) */
  const newest = q.series.filter(s => s.label === label).at(-1).backfill_sha256;
  const series = q.series.filter(s => s.label === label && s.backfill_sha256 === newest), all = [...new Set(series.flatMap(s => s.points.map(p => p.as_of)))].sort(), days = raceDays(all);
  const yard = yardOf(q), rows = raceRows(series, days);
  main.append(el('div', {class: 'stack'}, sec(c, ['A period you choose', el('small', {class: 'muted', style: 'font-weight:400'}, q.plain)], racePickers(c, H, q, all, labels),
    label === 'backfill_exploratory' ? el('p', {class: 'small', style: 'margin:8px 0 0'}, el('span', {class: 'mb-label neutral'}, c.icon('science'), 'Exploratory'), ' Rebuilt later from history, never a live record: it cannot show who reads the market better.') : null,
    rows.length ? el('div', {}, raceChart(c, yard, days, rows), raceKeys(c, yard, rows), raceTable(c, yard, rows)) : el('p', {class: 'empty muted'}, 'No answer came in during these dates.'),
    howto(c, `Each line is the average miss over the answers that came in from the period’s first day to that day (${q.metric === 'brier' ? 'Brier' : 'QLIKE'}, lower is better); the dashed line is the yardstick. An answer comes in when its question resolves, so a period mostly scores forecasts made before it. A short period mostly shows luck: only the tests above decide who is better.`))));
}
