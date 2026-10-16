/* Which forecaster beats the yardstick on which question (owner, 13 Oct 2026): one row per question, from the
   backend's own verdicts. No rank across questions: Brier and QLIKE scores are on different scales. */
function namesWith(S, verdict) { return S.comparisons.filter(m => m.verdict === verdict).map(m => fname(m.forecaster)); }
function bestCell(c, S) {
  const better = namesWith(S, 'better'), worse = namesWith(S, 'worse');
  if (!S.comparisons.length) return c.el('span', {class: 'mb-label neutral'}, c.icon('timer'), 'Not tested yet');
  return c.el('span', {}, better.length ? c.el('span', {class: 'mb-label success'}, c.icon('check'), 'Better: ' + better.join(', ')) : c.el('span', {class: 'mb-label neutral'}, c.icon('trending_flat'), 'Nobody better yet'),
    worse.length ? c.el('small', {}, 'Worse: ' + worse.join(', ')) : null);
}
function bestPart(main, c) {
  const {el} = c, qs = pay().questions.filter(q => q.scores);
  main.append(el('div', {class: 'stack'}, sec(c, 'The past: who beats the yardstick, question by question',
    qs.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
      el('thead', {}, el('tr', {}, ...['Question', 'Against the yardstick', 'Yardstick'].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...qs.map(q => el('tr', {}, el('td', {'data-k': 'Question'}, q.plain), el('td', {'data-k': 'Against the yardstick'}, bestCell(c, q.scores)),
        el('td', {'data-k': 'Yardstick'}, fname(q.primary_baseline))))))) : el('p', {class: 'empty muted'}, 'No question has a score yet.'),
    howto(c, 'Each question has its own yardstick, fixed before any result. A forecaster is "better" only when the test says so over many days, not after one good week.'))));
}
