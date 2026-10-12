/* Omenix platform runtime, part 1 (files design/mockups/_platform/js/*.js, concatenated in file order by platform_build.py
   into one script, split by purpose to keep every file small). The runtime of the design mockups (design/PLATFORM_DESIGN.md sections 2, 3, 5 and 6).
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
const st = {m: 'india', theme: 'light', wl: 0, density: 'comfortable', rail: 'labels', wlOff: false, drawer: null, pal: null, keys: false, hc: null, menu: null, fly: null, notif: false, wlopen: false, qs: null};
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
  st.qs = h.get('qs'); st.fly = h.get('fly'); st.notif = h.get('notif') === '1'; st.wlopen = h.get('wlopen') === '1';
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

