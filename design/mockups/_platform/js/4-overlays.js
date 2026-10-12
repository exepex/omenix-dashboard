/* Omenix platform runtime, part 4 of 7: overlays: hover card, context menu, notifications, profile, command palette, shortcuts, snackbar. Concatenated in file order by platform_build.py into one script. */
/* ---- overlays ----------------------------------------------------------------------------------------------- */
function place(box, anchor, {side = 'right', gap = 8} = {}) {
  const r = anchor.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
  let x = side === 'right' ? r.right + gap : r.left, y = side === 'right' ? r.top : r.bottom + 6;
  if (side === 'right' && x + w > innerWidth - 8) x = r.left - w - gap;
  if (x < 8 || x + w > innerWidth - 8) { x = Math.max(8, Math.min(innerWidth - w - 8, r.left)); y = r.bottom + 6; }
  if (y + h > innerHeight - 8) y = Math.max(8, (side === 'right' ? r.bottom : r.top - 6) - h);
  box.style.left = x + 'px'; box.style.top = y + 'px';
}
/* hover card */
let hcTimer = null, hcAnchor = null;
function hcContent(it) {
  const held = it.held, acc = held && P().accounts[held.account];
  const pnl = held ? (it.last - held.avg) * held.qty * (isFno(it) ? 1 : 1) : null;
  return [
    el('div', {class: 'top'}, el('div', {}, el('b', {}, it.sym), el('small', {}, it.name)), el('div', {class: 'px'}, price(it), delta(it.chg_pct))),
    el('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;align-items:center'}, asOfEl(it), it.bid != null ? el('span', {class: 'mb-asof', 'data-tip': 'Best bid and ask of the 3 pm snapshot: no market depth is recorded.'}, `bid ${num(it.bid)} · ask ${num(it.ask)}`) : null, it.iv != null ? el('span', {class: 'mb-asof', 'data-tip': 'Implied volatility computed by us from the snapshot (labelled, not exchange data).'}, `IV ${it.iv.toFixed(1)}% (ours)`) : null),
    held ? el('div', {class: 'held'}, el('b', {}, `${held.qty > 0 ? 'Long' : 'Short'} ${Math.abs(held.qty)}`), ` at ${num(held.avg)} · ${acc.name}${held.structure ? ' · ' + held.structure : ''} · `, moneyDelta(pnl)) : el('div', {class: 'held'}, 'No paper position in this market.'),
    el('div', {class: 'acts'},
      el('button', {class: 'md-btn outlined small', type: 'button', onclick: () => go('chart')}, icon('show_chart'), 'Chart'),
      P().fno && (it.fno || isFno(it)) ? el('button', {class: 'md-btn outlined small', type: 'button', onclick: () => go('chain')}, icon('layers'), 'Chain') : null,
      tradable(it) ? el('button', {class: 'md-btn small buy', type: 'button', disabled: !!tradeLock(), 'data-tip': tradeLock(), onclick: () => openOrder(it.id, 'buy')}, 'Buy') : null,
      tradable(it) ? el('button', {class: 'md-btn small sell', type: 'button', disabled: !!tradeLock(), 'data-tip': tradeLock(), onclick: () => openOrder(it.id, 'sell')}, 'Sell') : el('span', {class: 'muted', style: 'font-size:12px'}, 'Indices are not traded; use their futures or options.'))];
}
function openHc(id, anchor) {
  const it = item(id); if (!it || !anchor) return;
  closeMenu(); hcAnchor = anchor;
  F.hc.replaceChildren(...hcContent(it)); F.hc.classList.add('on');
  place(F.hc, anchor, {side: anchor.closest('.mb-wl') ? 'right' : 'below'});
  st.hc = id;
}
function closeHc() { F.hc.classList.remove('on'); st.hc = null; hcAnchor = null; }
/* context menu (the same small menu on every row) */
function openMenu(id, anchor) {
  const it = item(id); closeHc();
  const row = (ic, label, fn, key) => el('button', {type: 'button', role: 'menuitem', onclick: () => { closeMenu(); fn(); }}, icon(ic), label, key ? el('span', {class: 'mb-kbd'}, key) : null);
  F.menu.replaceChildren(
    row('show_chart', 'Chart', () => go('chart')),
    P().fno && (it.fno || isFno(it)) ? row('layers', 'Option chain', () => go('chain')) : null,
    tradable(it) ? row('receipt_long', 'Buy or sell', () => openOrder(id, 'buy'), 'B') : null,
    row('star', 'Add to another watchlist', () => snack(`${it.sym}: choose a list (1-5) in the watchlist settings.`)),
    row('newspaper', 'News', () => go('news')),
    row('open_in_new', 'Open details', () => openDrawer('quick:' + id)),
    row('notifications', 'Set an alert', () => go('alerts')));
  F.menu.classList.add('on'); place(F.menu, anchor, {side: 'below'}); st.menu = id;
  $('button', F.menu)?.focus();
}
function closeMenu() { F.menu.classList.remove('on'); st.menu = null; }
function openNotif(anchor) {
  const ns = S.notifications[st.m] || [];
  F.menu.replaceChildren(el('div', {class: 'mb-pal-group'}, 'Notifications'), ...ns.map(n => el('button', {type: 'button', role: 'menuitem', style: 'height:auto;padding:8px 10px;align-items:flex-start', onclick: closeMenu}, icon(n.icon), el('span', {style: 'display:grid;gap:2px;white-space:normal;max-width:280px'}, el('b', {style: 'font-weight:' + (n.unread ? 700 : 500)}, n.title), el('small', {class: 'muted'}, n.sub)))),
    el('div', {class: 'mb-pal-group', style: 'text-transform:none;letter-spacing:0;font-weight:500'}, 'Alerts are checked on each data update, not tick by tick. Also sent to Slack.'));
  F.menu.classList.add('on'); place(F.menu, anchor, {side: 'below'}); F.menu.style.left = Math.max(8, Math.min(innerWidth - F.menu.offsetWidth - 8, anchor.getBoundingClientRect().right - F.menu.offsetWidth)) + 'px'; st.notif = true;
}
function openProfile(anchor) {
  const opt = (label, on, fn) => el('button', {type: 'button', role: 'menuitemradio', 'aria-checked': String(on), onclick: () => { fn(); closeMenu(); renderAll(); }}, icon(on ? 'check' : 'remove'), label);
  F.menu.replaceChildren(el('div', {class: 'mb-pal-group'}, 'Theme'), opt('Light (default)', st.theme === 'light', () => st.theme = 'light'), opt('Dark', st.theme === 'dark', () => st.theme = 'dark'), opt('Follow the system', st.theme === 'system', () => st.theme = 'system'),
    el('div', {class: 'mb-pal-group'}, 'Density'), opt('Comfortable', st.density === 'comfortable', () => st.density = 'comfortable'), opt('Compact (more rows)', st.density === 'compact', () => st.density = 'compact'),
    el('div', {class: 'mb-pal-group'}, 'Navigation rail'), opt('Icons with labels', st.rail === 'labels', () => st.rail = 'labels'), opt('Icons only', st.rail === 'icons', () => st.rail = 'icons'),
    el('button', {type: 'button', role: 'menuitem', onclick: () => { closeMenu(); openKeys(); }}, icon('keyboard'), 'Keyboard shortcuts', el('span', {class: 'mb-kbd'}, '?')),
    el('div', {class: 'mb-pal-group', style: 'text-transform:none;letter-spacing:0;font-weight:500'}, 'Paper only · no broker is connected'));
  F.menu.classList.add('on'); place(F.menu, anchor, {side: 'below'}); F.menu.style.left = Math.max(8, innerWidth - F.menu.offsetWidth - 8) + 'px';
}
/* B and S pair: paper buy and sell straight from a result row */
const bsPair = (id, before = () => {}) => { const it = item(id), lock = tradeLock(); return el('span', {class: 'bs', style: 'display:inline-flex;gap:4px'},
  el('button', {class: 'mb-bs buy', type: 'button', disabled: !!lock, 'aria-label': `Buy ${it.sym}`, 'data-tip': lock || 'Buy', onclick: e => { e.stopPropagation(); before(); openOrder(id, 'buy'); }}, 'B'),
  el('button', {class: 'mb-bs sell', type: 'button', disabled: !!lock, 'aria-label': `Sell ${it.sym}`, 'data-tip': lock || 'Sell', onclick: e => { e.stopPropagation(); before(); openOrder(id, 'sell'); }}, 'S')); };
