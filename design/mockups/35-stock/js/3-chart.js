/* The price chart (owner, 13 Oct 2026): hover or tap for a crosshair with the date, price and the comparisons; drag
   across (or pinch) to zoom, double-click or "Reset zoom" to go back; NIFTY 50 and the sector index to compare with;
   the model's 50% and 80% expected range for N+1..N+5 as a fan past the last close; open paper trades' buys marked. */
let ZOOM = null;   /* [from, to] indices within the period, or null */
const FAN = 5, CW = 640, CH = 330;

function priceChart(c, S) {
  const {el} = c, C = S.chart, n = Math.min(SPANS[PER][1], C.close.length - 1), start = C.close.length - 1 - n;
  const box = el('div', {class: 'pchart'}), tip = el('div', {class: 'xtip', role: 'status', 'aria-live': 'polite'});
  tip.hidden = true;
  const reset = el('button', {class: 'md-btn text small', type: 'button', hidden: !ZOOM, onclick: () => { ZOOM = null; draw(); }}, c.icon('close'), 'Reset zoom');
  const legend = el('div', {class: 'axis'});
  const series = () => {
    const [a, b] = ZOOM || [0, n], i0 = start + a, i1 = start + b, base = C.close[i0];
    const pick = arr => arr ? arr.slice(i0, i1 + 1) : null;
    return {i0, i1, base, own: pick(C.close), dates: pick(C.dates), bench: CMP ? pick(C.bench) : null, sector: SEC && C.sector ? pick(C.sector.close) : null, atEnd: i1 === C.close.length - 1};
  };
  function draw() {
    const D0 = series(), rel = CMP || SEC, norm = (v, arr) => v == null ? null : rel ? v / arr.find(x => x != null) * 100 : v;
    const lines = [['own', D0.own, 'var(--mb-chart-1)', '']].concat(D0.bench ? [['bench', D0.bench, 'var(--mb-chart-2)', '6 4']] : [], D0.sector ? [['sector', D0.sector, 'var(--mb-chart-3)', '2 3']] : []);
    const fan = D0.atEnd ? S.tools.horizons.map(h => ({h: h.h, d: h.target_date, lo80: h.lo80, hi80: h.hi80, lo50: h.lo50, hi50: h.hi50, mid: h.mid})) : [];
    const fanN = v => rel ? v / D0.base * 100 : v;
    const vals = lines.flatMap(([, arr]) => arr.map(v => norm(v, arr)).filter(v => v != null)).concat(fan.flatMap(f => [fanN(f.lo80), fanN(f.hi80)]));
    const lo = Math.min(...vals), hi = Math.max(...vals), hist = D0.own.length - 1, frac = fan.length ? 0.8 : 1;   /* the fan keeps 20% of the width, room for its numbers */
    const X = i => i <= hist ? i / (hist || 1) * CW * frac : CW * frac + (i - hist) / FAN * CW * (1 - frac), Y = v => CH - 10 - (v - lo) / (hi - lo || 1) * (CH - 20);
    const svg = c.svgEl('svg', {viewBox: `0 0 ${CW} ${CH}`, preserveAspectRatio: 'none', class: 'plot', role: 'img', style: `height:${CH}px`,
      'aria-label': `${S.ticker} from ${day(c, D0.dates[0])} to ${day(c, D0.dates.at(-1))}${fan.length ? ', with the model’s expected range for the next five sessions' : ''}`});
    if (fan.length) {   /* the fan: from the last close to each horizon's 80% and 50% bounds */
      const x0 = X(D0.own.length - 1), y0 = Y(norm(D0.own.at(-1), D0.own)), at = (k, key) => `${X(D0.own.length - 1 + k)},${Y(fanN(fan[k - 1][key]))}`;
      for (const [key, cls] of [['80', 'fan80'], ['50', 'fan50']]) {
        const up = fan.map((f, k) => at(k + 1, 'hi' + key)), down = fan.map((f, k) => at(k + 1, 'lo' + key)).reverse();
        svg.append(c.svgEl('polygon', {class: cls, points: [`${x0},${y0}`, ...up, ...down].join(' ')}));
      }
    }
    for (const [, arr, color, dash] of lines) {
      const runs = [[]]; arr.forEach((v, i) => v == null ? runs.push([]) : runs.at(-1).push(`${X(i).toFixed(1)},${Y(norm(v, arr)).toFixed(1)}`));
      for (const r of runs.filter(r => r.length > 1)) svg.append(c.svgEl('polyline', {points: r.join(' '), fill: 'none', stroke: color, 'stroke-width': '2', 'stroke-dasharray': dash, 'vector-effect': 'non-scaling-stroke'}));
    }
    for (const t of groupTrades(S.trades)) {   /* where the open paper trades bought */
      const i = D0.dates.indexOf(t.entry_date);
      if (i >= 0) svg.append(c.svgEl('circle', {class: 'entry', cx: X(i), cy: Y(rel ? t.entry / D0.base * 100 : t.entry), r: 4, 'vector-effect': 'non-scaling-stroke'}));
    }
    if (fan.length) svg.append(c.svgEl('polyline', {class: 'fanmid', points: [[0, D0.own.at(-1)], ...fan.map((f, k) => [k + 1, f.mid])].map(([k, v]) => `${X(hist + k)},${Y(fanN(v))}`).join(' '), 'vector-effect': 'non-scaling-stroke'}));
    const ov = el('div', {class: 'ov', 'aria-hidden': 'true'}), pos = (x, y) => `left:${(x / CW * 100).toFixed(2)}%;top:${(y / CH * 100).toFixed(2)}%`;
    if (fan.length) { const f = fan.at(-1);   /* the forecast's numbers at its end: 4-in-5 high, middle, 4-in-5 low */
      for (const [v, cls] of [[f.hi80, 'hi'], [f.mid, 'md'], [f.lo80, 'lo']]) ov.append(el('span', {class: 'fl ' + cls, style: `right:0;top:${(Y(fanN(v)) / CH * 100).toFixed(2)}%`}, fmt(v, 0))); }
    if (EX) for (const m of S.example_marks.marks) {   /* labelled example: the marks a proven family would draw */
      const b = D0.dates.indexOf(m.buy), s = D0.dates.indexOf(m.sell);
      if (b >= 0) ov.append(el('span', {class: 'mk buy', style: pos(X(b), Y(norm(m.buy_at, D0.own)))}, '▲', el('span', {class: 't'}, ' Buy')));
      if (s >= 0) ov.append(el('span', {class: 'mk sell ' + (m.ret >= 0 ? 'up' : 'down'), style: pos(X(s), Y(norm(m.sell_at, D0.own)))}, '▼', el('span', {class: 't'}, ` Sell ${pct(m.ret)}`)));
    }
    const cross = c.svgEl('line', {class: 'cross', y1: 0, y2: CH, hidden: true, 'vector-effect': 'non-scaling-stroke'}), sel = c.svgEl('rect', {class: 'sel', y: 0, height: CH, width: 0, hidden: true});
    svg.append(cross, sel);
    box.replaceChildren(svg, ov, tip);
    reset.hidden = !ZOOM;
    const ret = (D0.own.at(-1) / D0.base - 1) * 100;
    legend.replaceChildren(el('span', {}, day(c, D0.dates[0])),
      el('span', {class: 'keys'}, el('i', {class: 'k1'}), `${S.ticker} ${pct(ret)}`, D0.bench ? [el('i', {class: 'k2'}), C.bench_name] : null, D0.sector ? [el('i', {class: 'k3'}), C.sector.name] : null,
        fan.length ? [el('i', {class: 'kf'}), 'our forecast range, next 5 sessions'] : null, S.trades.length ? [el('i', {class: 'ke'}), 'paper buys'] : null),
      el('span', {}, fan.length ? `+5 sessions` : day(c, D0.dates.at(-1))));
    const fanTip = fx => { if (!fan.length || fx <= frac) return null; const h = S.tools.horizons[Math.min(4, Math.floor((fx - frac) / (1 - frac) * 5))];
      return `Forecast for ${day(c, h.target_date)}: middle ${fmt(h.mid)} · 1 in 2: ${fmt(h.lo50, 0)}–${fmt(h.hi50, 0)} · 4 in 5: ${fmt(h.lo80, 0)}–${fmt(h.hi80, 0)} (not proven)`; };
    interact(c, S, svg, cross, sel, tip, D0, X, fx => Math.round(Math.min(fx / frac, 1) * hist), draw, fanTip);
  }
  draw();
  return {box, legend, reset};
}

