/* Omenix platform runtime, part 2 of 7: navigation model, the frame, the app bar, the navigation rail. Concatenated in file order by platform_build.py into one script. */
/* ---- navigation (PLATFORM_DESIGN.md section 4; a screen without a mockup yet is marked "soon") ------------------ */
const B = n => `../${n}/page.html`;
const NAV = [
  {id: 'dashboard', label: 'Dashboard', icon: 'dashboard', items: [{id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: B('31-dashboard'), key: 'g h'}]},
  {id: 'markets', label: 'Markets', icon: 'monitoring', items: [{id: 'markets', label: 'Markets overview', icon: 'monitoring', href: B('34-markets')},{id: 'watchlists', label: 'Watchlists', icon: 'star'}, {id: 'chart', label: 'Chart', icon: 'show_chart'}, {id: 'calendar', label: 'Calendar', icon: 'calendar_month'}]},
  {id: 'trade', label: 'Trade', icon: 'candlestick_chart', items: [{id: 'chain', label: 'Option chain', icon: 'layers', india: true, href: B('32-option-chain'), key: 'g c'}, {id: 'builder', label: 'Strategy builder', icon: 'calculate', india: true}, {id: 'screener', label: 'Screener', icon: 'filter_list', href: B('33-screener'), key: 'g s'}, {id: 'order', label: 'Order window', icon: 'receipt_long', action: 'order', key: 'B / S'}]},
  {id: 'portfolio', label: 'Portfolio', icon: 'account_balance_wallet', items: [{id: 'positions', label: 'Positions', icon: 'account_balance_wallet', key: 'g p'}, {id: 'holdings', label: 'Holdings', icon: 'pie_chart'}, {id: 'funds', label: 'Accounts and funds', icon: 'payments'}, {id: 'orders', label: 'Orders', icon: 'receipt_long', key: 'g o'}, {id: 'reports', label: 'Reports', icon: 'bar_chart'}]},
  {id: 'strategies', label: 'Strategies', icon: 'science', items: [{id: 'lab', label: 'Strategy lab', icon: 'science'}, {id: 'track', label: 'Track record', icon: 'history'}, {id: 'scoreboards', label: 'Scoreboards', icon: 'leaderboard'}, {id: 'forecasts', label: 'Forecasts', icon: 'query_stats', india: true}]},
  {id: 'research', label: 'Research', icon: 'travel_explore', items: [{id: 'stock', label: 'Stock page', icon: 'apartment', href: B('35-stock')},{id: 'news', label: 'News', icon: 'newspaper'}, {id: 'events', label: 'Calendar', icon: 'event'}, {id: 'alerts', label: 'Alerts', icon: 'notifications'}]},
  {id: 'control', label: 'Control', icon: 'shield', items: [{id: 'risk', label: 'Risk', icon: 'shield'}, {id: 'judge', label: 'Judge and evidence', icon: 'gavel'}, {id: 'health', label: 'Data health', icon: 'dns'}]},
  null,
  {id: 'assistant', label: 'Assistant', icon: 'smart_toy', items: [{id: 'assistant', label: 'Assistant', icon: 'smart_toy'}]},
  {id: 'help', label: 'Help', icon: 'help', items: [{id: 'help', label: 'Help and glossary', icon: 'help'}, {id: 'shortcuts', label: 'Keyboard shortcuts', icon: 'keyboard', action: 'keys', key: '?'}]},
  {id: 'settings', label: 'Settings', icon: 'settings', items: [{id: 'settings', label: 'Settings', icon: 'settings'}]},
];
const PINS = [{label: 'Pinned: NIFTY option chain', short: 'NIFTY chain', icon: 'layers', india: true, screen: 'chain'}, {label: 'Pinned: saved screen "High IV rank, rising open interest"', short: 'High IV', icon: 'filter_list', india: true, screen: 'screener'}, {label: 'Pinned: Stock tool scoreboard (Rule vs AI)', short: 'Rule vs AI', icon: 'leaderboard', screen: 'scoreboards'}];
const shown = x => !x.india || P().fno;
const allScreens = () => NAV.filter(Boolean).flatMap(g => g.items.filter(shown).map(i => ({...i, group: g.id})));
const screen = id => allScreens().find(s => s.id === id);
const SOON = 'This screen’s mockup is not drawn yet (design/PLATFORM_DESIGN.md section 9 gives the order).';
function go(id) {
  const s = screen(id);
  if (!s) return snack('This screen is India only: it is absent in the US market.');
  if (s.action === 'order') return openOrder(firstTradable(), 'buy');
  if (s.action === 'keys') return openKeys();
  if (s.href) { location.href = s.href + hashCarry(); return; }
  snack(`${s.label}: ${SOON}`);
}
const hashCarry = () => { const h = new URLSearchParams(); if (st.m !== 'india') h.set('m', st.m); if (st.clock === 'open') h.set('clock', 'open'); if (st.theme !== 'light') h.set('theme', st.theme); if (st.density !== 'comfortable') h.set('density', st.density); const s = h.toString(); return s ? '#' + s : ''; };
const firstTradable = () => { const ids = P().signals.map(x => x.id); return ids.find(id => tradable(item(id))) || Object.keys(P().items)[0]; };

