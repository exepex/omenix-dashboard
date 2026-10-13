/* Who is winning: one card per family, ranked by its overall miss score, with its points against the yardstick, a
   small running-total line, its traits and its tested verdicts; then the question-by-question heatmap. */
function leaderboard(main, c) {
  const {el} = c, S = state(), O = ov();
  const sec = el('section', {class: 'card sec', 'aria-label': 'Who is winning'}, head(c, 'Who is winning', O ? `all five questions together · points against “${refName()}”` : null));
  if (!O) return main.append(sec.append(el('div', {class: 'quiet'}, 'Empty: no forecast has been scored yet. Each family will get a card here: its rank, its points against the simple yardstick, how often it leaned the right way, and why it is ahead or behind.'), famStatus(c)), sec), void 0;
  const ranked = runningFams().filter(f => settledDays(O, f.id) >= D.rules.min_dates).sort((a, b) => O.table[a.id].brier - O.table[b.id].brier);
  const early = runningFams().filter(f => !ranked.includes(f)), idle = D.families.filter(f => !ranked.includes(f) && !early.includes(f));
  sec.append(el('div', {class: 'leaders'}, ...ranked.map((f, i) => leaderCard(c, S, O, f, i + 1)), ...early.map(f => leaderCard(c, S, O, f, null)), ...idle.map(f => el('div', {class: 'leader idle'},
    el('div', {class: 'lh'}, c.apBadge(AP[f.id])), el('b', {class: 'big muted'}, 'Not running yet'), el('small', {}, 'Joins with its own daily sessions. Never counted as zero.')))));
  sec.append(howto(c, `Points: each settled forecast earns points when it misses less than “${refName()}” (the share of the last 3 years on which the answer was yes) and loses points when it misses more. Ranked by the miss score over all five questions, once a family has 40 settled days on each; shown, not tested: the tests are per question, in the table below.`));
  main.append(sec);
}

function leaderCard(c, S, O, f, rank) {
  const {el} = c, t = O.table[f.id], up = t.points >= 0, tests = Object.values(S.questions).flatMap(b => b.comparisons.filter(r => r.a === f.id && r.b.startsWith('baseline')));
  const n = v => tests.filter(r => r.verdict === v).length, early = n('too_few_dates') + n('before_review');
  return el('div', {class: 'leader' + (rank === 1 ? ' first' : '')},
    el('div', {class: 'lh'}, rank ? el('span', {class: 'rank', 'aria-label': `Rank ${rank}`}, `${rank}${['st', 'nd', 'rd'][rank - 1]}`) : el('span', {class: 'mb-label warn'}, c.icon('timer'), 'Not ranked yet'), c.apBadge(AP[f.id])),
    rank ? null : el('small', {}, `Too early to rank: ${settledDays(O, f.id)} of ${D.rules.min_dates} settled days on its slowest question. Early leads often vanish.`),
    el('b', {class: 'big ' + (up ? 'pos' : 'neg')}, c.icon(up ? 'trending_up' : 'trending_down'), `${signed(t.points, 0)} points`),
    el('small', {}, up ? `ahead of “${refName()}”` : `behind “${refName()}”`),
    spark(c, f.id),
    el('div', {class: 'lfacts'}, fact(c, 'Miss score', miss(t.brier), 'lower is better'), fact(c, 'Leaned right', `${Math.round(t.right_pct)}%`, 'of its forecasts'),
      fact(c, 'How sure', `${Math.round(t.bold_pct)}%`, '0% = always 50/50'), fact(c, 'Honesty gap', `${fmt1(t.honesty_gap)} pts`, 'said vs happened')),
    el('p', {class: 'why'}, rank ? whyLine(t) : 'Too early to say why: with this few settled forecasts its habits can still change a lot.'),
    el('div', {class: 'lver'}, early ? verdictEl(c, 'too_few_dates', `${early} of 10 yardstick tests wait for days or the review`)
      : n('better') || n('worse') ? el('span', {class: 'acts'}, n('better') ? verdictEl(c, 'better', `on ${n('better')} of 10 tests`) : null, n('worse') ? verdictEl(c, 'worse', `on ${n('worse')} of 10 tests`) : null)
      : verdictEl(c, 'no_difference', 'on all 10 tests')));
}
/* settled days on the family's slowest question: no rank before every question has the protocol's 40 */
function settledDays(O, fid) { return Math.min(...Object.values(O.table[fid].questions).map(q => q.n || 0)); }
function fmt1(x) { return x == null ? '—' : x.toFixed(1); }
function fact(c, k, v, s) { return c.el('div', {class: 'mb-fact'}, c.el('span', {class: 'k'}, k), c.el('b', {}, v), c.el('small', {}, s)); }

