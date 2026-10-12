/* Omenix platform shell runtime of the design mockups (design/PLATFORM_DESIGN.md sections 2, 3, 5 and 6).
   A page defines `const SHELL = ...30-shell/data.json...` and `const D = ...its own data.json...`, then this script,
   then calls PF.mount({screen, group, render(main, ctx)}). The shell draws the app bar (brand, global search, market
   switch, index strip, bell, theme, profile), the navigation rail (groups with flyouts, pinned screens), the
   watchlist panel (5 lists, hover actions B S Chart Chain News More, drag to reorder), the hover card, the context
   menu, the command palette, the shortcuts list, the right drawer (Paper order window, quick view; a bottom sheet on
   phones) and the phone bottom tabs. Every class is a component of design/system/components.css; this file holds
   behaviour only. The URL hash holds the state (m, theme, wl, density, rail, drawer, pal, keys, hc, menu, fly, notif,
   wlopen), so Back, Forward and bookmarks work and every screenshot state is a link. Paper only: the order window
   records a paper order in the dashboard's inbox; nothing here places, modifies or cancels a real order. */
'use strict';
const PF = (() => {
const S = SHELL;
const NOW = Date.parse(S.now);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k === 'class') n.className = v; else if (k === 'html') n.innerHTML = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) { if (c == null || c === false) continue; n.append(c.nodeType ? c : document.createTextNode(String(c))); } return n; };
const svgEl = (tag, attrs = {}) => { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const icon = (id, cls = 'ms') => { const s = svgEl('svg', {class: cls, 'aria-hidden': 'true'}); const u = svgEl('use'); u.setAttribute('href', '#ms-' + id); s.append(u); return s; };
const help = tip => el('button', {class: 'md-help', type: 'button', 'data-tip': tip, 'aria-label': 'Explain'}, '?');

/* ---- state and the URL ------------------------------------------------------------------------------------- */
const st = {m: 'india', theme: 'light', wl: 0, density: 'comfortable', rail: 'labels', wlOff: false, drawer: null, pal: null, keys: false, hc: null, menu: null, fly: null, notif: false, wlopen: false};
let page = null, lastFocus = null;
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('m') in S.markets) st.m = h.get('m');
  if (['light', 'dark', 'system'].includes(h.get('theme'))) st.theme = h.get('theme');
  const wl = +h.get('wl'); if (wl >= 1 && wl <= 5) st.wl = wl - 1;
  if (h.get('density') === 'compact') st.density = 'compact';
  if (h.get('rail') === 'icons') st.rail = 'icons';
  if (h.get('wloff') === '1') st.wlOff = true;
  st.drawer = h.get('drawer'); st.pal = h.get('pal'); st.keys = h.get('keys') === '1'; st.hc = h.get('hc'); st.menu = h.get('menu');
  st.fly = h.get('fly'); st.notif = h.get('notif') === '1'; st.wlopen = h.get('wlopen') === '1';
  if (page && page.readHash) page.readHash(h);
}
function writeHash() {
  const h = new URLSearchParams();
  if (st.m !== 'india') h.set('m', st.m);
  if (st.theme !== 'light') h.set('theme', st.theme);
  if (st.wl) h.set('wl', st.wl + 1);
  if (st.density !== 'comfortable') h.set('density', st.density);
  if (st.rail !== 'labels') h.set('rail', st.rail);
  if (st.wlOff) h.set('wloff', '1');
  if (st.drawer) h.set('drawer', st.drawer);
  if (page && page.writeHash) page.writeHash(h);
  const s = h.toString();
  history.replaceState(null, '', s ? '#' + s : location.pathname + location.search);
}

