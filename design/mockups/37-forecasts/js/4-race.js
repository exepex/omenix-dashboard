/* The race (owner, 13 Oct 2026: "a single line graph of all the strategies together ... every day, and that goes up to
   month"): every family's running total of points against the yardstick on one chart, day by day; or the points won
   in each week or month as grouped bars. All five questions together, or one. */
const PERIOD = {week: [5, 'Week', 'W'], month: [21, 'Month', 'M']};   /* trading days per bucket */

/* [[forecast day, value]]: the running total (rq 'all' sums the five questions day by day) */
function raceSeries(fid, rq) {
  const R = ov().race[fid] || {}, byDay = {};
  for (const [qid, pts] of Object.entries(R)) if (rq === 'all' || qid === D.questions[rq].id) for (const [d, p] of pts) byDay[d] = (byDay[d] || 0) + p;
  let run = 0;
  return Object.keys(byDay).map(Number).sort((a, b) => a - b).map(d => [d, +(run += byDay[d]).toFixed(1)]);
}
function bucketSeries(fid, rq, size) {
  const R = ov().race[fid] || {}, out = {};
  for (const [qid, pts] of Object.entries(R)) if (rq === 'all' || qid === D.questions[rq].id) for (const [d, p] of pts) { const b = Math.floor((d - 1) / size); out[b] = (out[b] || 0) + p; }
  return out;
}

function race(main, c) {
  const {el} = c, O = ov(), fams = runningFams();
  const sec = el('section', {class: 'card sec', 'aria-label': 'The race'}, head(c, 'The race', O ? `points against “${refName()}”, all families on one chart` : null));
  if (!O || !fams.length) return main.append(sec.append(el('div', {class: 'quiet'}, 'Empty: the race starts with the first settled forecast. One line per family will show its running total of points, day by day; weekly and monthly bars show who won each period.')), sec), void 0;
  sec.append(el('div', {class: 'acts'}, seg(c, 'View', [['total', 'Running total'], ['week', 'Each week'], ['month', 'Each month']], RV, k => { RV = k; }),
    seg(c, 'Questions', [['all', 'All five'], ...D.questions.map((q, i) => [i, `${i + 1}`])], RQ, k => { RQ = k; })));
  if (RQ !== 'all') sec.append(el('p', {class: 'small muted', style: 'margin:0 0 6px'}, `Question ${RQ + 1}: ${D.questions[RQ].plain}`));
  sec.append(RV === 'total' ? raceLines(c, fams) : raceBars(c, fams, PERIOD[RV]), raceKeys(c, fams), el('p', {class: 'small', style: 'margin:8px 0 0'}, raceWords(fams)));
  sec.append(howto(c, RV === 'total' ? 'Each line is a family’s running total. Going up: it is missing less than the yardstick; going down: more. The 0 line is the yardstick itself. A steady climb matters more than a lucky jump.'
    : `Each group of bars is one ${PERIOD[RV][1].toLowerCase()} (${PERIOD[RV][0]} trading days); bars above 0 won that ${PERIOD[RV][1].toLowerCase()} against the yardstick, below 0 lost it. Left to right in each group: ${fams.map(f => f.name).join(', ')}.`));
  main.append(sec);
}

function raceFrame(c, lo, hi, label) {
  const phone = matchMedia('(max-width:599px)').matches, W = phone ? 380 : 760, H = phone ? 260 : 280, L = phone ? 48 : 52, R = phone ? 124 : 110, Y = v => 10 + (hi - v) / (hi - lo || 1) * (H - 36);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot race', role: 'img', 'aria-label': label});
  const step = niceStep((hi - lo) / 5);
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    svg.append(c.svgEl('line', {class: v === 0 ? 'zero' : 'grid', x1: L, x2: W - R, y1: Y(v), y2: Y(v)}));
    const t = c.svgEl('text', {x: L - 6, y: Y(v) + 4, 'text-anchor': 'end'}); t.textContent = signed(v, 0); svg.append(t);
  }
  const z = c.svgEl('text', {x: W - R + 4, y: Y(0) + 4, class: 'ref'}); z.textContent = 'yardstick = 0'; svg.append(z);
  return {svg, W, H, L, R, Y};
}
function niceStep(x) { const p = 10 ** Math.floor(Math.log10(x || 1)), m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }

