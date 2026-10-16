/* One card per question: today's answers, each forecaster's average miss score, the comparison against the yardstick
   with its verdict, and when it could settle. Waiting and not-started questions say why. */
const QSTATE = {scoring: ['success', 'check', 'Scoring'], waiting_for_data: ['warn', 'schedule', 'Waiting for data'], not_started: ['neutral', 'remove', 'Not started']};
const VERDICT = {better: ['success', 'check', 'Better than the yardstick'], worse: ['danger', 'close', 'Worse than the yardstick'], no_difference: ['neutral', 'trending_flat', 'No clear difference'],
  futile: ['neutral', 'block', 'Cannot win: stop testing'], not_tested: ['neutral', 'timer', 'Not enough days yet'], before_review: ['neutral', 'event', 'Before its review date']};
const VSTATUS = {counted: '', pending: ' (pending)', late: ' (late, not counted)', breach: ' (audit breach, not counted)', model_mismatch: ' (wrong model, not counted)'};
function answer(q, v) { return q.kind === 'probability' ? (v.probability == null ? '—' : `${Math.round(v.probability * 100)}%`) : (v.variance == null ? '—' : v.variance.toFixed(4)); }
function settle(s) {
  return s.status === 'not_measured' ? 'Too few days to say when it could settle (under 60).' : s.status === 'projected' ? `Could settle around ${dlabel(s.projected_date)}.`
    : `Would need until ${s.projected_date ? dlabel(s.projected_date) : 'more than 2 years'}: too long to wait.`;
}
function questionCard(c, q) {
  const {el} = c, [cls, g, w] = QSTATE[q.status], S = q.scores;
  return el('section', {class: 'card sec q', 'aria-label': q.plain}, el('h2', {}, q.plain, el('span', {class: 'mb-label ' + cls}, c.icon(g), w), el('small', {}, `${q.id} · protocol ${q.protocol} · answer in ${q.horizon_sessions} session${q.horizon_sessions === 1 ? '' : 's'}`)),
    q.waiting_for.length ? el('ul', {class: 'small', style: 'margin:0 0 8px;padding-left:18px'}, ...q.waiting_for.map(m => el('li', {}, `${m.input} (${m.story}): ${m.detail}`))) : null,
    q.today ? el('p', {class: 'small', style: 'margin:0 0 8px'}, el('b', {}, `Today (${dlabel(q.today.made_on)}): `), q.today.values.map(v => `${fname(v.forecaster)} ${answer(q, v)}${VSTATUS[v.status]}`).join(' · ')) : null,
    S && S.per_forecaster.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
      el('thead', {}, el('tr', {}, ...['Forecaster', 'Days', 'Missing', `Average miss (${q.metric === 'brier' ? 'Brier' : 'QLIKE'}, lower is better)`].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...S.per_forecaster.map(p => el('tr', {}, el('td', {'data-k': 'Forecaster'}, fname(p.forecaster)), el('td', {class: 'md-numeric', 'data-k': 'Days'}, String(p.n)),
        el('td', {class: 'md-numeric', 'data-k': 'Missing'}, String(p.n_missing)), el('td', {class: 'md-numeric', 'data-k': 'Average miss'}, p.mean_loss == null ? '—' : p.mean_loss.toFixed(3))))))) : null,
    S && S.comparisons.length ? el('ul', {class: 'drivers', style: 'list-style:none;padding:0;margin:8px 0 0;display:grid;gap:6px'}, ...S.comparisons.map(m => { const [vc, vg, vw] = VERDICT[m.verdict];
      return el('li', {class: 'small'}, el('span', {class: 'mb-label ' + vc}, c.icon(vg), vw), ` ${fname(m.forecaster)} against ${fname(m.baseline)}, ${m.n_pairs} days compared`); })) : null,
    S ? el('p', {class: 'small muted', style: 'margin:8px 0 0'}, settle(q.settle)) : null,
    howto(c, `The yardstick is ${fname(q.primary_baseline)}, fixed before any result was seen. "Better" needs the whole interval below zero, not one lucky month.`));
}
function questionsPart(main, c) { main.append(c.el('div', {class: 'stack'}, ...pay().questions.map(q => questionCard(c, q)))); }