/* ---- formatting --------------------------------------------------------------------------------------------- */
const LOC = {INR: 'en-IN', USD: 'en-US'}, SYM = {INR: '₹', USD: '$'};
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const P = (m = st.m) => S.markets[m];
const cur = () => P().currency;
const num = (x, d = 2, c = cur()) => x == null ? '—' : Math.abs(x).toLocaleString(LOC[c], {minimumFractionDigits: d, maximumFractionDigits: d});
const money = (x, d = null, sign = false, c = cur()) => { if (x == null) return '—'; const dd = d == null ? (c === 'INR' ? 0 : 2) : d; return (x < 0 ? '−' : sign && x > 0 ? '+' : '') + SYM[c] + num(x, dd, c); };
const sgn = (x, d = 2, u = '%') => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(d) + u;
const dir = x => x > 0 ? 'up' : x < 0 ? 'down' : 'flat';
const delta = (x, d = 2, u = '%') => x == null ? el('span', {class: 'muted'}, '—') : el('span', {class: 'mb-delta ' + dir(x)}, sgn(x, d, u));
const moneyDelta = (x, d = null, c = cur()) => x == null ? el('span', {class: 'muted'}, '—') : el('span', {class: 'mb-delta ' + dir(x)}, money(x, d, true, c));
const pad = n => String(n).padStart(2, '0');
const local = (iso, m = st.m) => new Date(Date.parse(iso) + P(m).offset_min * 60000);
const day = d => d.toISOString().slice(0, 10);
const hm = d => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
const dateShort = (iso, m = st.m) => { const d = local(iso, m); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
function when(iso, m = st.m) { const d = local(iso, m), n = local(S.now, m); const z = P(m).zone; return day(d) === day(n) ? `${hm(d)} ${z}` : `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${hm(d)} ${z}`; }
const nowLabel = (m = st.m) => when(S.now, m);
/* as-of of an instrument: its source, the short stamp, stale when older than the source's own cadence allows */
function asOf(it) {
  const src = S.sources[it.source], d = local(it.as_of), n = local(S.now);
  const stale = (NOW - Date.parse(it.as_of)) / 3600000 > src.max_age_h;
  const short = it.source === 'eod' ? `EOD ${d.getUTCDate()} ${MON[d.getUTCMonth()]}` : it.source === 'snap3pm' ? (day(d) === day(n) ? '3 pm snap' : `3 pm ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`) : day(d) === day(n) ? hm(d) + ' ' + P().zone : `${d.getUTCDate()} ${MON[d.getUTCMonth()]} close`;
  return {short, stale, tip: `${src.label} (${src.detail}). As of ${when(it.as_of)}.${stale ? ' Stale: older than this source should be.' : ''}${it.note ? ' ' + it.note : ''} Not a live price.`};
}
const asOfEl = (it, withIcon = true) => { const a = asOf(it); return el('span', {class: 'mb-asof' + (a.stale ? ' stale' : ''), 'data-tip': a.tip}, withIcon ? icon(a.stale ? 'warning' : 'schedule') : null, a.short + (a.stale ? ' · stale' : '')); };
const item = id => P().items[id];
const isFno = it => it.kind === 'option' || it.kind === 'future';
const tradable = it => it.kind !== 'index';
const price = it => num(it.last, 2);
const paperTag = () => el('span', {class: 'mb-tag paper', 'data-tip': 'Paper: research and paper trading only. No real order, no real money.'}, 'Paper');
const mockTag = () => el('span', {class: 'mb-tag mock', 'data-tip': S._note}, 'Mock');

/* ---- navigation (PLATFORM_DESIGN.md section 4; a screen without a mockup yet is marked "soon") ------------------ */
const B = n => `../${n}/page.html`;
const NAV = [
  {id: 'dashboard', label: 'Dashboard', icon: 'dashboard', items: [{id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: B('31-dashboard'), key: 'g h'}]},
  {id: 'markets', label: 'Markets', icon: 'monitoring', items: [{id: 'markets', label: 'Markets overview', icon: 'monitoring'}, {id: 'watchlists', label: 'Watchlists', icon: 'star'}, {id: 'chart', label: 'Chart', icon: 'show_chart'}, {id: 'calendar', label: 'Calendar', icon: 'calendar_month'}]},
  {id: 'trade', label: 'Trade', icon: 'candlestick_chart', items: [{id: 'chain', label: 'Option chain', icon: 'layers', india: true}, {id: 'builder', label: 'Strategy builder', icon: 'calculate', india: true}, {id: 'screener', label: 'Screener', icon: 'filter_list', key: 'g s'}, {id: 'order', label: 'Paper order window', icon: 'receipt_long', action: 'order', key: 'B / S'}]},
  {id: 'portfolio', label: 'Portfolio', icon: 'account_balance_wallet', items: [{id: 'positions', label: 'Positions', icon: 'account_balance_wallet', key: 'g p'}, {id: 'holdings', label: 'Holdings', icon: 'pie_chart'}, {id: 'funds', label: 'Accounts and funds', icon: 'payments'}, {id: 'orders', label: 'Orders', icon: 'receipt_long', key: 'g o'}, {id: 'reports', label: 'Reports', icon: 'bar_chart'}]},
  {id: 'strategies', label: 'Strategies', icon: 'science', items: [{id: 'lab', label: 'Strategy lab', icon: 'science'}, {id: 'track', label: 'Track record', icon: 'history'}, {id: 'scoreboards', label: 'Scoreboards', icon: 'leaderboard'}, {id: 'forecasts', label: 'Forecasts', icon: 'query_stats', india: true}]},
  {id: 'research', label: 'Research', icon: 'travel_explore', items: [{id: 'stock', label: 'Stock page', icon: 'apartment'}, {id: 'news', label: 'News', icon: 'newspaper'}, {id: 'events', label: 'Calendar', icon: 'event'}, {id: 'alerts', label: 'Alerts', icon: 'notifications'}]},
  {id: 'control', label: 'Control', icon: 'shield', items: [{id: 'risk', label: 'Risk', icon: 'shield'}, {id: 'judge', label: 'Judge and evidence', icon: 'gavel'}, {id: 'health', label: 'Data health', icon: 'dns'}]},
  null,
  {id: 'assistant', label: 'Assistant', icon: 'smart_toy', items: [{id: 'assistant', label: 'Assistant', icon: 'smart_toy'}]},
  {id: 'help', label: 'Help', icon: 'help', items: [{id: 'help', label: 'Help and glossary', icon: 'help'}, {id: 'shortcuts', label: 'Keyboard shortcuts', icon: 'keyboard', action: 'keys', key: '?'}]},
  {id: 'settings', label: 'Settings', icon: 'settings', items: [{id: 'settings', label: 'Settings', icon: 'settings'}]},
];
const PINS = [{label: 'Pinned: NIFTY option chain', short: 'NC', india: true, screen: 'chain'}, {label: 'Pinned: saved screen "High IV rank, rising open interest"', short: 'IV', india: true, screen: 'screener'}, {label: 'Pinned: Stock tool scoreboard (Rule vs AI)', short: 'RA', screen: 'scoreboards'}];
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
const hashCarry = () => { const h = new URLSearchParams(); if (st.m !== 'india') h.set('m', st.m); if (st.theme !== 'light') h.set('theme', st.theme); if (st.density !== 'comfortable') h.set('density', st.density); const s = h.toString(); return s ? '#' + s : ''; };
const firstTradable = () => { const ids = P().watchlists[st.wl].items.concat(P().watchlists[0].items); return ids.find(id => tradable(item(id))) || Object.keys(P().items)[0]; };

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
  F.pf.replaceChildren(appbar(), navrail(), watchlist(), F.main, tabbar());
  inner.replaceChildren();
  page.render(inner, ctx());
  inner.append(el('footer', {}, 'Omenix · research and paper trading only: nothing here places a real order · ', el('b', {}, 'Mock data'), ` as of ${nowLabel()}`));
  writeHash();
}

