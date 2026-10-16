/* The chances, session by session (contract 2.9; owner, 16 Oct 2026: the levels stay public): the weather's chance of
   a 2% move beside the usual chance, for the next session or within 5 sessions. A session not scored has no point. */
let HORIZON = '1d';
const HORIZONS = [['1d', 'Next session'], ['5d', 'Within 5 sessions']];
function pct0(x) { return `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`; }
/* the line's unbroken stretches: a session without a value breaks it, never joined across */
function runs(S, key, X, Y) {
  const out = [[]];
  S.forEach((s, i) => { if (s[key] == null) out.push([]); else out.at(-1).push(`${X(i).toFixed(1)},${Y(s[key]).toFixed(1)}`); });
  return out.filter(r => r.length).map(r => r.join(' '));
}
function chancesChart(c, S, p, b) {
  const pts = S.filter(s => s[p] != null), hi = Math.max(...pts.flatMap(s => [s[p], s[b]])) * 1.1, W = 1000, H = 240, L = 52, R = 16;
  const X = i => L + i / Math.max(1, S.length - 1) * (W - L - R), Y = v => 10 + (hi - v) / hi * (H - 36);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot race', role: 'img', 'aria-label': `The weather's chance against the usual chance over ${S.length} sessions`});
  for (const v of [0, hi / 2, hi]) { svg.append(c.svgEl('line', {class: 'grid', x1: L, x2: W - R, y1: Y(v), y2: Y(v)})); const t = c.svgEl('text', {x: L - 6, y: Y(v) + 4, 'text-anchor': 'end'}); t.textContent = pct0(v); svg.append(t); }
  for (const [key, cls] of [[b, 'line y'], [p, 'line l1']]) for (const run of runs(S, key, X, Y)) svg.append(c.svgEl('polyline', {class: cls, points: run}));
  S.forEach((s, i) => { if (s.colour === 'RED') svg.append(c.svgEl('circle', {class: 'red', cx: X(i), cy: Y(s[p]), r: 4})); });
  for (const [i, an] of [[0, 'start'], [S.length - 1, 'end']]) { const t = c.svgEl('text', {x: X(i), y: H - 6, 'text-anchor': an}); t.textContent = dshort(S[i].session); svg.append(t); }
  return svg;
}
function chancesPart(main, c) {
  const {el} = c, S = pay().sessions, [p, b] = HORIZON === '1d' ? ['p_big_1d', 'base_rate_1d'] : ['p_big_5d', 'base_rate_5d'];
  if (!S.some(s => s[p] != null)) return;
  main.append(el('div', {class: 'stack'}, sec(c, 'The chance of a big move, session by session',
    el('div', {class: 'md-segmented dense qpick', role: 'group', 'aria-label': 'Horizon'}, ...HORIZONS.map(([k, w]) => el('button', {type: 'button', 'aria-pressed': String(k === HORIZON), onclick: () => { HORIZON = k; c.rerender(); }}, w))),
    chancesChart(c, S, p, b),
    el('div', {class: 'keys'}, el('span', {}, el('i', {class: 'l1'}), 'The weather’s chance of a 2% move'), el('span', {}, el('i', {class: 'y'}), 'The usual chance (how often it happened)'), el('span', {}, el('i', {class: 'dot'}), 'A RED session')),
    howto(c, 'When the solid line rises well above the dashed one, the weather expects a big move more often than usual; that is when it turns AMBER or RED. A gap is a session it could not score.'))));
}
