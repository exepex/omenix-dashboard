/* The trades: open positions (legs shown to the owner only, behind sign-in on the dashboard) and closed trades after
   costs, each with its fills at the owner's three reaction times (the verdict uses 60 minutes). */
function legs(c, t) { return c.el('span', {class: 'legs'}, ...t.legs.map(l => c.el('code', {}, `${l.side === 'buy' ? 'Buy' : 'Sell'} ${l.lots} × ${l.strike} ${l.option_type}`))); }
function openPart(stack, c) {
  const {el} = c, O = pay().open;
  stack.append(sec(c, ['Open positions', c.paperTag(), el('span', {class: 'owner small muted'}, c.icon('lock'), 'Legs: owner only')],
    O.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
      el('thead', {}, el('tr', {}, ...['Book', 'Strategy', 'Legs', 'Opened', 'Most it can lose', 'So far', 'Days left'].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...O.map(t => el('tr', {}, el('td', {'data-k': 'Book'}, family(c, t.family)), el('td', {'data-k': 'Strategy'}, t.strategy, el('small', {}, t.structure)),
        el('td', {'data-k': 'Legs'}, legs(c, t)), el('td', {'data-k': 'Opened'}, dlabel(t.opened_on)),
        el('td', {class: 'md-numeric', 'data-k': 'Most it can lose'}, rs(c, t.max_loss)), el('td', {'data-k': 'So far'}, pnlLabel(c, t.unrealised)),
        el('td', {class: 'md-numeric', 'data-k': 'Days left'}, String(t.days_to_expiry))))))) : el('p', {class: 'empty muted'}, 'No open position.'),
    howto(c, '"Most it can lose" is fixed when the trade opens. "So far" is at the latest quotes, before exit costs.')));
}
function fills(c, t) {
  if (!t.fills) return c.el('small', {class: 'muted'}, 'Before owner-timing fills');
  return c.el('span', {class: 'fills'}, ...t.fills.map(f => { const [cls, g, w] = FILL[f.outcome];
    return c.el('span', {class: 'mb-label ' + cls, 'data-tip': `${f.minutes} minutes after the card: ${w}`}, c.icon(g), `${f.minutes} min: ${f.net == null ? w : signed(c, f.net)}`); }));
}
function closedPart(stack, c) {
  const {el} = c, C = pay().closed;
  stack.append(sec(c, ['Closed trades', c.paperTag()],
    C.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
      el('thead', {}, el('tr', {}, ...['Book', 'Strategy', 'Held', 'Result', 'Before costs', 'Costs', 'After costs', 'If you acted after 5 / 30 / 60 min'].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...C.map(t => { const [cls, g, w] = RESULT[t.result];
        return el('tr', {}, el('td', {'data-k': 'Book'}, family(c, t.family)), el('td', {'data-k': 'Strategy'}, t.strategy, el('small', {}, EXIT[t.exit])),
          el('td', {'data-k': 'Held'}, `${dlabel(t.opened_on)} to ${dlabel(t.closed_on)}`), el('td', {'data-k': 'Result'}, el('span', {class: 'mb-label ' + cls}, c.icon(g), w)),
          el('td', {class: 'md-numeric', 'data-k': 'Before costs'}, signed(c, t.gross)), el('td', {class: 'md-numeric', 'data-k': 'Costs'}, rs(c, t.costs)),
          el('td', {class: 'md-numeric', 'data-k': 'After costs'}, signed(c, t.net)), el('td', {'data-k': 'If you acted after 5 / 30 / 60 min'}, fills(c, t))); })))) : el('p', {class: 'empty muted'}, 'No closed trade yet.'),
    howto(c, 'After costs is the desk\'s fill. The three fills show the same decision if you had acted 5, 30 or 60 minutes after the card; the verdict uses 60. They are one decision, never three trials.')));
}
