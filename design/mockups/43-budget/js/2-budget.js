/* The month's minutes against the cap (a bar with the alert mark, all shares from the payload), the level with its meaning, and the minutes by
   kind of work. Minutes only: no model name, no session. */
const LEVEL = {ok: ['success', 'check', 'Within budget'], alert: ['warn', 'warning', 'Alert: close to the cap'], stop: ['danger', 'block', 'Stop: the cap is reached'], unknown: ['neutral', 'help', 'Unknown']};
const GROUP = {ai_books: 'AI books (forecasts)', ai_roles: 'AI roles (desk meeting)', post_mortem: 'Weekly post-mortem', data_routines: 'Data routines', development: 'Building the tool'};
function mins(x) { return `${Math.round(x).toLocaleString('en-IN')} min`; }
function budgetPart(main, c) {
  const {el} = c, B = pay(), [cls, g, w] = LEVEL[B.level], pct = B.pct_of_cap;
  main.append(el('div', {class: 'stack'},
    sec(c, ['AI books and roles this month', el('span', {class: 'mb-label ' + cls}, c.icon(g), w)],
      el('div', {class: 'facts2'}, fact(c, 'Used', mins(B.books_and_roles_minutes), `in ${B.month}`), fact(c, 'Cap', mins(B.cap_minutes), `${B.share_pct}% of ${mins(B.basis_minutes)} ${B.basis === 'plan' ? 'in your plan' : 'measured'}`)),
      el('div', {class: 'cap'}, el('div', {class: 'bar', role: 'img', 'aria-label': pct == null ? 'Nothing to measure yet' : `${pct.toFixed(0)}% of the cap used; the alert is at ${B.alert_pct}%`},
        pct == null ? null : el('i', {style: `width:${Math.min(100, pct).toFixed(1)}%`}), el('span', {class: 'tick', style: `left:${Math.min(100, B.alert_pct)}%`})),
        el('small', {class: 'muted'}, pct == null ? 'Nothing to measure yet.' : `${pct.toFixed(0)}% of the cap used. At ${B.alert_pct}% an alert goes out; at ${B.stop_pct}% the AI roles stop, the AI forecasters last.`)),
      B.note ? el('p', {class: 'small', style: 'margin:8px 0 0'}, c.icon('info'), ' ', B.note) : null,
      howto(c, `The budget is counted in minutes of AI sessions, not money. The AI books and roles may use at most ${B.share_pct}% of the basis.`)),
    sec(c, 'Minutes by kind of work', B.groups.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table'},
      el('thead', {}, el('tr', {}, ...['Kind of work', 'Minutes', 'Runs'].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...B.groups.map(r => el('tr', {}, el('td', {}, GROUP[r.group]), el('td', {class: 'md-numeric'}, mins(r.minutes)), el('td', {class: 'md-numeric'}, String(r.runs)))))))
      : el('p', {class: 'empty muted'}, 'No minutes recorded this month.'),
      howto(c, 'Building the tool counts in the basis, not against the cap.'))));
}
