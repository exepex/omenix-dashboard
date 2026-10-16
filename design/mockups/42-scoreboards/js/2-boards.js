/* The two boards, each in its own card and table: B (whole systems) and A (matched decisions). Never added together,
   never one "winner" across them. */
const STATUS = {ok: ['success', 'check', 'Ran'], pilot: ['warn', 'science', 'Pilot: no verdict'], not_run: ['neutral', 'remove', 'Not run yet']};
const BEATS = {yes: ['success', 'check', 'Yes'], no: ['danger', 'close', 'No'], not_tested: ['neutral', 'timer', 'Not enough trades yet']};
function boardCard(c, title, what, B) {
  const {el} = c, [cls, g, w] = STATUS[B.status];
  return sec(c, [title, el('span', {class: 'mb-label ' + cls}, c.icon(g), w), c.paperTag()],
    el('p', {class: 'small muted', style: 'margin:0 0 8px'}, what),
    B.status === 'not_run' ? el('p', {class: 'empty muted'}, 'No run yet: this board fills in once the books have closed trades.')
    : el('div', {}, el('p', {class: 'small', style: 'margin:0 0 6px'}, B.label + (B.as_of ? ` · as of ${dlabel(B.as_of)}` : '')),
      el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
        el('thead', {}, el('tr', {}, ...['Book', 'Trades', 'After all costs', 'Worst month', 'Largest fall', 'Beats doing nothing?'].map(h => el('th', {scope: 'col'}, h)))),
        el('tbody', {}, ...B.books.map(b => { const v = b.beats_do_nothing == null ? null : BEATS[b.beats_do_nothing];
          return el('tr', {}, el('td', {'data-k': 'Book'}, family(c, b.family)), el('td', {class: 'md-numeric', 'data-k': 'Trades'}, String(b.trades)),
            el('td', {'data-k': 'After all costs'}, pnlLabel(c, b.net)), el('td', {class: 'md-numeric', 'data-k': 'Worst month'}, b.worst_month == null ? '—' : signed(c, b.worst_month)),
            el('td', {class: 'md-numeric', 'data-k': 'Largest fall'}, rs(c, b.max_drawdown)),
            el('td', {'data-k': 'Beats doing nothing?'}, v ? el('span', {class: 'mb-label ' + v[0]}, c.icon(v[1]), v[2]) : el('small', {class: 'muted'}, 'No verdict in a pilot'))); })))),
      el('p', {class: 'small', style: 'margin:8px 0 0'}, 'Doing nothing (a NIFTY index fund with the same money, same days): ', B.do_nothing_net == null ? '—' : pnlLabel(c, B.do_nothing_net))),
    howto(c, 'Each book is its own row; the rows are never added up. "Beats doing nothing" uses the test frozen before the results were seen.'));
}
function boardsPart(main, c) {
  const P = pay();
  main.append(c.el('div', {class: 'stack'},
    boardCard(c, 'Scoreboard B: whole systems', 'Each book\'s whole paper account: which complete system made the most money after every cost.', P.board_b),
    boardCard(c, 'Scoreboard A: matched decisions', 'Every book\'s decisions on the same opportunities on a standard shadow account: whose judgement is better.', P.board_a)));
}