/* crosshair, drag-to-zoom, pinch-to-zoom and double-click reset on the chart's svg */
function interact(c, S, svg, cross, sel, tip, D0, X, toIndex, draw, fanTip) {
  const C = S.chart, idx = e => { const r = svg.getBoundingClientRect(); return Math.max(0, Math.min(D0.own.length - 1, toIndex((e.clientX - r.left) / r.width))); };
  const pts = new Map(); let drag = null, pinch = null;
  const show = i => {
    const g = D0.i0 + i, x = X(i); cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.hidden = false;
    const parts = [day(c, C.dates[g]), `${S.ticker} ${fmt(C.close[g])}`];
    if (D0.bench) parts.push(`${C.bench_name} ${fmt(C.bench[g])}`);
    if (D0.sector) parts.push(`${C.sector.name} ${C.sector.close[g] == null ? 'not recorded' : fmt(C.sector.close[g])}`);
    tip.textContent = parts.join(' · '); tip.hidden = false;
  };
  const zoomTo = (a, b) => { const lo = Math.max(0, Math.min(a, b)), hi = Math.min(D0.own.length - 1, Math.max(a, b)); if (hi - lo >= 4) { const off = (ZOOM || [0])[0]; ZOOM = [off + lo, off + hi]; draw(); } };
  svg.addEventListener('pointerdown', e => { pts.set(e.pointerId, e.clientX); svg.setPointerCapture(e.pointerId);
    if (pts.size === 2) { const [x1, x2] = [...pts.values()]; pinch = {d: Math.abs(x1 - x2), a: idx({clientX: Math.min(x1, x2)}), b: idx({clientX: Math.max(x1, x2)})}; drag = null; }
    else drag = {from: idx(e)}; });
  svg.addEventListener('pointermove', e => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, e.clientX);
    if (pinch && pts.size === 2) return;
    const r = svg.getBoundingClientRect(), ft = fanTip((e.clientX - r.left) / r.width);   /* inside the fan: that day's forecast */
    if (ft) { cross.hidden = true; tip.textContent = ft; tip.hidden = false; return; }
    const i = idx(e); show(i);
    if (drag && pts.size === 1 && Math.abs(i - drag.from) > 1) { sel.hidden = false; sel.setAttribute('x', X(Math.min(i, drag.from))); sel.setAttribute('width', Math.abs(X(i) - X(drag.from))); drag.to = i; }
  });
  const end = e => {
    if (pinch && pts.size === 2) { const [x1, x2] = [...pts.values()], k = Math.abs(x1 - x2) / (pinch.d || 1); if (k > 1.15) zoomTo(pinch.a, pinch.b); else if (k < 0.85) { ZOOM = null; draw(); } }
    else if (drag && drag.to != null) zoomTo(drag.from, drag.to);
    pts.delete(e.pointerId); if (!pts.size) { pinch = null; drag = null; sel.hidden = true; }
  };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  svg.addEventListener('pointerleave', () => { if (!pts.size) { cross.hidden = true; tip.hidden = true; } });
  svg.addEventListener('dblclick', () => { ZOOM = null; draw(); });
}

