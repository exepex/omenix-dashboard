/* Overall, since the start: one card per family, ranked by its points against the past average once it has 40
   answered days on every question; its running line, its habits in plain words, why it is where it is, and the
   official verdict. Overall totals are shown, not tested (the official tests are per question). */
function overallPart(main, c) {
  const {el} = c, S = state(), O = ov();
  const sec = el('section', {class: 'card sec', 'aria-label': 'Overall, since the start'}, head(c, 'Overall, since the start', O ? `${dayText(1)} to ${dayText(S.day)} · all five predictions together` : 'the whole track record'));
  if (!O) { sec.append(quiet(c, 'Empty: no prediction has been answered yet. Each family will get a card here: its rank, its points against the past average, how often it called the direction right, and why it is ahead or behind.'), famStatus(c)); main.append(sec); return; }
  const ranked = runningFams().filter(f => settledDays(O, f.id) >= D.rules.min_dates).sort((a, b) => O.table[b.id].points - O.table[a.id].points);
  const early = runningFams().filter(f => !ranked.includes(f)), idle = D.families.filter(f => !ranked.includes(f) && !early.includes(f));
  sec.append(el('div', {class: 'leaders'}, ...ranked.map((f, i) => leaderCard(c, S, O, f, i + 1)), ...early.map(f => leaderCard(c, S, O, f, null)), ...idle.map(f => el('div', {class: 'leader idle'},
    el('div', {class: 'lh'}, c.apBadge(AP[f.id])), el('b', {class: 'big muted'}, 'Not running yet'), el('small', {}, 'Joins with its own daily sessions. Never counted as zero.')))));
  sec.append(howto(c, `Points: every answered prediction is compared with the past average’s on the same day. Example: the past average said 50%, the family said 80%, and it happened: the family earns 21 points. Had it not happened, it loses 39. Missing a prediction earns nothing. A family is ranked once it has ${D.rules.min_dates} answered days on every question.`));
  main.append(sec);
}

function leaderCard(c, S, O, f, rank) {
  const {el} = c, t = O.table[f.id], up = t.points >= 0;
  return el('div', {class: 'leader' + (rank === 1 ? ' first' : '')},
    el('div', {class: 'lh'}, rank ? el('span', {class: 'rank', 'aria-label': `Rank ${rank}`}, `${rank}${['st', 'nd', 'rd'][rank - 1]}`) : el('span', {class: 'mb-label warn'}, c.icon('timer'), 'Not ranked yet'), c.apBadge(AP[f.id])),
    rank ? null : el('small', {}, `Too early to rank: ${settledDays(O, f.id)} of ${D.rules.min_dates} answered days on its slowest question. Early leads often vanish.`),
    el('b', {class: 'big ' + (up ? 'pos' : 'neg')}, c.icon(up ? 'trending_up' : 'trending_down'), `${signed(t.points, 0)} points`),
    el('small', {}, up ? 'ahead of the past average' : 'behind the past average'),
    spark(c, f.id),
    el('div', {class: 'lfacts'}, fact(c, 'Right direction', `${Math.round(t.right_pct)}%`, 'of its predictions'), fact(c, 'Average miss', miss(t.brier), '0 is perfect; 0.25 is a coin toss'),
      fact(c, 'Confidence', `${Math.round(t.bold_pct)}%`, '0% always says 50/50'), fact(c, 'Trust gap', `${fmt1(t.honesty_gap)} pts`, 'lower: its chances come true as often as it says')),
    el('p', {class: 'why'}, rank ? whyLine(t) : 'Too early to say why: with this few answers its habits can still change a lot.'),
    officialLine(c, S, f.id));
}
/* the official verdict over its 10 tests against the yardsticks (2 per question) */
function officialLine(c, S, fid) {
  const tests = Object.values(S.questions).flatMap(b => b.comparisons.filter(r => r.a === fid && r.b.startsWith('baseline'))), n = v => tests.filter(r => r.verdict === v).length;
  const wait = n('too_few_dates') + n('before_review');
  if (wait) return c.el('div', {class: 'lver'}, verdictEl(c, 'too_few_dates', `official verdict: ${wait} of 10 tests still waiting`));
  if (!n('better') && !n('worse')) return c.el('div', {class: 'lver'}, verdictEl(c, 'no_difference', 'official verdict on all 10 tests'));
  return c.el('div', {class: 'lver'}, n('better') ? verdictEl(c, 'better', `official, on ${n('better')} of 10 tests`) : null, n('worse') ? verdictEl(c, 'worse', `official, on ${n('worse')} of 10 tests`) : null);
}
function fact(c, k, v, s) { return c.el('div', {class: 'mb-fact'}, c.el('span', {class: 'k'}, k), c.el('b', {}, v), c.el('small', {}, s)); }

/* the running total of one family's points since the start, as a small line */
function spark(c, fid) {
  const pts = runningTotal(rowsIn(fid, 'all', 1, Infinity)), W = 220, H = 40;
  if (pts.length < 2) return null;
  const vals = pts.map(p => p[1]), lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), X = i => i / (pts.length - 1) * W, Y = v => 3 + (hi - v) / (hi - lo || 1) * (H - 6);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot spark', role: 'img', 'aria-label': `Running total since the start: ${signed(vals.at(-1), 0)} points`});
  svg.append(c.svgEl('line', {class: 'zero', x1: 0, x2: W, y1: Y(0), y2: Y(0)}), c.svgEl('polyline', {class: 'line ' + LINE[fid], points: vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}));
  return svg;
}

function famStatus(c) {
  const {el} = c;
  return el('div', {class: 'firsts'}, ...D.families.map(f => el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, c.apBadge(AP[f.id])),
    el('b', {}, f.id === 'book1_rules' ? 'Starts first' : 'Joins later'),
    el('small', {}, f.id === 'book1_rules' ? 'Its daily predictions start with step G3.' : 'With its own daily sessions (step G5). Until then: not running, never zero.'))));
}