/* app bar */
function appbar() {
  const unread = (S.notifications[st.m] || []).filter(n => n.unread).length;
  return el('header', {class: 'mb-appbar', id: 'appbar'},
    el('a', {class: 'mb-appbar-brand', href: B('31-dashboard') + hashCarry(), 'aria-label': 'Omenix: Dashboard'}, el('span', {class: 'mb-brand-mark'}, 'OM')),
    el('div', {class: 'mb-appbar-name'}, 'Omenix', el('small', {}, 'Research · Paper only')),
    el('button', {class: 'mb-gsearch', type: 'button', onclick: () => openPal(''), 'aria-label': 'Search stocks, F&O, screens (slash)'}, icon('search'), el('span', {}, P().fno ? 'Search stocks, F&O, screens…' : 'Search stocks, screens, news…'), el('span', {class: 'mb-kbd'}, '/')),
    el('div', {class: 'md-segmented dense light', role: 'group', 'aria-label': 'Market'}, ...Object.entries(S.markets).map(([k, v]) => el('button', {type: 'button', 'aria-pressed': String(k === st.m), onclick: () => { if (st.m !== k) { st.m = k; st.wl = 0; closeAll(); renderAll(); } }}, v.label))),
    el('div', {class: 'mb-idx-strip', 'aria-label': 'Indices'}, ...P().indices.map(id => { const it = item(id), a = asOf(it); return el('a', {class: 'mb-idx' + (a.stale ? ' stale' : ''), href: '#', 'data-tip': `${it.sym}: ${a.tip}`, onclick: e => { e.preventDefault(); go('markets'); }}, el('span', {class: 'n'}, it.sym), el('span', {class: 'v'}, price(it)), delta(it.chg_pct)); })),
    el('div', {class: 'mb-appbar-end'},
      el('button', {class: 'md-icon-btn hide-phone', type: 'button', 'aria-label': st.wlOff ? 'Show the watchlist' : 'Hide the watchlist', 'data-tip': (st.wlOff ? 'Show' : 'Hide') + ' the watchlist panel', onclick: () => { if (innerWidth < 1200) { st.wlopen = !st.wlopen; applySettings(); } else { st.wlOff = !st.wlOff; applySettings(); writeHash(); } }}, icon('dock_to_left')),
      el('button', {class: 'md-icon-btn mb-badged', type: 'button', id: 'bell', 'aria-label': `Notifications, ${unread} unread`, onclick: e => openNotif(e.currentTarget)}, icon('notifications'), unread ? el('span', {class: 'md-badge count'}, unread) : null),
      el('button', {class: 'md-icon-btn hide-phone', type: 'button', 'aria-label': 'Switch theme', 'data-tip': document.documentElement.dataset.theme === 'dark' ? 'Light theme' : 'Dark theme', onclick: () => { st.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; renderAll(); }}, icon(document.documentElement.dataset.theme === 'dark' ? 'light_mode' : 'dark_mode')),
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
  if (pins.length) { nav.append(el('div', {class: 'mb-rail-sep', role: 'separator'})); for (const p of pins) nav.append(el('a', {class: 'mb-rail-pin', href: '#', 'data-tip': p.label, 'aria-label': p.label, onclick: e => { e.preventDefault(); go(p.screen); }}, p.short)); }
  return nav;
}

/* watchlist panel */
let dragId = null;
function watchlist() {
  const L = P().watchlists[st.wl];
  const list = el('ul', {class: 'mb-wl-list', id: 'wl-list', 'aria-label': `Watchlist ${L.name}`});
  for (const id of L.items) list.append(wlRow(item(id)));
  if (!L.items.length) list.append(el('li', {class: 'quiet', style: 'margin:12px'}, `“${L.name}” is empty. Type in the field above to add stocks${P().fno ? ', F&O underlyings or contracts' : ''}; or use “Add all to watchlist” in the Screener.`));
  const find = el('input', {type: 'search', placeholder: P().fno ? 'Search and add: infy, nifty 24500 ce' : 'Search and add: aapl, msft', 'aria-label': 'Filter or add to this watchlist', oninput: e => { const q = e.target.value.trim().toLowerCase(); for (const r of $$('.mb-wl-row', list)) r.hidden = q && !r.dataset.text.includes(q); }, onkeydown: e => { if (e.key === 'Enter') openPal(e.target.value); }});
  return el('aside', {class: 'mb-wl', id: 'wl', 'aria-label': 'Watchlist'},
    el('div', {class: 'mb-wl-head'}, el('label', {class: 'mb-wl-find'}, icon('search'), find),
      el('div', {class: 'mb-wl-meta'}, el('span', {}, el('b', {}, L.name), ` · ${L.items.length} / 50`), el('span', {class: 'mb-asof', 'data-tip': 'Every row shows its own as-of time: these are end-of-day files, the 3 pm option snapshot and the stock tool’s runs, not a live feed.'}, icon('schedule'), 'not live'),
        st.wlopen ? el('button', {class: 'md-icon-btn small', type: 'button', 'aria-label': 'Close the watchlist', onclick: () => { st.wlopen = false; applySettings(); renderTabs(); }}, icon('close')) : null)),
    list,
    el('div', {class: 'mb-wl-foot', role: 'tablist', 'aria-label': 'Watchlists'}, ...P().watchlists.map((w, i) => el('button', {type: 'button', role: 'tab', 'aria-pressed': String(i === st.wl), 'aria-selected': String(i === st.wl), 'data-tip': `${w.name} (${w.items.length})`, onclick: () => { st.wl = i; F.pf.replaceChild(watchlist(), $('#wl', F.pf)); writeHash(); }}, i + 1)),
      el('button', {type: 'button', 'aria-label': 'Watchlist settings: columns, sort', 'data-tip': 'Sort, columns and list names (Settings)', onclick: () => snack('Watchlist settings: sort, columns and names live in Settings.')}, icon('tune'))));
}
function wlRow(it) {
  const a = asOf(it), held = it.held;
  const acts = el('div', {class: 'mb-wl-acts'},
    el('button', {class: 'mb-bs buy', type: 'button', 'aria-label': `Paper buy ${it.sym}`, 'data-tip': tradable(it) ? 'Paper buy (B)' : 'An index cannot be traded: use its futures or options', disabled: !tradable(it), onclick: e => { e.stopPropagation(); openOrder(it.id, 'buy'); }}, 'B'),
    el('button', {class: 'mb-bs sell', type: 'button', 'aria-label': `Paper sell ${it.sym}`, 'data-tip': tradable(it) ? 'Paper sell (S)' : 'An index cannot be traded', disabled: !tradable(it), onclick: e => { e.stopPropagation(); openOrder(it.id, 'sell'); }}, 'S'),
    el('button', {class: 'md-icon-btn', type: 'button', 'aria-label': 'Chart', 'data-tip': 'Chart', onclick: e => { e.stopPropagation(); go('chart'); }}, icon('show_chart')),
    P().fno && (it.fno || isFno(it)) ? el('button', {class: 'md-icon-btn', type: 'button', 'aria-label': 'Option chain', 'data-tip': 'Option chain', onclick: e => { e.stopPropagation(); go('chain'); }}, icon('layers')) : null,
    el('button', {class: 'md-icon-btn', type: 'button', 'aria-label': `More actions for ${it.sym}`, 'aria-haspopup': 'menu', onclick: e => { e.stopPropagation(); openMenu(it.id, e.currentTarget); }}, icon('more_vert')));
  const row = el('li', {class: 'mb-wl-row' + (a.stale ? ' stale' : ''), tabindex: '0', draggable: 'true', 'data-inst': it.id, 'data-text': (it.sym + ' ' + it.name).toLowerCase(), 'aria-label': `${it.sym}, ${price(it)}, ${sgn(it.chg_pct)}, ${a.short}${a.stale ? ', stale' : ''}`,
      onclick: () => openHc(it.id, row), onkeydown: e => { if (e.key === 'Enter') openHc(it.id, row); },
      ondragstart: e => { dragId = it.id; e.dataTransfer.effectAllowed = 'move'; }, ondragover: e => e.preventDefault(),
      ondrop: e => { e.preventDefault(); const L = P().watchlists[st.wl].items; if (!dragId || dragId === it.id) return; L.splice(L.indexOf(dragId), 1); L.splice(L.indexOf(it.id), 0, dragId); dragId = null; F.pf.replaceChild(watchlist(), $('#wl', F.pf)); }},
    icon('drag_indicator', 'ms grip'),
    el('div', {style: 'min-width:0'}, el('div', {class: 'sym'}, it.sym, held ? el('span', {class: 'mb-label paper', style: 'padding:0 5px;font-size:10.5px;line-height:16px', 'data-tip': `Held in ${P().accounts[held.account].name}: ${held.qty} at ${num(held.avg)} (Paper)`}, 'held') : null), el('div', {class: 'sub'}, it.name)),
    el('div', {class: 'px'}, el('div', {}, price(it)), el('small', {'data-tip': a.tip}, delta(it.chg_pct), ' · ' + a.short + (a.stale ? ' · stale' : ''))),
    acts);
  return row;
}

/* phone bottom tabs: Home · Watchlist · Orders · Portfolio · More */
function tabbar() {
  const t = (id, label, ic, on, fn) => el('a', {class: 'mb-nav-item', href: '#', 'aria-current': on ? 'page' : null, onclick: e => { e.preventDefault(); fn(); }}, el('span', {class: 'mb-nav-ind'}, icon(ic)), label);
  const w = st.wlopen;
  return el('nav', {class: 'mb-navbar', id: 'tabs', 'aria-label': 'Main'},
    t('home', 'Home', 'home', !w && page.screen === 'dashboard', () => go('dashboard')),
    t('wl', 'Watchlist', 'star', w, () => { st.wlopen = !st.wlopen; applySettings(); renderTabs(); }),
    t('orders', 'Orders', 'receipt_long', !w && page.screen === 'orders', () => go('orders')),
    t('portfolio', 'Portfolio', 'account_balance_wallet', !w && page.group === 'portfolio' && page.screen !== 'orders', () => go('positions')),
    t('more', 'More', 'menu', !w && !['dashboard', 'orders'].includes(page.screen) && page.group !== 'portfolio', () => openDrawer('nav')));
}
const renderTabs = () => { const t = $('#tabs', F.pf); if (t) F.pf.replaceChild(tabbar(), t); };

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
    held ? el('div', {class: 'held'}, el('b', {}, `${held.qty > 0 ? 'Long' : 'Short'} ${Math.abs(held.qty)}`), ` at ${num(held.avg)} · ${acc.name}${held.structure ? ' · ' + held.structure : ''} · `, moneyDelta(pnl), ' ', paperTag()) : el('div', {class: 'held'}, 'No paper position in this market.'),
    el('div', {class: 'acts'},
      el('button', {class: 'md-btn outlined small', type: 'button', onclick: () => go('chart')}, icon('show_chart'), 'Chart'),
      P().fno && (it.fno || isFno(it)) ? el('button', {class: 'md-btn outlined small', type: 'button', onclick: () => go('chain')}, icon('layers'), 'Chain') : null,
      tradable(it) ? el('button', {class: 'md-btn small buy', type: 'button', onclick: () => openOrder(it.id, 'buy')}, 'Paper buy') : null,
      tradable(it) ? el('button', {class: 'md-btn small sell', type: 'button', onclick: () => openOrder(it.id, 'sell')}, 'Paper sell') : el('span', {class: 'muted', style: 'font-size:12px'}, 'Indices are not traded; use their futures or options.'))];
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
    tradable(it) ? row('receipt_long', 'Paper order', () => openOrder(id, 'buy'), 'B') : null,
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
/* command palette: stocks, F&O underlyings, contracts, screens, strategies, news, pages; recently viewed when empty */
let palSel = 0, palRows = [];
function palIndex() {
  const out = [];
  for (const it of Object.values(P().items)) out.push({group: it.kind === 'stock' ? 'Stocks' : it.kind === 'index' ? 'Indices' : 'F&O contracts', label: it.sym, sub: it.name, ic: it.kind === 'stock' ? 'apartment' : it.kind === 'index' ? 'monitoring' : 'layers', end: [price(it), ' ', delta(it.chg_pct)], open: () => openDrawer('quick:' + it.id), id: it.id});
  if (P().fno) for (const it of Object.values(P().items).filter(i => i.fno)) out.push({group: 'F&O underlyings', label: it.sym + ' options and futures', sub: 'Option chain · ' + it.name, ic: 'layers', open: () => go('chain')});
  for (const x of S.search_extra.filter(x => x.market === 'both' || x.market === st.m)) out.push({group: {screen: 'Screens', strategy: 'Strategies', news: 'News'}[x.kind], label: x.label, sub: x.sub, ic: {screen: 'filter_list', strategy: 'science', news: 'newspaper'}[x.kind], open: () => go({screen: 'screener', strategy: 'lab', news: 'news'}[x.kind])});
  for (const s of allScreens()) out.push({group: 'Pages', label: s.label, sub: NAV.find(g => g && g.id === s.group).label + (s.key ? ' · ' + s.key : ''), ic: s.icon, open: () => go(s.id)});
  return out;
}
const GROUP_ORDER = ['Recently viewed', 'Stocks', 'Indices', 'F&O underlyings', 'F&O contracts', 'Screens', 'Strategies', 'News', 'Pages'];
function palResults(q) {
  const idx = palIndex(); q = q.trim().toLowerCase();
  let rows;
  if (!q) rows = P().recent.map(id => ({...idx.find(r => r.id === id), group: 'Recently viewed'})).concat(idx.filter(r => r.group === 'Pages').slice(0, 6));
  else { const words = q.split(/\s+/); rows = idx.filter(r => words.every(w => (r.label + ' ' + r.sub).toLowerCase().includes(w))); }
  const by = {}; for (const r of rows) (by[r.group] ||= []).push(r);
  return GROUP_ORDER.filter(g => by[g]).flatMap(g => by[g].slice(0, 6));
}
function openPal(q = '') {
  closeHc(); closeMenu(); lastFocus = document.activeElement;
  const input = el('input', {type: 'search', value: q, placeholder: P().fno ? 'Search stocks, F&O underlyings, contracts, screens, strategies, news' : 'Search stocks, screens, strategies, news', 'aria-label': 'Search', 'aria-controls': 'pal-list', oninput: e => palDraw(e.target.value), onkeydown: palKey});
  F.pal.replaceChildren(el('div', {class: 'mb-modal-head'}, icon('search'), input, el('button', {class: 'md-icon-btn small', type: 'button', 'aria-label': 'Close', onclick: closePal}, icon('close'))), el('div', {class: 'mb-modal-body', id: 'pal-list', role: 'listbox'}),
    el('div', {class: 'mb-modal-foot'}, el('span', {}, el('span', {class: 'mb-kbd'}, '↑'), el('span', {class: 'mb-kbd'}, '↓'), 'move'), el('span', {}, el('span', {class: 'mb-kbd'}, 'Enter'), 'open'), el('span', {}, el('span', {class: 'mb-kbd'}, 'Esc'), 'close'), el('span', {}, `${P().label} market · prices are as-of, not live`)));
  F.pal.classList.add('on'); F.veil.classList.add('on'); st.pal = q || '1';
  palDraw(q); input.focus();
}
function palDraw(q) {
  palRows = palResults(q); palSel = 0;
  const list = $('#pal-list', F.pal); list.replaceChildren();
  let g = null;
  palRows.forEach((r, i) => { if (r.group !== g) { g = r.group; list.append(el('div', {class: 'mb-pal-group'}, g)); } list.append(el('div', {class: 'mb-pal-item', role: 'option', id: 'pal-' + i, 'aria-selected': String(i === palSel), onclick: () => { closePal(); r.open(); }, onpointermove: () => palMark(i)}, el('span', {class: 'mb-avatar ' + (r.group === 'Pages' ? 'neutral' : r.group === 'News' ? 'info' : '')}, icon(r.ic)), el('span', {style: 'min-width:0'}, el('b', {}, r.label), el('small', {}, r.sub)), el('span', {class: 'end'}, ...(r.end || [])))); });
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
      k('/'), el('dd', {}, 'Search everything (also Ctrl K)'), k('B'), el('dd', {}, 'Paper buy the focused row'), k('S'), el('dd', {}, 'Paper sell the focused row'), k('Esc'), el('dd', {}, 'Close the drawer, card or dialog'),
      k('g', 'h'), el('dd', {}, 'Dashboard'), k('g', 'p'), el('dd', {}, 'Portfolio: positions'), k('g', 'o'), el('dd', {}, 'Orders'), k('g', 's'), el('dd', {}, 'Screener'), k('?'), el('dd', {}, 'This list'))),
    el('div', {class: 'mb-modal-foot'}, el('span', {}, 'Every action also has a button: the keyboard is a shortcut, never the only way.')));
  F.keys.classList.add('on'); F.veil.classList.add('on'); st.keys = true; $('button', F.keys).focus();
}
function closeKeys() { F.keys.classList.remove('on'); st.keys = false; if (!F.drawer.classList.contains('open') && !F.pal.classList.contains('on')) F.veil.classList.remove('on'); }
/* snackbar */
let snackT = null;
function snack(msg) { F.snack.replaceChildren(el('span', {}, msg), el('button', {class: 'md-btn text', type: 'button', onclick: () => F.snack.classList.remove('on')}, 'OK')); F.snack.classList.add('on'); clearTimeout(snackT); snackT = setTimeout(() => F.snack.classList.remove('on'), 5000); }

