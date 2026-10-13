/* Financials in detail (owner, 13 Oct 2026: "more graphs: revenue, growth, net profit, debt, margins"): one small
   chart per measure, each with a plain one-line takeaway, by quarter or by year. What the records do not hold (debt,
   cash flow) keeps its frame, marked "not recorded yet", so the gap is visible. */
function financials(c, S) {
  const {el} = c, rows = RES === 'y' ? S.results.years : S.results.quarters, india = c.m === 'india', lbl = r => RES === 'y' ? `FY${String(new Date(r.end).getUTCFullYear()).slice(2)}` : quarterOf(r.end).replace(' 20', " '");
  const last = rows.at(-1), eps = RES === 'y' ? [] : S.quarters.slice(-rows.length);
  const said = (v, word) => v == null ? `${word} growth needs the same period a year earlier (not in the records).` : `${word} ${v >= 0 ? 'grew' : 'fell'} ${fmt(Math.abs(v), 1)}% from a year earlier.`;
  const tiles = [
    tile(c, 'Revenue', big(last.revenue), said(last.rev_yoy, 'Revenue'), bars(c, rows, r => r.revenue, lbl)),
    tile(c, 'Net profit', big(last.profit), said(last.profit_yoy, 'Profit'), bars(c, rows, r => r.profit, lbl, null, 'prof')),
    tile(c, 'Growth from a year earlier', last.rev_yoy == null ? '—' : pct(last.rev_yoy), 'Revenue and profit against the same period a year earlier; bars below the line are falls.',
      bars(c, rows, r => r.rev_yoy, lbl, r => r.profit_yoy)),
    tile(c, 'Margins', last.margin == null ? '—' : `${fmt(last.margin, 1)}%`, `Of every ${cur(c, 100, 0)} of revenue, about ${last.margin == null ? '—' : fmt(last.margin, 0)} is net profit${india ? '; the second line is profit before tax' : ''}.`,
      lines(c, rows, [r => r.margin, india ? r => r.pbt && r.revenue ? r.pbt / r.revenue * 100 : null : null].filter(Boolean), lbl)),
    eps.length ? tile(c, 'Earnings per share', cur(c, eps.at(-1).eps), 'Net profit for each share (diluted).', bars(c, eps, q => q.eps, q => quarterOf(q.end).replace(' 20', " '"))) : null,
    tile(c, 'Debt', null, 'How much the company owes and whether it is going up or down.', null),
    tile(c, 'Cash flow', null, 'Cash the business makes from operations after spending on growth.', null)].filter(Boolean);
  return el('section', {class: 'card', 'aria-label': 'Financials in detail'}, head(c, 'Financials in detail', india ? 'consolidated, as filed with NSE' : 'as filed with the SEC'),
    el('div', {class: 'acts', style: 'margin-bottom:10px'}, seg(c, 'Periods', [['q', 'Quarters'], ['y', 'Years']], RES, k => { RES = k; }),
      el('span', {class: 'small muted'}, `${rows.length} ${RES === 'y' ? 'years' : 'quarters'} recorded`)),
    el('div', {class: 'tiles'}, ...tiles));
}

function tile(c, title, value, words, chart) {
  const {el} = c;
  return el('div', {class: 'tile' + (chart ? '' : ' empty')}, el('div', {class: 'tile-h'}, el('b', {}, title), value == null ? gap(c, title) : el('span', {class: 'v'}, value)),
    chart || el('div', {class: 'nochart'}, c.icon('info'), 'Not in the stock tool’s records yet'), el('small', {}, words));
}

/* small bars, one per period; a second series (optional) drawn beside it; values below zero hang under the line */
function bars(c, rows, f, lbl, g, cls = 'rev') {
  const W = 300, H = 110, vals = rows.flatMap(r => [f(r), g ? g(r) : null]).filter(v => v != null);
  const s = c.svgEl('svg', {viewBox: `0 0 ${W} ${H + 16}`, class: 'plot bars mini', role: 'img', 'aria-label': rows.map(r => `${lbl(r)}: ${f(r) == null ? 'not recorded' : fmt(f(r), 1)}`).join('; ')});
  if (!vals.length) return s;
  const top = Math.max(0, ...vals), bot = Math.min(0, ...vals), Y = v => 4 + (top - v) / (top - bot || 1) * (H - 8), slot = W / rows.length, bw = slot * (g ? 0.32 : 0.56);
  rows.forEach((r, i) => { [[f(r), 0], [g ? g(r) : null, 1]].forEach(([v, k]) => { if (v == null) return;
      const x = i * slot + slot / 2 + (g ? (k ? 1 : -bw - 1) : -bw / 2);
      s.append(c.svgEl('rect', {class: v < 0 ? 'loss' : k ? 'prof' : cls, x, y: Math.min(Y(v), Y(0)), width: bw, height: Math.max(1, Math.abs(Y(v) - Y(0)))})); });
    const t = c.svgEl('text', {x: i * slot + slot / 2, y: H + 13, 'text-anchor': 'middle', class: 'lbl'}); t.textContent = lbl(r); s.append(t); });
  s.append(c.svgEl('line', {class: 'zero', x1: 0, x2: W, y1: Y(0), y2: Y(0)}));
  return s;
}

/* small lines for percentages (margins), each point labelled */
function lines(c, rows, fs, lbl) {
  const W = 300, H = 110, vals = rows.flatMap(r => fs.map(f => f(r))).filter(v => v != null), lo = Math.min(0, ...vals), hi = Math.max(...vals, 1);
  const s = c.svgEl('svg', {viewBox: `0 0 ${W} ${H + 16}`, class: 'plot bars mini', role: 'img', 'aria-label': rows.map(r => `${lbl(r)}: ${fs.map(f => f(r) == null ? '—' : fmt(f(r), 1) + '%').join(', ')}`).join('; ')});
  const slot = W / rows.length, X = i => i * slot + slot / 2, Y = v => 14 + (hi - v) / (hi - lo || 1) * (H - 22);
  fs.forEach((f, k) => { const pts = rows.map((r, i) => f(r) == null ? null : `${X(i)},${Y(f(r))}`).filter(Boolean);
    if (pts.length > 1) s.append(c.svgEl('polyline', {class: k ? 'mline2' : 'mline', points: pts.join(' ')}));
    if (!k) rows.forEach((r, i) => { if (f(r) == null) return; const t = c.svgEl('text', {x: X(i), y: Y(f(r)) - 6, 'text-anchor': 'middle', class: 'mval'}); t.textContent = fmt(f(r), 1); s.append(t); }); });
  rows.forEach((r, i) => { const t = c.svgEl('text', {x: X(i), y: H + 13, 'text-anchor': 'middle', class: 'lbl'}); t.textContent = lbl(r); s.append(t); });
  return s;
}
