/* The books (what each may trade and why not), the approved strategies' paper results after every cost, and the
   real-money checks (never eligible from this screen; the owner decides in writing). */
const RSTATUS = {active: ['success', 'check', 'Active'], paused: ['warn', 'timer', 'Paused'], retired: ['neutral', 'remove', 'Retired']};
function booksPart(main, c) {
  const {el} = c, P = pay();
  main.append(el('div', {class: 'stack'}, sec(c, ['What each book may trade', c.paperTag()], el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
    el('thead', {}, el('tr', {}, ...['Book', 'Approved strategies', 'Trading?', 'AI and data costs'].map(h => el('th', {scope: 'col'}, h)))),
    el('tbody', {}, ...P.books.map(b => el('tr', {}, el('td', {'data-k': 'Book'}, family(c, b.family)), el('td', {'data-k': 'Approved strategies'}, b.approved.length ? b.approved.join(', ') : 'None'),
      el('td', {'data-k': 'Trading?'}, b.trading ? el('span', {class: 'mb-label success'}, c.icon('check'), 'Yes') : el('span', {class: 'mb-label neutral'}, c.icon('remove'), 'No'), b.why_not ? el('small', {}, b.why_not) : null),
      el('td', {class: 'md-numeric', 'data-k': 'AI and data costs'}, b.ai_and_data_costs == null ? '—' : rs(c, b.ai_and_data_costs))))))),
    howto(c, 'A book trades only strategies that passed their test. Its AI and data costs count against its results.')),
    sec(c, ['Paper results after every cost', c.paperTag()], P.results.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
      el('thead', {}, el('tr', {}, ...['Strategy', 'Status', 'Trades', 'Before costs', 'Costs', 'After costs', 'After tax', 'Against an index fund'].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...P.results.map(r => { const [cls, g, w] = RSTATUS[r.status];
        return el('tr', {}, el('td', {'data-k': 'Strategy'}, r.strategy, el('small', {}, `${SHELL.families[r.family].label} · rung ${r.rung}`)), el('td', {'data-k': 'Status'}, el('span', {class: 'mb-label ' + cls}, c.icon(g), w), r.pause_reason ? el('small', {}, r.pause_reason) : null),
          el('td', {class: 'md-numeric', 'data-k': 'Trades'}, `${r.trades}`, el('small', {}, `${r.won} won · ${r.lost} lost`)), el('td', {class: 'md-numeric', 'data-k': 'Before costs'}, signed(c, r.gross)),
          el('td', {class: 'md-numeric', 'data-k': 'Costs'}, rs(c, r.costs)), el('td', {'data-k': 'After costs'}, pnlLabel(c, r.net)), el('td', {class: 'md-numeric', 'data-k': 'After tax'}, signed(c, r.net_after_tax)),
          el('td', {class: 'md-numeric', 'data-k': 'Against an index fund'}, signed(c, r.vs_index_fund))); }))))
      : el('p', {class: 'empty muted'}, 'No strategy has passed, so there is no paper result yet.'),
      howto(c, 'Costs are charges and price pads. "Against an index fund" is what it made above simply holding NIFTY with the same money.')),
    sec(c, 'Real money', el('p', {class: 'small', style: 'margin:0 0 8px'}, el('span', {class: 'mb-label neutral'}, c.icon('lock'), 'Not eligible'), ' Paper only: real money needs every check below and your written approval.'),
      el('ul', {class: 'drivers', style: 'list-style:none;padding:0;margin:0;display:grid;gap:6px'}, ...P.real_money.checks.map(k => el('li', {class: 'small'},
        k.met === true ? el('span', {class: 'mb-label success'}, c.icon('check'), 'Met') : k.met === false ? el('span', {class: 'mb-label danger'}, c.icon('close'), 'Not met') : el('span', {class: 'mb-label neutral'}, c.icon('remove'), 'Not checked yet'), ' ', k.plain))))));
}