/* ---- the right drawer: Paper order window, quick view, phone "More" ------------------------------------------ */
function openDrawer(view) {
  closeHc(); closeMenu(); closePal();
  if (!F.drawer.classList.contains('open')) lastFocus = document.activeElement;
  const [kind, id, side] = view.split(':');
  const body = kind === 'order' ? orderView(id, side) : kind === 'quick' ? quickView(id) : navView();
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
    const ok = executable && checks.every(c => c[0]);
    sumBox.replaceChildren(...[
      !executable ? el('div', {class: 'mb-alert danger', role: 'alert'}, icon('block'), el('div', {}, el('b', {class: 't'}, 'Refused: no executable quote'), el('div', {class: 's'}, tradable(it) ? `Our data has no bid and ask for ${it.sym}. Paper F&O orders are filled only from the recorded NIFTY monthly option snapshots (3 pm); this contract has ${it.source === 'eod' ? 'end-of-day prices only' : 'no recorded quotes'}, so it is refused, never filled from a guessed price.` : 'An index is not an instrument: trade its futures or options.')), el('span')) : null,
      !executable ? null : el('dl', {class: 'mb-order-sum'},
        el('dt', {}, o.type === 'limit' ? 'Limit price' : (it.kind === 'option' ? (o.side === 'buy' ? 'Ask at the 3 pm snapshot' : 'Bid at the 3 pm snapshot') : 'Last price (as-of)')), el('dd', {}, num(px)),
        el('dt', {}, fno ? `Quantity (${o.qty} lot${o.qty === 1 ? '' : 's'} × ${lot})` : 'Quantity'), el('dd', {}, String(units)),
        el('dt', {}, fno && it.kind === 'option' ? 'Premium' : 'Order value'), el('dd', {}, money(value, 2)),
        el('dt', {}, 'Charges (estimate) ', help(`${Pm.charges.label}. ` + ch.rows.map(([k, v]) => `${k} ${money(v, 2)}`).join(' · '))), el('dd', {}, money(ch.total, 2)),
        fno && executable ? [el('dt', {}, 'Maximum loss'), el('dd', {}, maxLoss === Infinity ? 'Unlimited' : money(maxLoss, 2))] : null,
        fno && executable ? [el('dt', {}, 'Margin estimate ', help('From our recorded margin source (labelled): for a bought option the premium paid; for a sold option a per-lot estimate. Mock value.')), el('dd', {}, money(margin, 0))] : null,
        el('dt', {class: 'tot'}, o.side === 'buy' ? 'Cash after (Manual)' : 'Cash after (Manual)'), el('dd', {class: 'tot'}, money(acc.cash + (o.side === 'buy' ? -(value + ch.total) : (fno ? value - ch.total : value - ch.total)), 2))),
      el('div', {}, el('div', {class: 'mb-micro', style: 'margin-bottom:6px'}, 'Checks against the Manual account’s limits'),
        el('ul', {class: 'mb-checks'}, ...checks.map(([pass, t, d]) => el('li', {class: pass ? 'ok' : 'fail'}, el('span', {class: 'mb-mark ' + (pass ? 'ok' : 'no')}, icon(pass ? 'check' : 'close')), el('span', {}, t, el('span', {class: 'vh'}, pass ? ' passed' : ' failed'), el('small', {}, d)))))),
      el('div', {class: 'mb-alert paper'}, icon('description'), el('div', {}, el('b', {class: 't'}, 'Paper order: no real order is placed'), el('div', {class: 's'}, `It goes to the dashboard’s inbox; the ${fno ? 'F&O tool' : 'stock tool'} imports it and fills it only from valid quotes with the strategies’ own fill rules, never from a guessed price.`)), el('span'))].filter(Boolean));
    const nextQ = Pm.next_quotes[it.kind === 'option' ? 'option' : 'stock'];
    foot.replaceChildren(
      el('button', {class: 'md-btn filled ' + o.side, type: 'button', disabled: !ok, style: 'height:44px', onclick: () => { closeDrawer(); snack(`Paper order recorded: ${o.side} ${units} ${it.sym}, ${o.type === 'limit' ? 'limit ' + num(o.limit) : 'market'}. Open until ${nextQ}.`); }}, icon(ok ? 'receipt_long' : 'block'), ok ? `Place paper ${o.side} · ${units} ${it.sym}` : (executable ? 'Blocked by a limit check' : 'Refused: no executable quote')),
      el('div', {class: 'muted', style: 'font-size:12px;text-align:center'}, ok ? (o.type === 'market' ? `Fills at the next valid quotes: ${nextQ}.` : `Fills only if the next valid quotes reach ${num(o.limit)}: ${nextQ}.`) : 'Nothing is recorded until every check passes.'));
  }
  for (const [k, v] of [['buy', 'Buy'], ['sell', 'Sell']]) sideBtns.append(el('button', {type: 'button', class: k, 'data-side': k, 'aria-pressed': String(o.side === k), onclick: () => { o.side = k; draw(); }}, icon(k === 'buy' ? 'trending_up' : 'trending_down'), v));
  const accSel = el('select', {class: 'mb-input', id: 'o-acc', 'aria-label': 'Account'}, ...Object.entries(Pm.accounts).map(([k, a]) => el('option', {value: k, selected: k === manualId, disabled: a.kind !== 'manual'}, a.kind === 'manual' ? `${a.name} · cash ${money(a.cash)}` : `${a.name} (strategy book: not traded by hand)`)));
  draw();
  return [drawerHead(`Paper ${fno ? 'F&O ' : ''}order`, null, el('div', {style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px'}, el('b', {style: 'font-size:15px'}, it.sym), el('span', {class: 'muted', style: 'font-size:13px'}, `${price(it)}`), delta(it.chg_pct), asOfEl(it), paperTag())),
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
function openOrder(id, side) { const it = item(id); if (!it) return; openDrawer(`order:${id}:${side}`); }

/* ---- tooltip (hover, focus, tap; Escape closes) ------------------------------------------------------------- */
let pinned = null;
function showTip(t, text) { const tip = $('#tip'); tip.textContent = text; tip.classList.add('on'); const r = t.getBoundingClientRect(); let left = r.left + r.width / 2 - tip.offsetWidth / 2, top = r.top - tip.offsetHeight - 8; left = Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, left)); if (top < 8) top = r.bottom + 8; tip.style.left = left + 'px'; tip.style.top = top + 'px'; }
function hideTip() { if (!pinned) $('#tip').classList.remove('on'); }

/* ---- global events ------------------------------------------------------------------------------------------ */
function closeTop() {
  if (F.menu.classList.contains('on')) return closeMenu();
  if (F.hc.classList.contains('on')) return closeHc();
  if (F.pal.classList.contains('on')) return closePal();
  if (F.keys.classList.contains('on')) return closeKeys();
  if (F.drawer.classList.contains('open')) return closeDrawer();
  if (st.wlopen) { st.wlopen = false; applySettings(); renderTabs(); }
}
function closeAll() { closeMenu(); closeHc(); closePal(); closeKeys(); closeDrawer(); }
let gPending = 0;
function bind() {
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-tip]'); if (t && !pinned && !e.target.closest('.mb-menu')) showTip(t, t.dataset.tip);
    const a = e.target.closest('a[data-inst], .tk[data-inst]');
    if (a && matchMedia('(hover: hover)').matches) { clearTimeout(hcTimer); hcTimer = setTimeout(() => openHc(a.dataset.inst, a), 350); }
  });
  document.addEventListener('pointerout', e => {
    if (e.target.closest('[data-tip]')) hideTip();
    if (e.target.closest('a[data-inst], .tk[data-inst]')) { clearTimeout(hcTimer); hcTimer = setTimeout(() => { if (!F.hc.matches(':hover') && hcAnchor && !hcAnchor.closest('.mb-wl')) closeHc(); }, 300); }
  });
  F.hc.addEventListener('pointerleave', () => { if (hcAnchor && !hcAnchor.closest('.mb-wl')) hcTimer = setTimeout(closeHc, 250); });
  F.hc.addEventListener('pointerenter', () => clearTimeout(hcTimer));
  document.addEventListener('focusin', e => { const t = e.target.closest('[data-tip]'); if (t) showTip(t, t.dataset.tip); });
  document.addEventListener('focusout', e => { if (e.target.closest('[data-tip]')) { pinned = null; hideTip(); } });
  document.addEventListener('click', e => {
    const t = e.target.closest('.md-help, span[data-tip], small[data-tip]');
    if (t) { e.preventDefault(); if (pinned === t) { pinned = null; hideTip(); } else { pinned = t; showTip(t, t.dataset.tip); } } else if (pinned) { pinned = null; hideTip(); }
    if (F.menu.classList.contains('on') && !e.target.closest('.mb-menu, [aria-haspopup="menu"], #bell, #me')) closeMenu();
    if (F.hc.classList.contains('on') && !e.target.closest('.mb-hcard, [data-inst]')) closeHc();
  });
  document.addEventListener('keydown', e => {
    const typing = e.target.closest('input, textarea, select');
    if (e.key === 'Escape') { pinned = null; hideTip(); closeTop(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPal(''); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); openPal(''); return; }
    if (e.key === '?') { e.preventDefault(); openKeys(); return; }
    if (gPending && Date.now() - gPending < 1200) { gPending = 0; const to = {h: 'dashboard', p: 'positions', o: 'orders', s: 'screener'}[e.key]; if (to) { e.preventDefault(); go(to); } return; }
    if (e.key === 'g') { gPending = Date.now(); return; }
    if (e.key === 'b' || e.key === 's') { const r = e.target.closest('[data-inst]'); if (r && tradable(item(r.dataset.inst))) { e.preventDefault(); openOrder(r.dataset.inst, e.key === 'b' ? 'buy' : 'sell'); } }
  });
  addEventListener('scroll', () => $('#appbar')?.classList.toggle('scrolled', scrollY > 4), {passive: true});
  addEventListener('hashchange', () => { readHash(); closeAll(); renderAll(); openFromHash(); });
}
/* screenshot and bookmark states held in the hash */
function openFromHash() {
  if (st.drawer) openDrawer(st.drawer);
  if (st.pal) openPal(st.pal === '1' ? '' : st.pal);
  if (st.keys) openKeys();
  if (st.fly) $$('.mb-rail-fly').forEach(f => f.closest('.mb-rail-grp').querySelector('.mb-rail-item .mb-nav-label').textContent.toLowerCase() === st.fly && f.classList.add('on'));
  const anchor = id => $(`.mb-wl [data-inst="${id}"]`) && getComputedStyle($('.mb-wl')).display !== 'none' ? $(`.mb-wl [data-inst="${id}"]`) : $(`#page [data-inst="${id}"]`);
  if (st.hc) { const id = st.hc; const a = anchor(id); if (a) { a.classList.add('open'); openHc(id, a); } }
  if (st.menu) { const id = st.menu; const a = anchor(id); if (a) { a.classList.add('open'); const b = a.querySelector('[aria-haspopup="menu"]'); openMenu(id, b && b.offsetParent ? b : a); } }
  if (st.notif) openNotif($('#bell'));
}

