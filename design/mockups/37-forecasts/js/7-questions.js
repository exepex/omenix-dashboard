/* How each family does on each of the five predictions (owner: "question by question ... I did not understand"): one
   row per prediction, asked in plain words with why it matters, then each family's points per prediction against the
   past average as a coloured tile, with the official verdict under it. */
function questionsPart(main, c) {
  const {el} = c, S = state(), O = ov();
  const sec = el('section', {class: 'card sec', 'aria-label': 'Each prediction'}, head(c, 'Which family is best at which prediction', 'overall since the start, one row per prediction'));
  sec.append(el('p', {class: 'small', style: 'margin:0 0 10px'}, 'The families do not predict NIFTY’s price. They answer the same five yes-or-no questions every day, about the next two to four weeks. A family can be good at one and poor at another.'));
  const tile = (x, v, n) => { const s = x == null ? '' : Math.abs(x) >= 5 ? ' s3' : Math.abs(x) >= 2 ? ' s2' : ' s1';
    return el('div', {class: 'mb-heat-tile' + (x == null ? '' : x >= 0 ? ' up' : ' down') + s}, el('b', {}, x == null ? '—' : signed(x, 1)), el('small', {}, x == null ? 'nothing answered yet' : 'points per prediction'),
      v ? verdictEl(c, v, v === 'too_few_dates' ? `${n} of ${D.rules.min_dates} days` : null) : null); };
  const rows = D.questions.map((q, i) => el('tr', {}, el('th', {scope: 'row'}, el('b', {}, `${i + 1}. ${q.short}`), el('span', {class: 'qp'}, q.plain), el('small', {}, q.why)),
    ...D.families.map(f => { const qt = O && O.table[f.id] && O.table[f.id].questions[q.id] || {}, x = O ? cell(S, f.id, q.id) : {v: null};
      return el('td', {'data-k': f.name}, O ? tile(qt.points_per_forecast, x.v, x.n) : el('span', {class: 'muted small'}, 'not answered yet')); })));
  sec.append(el('div', {class: 'scroll'}, el('table', {class: 'board heat'}, el('thead', {}, el('tr', {}, el('th', {}, 'Prediction'), ...D.families.map(f => el('th', {}, c.apBadge(AP[f.id]))))), el('tbody', {}, ...rows))),
    howto(c, O ? 'Green: on this prediction the family beat the past average (darker: by more). Red: it did worse. Under it, the official verdict: a tick only when the lead is too big to be luck.'
      : 'Empty: each cell will show how the family does on that prediction against the past average, with the official verdict under it.'));
  main.append(sec);
}

/* the official verdict of one family on one prediction, from its two tests against the yardsticks */
function cell(S, fam, qid) {
  const rows = S.questions[qid].comparisons.filter(r => r.a === fam && r.b.startsWith('baseline')), has = v => rows.filter(r => r.verdict === v);
  if (has('not_running').length) return {v: 'not_running'};
  if (has('too_few_dates').length) return {v: 'too_few_dates', n: Math.min(...rows.map(r => r.n_dates))};
  if (has('before_review').length) return {v: 'before_review'};
  if (has('worse').length) return {v: 'worse'};
  return {v: has('better').length ? 'better' : 'no_difference'};
}
