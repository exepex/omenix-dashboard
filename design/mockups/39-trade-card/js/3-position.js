/* The position (TRADE and WATCH): what, the entry range, how much, the most it can lose against the Rs 10,000 cap,
   the worst stretches, the exits, costs and tax, the volatility edge and what would prove it wrong. */

function positionPart(col, c) {
  const {el} = c, C = card(), T = C.trade;
  if (!T) {
    col.append(sec(c, 'The position', el('p', {class: 'small muted', style: 'margin:0'}, 'No position today: a NO TRADE card carries none. The reason is at the top; the price of staying out is below.')));
    return;
  }
  col.append(sec(c, [el('span', {}, C.status === 'WATCH' ? 'The shadow position (never traded)' : 'The paper position'), c.paperTag(), owner(c)],
    el('p', {class: 'what'}, T.what),
    el('p', {class: 'small muted', style: 'margin:0 0 8px'}, `${T.strategy} · ${apName(T.family)}`),
    legs(c, T), entry(c, T), sizeFacts(c, T), maxLoss(c, T)),
  sec(c, 'If it goes badly', el('ul', {class: 'list'}, ...T.worst_cases.map(w => el('li', {}, `${w.scenario}: loss ${rs(c, w.loss)}`))),
    howto(c, 'Stress tests of the same position through the worst stretches on record. They show the worst case, never an edge.')),
  sec(c, 'How it ends', el('ul', {class: 'list'}, ...T.exit_plan.map(x => el('li', {}, x))),
    el('h2', {style: 'margin-top:12px'}, 'What would prove it wrong'), el('ul', {class: 'list'}, ...T.proves_wrong.map(x => el('li', {}, x)))),
  sec(c, ['Costs and tax', c.paperTag()], el('div', {class: 'facts3'},
    fact(c, 'Charges and pads', rs(c, T.costs.charges_and_pads), 'A round trip, with worse fills assumed'),
    fact(c, 'Breaks even at', rsUnit(c, T.costs.breakeven_per_unit) + ' a unit', 'After costs'),
    fact(c, 'Tax scenario', `${(T.costs.tax_rate * 100).toFixed(1)}%`, 'On the year’s net F&O profit')),
    T.vol_edge ? el('div', {class: 'facts3', style: 'margin-top:8px'},
      fact(c, 'Vega per lot', rs(c, T.vol_edge.vega_per_lot), 'Per point of implied volatility'),
      fact(c, 'Edge needed', `${T.vol_edge.edge_needed_points} points`, 'Of implied volatility, to cover costs')) : null));
}
function apName(f) { return {rule: 'Rule-based (Book 1)', hybrid: 'Hybrid (Book 2)', ai: 'AI team (Book 3)'}[f]; }
function legs(c, T) {
  const {el} = c;
  return el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table'}, el('thead', {}, el('tr', {}, ...['Leg', 'Strike', 'Expiry', 'Lots'].map(h => el('th', {scope: 'col'}, h)))),
    el('tbody', {}, ...T.legs.map(l => el('tr', {}, el('td', {}, el('span', {class: 'mb-label ' + (l.side === 'buy' ? 'success' : 'danger')}, c.icon(l.side === 'buy' ? 'arrow_upward' : 'arrow_downward'), l.side === 'buy' ? 'Buy' : 'Sell'), ' ', l.option_type === 'CE' ? 'call' : 'put', el('small', {}, l.contract)),
      el('td', {class: 'md-numeric'}, c.num(l.strike, 0, 'INR')), el('td', {}, dlabel(l.expiry)), el('td', {class: 'md-numeric'}, l.lots))))));
}
function entry(c, T) {
  const {el} = c, E = T.entry, lo = E.min_per_unit * 0.8, hi = E.max_per_unit * 1.2, at = x => `${((x - lo) / (hi - lo) * 100).toFixed(1)}%`;
  const debit = E.kind === 'debit';
  return el('div', {style: 'margin-top:12px'}, el('b', {class: 'small'}, `Entry: ${debit ? 'pay' : 'receive'} ${rsUnit(c, E.min_per_unit)} to ${rsUnit(c, E.max_per_unit)} a unit`),
    el('div', {class: 'range', role: 'img', 'aria-label': `Enter between ${E.min_per_unit} and ${E.max_per_unit} a unit; ${debit ? 'never above the high end' : 'never below the low end'}`},
      el('span', {class: 'track'}), el('span', {class: 'ok', style: `left:${at(E.min_per_unit)};width:calc(${at(E.max_per_unit)} - ${at(E.min_per_unit)})`}),
      el('span', {class: 'stop', style: `left:${at(debit ? E.max_per_unit : E.min_per_unit)}`})),
    el('div', {class: 'range-keys'}, el('span', {}, debit ? 'Cheaper' : 'Less received'), el('span', {}, debit ? `Do not enter above ${rsUnit(c, E.max_per_unit)}` : `Do not enter below ${rsUnit(c, E.min_per_unit)}`), el('span', {}, debit ? 'Dearer' : 'More received')),
    howto(c, `Prices from the 15:00 bid and ask. The card is valid until ${ist(E.valid_until)}; after that it is stale.`));
}
function sizeFacts(c, T) {
  return c.el('div', {class: 'facts3', style: 'margin-top:12px'}, fact(c, 'Size', `${T.size.lots} lot (${T.size.units} units)`),
    fact(c, 'Money tied up', rs(c, T.size.funds_at_entry), 'The debit plus the short leg’s margin'), fact(c, 'Paper', 'No real money'));
}
function maxLoss(c, T) {
  const {el} = c, share = Math.min(1, T.max_loss / T.max_loss_cap);
  return el('div', {class: 'cap', style: 'margin-top:12px'}, el('b', {class: 'small'}, `The most it can lose: ${rs(c, T.max_loss)}, charges included`),
    el('div', {class: 'bar', role: 'img', 'aria-label': `${Math.round(share * 100)}% of the Rs 10,000 cap`}, el('i', {style: `width:${(share * 100).toFixed(1)}%`})),
    el('small', {class: 'muted'}, `${Math.round(share * 100)}% of the ${rs(c, T.max_loss_cap)} a trade may lose. Fixed at entry: no stop-loss order is needed.`));
}