/* the running total of one family's points over all five questions, as a small line */
function spark(c, fid) {
  const pts = raceSeries(fid, 'all'), W = 220, H = 40;
  if (pts.length < 2) return null;
  const vals = pts.map(p => p[1]), lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), X = i => i / (pts.length - 1) * W, Y = v => 3 + (hi - v) / (hi - lo || 1) * (H - 6);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot spark', role: 'img', 'aria-label': `Running total from ${signed(vals[0], 0)} to ${signed(vals.at(-1), 0)} points`});
  svg.append(c.svgEl('line', {class: 'zero', x1: 0, x2: W, y1: Y(0), y2: Y(0)}), c.svgEl('polyline', {class: 'line ' + LINE[fid], points: vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}));
  return svg;
}

/* question by question: points per forecast against the yardstick as a coloured tile, with the protocol's verdict */
function heatmap(main, c) {
  const {el} = c, S = state(), O = ov();
  const sec = el('section', {class: 'card sec', 'aria-label': 'Question by question'}, head(c, 'Question by question', 'where each family wins and loses, with the official verdict'));
  if (!O) return main.append(sec.append(el('div', {class: 'quiet'}, 'Empty: each cell will show a family’s points per forecast on one question, coloured green when ahead of the yardstick and red when behind, with the official verdict under it.')), sec), void 0;
  const tile = (x, v, sub) => { const s = x == null ? '' : Math.abs(x) >= 5 ? ' s3' : Math.abs(x) >= 2 ? ' s2' : ' s1';
    return el('div', {class: 'mb-heat-tile' + (x == null ? '' : x >= 0 ? ' up' : ' down') + s}, el('b', {}, x == null ? '—' : signed(x, 1)), el('small', {}, x == null ? 'no settled forecast' : 'points each'), v ? verdictEl(c, v, sub) : null); };
  const table = el('table', {class: 'board heat'}, el('thead', {}, el('tr', {}, el('th', {}, 'Family'), ...D.questions.map((q, i) => el('th', {}, `${i + 1}. ${q.short}`)), el('th', {}, 'All five'))),
    el('tbody', {}, ...D.families.map(f => { const t = O.table[f.id] || {};
      return el('tr', {}, el('th', {scope: 'row'}, c.apBadge(AP[f.id]), el('small', {class: 'muted', style: 'display:block;margin-top:4px;font-weight:400'}, coverage(S, f.id))),
        ...D.questions.map((q, i) => { const x = cell(S, f.id, q.id), qt = (t.questions || {})[q.id] || {};
          return el('td', {'data-k': `${i + 1}. ${q.short}`}, tile(qt.points_per_forecast, x.v, x.v === 'too_few_dates' ? `${x.n} of ${D.rules.min_dates} days` : null)); }),
        el('td', {'data-k': 'All five'}, tile(t.n ? +(t.points / t.n).toFixed(2) : null, null))); })));
  sec.append(el('div', {class: 'scroll'}, table),
    howto(c, 'Colour and sign: points per forecast against the yardstick (green ahead, red behind; darker is bigger). Under it, the official verdict per question: a tick only when the lead is too big to be luck. “All five” is shown, not tested.'));
  main.append(sec);
}

function cell(S, fam, qid) {
  const rows = S.questions[qid].comparisons.filter(r => r.a === fam && r.b.startsWith('baseline')), has = v => rows.filter(r => r.verdict === v);
  if (has('not_running').length) return {v: 'not_running'};
  if (has('too_few_dates').length) return {v: 'too_few_dates', n: Math.min(...rows.map(r => r.n_dates))};
  if (has('before_review').length) return {v: 'before_review'};
  if (has('worse').length) return {v: 'worse'};
  return {v: has('better').length ? 'better' : 'no_difference'};
}

function coverage(S, fam) {
  const f = S.forecasters[fam];
  if (f.status !== 'running') return f.status === 'not_started' ? 'Not started' : 'Not running yet: never counted as zero';
  const missed = f.days - f.with_forecast;
  return `Forecast on ${f.with_forecast} of ${f.days} days${missed ? `; ${missed} missed (counted, never scored)` : ''}`;
}

/* the empty board still says where each family stands, so "not running" is never mistaken for "scored zero" */
function famStatus(c) {
  const {el} = c;
  return el('div', {class: 'firsts'}, ...D.families.map(f => el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, c.apBadge(AP[f.id])),
    el('b', {}, f.id === 'book1_rules' ? 'Starts first' : 'Joins later'),
    el('small', {}, f.id === 'book1_rules' ? 'Its daily forecasts start with step G3.' : 'With its own daily sessions (step G5). Until then: not running, never zero.'))));
}
