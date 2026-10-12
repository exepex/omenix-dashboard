/* Omenix platform runtime, part 5 of 7: the right drawer (quick view, all screens) and the order window. Concatenated in file order by platform_build.py into one script. */
/* ---- the right drawer: Paper order window, quick view, phone "More" ------------------------------------------ */
function openDrawer(view) {
  closeHc(); closeMenu(); closePal();
  if (!F.drawer.classList.contains('open')) lastFocus = document.activeElement;
  const [kind, id, side] = view.split(':');
  const body = kind === 'order' ? orderView(id, side) : kind === 'quick' ? quickView(id) : kind === 'basket' ? basketView(id) : navView();
  if (!body) return;
  F.drawer.replaceChildren(el('div', {class: 'mb-sheet-grip', 'aria-hidden': 'true'}), ...body);
  F.drawer.classList.add('open'); F.veil.classList.add('on'); st.drawer = view; writeHash();
  setTimeout(() => $('.mb-drawer-head .md-icon-btn', F.drawer)?.focus(), 0);
}
function closeDrawer() { if (!F.drawer.classList.contains('open')) return; F.drawer.classList.remove('open'); if (!F.pal.classList.contains('on') && !F.keys.classList.contains('on')) F.veil.classList.remove('on'); st.drawer = null; writeHash(); lastFocus?.focus?.(); }
const drawerHead = (title, sub, ...extra) => el('div', {class: 'mb-drawer-head'}, el('div', {style: 'min-width:0'}, el('h2', {id: 'drawer-title'}, title), sub ? el('div', {class: 'sub'}, sub) : null, ...extra), el('button', {class: 'md-icon-btn', type: 'button', 'aria-label': 'Close (Esc)', onclick: closeDrawer}, icon('close')));
function navView() {
  return [drawerHead('All screens', `${P().label} market${P().fno ? '' : ' · F&O is India only'}`),
    el('div', {class: 'mb-drawer-body'}, ...NAV.filter(Boolean).map(g => { const items = g.items.filter(shown); return items.length ? el('div', {}, el('div', {class: 'mb-pal-group', style: 'padding-left:0'}, g.label), ...items.map(i => el('a', {class: 'mb-pal-item', href: i.href ? i.href + hashCarry() : '#', onclick: e => { if (!i.href) { e.preventDefault(); closeDrawer(); go(i.id); } }}, el('span', {class: 'mb-avatar neutral'}, icon(i.icon)), el('span', {}, el('b', {}, i.label), el('small', {}, i.href || i.action ? (i.key || 'open') : 'mockup soon')), el('span', {class: 'end'}, icon('chevron_right'))))) : null; }))];
}
function spark(it) {
  if (!it.spark) return null;
  const v = it.spark, lo = Math.min(...v), hi = Math.max(...v), W = 360, H = 90;
  const pts = v.map((y, i) => [i / (v.length - 1) * W, H - 6 - (y - lo) / (hi - lo || 1) * (H - 12)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
  const s = svgEl('svg', {viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img', 'aria-label': `${it.sym}: the last ${v.length} price checks, ${sgn(it.chg_pct)} today`, style: 'width:100%;height:90px;display:block'});
  const gid = 'g' + it.id.replace(/\W/g, '');
  const defs = svgEl('defs'), g = svgEl('linearGradient', {id: gid, x1: 0, x2: 0, y1: 0, y2: 1});
  g.append(svgEl('stop', {offset: '0', 'stop-color': 'var(--mb-chart-1)', 'stop-opacity': '.28'}), svgEl('stop', {offset: '1', 'stop-color': 'var(--mb-chart-1)', 'stop-opacity': '0'})); defs.append(g); s.append(defs);
  s.append(svgEl('path', {d: line + `L${W},${H}L0,${H}Z`, fill: `url(#${gid})`}), svgEl('path', {d: line, fill: 'none', stroke: 'var(--mb-chart-1)', 'stroke-width': '2', 'vector-effect': 'non-scaling-stroke'}));
  return s;
}
function quickView(id) {
  const it = item(id); if (!it) return null;
  return [drawerHead(it.sym, it.name, el('div', {style: 'margin-top:6px;display:flex;gap:6px;flex-wrap:wrap'}, asOfEl(it), mockTag())),
    el('div', {class: 'mb-drawer-body'},
      el('div', {style: 'display:flex;align-items:baseline;gap:10px'}, el('span', {style: 'font:700 28px/1.1 var(--md-ref-typeface-plain);letter-spacing:-.5px'}, price(it)), delta(it.chg_pct), el('span', {class: 'muted', style: 'font-size:12px'}, 'change on the previous close')),
      spark(it) || el('div', {class: 'quiet'}, it.kind === 'option' ? 'Options have one recorded price a day (the 3 pm snapshot); the chain shows the strike around it.' : 'End-of-day prices only for this contract.'),
      ...hcContent(it).slice(2)),
    el('div', {class: 'mb-drawer-foot'}, el('div', {class: 'sub muted', style: 'font-size:12px'}, 'Quick view. The full page has the chart, signals, news, events and your positions.'))];
}

/* Paper order window (PLATFORM_DESIGN.md section 5) */
function charges(it, side, value) {
  const C = P().charges, r = isFno(it) ? C.option : (C.equity_delivery || C.equity);
  if (P().currency === 'USD') { const sec = side === 'sell' ? value * r.sec_sell_pct / 100 : 0; return {rows: [['Commission', r.commission_flat], ['SEC fee (sell)', sec]], total: r.commission_flat + sec}; }
  const exch = value * r.exchange_pct / 100, sebi = value * r.sebi_pct / 100;
  const stt = isFno(it) ? (side === 'sell' ? value * r.stt_sell_pct / 100 : 0) : value * r.stt_pct / 100;
  const stamp = side === 'buy' ? value * r.stamp_buy_pct / 100 : 0, gst = (r.brokerage_flat + exch + sebi) * r.gst_pct / 100;
  const rows = [['Brokerage', r.brokerage_flat], ['STT', stt], ['Exchange charges', exch], ['GST', gst], ['Stamp duty', stamp], ['SEBI fee', sebi]];
  return {rows, total: rows.reduce((a, [, v]) => a + v, 0)};
}
function orderView(id, side = 'buy') {
  const it = item(id); if (!it) return null;
  const Pm = P(), manualId = Object.keys(Pm.accounts).find(k => Pm.accounts[k].kind === 'manual'), acc = Pm.accounts[manualId], L = Pm.limits;
  const fno = isFno(it), lot = it.lot || 1;
  /* executable quotes: stocks from the stock tool's next price check; F&O only from the recorded NIFTY monthly 3 pm snapshot */
  const executable = tradable(it) && (!fno || (it.kind === 'option' && it.source === 'snap3pm'));
  const o = {side: side === 'sell' ? 'sell' : 'buy', qty: fno ? 1 : (Pm.currency === 'INR' ? 10 : 2), type: 'market', limit: null, validity: 'day', bracket: false, sl: null, tgt: null};
  const owned = it.held && it.held.account === manualId ? it.held.qty : 0;
  const sideBtns = el('div', {class: 'mb-order-side', role: 'group', 'aria-label': 'Side'});
  const sumBox = el('div', {style: 'display:grid;gap:12px'}), foot = el('div', {class: 'mb-drawer-foot'});
  const qtyIn = el('input', {class: 'mb-input', type: 'number', min: '1', step: '1', value: o.qty, id: 'o-qty', inputmode: 'numeric', oninput: e => { o.qty = Math.max(0, Math.floor(+e.target.value || 0)); draw(); }});
  const limIn = el('input', {class: 'mb-input', type: 'number', step: '0.05', id: 'o-lim', disabled: true, placeholder: 'Market', oninput: e => { o.limit = +e.target.value || null; draw(); }});
  const typeSeg = el('div', {class: 'md-segmented dense', role: 'group', 'aria-label': 'Order type'}, ...[['market', 'Market'], ['limit', 'Limit']].map(([k, v]) => el('button', {type: 'button', 'aria-pressed': String(o.type === k), onclick: e => { o.type = k; $$('button', typeSeg).forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); limIn.disabled = k === 'market'; if (k === 'limit' && !o.limit) { o.limit = basis(); limIn.value = o.limit.toFixed(2); } if (k === 'market') { limIn.value = ''; } draw(); }}, v)));
  const valSeg = el('div', {class: 'md-segmented dense', role: 'group', 'aria-label': 'Validity'}, ...[['day', 'Day'], ['gtc', 'Until cancelled']].map(([k, v]) => el('button', {type: 'button', 'aria-pressed': String(o.validity === k), 'data-tip': k === 'gtc' ? 'Good till cancelled (GTC): stays open across sessions until filled or you cancel it.' : 'Cancelled if not filled by the end of the next valid quotes’ session.', onclick: e => { o.validity = k; $$('button', valSeg).forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); draw(); }}, v)));
  const slIn = el('input', {class: 'mb-input', type: 'number', step: '0.05', placeholder: 'Stop-loss', 'aria-label': 'Stop-loss price', disabled: true, oninput: e => { o.sl = +e.target.value || null; draw(); }});
  const tgIn = el('input', {class: 'mb-input', type: 'number', step: '0.05', placeholder: 'Target', 'aria-label': 'Target price', disabled: true, oninput: e => { o.tgt = +e.target.value || null; draw(); }});
  const brk = el('input', {type: 'checkbox', id: 'o-brk', onchange: e => { o.bracket = e.target.checked; slIn.disabled = tgIn.disabled = !o.bracket; draw(); }});
  function basis() { return it.kind === 'option' ? (o.side === 'buy' ? it.ask : it.bid) : it.last; }
  function draw() {
    for (const b of $$('button', sideBtns)) b.setAttribute('aria-pressed', String(b.dataset.side === o.side));
    const px = o.type === 'limit' && o.limit ? o.limit : basis();
    const units = o.qty * lot, value = px * units, ch = charges(it, o.side, value);
    const checks = [];
    if (!executable) checks.push([false, 'Executable quotes', isFno(it) ? 'none recorded for this contract' : 'not tradable']);
    else if (fno) checks.push([true, 'Executable quotes', `3 pm snapshot: bid ${num(it.bid)} · ask ${num(it.ask)}`]);
    else checks.push([true, 'Quotes', Pm.currency === 'INR' ? 'the stock tool prices this stock' : 'the stock tool prices this stock']);
    if (o.qty < 1) checks.push([false, 'Quantity', 'at least 1']);
    let maxLoss = null, margin = null;
    if (fno && executable) {
      maxLoss = o.side === 'buy' ? value + ch.total : Infinity;
      margin = o.side === 'buy' ? value + ch.total : Pm.short_option_margin_per_lot * o.qty;
      checks.push([maxLoss <= L.max_loss_per_trade, `Maximum loss ≤ ${money(L.max_loss_per_trade)} a trade`, maxLoss === Infinity ? 'unlimited: a single short option' : money(maxLoss)]);
      checks.push([acc.open_structures + 1 <= L.max_open_structures, `Open structures ≤ ${L.max_open_structures}`, `${acc.open_structures} open + this one`]);
      checks.push([maxLoss !== Infinity && acc.at_risk + maxLoss <= L.max_at_risk, `At risk ≤ ${money(L.max_at_risk)}`, maxLoss === Infinity ? 'unlimited' : `${money(acc.at_risk)} + ${money(maxLoss)}`]);
      checks.push([margin <= acc.cash, 'Margin estimate within cash', `${money(margin)} of ${money(acc.cash)}`]);
    } else if (executable) {
      if (o.side === 'buy') checks.push([value + ch.total <= acc.cash, 'Cash available', `${money(value + ch.total)} of ${money(acc.cash)}`]);
      else checks.push([o.qty <= owned, 'Shares held in Manual (no short selling)', `${o.qty} of ${owned}`]);
    }
    if (o.bracket) checks.push([o.sl != null && o.tgt != null && (o.side === 'buy' ? o.sl < px && o.tgt > px : o.sl > px && o.tgt < px), 'Stop-loss and target around the price', o.sl && o.tgt ? `${num(o.sl)} / ${num(o.tgt)}` : 'enter both']);
    const lock = tradeLock();
    if (lock) checks.unshift([false, 'Market open', lock.replace(/^Market closed: /, '')]);
    const ok = !lock && executable && checks.every(c => c[0]);
    const nextQ = Pm.next_quotes[it.kind === 'option' ? 'option' : 'stock'];
    sumBox.replaceChildren(...[
      !executable ? el('div', {class: 'mb-alert danger', role: 'alert'}, icon('block'), el('div', {}, el('b', {class: 't'}, 'Refused: no executable quote'), el('div', {class: 's'}, tradable(it) ? `Our data has no bid and ask for ${it.sym}. Paper F&O orders are filled only from the recorded NIFTY monthly option snapshots (3 pm); this contract has ${it.source === 'eod' ? 'end-of-day prices only' : 'no recorded quotes'}, so it is refused, never filled from a guessed price.` : 'An index is not an instrument: trade its futures or options.')), el('span')) : null,
      !executable ? null : el('dl', {class: 'mb-order-sum'},
        el('dt', {}, o.type === 'limit' ? 'Limit price' : (it.kind === 'option' ? `${o.side === 'buy' ? 'Ask' : 'Bid'} at the ${dateShort(it.as_of)} 3 pm snapshot` : `Last price, ${asOf(it).short}`)), el('dd', {}, num(px)),
        el('dt', {}, fno ? `Quantity (${o.qty} lot${o.qty === 1 ? '' : 's'} × ${lot})` : 'Quantity'), el('dd', {}, String(units)),
        el('dt', {}, (fno && it.kind === 'option' ? 'Premium' : 'Order value') + ' (estimate)'), el('dd', {}, money(value, 2)),
        el('dt', {}, 'Charges (estimate) ', help(`${Pm.charges.label}. ` + ch.rows.map(([k, v]) => `${k} ${money(v, 2)}`).join(' · '))), el('dd', {}, money(ch.total, 2)),
        fno && executable ? [el('dt', {}, 'Maximum loss (estimate)'), el('dd', {}, maxLoss === Infinity ? 'Unlimited' : money(maxLoss, 2))] : null,
        fno && executable ? [el('dt', {}, 'Margin estimate ', help('From our recorded margin source (labelled): for a bought option the premium paid; for a sold option a per-lot estimate. Mock value.')), el('dd', {}, money(margin, 0))] : null,
        el('dt', {class: 'tot'}, 'Cash after (estimate)'), el('dd', {class: 'tot'}, money(acc.cash + (o.side === 'buy' ? -(value + ch.total) : (fno ? value - ch.total : value - ch.total)), 2))),
      executable ? el('div', {class: 'mb-asof', style: 'white-space:normal;align-items:flex-start'}, icon('schedule'), `Estimates use ${it.kind === 'option' ? 'the ' + dateShort(it.as_of) + ' 3 pm quotes' : 'the ' + asOf(it).short + ' price'}. The fill uses ${nextQ}, so the paper fill price, charges and cash can differ.`) : null,
      el('div', {}, el('div', {class: 'mb-micro', style: 'margin-bottom:6px'}, 'Checks against the Manual account’s limits'),
        el('ul', {class: 'mb-checks'}, ...checks.map(([pass, t, d]) => el('li', {class: pass ? 'ok' : 'fail'}, el('span', {class: 'mb-mark ' + (pass ? 'ok' : 'no')}, icon(pass ? 'check' : 'close')), el('span', {}, t, el('span', {class: 'vh'}, pass ? ' passed' : ' failed'), el('small', {}, d)))))),
      el('div', {class: 'mb-asof', style: 'white-space:normal;align-items:flex-start'}, icon('info'), `No real order is placed: Omenix records it for your paper account; the ${fno ? 'F&O tool' : 'stock tool'} fills it only from valid quotes with the strategies’ own fill rules.`)].filter(Boolean));
    foot.replaceChildren(
      el('button', {class: 'md-btn filled ' + o.side, type: 'button', disabled: !ok, style: 'height:44px', onclick: () => { closeDrawer(); snack(`Order recorded: ${o.side} ${units} ${it.sym}, ${o.type === 'limit' ? 'limit ' + num(o.limit) : 'market'}. Open until ${nextQ}.`); }}, icon(ok ? 'receipt_long' : lock ? 'lock' : 'block'), ok ? `${o.side === 'buy' ? 'Buy' : 'Sell'} ${units} ${it.sym}` : lock ? 'Market closed' : (executable ? 'Blocked by a limit check' : 'Refused: no executable quote')),
      el('div', {class: 'muted', style: 'font-size:12px;text-align:center'}, ok ? (o.type === 'market' ? `Fills at the next valid quotes: ${nextQ}.` : `Fills only if the next valid quotes reach ${num(o.limit)}: ${nextQ}.`) : 'Nothing is recorded until every check passes.'));
  }
  for (const [k, v] of [['buy', 'Buy'], ['sell', 'Sell']]) sideBtns.append(el('button', {type: 'button', class: k, 'data-side': k, 'aria-pressed': String(o.side === k), onclick: () => { o.side = k; draw(); }}, icon(k === 'buy' ? 'trending_up' : 'trending_down'), v));
  const accSel = el('select', {class: 'mb-input', id: 'o-acc', 'aria-label': 'Account'}, ...Object.entries(Pm.accounts).map(([k, a]) => el('option', {value: k, selected: k === manualId, disabled: a.kind !== 'manual'}, a.kind === 'manual' ? `${a.name} · cash ${money(a.cash)}` : `${a.name} (strategy book: not traded by hand)`)));
  draw();
  return [drawerHead(`${fno ? 'F&O order' : 'Order'}`, null, el('div', {style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px'}, el('b', {style: 'font-size:15px'}, it.sym), el('span', {class: 'muted', style: 'font-size:13px'}, `${price(it)}`), delta(it.chg_pct), asOfEl(it))),
    el('div', {class: 'mb-drawer-body'},
      sideBtns,
      executable ? null : sumBox,
      el('div', {class: 'mb-field'}, el('label', {for: 'o-acc'}, 'Account'), accSel, el('span', {class: 'hint'}, `Your own paper account in ${Pm.label}: shown beside the strategy books, never part of their scoreboards. `, help(`Starting capital ${money(Pm.accounts[manualId].capital)}. ${S.limits_note}`))),
      el('div', {class: 'mb-field-row'}, el('div', {class: 'mb-field'}, el('label', {for: 'o-qty'}, fno ? `Lots (lot ${lot})` : 'Quantity (shares)'), qtyIn), el('div', {class: 'mb-field'}, el('label', {for: 'o-lim'}, 'Limit price'), limIn)),
      el('div', {class: 'mb-field-row'}, el('div', {class: 'mb-field'}, el('span', {class: 'l'}, 'Order type ', help('Market: filled at the next valid quotes by the shared fill rules. Limit: filled only if the next valid quotes reach your limit.')), typeSeg), el('div', {class: 'mb-field'}, el('span', {class: 'l'}, 'Validity'), valSeg)),
      el('div', {class: 'mb-field'}, el('label', {for: 'o-brk', style: 'display:flex;align-items:center;gap:8px;cursor:pointer'}, brk, 'Add a stop-loss and target (bracket)'), el('div', {class: 'mb-field-row'}, slIn, tgIn)),
      executable ? sumBox : null),
    foot];
}

