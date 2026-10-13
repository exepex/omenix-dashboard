/* The period's chart: every family's running profit on one chart with the comparison line (lines), or the profit of
   each week or month as grouped bars. Hover or touch shows every value on a day. */
function cumulative(trades, a, b) {
  const by = {}; for (const t of trades) by[t[1]] = (by[t[1]] || 0) + t[3];
  let run = 0; const out = [[a, 0]];
  for (let d = a; d <= b; d++) if (by[d] != null) out.push([d, run += by[d]]);
  if (out.at(-1)[0] !== b) out.push([b, run]);
  return out;
}
function frame(c, lo, hi, label) {
  const phone = matchMedia('(max-width:599px)').matches, W = phone ? 380 : 1000, H = phone ? 250 : 300, L = phone ? 62 : 80, R = phone ? 104 : 130;
  const Y = v => 10 + (hi - v) / (hi - lo || 1) * (H - 36), svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot race', role: 'img', 'aria-label': label});
  const step = nice((hi - lo) / 5);
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    svg.append(c.svgEl('line', {class: v === 0 ? 'zero' : 'grid', x1: L, x2: W - R, y1: Y(v), y2: Y(v)}));
    const t = c.svgEl('text', {x: L - 6, y: Y(v) + 4, 'text-anchor': 'end'}); t.textContent = short(c, v); svg.append(t);
  }
  return {svg, W, H, L, R, Y};
}
function nice(x) { const p = 10 ** Math.floor(Math.log10(x || 1)), m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
/* compact money for axes: ₹1.2L / ₹45k / $1.2k */
function short(c, v) { const a = Math.abs(v), s = v < 0 ? '−' : v > 0 ? '+' : '', cur = inr(c) ? '₹' : '$';
  return a >= 1e5 && inr(c) ? `${s}${cur}${+(a / 1e5).toFixed(1)}L` : a >= 1e3 ? `${s}${cur}${+(a / 1e3).toFixed(1)}k` : `${s}${cur}${Math.round(a)}`; }

function lines(c, fams, rows, a, b) {
  const S = fams.map(f => [f, nameOf(f), cumulative(rows[f], a, b)]), ref = reference();
  if (ref === 'baseline') S.push(['baseline', 'Baselines', cumulative(within(tradesOf(c, 'baseline', 'stocks'), a, b), a, b)]);
  if (ref === 'nifty' && state().index) S.push(['nifty', 'Holding NIFTY', niftyLine(c, a, b)]);
  const vals = S.flatMap(x => x[2].map(p => p[1])), F = frame(c, Math.min(0, ...vals), Math.max(0, ...vals), S.map(([, n, s]) => `${n}: ${money(c, s.at(-1)[1])}`).join('; '));
  const X = d => F.L + (d - a) / (b - a || 1) * (F.W - F.L - F.R);
  for (const [f, , s] of S) F.svg.append(c.svgEl('polyline', {class: 'line ' + LINE[f] + (f === 'baseline' || f === 'nifty' ? ' y' : ''), points: s.map(([d, v]) => `${X(d).toFixed(1)},${F.Y(v).toFixed(1)}`).join(' ')}));
  const ends = S.map(([f, n, s]) => ({f, n, v: s.at(-1)[1], y: F.Y(s.at(-1)[1])})).sort((p, q) => p.y - q.y);
  ends.forEach((e, i) => { if (i && e.y - ends[i - 1].y < 15) e.y = ends[i - 1].y + 15; });
  for (const e of ends) { const t = c.svgEl('text', {x: F.W - F.R + 4, y: e.y + 4, class: 'end ' + LINE[e.f]}); t.textContent = `${e.n} ${short(c, e.v)}`; F.svg.append(t); }
  for (const [d, an] of [[a, 'start'], [b, 'end']]) { const t = c.svgEl('text', {x: X(d), y: F.H - 6, 'text-anchor': an}); t.textContent = dshort(dateOf(d)); F.svg.append(t); }
  const tip = c.el('div', {class: 'xtip', hidden: true}), cross = c.svgEl('line', {class: 'cross', y1: 10, y2: F.H - 26, x1: -9, x2: -9});
  F.svg.append(cross);
  const hide = () => { tip.hidden = true; cross.setAttribute('x1', -9); cross.setAttribute('x2', -9); };
  F.svg.addEventListener('pointermove', e => { const r = F.svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * F.W, d = Math.round(a + (x - F.L) / (F.W - F.L - F.R) * (b - a));
    if (d < a || d > b) return hide();
    cross.setAttribute('x1', X(d)); cross.setAttribute('x2', X(d)); tip.hidden = false;
    tip.textContent = `${dayText(d)}: ` + S.map(([, n, s]) => { const p = s.filter(q => q[0] <= d).at(-1); return `${n} ${p ? money(c, p[1]) : '—'}`; }).join(' · '); });
  F.svg.addEventListener('pointerleave', hide);
  return c.el('div', {class: 'pchart'}, F.svg, tip);
}

function bars(c, fams, rows, a, size) {
  const B = fams.map(f => { const out = {}; for (const t of rows[f]) { const k = Math.floor((t[1] - a) / size); out[k] = (out[k] || 0) + t[3]; } return [f, out]; });
  const keysIn = [...new Set(B.flatMap(([, o]) => Object.keys(o).map(Number)))].sort((x, y) => x - y), vals = B.flatMap(([, o]) => Object.values(o));
  const F = frame(c, Math.min(0, ...vals), Math.max(0, ...vals), 'Profit of each period, by family');
  const slot = (F.W - F.L - F.R) / Math.max(1, keysIn.length), bw = Math.max(2, Math.min(18, slot / (fams.length + 1))), every = Math.ceil(keysIn.length / 8);
  keysIn.forEach((k, i) => { B.forEach(([f, o], j) => { const v = o[k]; if (v == null) return;
      F.svg.append(c.svgEl('rect', {class: 'bar ' + LINE[f], x: F.L + i * slot + (slot - bw * fams.length) / 2 + j * bw, width: Math.max(1, bw - 1), y: Math.min(F.Y(v), F.Y(0)), height: Math.max(1, Math.abs(F.Y(v) - F.Y(0))), 'data-tip': `${nameOf(f)}, from ${dayText(a + k * size)}: ${money(c, v)}`})); });
    if (i % every === 0) { const t = c.svgEl('text', {x: F.L + i * slot + slot / 2, y: F.H - 6, 'text-anchor': 'middle'}); t.textContent = dshort(dateOf(a + k * size)); F.svg.append(t); } });
  return F.svg;
}

function keys(c, fams) {
  const ref = reference(), {el} = c;
  return el('div', {class: 'keys'}, ...fams.map(f => el('span', {}, el('i', {class: 'k' + LINE[f].slice(1)}), nameOf(f))),
    ref === 'baseline' ? el('span', {}, el('i', {class: 'ky'}), 'Baselines (for comparison)') : ref === 'nifty' && state().index ? el('span', {}, el('i', {class: 'ky'}), `Holding NIFTY with ${plain(c, mk(c).fno_capital)}`) : null);
}
