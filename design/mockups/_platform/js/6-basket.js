/* Omenix platform runtime, part 6 of 7: the F&O basket order (all legs or none). Concatenated in file order by platform_build.py into one script. */
/* Paper basket: a multi-leg F&O idea placed as one paper order (all legs or none), with the same limit checks */
function basketView(bid) {
  const b = ((P().fno_example || {}).baskets || {})[bid]; if (!b) return null;
  const Pm = P(), manualId = Object.keys(Pm.accounts).find(k => Pm.accounts[k].kind === 'manual'), acc = Pm.accounts[manualId], L = Pm.limits;
  let lots = 1;
  const legs = b.legs.map(l => ({...l, it: item(l.id)}));
  const box = el('div', {style: 'display:grid;gap:12px'}), foot = el('div', {class: 'mb-drawer-foot'});
  const executable = legs.every(l => l.it.kind === 'option' && l.it.source === 'snap3pm');
  function draw() {
    const lot = legs[0].it.lot;
    const perUnit = legs.reduce((a, l) => a + (l.side === 'sell' ? l.it.bid : -l.it.ask) * l.lots, 0);
    const net = perUnit * lot * lots;
    const ch = legs.reduce((a, l) => a + charges(l.it, l.side, (l.side === 'sell' ? l.it.bid : l.it.ask) * lot * l.lots * lots).total, 0);
    /* the structure's own maximum loss and profit (as on the idea card); the limit check adds the charges */
    const maxLoss = b.kind === 'debit' ? -net : (b.width - perUnit) * lot * lots;
    const maxProfit = b.kind === 'debit' ? (b.width + perUnit) * lot * lots : net;
    const margin = b.margin_per_lot * lots;
    const checks = [[executable, 'Executable quotes for every leg', `3 pm snapshot of ${dateShort(legs[0].it.as_of)}`],
      [maxLoss + ch <= L.max_loss_per_trade, `Maximum loss with charges ≤ ${money(L.max_loss_per_trade)} a trade`, money(maxLoss + ch)],
      [acc.open_structures + 1 <= L.max_open_structures, `Open structures ≤ ${L.max_open_structures}`, `${acc.open_structures} open + this one`],
      [acc.at_risk + maxLoss <= L.max_at_risk, `At risk ≤ ${money(L.max_at_risk)}`, `${money(acc.at_risk)} + ${money(maxLoss)}`],
      [margin <= acc.cash, 'Margin estimate within cash', `${money(margin)} of ${money(acc.cash)}`]];
    const lock = tradeLock();
    if (lock) checks.unshift([false, 'Market open', lock.replace(/^Market closed: /, '')]);
    const ok = !lock && checks.every(c => c[0]);
    box.replaceChildren(
      el('table', {class: 'mb-legs'}, el('thead', {}, el('tr', {}, el('th', {}, 'Leg'), el('th', {}, 'Side'), el('th', {class: 'num'}, 'Lots'), el('th', {class: 'num'}, 'Price'))),
        el('tbody', {}, ...legs.map(l => el('tr', {}, el('td', {}, l.it.sym.replace(/^NIFTY 27 OCT /, '')), el('td', {}, el('span', {class: 'mb-label ' + (l.side === 'buy' ? 'success' : 'danger')}, l.side === 'buy' ? 'Buy' : 'Sell')), el('td', {class: 'num'}, String(l.lots * lots)), el('td', {class: 'num'}, num(l.side === 'sell' ? l.it.bid : l.it.ask) + (l.side === 'sell' ? ' bid' : ' ask')))))),
      el('dl', {class: 'mb-order-sum'},
        el('dt', {}, (net >= 0 ? 'Net credit' : 'Net debit') + ' (estimate)'), el('dd', {}, money(Math.abs(net), 2)),
        el('dt', {}, 'Charges (estimate) ', help(Pm.charges.label + '. Four legs, each charged on its own premium.')), el('dd', {}, money(ch, 2)),
        el('dt', {}, 'Maximum profit (estimate, before charges)'), el('dd', {}, money(maxProfit, 2)),
        el('dt', {}, 'Maximum loss (estimate, before charges)'), el('dd', {}, money(maxLoss, 2)),
        el('dt', {}, 'Breakevens'), el('dd', {}, b.breakevens.map(x => num(x, 0)).join(' / ')),
        el('dt', {}, 'Margin estimate ', help('Hedged structure: from our recorded margin source (labelled). Mock value.')), el('dd', {}, money(margin)),
        el('dt', {class: 'tot'}, 'Probability of profit ', help('Risk-neutral, from the snapshot’s implied volatility: what option prices imply, not a forecast of ours.')), el('dd', {class: 'tot'}, b.pop + '% (risk-neutral)')),
      el('div', {class: 'mb-asof', style: 'white-space:normal;align-items:flex-start'}, icon('schedule'), `Estimates use the ${dateShort(legs[0].it.as_of)} 3 pm quotes. The fill uses ${Pm.next_quotes.option}, so the real credit, losses and charges can differ.`),
      el('div', {}, el('div', {class: 'mb-micro', style: 'margin-bottom:6px'}, 'Checks against the Manual account’s limits'),
        el('ul', {class: 'mb-checks'}, ...checks.map(([pass, t, d]) => el('li', {class: pass ? 'ok' : 'fail'}, el('span', {class: 'mb-mark ' + (pass ? 'ok' : 'no')}, icon(pass ? 'check' : 'close')), el('span', {}, t, el('span', {class: 'vh'}, pass ? ' passed' : ' failed'), el('small', {}, d)))))),
      el('div', {class: 'mb-asof', style: 'white-space:normal;align-items:flex-start'}, icon('info'), 'No real order is placed. All legs or none: the F&O tool fills them from the next 3 pm snapshot with the books’ own fill model.'));
    foot.replaceChildren(el('button', {class: 'md-btn filled buy', type: 'button', disabled: !ok, style: 'height:44px', onclick: () => { closeDrawer(); snack(`Basket recorded: ${b.name}, ${lots} lot${lots > 1 ? 's' : ''}. Open until ${Pm.next_quotes.option}.`); }}, icon(ok ? 'receipt_long' : lock ? 'lock' : 'block'), ok ? `Place basket · ${legs.length} legs` : lock ? 'Market closed' : 'Blocked by a limit check'),
      el('div', {class: 'muted', style: 'font-size:12px;text-align:center'}, ok ? `Fills at the next valid quotes: ${Pm.next_quotes.option}.` : 'Nothing is recorded until every check passes.'));
  }
  const lotIn = el('input', {class: 'mb-input', type: 'number', min: '1', step: '1', value: '1', id: 'b-lots', oninput: e => { lots = Math.max(1, Math.floor(+e.target.value || 1)); draw(); }});
  draw();
  return [drawerHead('F&O basket order', null, el('div', {style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px'}, el('b', {style: 'font-size:15px'}, b.name))),
    el('div', {class: 'mb-drawer-body'},
      el('div', {class: 'mb-field'}, el('span', {class: 'l'}, 'Account'), el('div', {class: 'mb-input', style: 'display:flex;align-items:center'}, `${acc.name} · cash ${money(acc.cash)}`)),
      el('div', {class: 'mb-field-row'}, el('div', {class: 'mb-field'}, el('label', {for: 'b-lots'}, `Lots (lot ${legs[0].it.lot})`), lotIn), el('div', {class: 'mb-field'}, el('span', {class: 'l'}, 'Order type'), el('div', {class: 'mb-input', style: 'display:flex;align-items:center;font-size:14px'}, 'Market, all legs'))),
      box,
      el('button', {class: 'md-btn outlined', type: 'button', onclick: () => go('builder')}, icon('calculate'), 'Adjust in the Strategy builder')),
    foot];
}
function openOrder(id, side) { const it = item(id); if (!it) return; openDrawer(`order:${id}:${side}`); }