/* ---- the frame ---------------------------------------------------------------------------------------------- */
let F = {};
function frame() {
  document.body.prepend(el('div', {id: 'tip', class: 'md-tooltip', role: 'tooltip'}));
  F.pf = el('div', {class: 'mb-pf', id: 'pf'});
  F.main = el('main', {class: 'mb-pf-main', id: 'main'}, el('div', {class: 'mb-pf-inner', id: 'page'}));
  F.veil = el('div', {class: 'mb-veil', id: 'veil', onclick: closeTop});
  F.drawer = el('aside', {class: 'mb-drawer', id: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'drawer-title'});
  F.hc = el('div', {class: 'mb-hcard', id: 'hcard', role: 'dialog', 'aria-label': 'Quick view'});
  F.pal = el('div', {class: 'mb-modal palette', id: 'palette', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Search'});
  F.keys = el('div', {class: 'mb-modal', id: 'keys', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'keys-title'});
  F.menu = el('div', {class: 'mb-menu', id: 'menu', role: 'menu'});
  F.snack = el('div', {class: 'mb-snack', id: 'snack', role: 'status', 'aria-live': 'polite'});
  document.body.append(F.pf, F.veil, F.drawer, F.hc, F.pal, F.keys, F.menu, F.snack);
}
function applySettings() {
  const root = document.documentElement;
  if (st.theme === 'system') root.removeAttribute('data-theme'); else root.dataset.theme = st.theme;
  F.pf.classList.toggle('compact', st.density === 'compact');
  F.pf.classList.toggle('rail-compact', st.rail === 'icons');
  F.pf.classList.toggle('wl-off', st.wlOff);
  F.pf.classList.toggle('wl-on', st.wlopen);
}
function renderAll() {
  applySettings();
  const inner = $('#page', F.main);
  F.pf.replaceChildren(appbar(), navrail(), signalsPanel(), F.main, tabbar());
  inner.replaceChildren();
  page.render(inner, ctx());
  inner.append(el('footer', {}, 'Omenix · research and paper trading only: nothing here places a real order · ', el('b', {}, page.dataLabel || 'Example data'), ` as of ${nowLabel()}`,
    el('div', {class: 'mb-legal-links'}, el('a', {href: '../36-legal/privacy.html'}, 'Privacy policy'), ' · ', el('a', {href: '../36-legal/terms.html'}, 'Terms of service'))));
  writeHash();
}

/* app bar */
function appbar() {
  const unread = (S.notifications[st.m] || []).filter(n => n.unread).length;
  return el('header', {class: 'mb-appbar', id: 'appbar'},
    el('a', {class: 'mb-appbar-brand', href: B('31-dashboard') + hashCarry(), 'aria-label': 'Omenix: Dashboard'}, brandMark()),
    el('div', {class: 'mb-appbar-name'}, 'Omenix', el('small', {}, 'Research · Paper only')),
    el('button', {class: 'mb-gsearch', type: 'button', onclick: () => openPal(''), 'aria-label': 'Search stocks, F&O, screens (slash)'}, icon('search'), el('span', {class: 'lg'}, P().fno ? 'Search stocks, F&O, codes' : 'Search stocks'), el('span', {class: 'sm'}, 'Search…'), el('span', {class: 'mb-kbd'}, '/')),
    el('div', {class: 'md-segmented dense light', role: 'group', 'aria-label': 'Market'}, ...Object.entries(S.markets).map(([k, v]) => el('button', {type: 'button', 'aria-pressed': String(k === st.m), onclick: () => { if (st.m !== k) { st.m = k; st.wl = 0; closeAll(); renderAll(); } }}, v.label))),
    (k => el('span', {class: 'mb-mkt' + (k.open ? ' open' : ''), role: 'status', 'data-tip': `${P().exchange}: ${k.word.toLowerCase()}, ${k.text}.${k.open ? ' You can buy and sell.' : ' Your buy and sell are paused until then; the strategies keep paper trading.'}${st.clock === 'open' ? ' (Example clock: during the session.)' : ''}`}, el('i', {'aria-hidden': 'true'}), el('b', {}, k.word), el('span', {class: 't'}, k.text)))(market()),
    page.strip === false ? null : el('div', {class: 'mb-idx-strip', 'aria-label': 'Indices'}, ...P().indices.map(id => { const it = item(id), a = asOf(it); return el('a', {class: 'mb-idx' + (a.stale ? ' stale' : ''), href: '#', 'data-tip': `${it.sym}: ${a.tip}`, onclick: e => { e.preventDefault(); go('markets'); }}, el('span', {class: 'n'}, it.sym), el('span', {class: 'v'}, price(it)), delta(it.chg_pct)); })),
    el('div', {class: 'mb-appbar-end'},
      el('button', {class: 'md-icon-btn hide-phone', type: 'button', 'aria-label': st.wlOff ? 'Show today’s picks' : 'Hide today’s picks', 'data-tip': (st.wlOff ? 'Show' : 'Hide') + ' today’s picks panel', onclick: () => { if (innerWidth < 1200) { st.wlopen = !st.wlopen; applySettings(); } else { st.wlOff = !st.wlOff; applySettings(); writeHash(); } }}, icon('dock_to_left')),
      el('button', {class: 'md-icon-btn mb-badged', type: 'button', id: 'bell', 'aria-label': `Notifications, ${unread} unread`, onclick: e => openNotif(e.currentTarget)}, icon('notifications'), unread ? el('span', {class: 'md-badge count'}, unread) : null),
      el('button', {class: 'md-icon-btn', type: 'button', 'aria-label': 'Switch theme', 'data-tip': document.documentElement.dataset.theme === 'dark' ? 'Light theme' : 'Dark theme', onclick: () => { st.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; renderAll(); }}, icon(document.documentElement.dataset.theme === 'dark' ? 'light_mode' : 'dark_mode')),
      el('button', {class: 'mb-me', type: 'button', id: 'me', 'aria-label': 'Profile and settings', onclick: e => openProfile(e.currentTarget)}, 'OW')));
}

/* navigation rail */
function navrail() {
  const nav = el('nav', {class: 'mb-navrail', 'aria-label': 'Screens'});
  for (const g of NAV) {
    if (!g) { nav.append(el('div', {class: 'mb-rail-sep', role: 'separator'})); continue; }
    const items = g.items.filter(shown); if (!items.length) continue;
    const first = items.find(i => i.href) || items[0];
    const cur = page.group === g.id;
    const fly = el('div', {class: 'mb-rail-fly' + (st.fly === g.id ? ' on' : ''), role: 'menu', 'aria-label': g.label}, el('div', {class: 't'}, g.label),
      ...items.map(i => el('a', {href: i.href ? i.href + hashCarry() : '#', role: 'menuitem', 'aria-current': page.screen === i.id ? 'page' : null, 'aria-disabled': !i.href && !i.action ? 'true' : null, 'data-tip': !i.href && !i.action ? SOON : null, onclick: e => { if (!i.href) { e.preventDefault(); go(i.id); } }}, icon(i.icon), i.label, i.key ? el('small', {}, i.key) : !i.href && !i.action ? el('small', {}, 'soon') : null)));
    nav.append(el('div', {class: 'mb-rail-grp'}, el('a', {class: 'mb-rail-item', href: first.href ? first.href + hashCarry() : '#', 'aria-current': cur ? 'page' : null, 'aria-haspopup': items.length > 1 ? 'menu' : null, onclick: e => { if (!first.href) { e.preventDefault(); go(first.id); } }}, el('span', {class: 'mb-nav-ind'}, icon(g.icon)), el('span', {class: 'mb-nav-label'}, g.label)), items.length > 1 || !first.href ? fly : null));
  }
  const pins = PINS.filter(shown);
  if (pins.length) { nav.append(el('div', {class: 'mb-rail-sep', role: 'separator'})); nav.append(el('div', {class: 'mb-rail-pins-t'}, icon('push_pin'), 'Pinned')); for (const p of pins) nav.append(el('a', {class: 'mb-rail-pin', href: '#', 'data-tip': p.label, 'aria-label': p.label, onclick: e => { e.preventDefault(); go(p.screen); }}, icon(p.icon), el('span', {}, p.short))); }
  return nav;
}