/* ---- the page API ------------------------------------------------------------------------------------------- */
function pagehead({crumbs = [], title, meta = [], actions = []}) {
  return el('div', {class: 'mb-pagehead'},
    el('ol', {class: 'mb-crumbs', 'aria-label': 'Breadcrumb'}, ...crumbs.map(([label, href], i) => el('li', {}, i === crumbs.length - 1 ? el('span', {'aria-current': 'page'}, label) : el('a', {href: href || '#'}, label)))),
    el('div', {style: 'min-width:0'}, el('h1', {}, title)), el('div', {class: 'mb-pagehead-meta'}, ...meta), el('div', {class: 'mb-pagehead-actions'}, ...actions));
}
const inst = (id, text) => { const it = item(id); return el('a', {class: 'tk', href: '#', 'data-inst': id, onclick: e => { e.preventDefault(); openDrawer('quick:' + id); }}, text || (it ? it.sym : id)); };
function ctx() { return {m: st.m, P: P(), S, st, cur: cur(), el, icon, svgEl, help, num, money, sgn, dir, delta, moneyDelta, when, dateShort, nowLabel, asOf, asOfEl, item, inst, isFno, paperTag, mockTag, pagehead, openOrder, openDrawer, openPal, openKeys, openHc, openMenu, go, snack, screen, rerender: renderAll}; }
function mount(cfg) { page = cfg; frame(); readHash(); renderAll(); bind(); openFromHash(); }
return {mount, el, icon, svgEl, money, num, sgn, delta, P, st};
})();