function raceLines(c, fams) {
  const S = fams.map(f => [f, raceSeries(f.id, RQ)]).filter(([, s]) => s.length), all = S.flatMap(([, s]) => s);
  if (!all.length) return c.el('div', {class: 'quiet'}, 'No settled forecast on this question yet.');
  const d0 = Math.min(...all.map(p => p[0])), d1 = Math.max(...all.map(p => p[0])), vals = all.map(p => p[1]);
  const F = raceFrame(c, Math.min(0, ...vals), Math.max(0, ...vals), S.map(([f, s]) => `${f.name}: ${signed(s.at(-1)[1], 0)} points by ${dayLabel(s.at(-1)[0])}`).join('; '));
  const X = d => F.L + (d - d0) / (d1 - d0 || 1) * (F.W - F.L - F.R);
  for (const [f, s] of S) F.svg.append(c.svgEl('polyline', {class: 'line ' + LINE[f.id], points: s.map(([d, v]) => `${X(d).toFixed(1)},${F.Y(v).toFixed(1)}`).join(' ')}));
  /* end labels: the name and the total beside each line, nudged apart so they never overlap */
  const ends = S.map(([f, s]) => ({f, v: s.at(-1)[1], y: F.Y(s.at(-1)[1])})).sort((a, b) => a.y - b.y);
  ends.forEach((e, i) => { if (i && e.y - ends[i - 1].y < 15) e.y = ends[i - 1].y + 15; });
  for (const e of ends) { const t = c.svgEl('text', {x: F.W - F.R + 4, y: e.y + 4, class: 'end ' + LINE[e.f.id]}); t.textContent = `${e.f.name} ${signed(e.v, 0)}`; F.svg.append(t); }
  for (const [d, a] of [[d0, 'start'], [d1, 'end']]) { const t = c.svgEl('text', {x: X(d), y: F.H - 6, 'text-anchor': a}); t.textContent = dayLabel(d); F.svg.append(t); }
  return hoverable(c, F, S, X, d0, d1);
}

/* hover or touch: a vertical line and every family's total on that day */
function hoverable(c, F, S, X, d0, d1) {
  const tip = c.el('div', {class: 'xtip', hidden: true}), cross = c.svgEl('line', {class: 'cross', y1: 10, y2: F.H - 26, x1: -9, x2: -9});
  F.svg.append(cross);
  const show = e => { const r = F.svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * F.W, d = Math.round(d0 + (x - F.L) / (F.W - F.L - F.R) * (d1 - d0));
    if (d < d0 || d > d1) return hide();
    cross.setAttribute('x1', X(d)); cross.setAttribute('x2', X(d)); tip.hidden = false;
    tip.textContent = `${dayLabel(d)}: ` + S.map(([f, s]) => { const p = s.filter(q => q[0] <= d).at(-1); return `${f.name} ${p ? signed(p[1], 0) : '—'}`; }).join(' · '); };
  const hide = () => { tip.hidden = true; cross.setAttribute('x1', -9); cross.setAttribute('x2', -9); };
  F.svg.addEventListener('pointermove', show); F.svg.addEventListener('pointerleave', hide);
  return c.el('div', {class: 'pchart'}, F.svg, tip);
}

function raceBars(c, fams, [size, word, short]) {
  const B = fams.map(f => [f, bucketSeries(f.id, RQ, size)]), keys = [...new Set(B.flatMap(([, b]) => Object.keys(b).map(Number)))].sort((a, b) => a - b);
  if (!keys.length) return c.el('div', {class: 'quiet'}, 'No settled forecast on this question yet.');
  const vals = B.flatMap(([, b]) => Object.values(b)), F = raceFrame(c, Math.min(0, ...vals), Math.max(0, ...vals), `${word}ly points by family`);
  const slot = (F.W - F.L - F.R) / keys.length, bw = Math.min(16, slot / (fams.length + 1));
  keys.forEach((k, i) => { B.forEach(([f, b], j) => { const v = b[k]; if (v == null) return;
      const x = F.L + i * slot + (slot - bw * fams.length) / 2 + j * bw, r = c.svgEl('rect', {class: 'bar ' + LINE[f.id], x, width: bw - 1, y: Math.min(F.Y(v), F.Y(0)), height: Math.max(1, Math.abs(F.Y(v) - F.Y(0))), 'data-tip': `${f.name}, ${word.toLowerCase()} ${k + 1}: ${signed(v, 0)} points`});
      F.svg.append(r); });
    if (keys.length <= 12 || i % 2 === 0) { const t = c.svgEl('text', {x: F.L + i * slot + slot / 2, y: F.H - 6, 'text-anchor': 'middle'}); t.textContent = `${short}${k + 1}`; F.svg.append(t); } });
  return F.svg;
}

function raceKeys(c, fams) {
  return c.el('div', {class: 'keys'}, ...fams.map(f => c.el('span', {}, c.el('i', {class: 'k' + LINE[f.id].slice(1)}), f.name)), c.el('span', {}, c.el('i', {class: 'kz'}), `0 = “${refName()}”`));
}

/* the race in words: who leads, by how much, and who won the latest month */
function raceWords(fams) {
  const tot = fams.map(f => [f, (raceSeries(f.id, RQ).at(-1) || [0, 0])[1]]).sort((a, b) => b[1] - a[1]);
  const last = fams.map(f => { const b = bucketSeries(f.id, RQ, 21), k = Math.max(...Object.keys(b).map(Number)); return [f, b[k], k]; }).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]);
  const lead = tot.length > 1 ? `${tot[0][0].name} leads with ${signed(tot[0][1], 0)} points, ${Math.round(tot[0][1] - tot[1][1])} ahead of ${tot[1][0].name}.` : `${tot[0][0].name}: ${signed(tot[0][1], 0)} points so far.`;
  const behind = tot.filter(x => x[1] < 0).map(x => x[0].name);
  return `${lead}${behind.length ? ` ${behind.join(' and ')} ${behind.length > 1 ? 'are' : 'is'} behind the yardstick.` : ''}${last.length ? ` Latest month: ${last.map(([f, v]) => `${f.name} ${signed(v, 0)}`).join(', ')}.` : ''}`;
}
