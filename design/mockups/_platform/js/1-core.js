/* Omenix platform runtime, part 1 of 7 (files design/mockups/_platform/js/*.js, concatenated in file order by platform_build.py
   into one script). The runtime of the design mockups (design/PLATFORM_DESIGN.md sections 2, 3, 5 and 6).
   A page defines `const SHELL = ...30-shell/data.json...` and `const D = ...its own data.json...`, then this script,
   then calls PF.mount({screen, group, render(main, ctx)}). The shell draws the app bar (brand, global search, market
   switch, index strip, bell, theme, profile), the navigation rail (groups with flyouts, pinned screens), the
   picks panel (today’s buy picks by strategy family with their real figures; filter chips, pages, B / S on every row), the hover card, the context
   menu, the command palette, the shortcuts list, the right drawer (Paper order window, quick view; a bottom sheet on
   phones) and the phone bottom tabs. Every class is a component of design/system/components.css; this file holds
   behaviour only. The URL hash holds the state (m, theme, wl, density, rail, drawer, pal, keys, hc, menu, fly, notif,
   wlopen, ap, pg, fno), so Back, Forward and bookmarks work and every screenshot state is a link. Paper only: the order window
   records a paper order in the dashboard's inbox; nothing here places, modifies or cancels a real order. */
'use strict';
const PF = (() => {
const S = SHELL;
const NOW = Date.parse(S.now);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k === 'class') n.className = v; else if (k === 'html') n.innerHTML = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) { if (c == null || c === false) continue; n.append(c.nodeType ? c : document.createTextNode(String(c))); } return n; };
const svgEl = (tag, attrs = {}) => { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
/** The logo tile (design/brand/): the sprite's mb-logo mark on the brand gradient. */
const brandMark = () => { const s = svgEl('svg', {class: 'mb-logo', 'aria-hidden': 'true'}); const u = svgEl('use'); u.setAttribute('href', '#mb-logo'); s.append(u); const t = document.createElement('span'); t.className = 'mb-brand-mark'; t.append(s); return t; };
const icon = (id, cls = 'ms') => { const s = svgEl('svg', {class: cls, 'aria-hidden': 'true'}); const u = svgEl('use'); u.setAttribute('href', '#ms-' + id); s.append(u); return s; };
const help = tip => el('button', {class: 'md-help', type: 'button', 'data-tip': tip, 'aria-label': 'Explain'}, '?');

/* ---- state and the URL ------------------------------------------------------------------------------------- */
const st = {clock: 'now', m: 'india', theme: 'light', wl: 0, ap: 'all', pg: 0, fno: 'today', density: 'comfortable', rail: 'labels', wlOff: false, drawer: null, pal: null, keys: false, hc: null, menu: null, fly: null, notif: false, wlopen: false};
let page = null, lastFocus = null;
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('m') in S.markets) st.m = h.get('m');
  st.clock = h.get('clock') === 'open' ? 'open' : 'now';
  if (['light', 'dark', 'system'].includes(h.get('theme'))) st.theme = h.get('theme');
  if (['rule', 'ai', 'hybrid'].includes(h.get('ap'))) st.ap = h.get('ap');
  st.pg = Math.max(0, (+h.get('pg') || 1) - 1); st.fno = h.get('fno') === 'example' ? 'example' : 'today';
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
  if (st.clock === 'open') h.set('clock', 'open');
  if (st.theme !== 'light') h.set('theme', st.theme);
  if (st.ap !== 'all') h.set('ap', st.ap);
  if (st.pg) h.set('pg', st.pg + 1);
  if (st.fno !== 'today') h.set('fno', st.fno);
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
/* market session: open or closed now; your own buy and sell work only while it is open (owner, 13 Oct 2026). The
   strategies keep paper trading on their own schedule. #clock=open shows the same page during the session (example). */
function market(m = st.m) {
  const T = P(m).status, now = Date.parse(st.clock === 'open' ? T.example_open_now : S.now), o = Date.parse(T.open_utc), c = Date.parse(T.close_utc), z = P(m).zone;
  const at = iso => { const d = local(iso, m); return `${hm(d)} ${z}`; };
  if (now >= o && now < c) return {open: true, word: 'Open', text: `closes ${at(T.close_utc)}`};
  const next = now < o ? T.open_utc : T.next_open_utc;
  return {open: false, word: 'Closed', text: `opens ${now < o ? 'today' : dateShort(next, m)} ${at(next)}`, next};
}
const tradeLock = () => { const k = market(); return k.open ? null : `Market closed: you can buy and sell again when it ${k.text}. The strategies keep paper trading on their own.`; };
const isFno = it => it.kind === 'option' || it.kind === 'future';
const tradable = it => it.kind !== 'index';
const price = it => num(it.last, 2);
const paperTag = () => el('span', {class: 'mb-tag paper', 'data-tip': 'Paper: research and paper trading only. No real order, no real money.'}, 'Paper');
const mockTag = () => el('span', {class: 'mb-tag mock', 'data-tip': P().example_note}, 'Example data');

