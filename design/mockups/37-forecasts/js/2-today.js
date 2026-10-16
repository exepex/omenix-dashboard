/* Today's forecasts on top, the past below, each said plainly (owner, 13 Oct 2026, second feedback round). */
function todayPart(main, c) {
  const {el} = c, qs = pay().questions.filter(q => q.today);
  main.append(el('div', {class: 'stack'}, sec(c, 'Today: what each forecaster says',
    qs.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
      el('thead', {}, el('tr', {}, ...['Question', 'Answers', 'Answer known on'].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...qs.map(q => el('tr', {}, el('td', {'data-k': 'Question'}, q.plain),
        el('td', {'data-k': 'Answers'}, q.today.values.map(v => `${fname(v.forecaster)} ${answer(q, v)}${VSTATUS[v.status]}`).join(' · ')),
        el('td', {'data-k': 'Answer known on'}, dlabel(q.today.answer_on))))))) : el('p', {class: 'empty muted'}, 'No forecast was made today.'),
    howto(c, 'Nobody is right or wrong yet: these answers are known only on the answer date. Everything below is the past, forecasts whose answers are known.'))));
}
