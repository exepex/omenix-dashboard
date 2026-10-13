/* The race chart of the chosen period: every family on one chart, as running totals (lines) or as the points won in
   each day, week or month (grouped bars), counted by the day each answer came in. */
function raceFrame(c, lo, hi, label) {
  const phone = matchMedia('(max-width:599px)').matches, W = phone ? 380 : 1000, H = phone ? 250 : 300, L = phone ? 48 : 52, R = phone ? 112 : 118, Y = v => 10 + (hi - v) / (hi - lo || 1) * (H - 36);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot race', role: 'img', 'aria-label': label}), step = niceStep((hi - lo) / 5);
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    svg.append(c.svgEl('line', {class: v === 0 ? 'zero' : 'grid', x1: L, x2: W - R, y1: Y(v), y2: Y(v)}));
    const t = c.svgEl('text', {x: L - 6, y: Y(v) + 4, 'text-anchor': 'end'}); t.textContent = signed(v, 0); svg.append(t);
  }
  const z = c.svgEl('text', {x: W - R + 4, y: Y(0) + 4, class: 'ref'}); z.textContent = 'past average = 0'; svg.append(z);
  return {svg, W, H, L, R, Y};
}
function niceStep(x) { const p = 10 ** Math.floor(Math.log10(x || 1)), m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
function shortDate(day) { const d = dateOf(day); return d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'}) : ''; }

function raceLines(c, fams, rows) {
  const S = fams.map(f => [f, runningTotal(rows[f.id])]).filter(([, s]) => s.length), all = S.flatMap(([, s]) => s);
  const d0 = Math.min(...all.map(p => p[0])), d1 = Math.max(...all.map(p => p[0])), vals = all.map(p => p[1]);
  const F = raceFrame(c, Math.min(0, ...vals), Math.max(0, ...vals), S.map(([f, s]) => `${f.name}: ${signed(s.at(-1)[1], 0)} points by ${dayText(s.at(-1)[0])}`).join('; '));
  const X = d => F.L + (d - d0) / (d1 - d0 || 1) * (F.W - F.L - F.R);
  for (const [f, s] of S) F.svg.append(c.svgEl('polyline', {class: 'line ' + LINE[f.id], points: s.map(([d, v]) => `${X(d).toFixed(1)},${F.Y(v).toFixed(1)}`).join(' ')}));
  const ends = S.map(([f, s]) => ({f, v: s.at(-1)[1], y: F.Y(s.at(-1)[1])})).sort((a, b) => a.y - b.y);
  ends.forEach((e, i) => { if (i && e.y - ends[i - 1].y < 15) e.y = ends[i - 1].y + 15; });
  for (const e of ends) { const t = c.svgEl('text', {x: F.W - F.R + 4, y: e.y + 4, class: 'end ' + LINE[e.f.id]}); t.textContent = `${e.f.name} ${signed(e.v, 0)}`; F.svg.append(t); }
  for (const [d, a] of [[d0, 'start'], [d1, 'end']]) { const t = c.svgEl('text', {x: X(d), y: F.H - 6, 'text-anchor': a}); t.textContent = shortDate(d); F.svg.append(t); }
  return hoverable(c, F, S, X, d0, d1);
}

/* hover or touch: a vertical line and every family's total on that day */
function hoverable(c, F, S, X, d0, d1) {
  const tip = c.el('div', {class: 'xtip', hidden: true}), cross = c.svgEl('line', {class: 'cross', y1: 10, y2: F.H - 26, x1: -9, x2: -9});
  F.svg.append(cross);
  const hide = () => { tip.hidden = true; cross.setAttribute('x1', -9); cross.setAttribute('x2', -9); };
  F.svg.addEventListener('pointermove', e => { const r = F.svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * F.W, d = Math.round(d0 + (x - F.L) / (F.W - F.L - F.R) * (d1 - d0));
    if (d < d0 || d > d1) return hide();
    cross.setAttribute('x1', X(d)); cross.setAttribute('x2', X(d)); tip.hidden = false;
    tip.textContent = `${dayText(d)}: ` + S.map(([f, s]) => { const p = s.filter(q => q[0] <= d).at(-1); return `${f.name} ${p ? signed(p[1], 0) : '—'}`; }).join(' · '); });
  F.svg.addEventListener('pointerleave', hide);
  return c.el('div', {class: 'pchart'}, F.svg, tip);
}

function raceBars(c, fams, rows, a, size) {
  const B = fams.map(f => { const out = {}; for (const [d, p] of rows[f.id]) { const k = Math.floor((d - a) / size); out[k] = (out[k] || 0) + p; } return [f, out]; });
  const keys = [...new Set(B.flatMap(([, b]) => Object.keys(b).map(Number)))].sort((x, y) => x - y), vals = B.flatMap(([, b]) => Object.values(b));
  const F = raceFrame(c, Math.min(0, ...vals), Math.max(0, ...vals), 'Points won or lost in each period, by family');
  const slot = (F.W - F.L - F.R) / keys.length, bw = Math.max(2, Math.min(16, slot / (fams.length + 1))), every = Math.ceil(keys.length / 8);
  keys.forEach((k, i) => { B.forEach(([f, b], j) => { const v = b[k]; if (v == null) return;
      F.svg.append(c.svgEl('rect', {class: 'bar ' + LINE[f.id], x: F.L + i * slot + (slot - bw * fams.length) / 2 + j * bw, width: Math.max(1, bw - 1), y: Math.min(F.Y(v), F.Y(0)), height: Math.max(1, Math.abs(F.Y(v) - F.Y(0))), 'data-tip': `${f.name}, from ${dayText(a + k * size)}: ${signed(v, 0)} points`})); });
    if (i % every === 0) { const t = c.svgEl('text', {x: F.L + i * slot + slot / 2, y: F.H - 6, 'text-anchor': 'middle'}); t.textContent = shortDate(a + k * size); F.svg.append(t); } });
  return F.svg;
}

function raceKeys(c, fams) {
  return c.el('div', {class: 'keys'}, ...fams.map(f => c.el('span', {}, c.el('i', {class: 'k' + LINE[f.id].slice(1)}), f.name)), c.el('span', {}, c.el('i', {class: 'kz'}), '0 = the past average'));
}
