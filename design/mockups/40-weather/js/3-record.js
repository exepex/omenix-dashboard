/* The record: the last sessions' colours against what happened, how often it is RED against its 15% maximum, its
   score against the usual chance, and this month's price of the RED rule. */
function recordPart(col, c) {
  const {el} = c, W = wx(), R = W.red_share, P = W.price_of_calm;
  col.append(sec(c, 'The last sessions', el('div', {class: 'strip', role: 'list'}, ...W.recent.map(r => el('span', {role: 'listitem'}, dshort(r.session), colourLabel(c, r.colour),
    r.big_move == null ? 'not known yet' : r.big_move ? '2% move' : 'no big move'))), howto(c, 'Each session’s colour and whether a 2% move came next. A RED with no move is not a mistake on its own; only many sessions tell.')),
  sec(c, ['How often it is RED', R.over_alarming ? el('span', {class: 'mb-label danger'}, c.icon('warning'), 'Over-alarming') : el('span', {class: 'mb-label success'}, c.icon('check'), 'Within the limit')],
    el('div', {class: 'cap'}, el('div', {class: 'bar', role: 'img', 'aria-label': `${pct(R.share, 1)} of sessions RED; the limit is 15%`}, el('i', {style: `width:${Math.min(100, (R.share || 0) / 0.3 * 100).toFixed(1)}%`})),
      el('small', {class: 'muted'}, R.sessions ? `RED on ${R.red_sessions} of the last ${R.sessions} sessions (${pct(R.share, 1)}); the limit is ${pct(R.max_share)}. Above it, a new version must be proposed; RED still blocks until you approve it.` : 'No session counted yet.'))),
  sec(c, 'Its record against the usual chance', el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
    el('thead', {}, el('tr', {}, ...['Question', 'Days', 'Miss score', 'Usual chance', 'Verdict'].map(h => el('th', {scope: 'col'}, h)))),
    el('tbody', {}, ...W.scores.map(s => { const [cls, g, w] = VERDICT[s.verdict];
      return el('tr', {}, el('td', {'data-k': 'Question'}, s.question === 'V6_1d' ? 'Next session' : 'Within 5 sessions'), el('td', {class: 'md-numeric', 'data-k': 'Days'}, String(s.n_scored), el('small', {}, `test needs ${s.n_needed}`)),
        el('td', {class: 'md-numeric', 'data-k': 'Miss score'}, s.brier == null ? '—' : s.brier.toFixed(3)), el('td', {class: 'md-numeric', 'data-k': 'Usual chance'}, s.brier_base_rate == null ? '—' : s.brier_base_rate.toFixed(3)),
        el('td', {'data-k': 'Verdict'}, el('span', {class: 'mb-label ' + cls}, c.icon(g), w))); })))),
    howto(c, 'Miss score (Brier): 0 is perfect; lower is better. The weather must beat simply saying the usual chance every day.')),
  sec(c, 'This month’s price of the RED rule', P.status === 'measured' ? el('div', {class: 'facts3'}, fact(c, 'Trades blocked', String(P.blocked_trades)),
      fact(c, 'Risk avoided', rs(c, P.risk_avoided), 'Their maximum losses'),
      fact(c, P.shadow_net > 0 ? 'RED cost' : 'RED saved', rs(c, Math.abs(P.shadow_net)), 'What the blocked trades would have made, on paper'))
    : el('p', {class: 'small muted', style: 'margin:0'}, P.status === 'nothing_blocked' ? 'Nothing was blocked this month.' : 'Not measured yet: the blocked trades’ shadow results come later.'),
    howto(c, 'RED is kept by choice as a survival rule. This shows honestly whether it costs or saves money.')));
}
