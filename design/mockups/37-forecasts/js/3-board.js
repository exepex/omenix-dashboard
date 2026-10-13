/* The scoreboard: one row per family, one column per question. Each cell sums up the family's two tests against that
   question's yardsticks in one verdict (glyph, word, colour), with "not proven yet" and its days still needed. */
function cell(S, fam, qid) {
  const rows = S.questions[qid].comparisons.filter(r => r.a === fam && r.b.startsWith('baseline'));
  const has = v => rows.filter(r => r.verdict === v);
  if (has('not_running').length) return {v: 'not_running', sub: 'no forecasts'};
  if (has('too_few_dates').length) return {v: 'too_few_dates', n: Math.min(...rows.map(r => r.n_dates))};
  if (has('before_review').length) return {v: 'before_review', sub: 'waits for the first review'};
  if (has('worse').length) return {v: 'worse', sub: 'than ' + has('worse').map(r => nameOf(r.b).toLowerCase()).join(' and ')};
  const won = has('better');
  return won.length ? {v: 'better', sub: won.length === rows.length ? 'than both yardsticks' : 'than ' + nameOf(won[0].b).toLowerCase()} : {v: 'no_difference', sub: 'from the yardsticks'};
}

function board(main, c) {
  const {el} = c, S = state();
  const sec = el('section', {class: 'card sec', 'aria-label': 'Scoreboard'}, head(c, 'Who reads NIFTY best', 'each family against the simple yardsticks, question by question'));
  if (!Object.keys(S.questions).length) {
    sec.append(el('div', {class: 'quiet'}, 'Empty: no forecast has been scored yet. Each cell will say whether the family is better or worse than the yardsticks, or not proven yet with the days still needed.'),
      famStatus(c, S));
    return main.append(sec);
  }
  const table = el('table', {class: 'board'}, el('thead', {}, el('tr', {}, el('th', {}, 'Family'), ...D.questions.map((q, i) => el('th', {}, `${i + 1}. ${q.short}`)))),
    el('tbody', {}, ...D.families.map(f => el('tr', {}, el('th', {scope: 'row'}, c.apBadge(AP[f.id]), el('small', {class: 'muted', style: 'display:block;margin-top:4px;font-weight:400'}, coverage(S, f.id))),
      ...D.questions.map((q, i) => { const x = cell(S, f.id, q.id);
        return el('td', {'data-k': `${i + 1}. ${q.short}`}, verdictEl(c, x.v, x.sub), x.v === 'too_few_dates' ? proof(c, x.n) : null); })))));
  sec.append(el('div', {class: 'scroll'}, table),
    howto(c, 'Green tick: its misses are smaller than the yardsticks’, and too big a gap to be luck. Red cross: bigger. Grey line: no clear difference. Amber timer: not proven yet. Tap a question below to see the numbers behind a cell.'));
  main.append(sec);
}

function coverage(S, fam) {
  const f = S.forecasters[fam];
  if (f.status !== 'running') return f.status === 'not_started' ? 'Not started' : 'Not running yet: never counted as zero';
  const missed = f.days - f.with_forecast;
  return `Forecast on ${f.with_forecast} of ${f.days} days${missed ? `; ${missed} missed (counted, never scored)` : ''}`;
}

/* the empty board still says where each family stands, so "not running" is never mistaken for "scored zero" */
function famStatus(c, S) {
  const {el} = c;
  return el('div', {class: 'firsts'}, ...D.families.map(f => el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, c.apBadge(AP[f.id])),
    el('b', {}, f.id === 'book1_rules' ? 'Starts first' : 'Joins later'),
    el('small', {}, f.id === 'book1_rules' ? 'Its daily forecasts start with step G3.' : 'With its own daily sessions (step G5). Until then: not running, never zero.'))));
}