/* command palette: stocks, F&O underlyings, contracts, screens, strategies, news, pages; recently viewed when empty */
let palSel = 0, palRows = [];
function palIndex() {
  const out = [];
  for (const it of Object.values(P().items)) out.push({group: it.kind === 'stock' ? 'Stocks' : it.kind === 'index' ? 'Indices' : 'F&O contracts', label: it.sym, sub: it.name + (isFno(it) ? ' · ' + it.code : ''), code: it.code, ic: it.kind === 'stock' ? 'apartment' : it.kind === 'index' ? 'monitoring' : 'layers', end: [price(it), ' ', delta(it.chg_pct)], open: () => openDrawer('quick:' + it.id), id: it.id});
  if (P().fno) for (const it of Object.values(P().items).filter(i => i.fno)) out.push({group: 'F&O underlyings', label: it.sym + ' options and futures', sub: 'Option chain · ' + it.name, ic: 'layers', open: () => go('chain')});
  for (const x of P().search_extra || []) out.push({group: {screen: 'Screens', strategy: 'Strategies', news: 'News'}[x.kind], label: x.label, sub: x.sub, ic: {screen: 'filter_list', strategy: 'science', news: 'newspaper'}[x.kind], open: () => go({screen: 'screener', strategy: 'lab', news: 'news'}[x.kind])});
  for (const s of allScreens()) out.push({group: 'Pages', label: s.label, sub: NAV.find(g => g && g.id === s.group).label + (s.key ? ' · ' + s.key : ''), ic: s.icon, open: () => go(s.id)});
  return out;
}
const GROUP_ORDER = ['Recently viewed', 'Stocks', 'Indices', 'F&O underlyings', 'F&O contracts', 'Screens', 'Strategies', 'News', 'Pages'];
function palResults(q) {
  const idx = palIndex(); q = q.trim().toLowerCase();
  let rows;
  if (!q) rows = P().recent.map(id => ({...idx.find(r => r.id === id), group: 'Recently viewed'})).concat(idx.filter(r => r.group === 'Pages').slice(0, 6));
  else {
    /* words in any order ("nifty 24500 ce", "24500 call"), or the exchange trading code typed whole ("NIFTY26OCT24500CE") */
    const syn = w => ({call: 'ce', put: 'pe', calls: 'ce', puts: 'pe', future: 'fut', futures: 'fut'})[w] || w;
    const words = q.split(/\s+/).map(syn), flat = q.replace(/\s+/g, '');
    const hay = r => (r.label + ' ' + r.sub + ' ' + (r.code || '')).toLowerCase();
    rows = idx.filter(r => (r.code && r.code.toLowerCase().includes(flat) && flat.length > 2) || words.every(w => hay(r).includes(w)));
  }
  const by = {}; for (const r of rows) (by[r.group] ||= []).push(r);
  return GROUP_ORDER.filter(g => by[g]).flatMap(g => by[g].slice(0, 6));
}
function openPal(q = '') {
  closeHc(); closeMenu(); lastFocus = document.activeElement;
  const input = el('input', {type: 'search', value: q, placeholder: P().fno ? 'Symbol, company or option code: reliance, nifty 24500 ce, NIFTY26OCT24500CE' : 'Symbol or company: aapl, nvidia', 'aria-label': 'Search', 'aria-controls': 'pal-list', oninput: e => palDraw(e.target.value), onkeydown: palKey});
  F.pal.replaceChildren(el('div', {class: 'mb-modal-head'}, icon('search'), input, el('button', {class: 'md-icon-btn small', type: 'button', 'aria-label': 'Close', onclick: closePal}, icon('close'))), el('div', {class: 'mb-modal-body', id: 'pal-list', role: 'listbox'}),
    el('div', {class: 'mb-modal-foot'}, el('span', {}, el('span', {class: 'mb-kbd'}, '↑'), el('span', {class: 'mb-kbd'}, '↓'), 'move'), el('span', {}, el('span', {class: 'mb-kbd'}, 'Enter'), 'open'), el('span', {}, el('span', {class: 'mb-kbd'}, 'Esc'), 'close'), el('span', {}, `${P().label} market · prices are as-of, not live`)));
  F.pal.classList.add('on'); F.veil.classList.add('on'); st.pal = q || '1';
  palDraw(q); input.focus();
}
function palDraw(q) {
  palRows = palResults(q); palSel = 0;
  const list = $('#pal-list', F.pal); list.replaceChildren();
  let g = null;
  palRows.forEach((r, i) => { if (r.group !== g) { g = r.group; list.append(el('div', {class: 'mb-pal-group'}, g)); } list.append(el('div', {class: 'mb-pal-item', role: 'option', id: 'pal-' + i, 'aria-selected': String(i === palSel), onclick: () => { closePal(); r.open(); }, onpointermove: () => palMark(i)}, el('span', {class: 'mb-avatar ' + (r.group === 'Pages' ? 'neutral' : r.group === 'News' ? 'info' : '')}, icon(r.ic)), el('span', {style: 'min-width:0'}, el('b', {}, r.label), el('small', {}, r.sub)), el('span', {class: 'end', style: 'display:flex;gap:8px;align-items:center'}, ...(r.end || []), r.id && tradable(item(r.id)) ? bsPair(r.id, closePal) : null))); });
  if (!palRows.length) list.append(el('div', {class: 'quiet', style: 'margin:8px'}, `Nothing matches “${q}” in the ${P().label} market.${!P().fno && /nifty|fut|\bce\b|\bpe\b|option/i.test(q) ? ' F&O is India only: switch the market to India.' : ''}`));
}
function palMark(i) { palSel = i; $$('.mb-pal-item', F.pal).forEach((n, j) => n.setAttribute('aria-selected', String(j === i))); $('#pal-' + i, F.pal)?.scrollIntoView({block: 'nearest'}); }
function palKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); palMark(Math.min(palRows.length - 1, palSel + 1)); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); palMark(Math.max(0, palSel - 1)); }
  else if (e.key === 'Enter' && palRows[palSel]) { e.preventDefault(); const r = palRows[palSel]; closePal(); r.open(); }
}
function closePal() { F.pal.classList.remove('on'); st.pal = null; if (!F.drawer.classList.contains('open') && !F.keys.classList.contains('on')) F.veil.classList.remove('on'); lastFocus?.focus?.(); }
/* shortcuts (PLATFORM_DESIGN.md section 3.5) */
function openKeys() {
  closePal(); closeMenu();
  const k = (...ks) => el('dt', {}, ...ks.map(x => el('span', {class: 'mb-kbd'}, x)));
  F.keys.replaceChildren(el('div', {class: 'mb-modal-head'}, icon('keyboard'), el('h2', {id: 'keys-title'}, 'Keyboard shortcuts'), el('button', {class: 'md-icon-btn small', type: 'button', 'aria-label': 'Close', onclick: closeKeys}, icon('close'))),
    el('div', {class: 'mb-modal-body'}, el('dl', {class: 'mb-keys'},
      k('/'), el('dd', {}, 'Search everything (also Ctrl K)'), k('B'), el('dd', {}, 'Buy the focused row'), k('S'), el('dd', {}, 'Sell the focused row'), k('Esc'), el('dd', {}, 'Close the drawer, card or dialog'),
      k('g', 'h'), el('dd', {}, 'Dashboard'), k('g', 'p'), el('dd', {}, 'Portfolio: positions'), k('g', 'o'), el('dd', {}, 'Orders'), k('g', 's'), el('dd', {}, 'Screener'), k('?'), el('dd', {}, 'This list'))),
    el('div', {class: 'mb-modal-foot'}, el('span', {}, 'Every action also has a button: the keyboard is a shortcut, never the only way.')));
  F.keys.classList.add('on'); F.veil.classList.add('on'); st.keys = true; $('button', F.keys).focus();
}
function closeKeys() { F.keys.classList.remove('on'); st.keys = false; if (!F.drawer.classList.contains('open') && !F.pal.classList.contains('on')) F.veil.classList.remove('on'); }
/* snackbar */
let snackT = null;
function snack(msg) { F.snack.replaceChildren(el('span', {}, msg), el('button', {class: 'md-btn text', type: 'button', onclick: () => F.snack.classList.remove('on')}, 'OK')); F.snack.classList.add('on'); clearTimeout(snackT); snackT = setTimeout(() => F.snack.classList.remove('on'), 5000); }