function chartCard(c, S) {
  const {el} = c, C = S.chart, P = priceChart(c, S);
  return el('section', {class: 'card', 'aria-label': 'Price chart'}, head(c, 'Price', 'hover or tap for values · drag across to zoom · double-click to reset'),
    el('div', {class: 'acts', style: 'margin-bottom:8px'}, seg(c, 'Period', Object.entries(SPANS).map(([k, v]) => [k, v[0]]), PER, k => { PER = k; ZOOM = null; }),
      el('button', {class: 'md-chip filter', type: 'button', 'aria-pressed': String(CMP), onclick: () => { CMP = !CMP; c.rerender(); }}, `Compare: ${C.bench_name}`),
      C.sector ? el('button', {class: 'md-chip filter', type: 'button', 'aria-pressed': String(SEC), onclick: () => { SEC = !SEC; c.rerender(); }}, `Compare: ${C.sector.name}`)
        : el('span', {class: 'small muted'}, 'Sector comparison: ', gap(c, 'A sector fund for this stock')), P.reset),
    P.box, P.legend, forecastLine(c, S), marksNote(c, S),
    CMP || SEC ? el('p', {class: 'muted small', style: 'margin:6px 0 0'}, `All lines start at 100 on the first day shown.${SEC && C.sector ? ` ${C.sector.name} is recorded from ${day(c, C.sector.from)}.` : ''}`) : null);
}

/* the forecast's numbers in one plain line under the chart (the fan shows them as a picture) */
function forecastLine(c, S) {
  const h = S.tools.horizons.at(-1);
  return c.el('p', {class: 'fline'}, c.el('b', {}, `Our forecast for ${day(c, h.target_date)}`), ` (in ${h.h} sessions): middle ${cur(c, h.mid)} · 1 in 2 chance between ${cur(c, h.lo50, 0)} and ${cur(c, h.hi50, 0)} · 4 in 5 chance between ${cur(c, h.lo80, 0)} and ${cur(c, h.hi80, 0)}. `,
    c.el('span', {class: 'mb-tag'}, 'not proven'), ' Hover or tap the fan for each day.');
}

/* buy and sell marks come only from a proven family; none is proven yet, so they show only as a labelled example */
function marksNote(c, S) {
  const {el} = c, X = S.example_marks, M = X.marks, won = M.filter(m => m.ret >= 0).length;
  return el('div', {class: 'marks'}, el('button', {class: 'md-chip filter', type: 'button', 'aria-pressed': String(!!EX), onclick: () => { EX = EX ? null : 'win'; c.rerender(); }}, 'Show example buy and sell marks'),
    EX ? el('div', {class: 'small'}, el('span', {class: 'mb-tag', 'data-tip': X.note}, 'Example data'), ` If ${S.tools.families[X.family].label} were ${X.proof}, its buys and sells would show like this: ${won} of ${M.length} trades made money (real price changes between the marked days).`,
        el('ul', {class: 'pts'}, ...M.map(m => el('li', {}, `▲ Buy ${day(c, m.buy)} at ${fmt(m.buy_at)} → ▼ Sell ${day(c, m.sell)} at ${fmt(m.sell_at)}: `, el('b', {class: m.ret >= 0 ? 'up' : 'down'}, pct(m.ret))))))
      : el('span', {class: 'small muted'}, 'Buy and sell marks appear on the chart only once a family is proven to beat the baselines. None is yet.'));
}
