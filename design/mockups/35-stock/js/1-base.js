/* 35-stock page runtime (owner's feedback of 13 Oct 2026). Split by purpose: 1 state and helpers, 2 header, 3 price
   chart, 4 overview, 5 our strategies, 6 news and results, 7 F&O. Every colour is a design-system token. */
let TAB = 'overview', PER = '1y', CMP = false, SEC = false, RES = 'q', LOC = 'en-IN';   /* URL: tab, per, cmp, sec, res */
const TABS = [['overview', 'Overview'], ['tools', 'Our strategies'], ['news', 'News'], ['results', 'Results and filings'], ['fno', 'F&O']];
const SPANS = {'5d': ['5D', 5], '1m': ['1M', 21], '3m': ['3M', 63], '6m': ['6M', 126], '1y': ['1Y', 250], '2y': ['2Y', 504]};
const STATUS = {confirmed_primary: ['confirmed', 'success'], corroborated: ['corroborated', 'success'], single_source: ['single source', 'neutral'], unverified: ['unverified', 'warn'], rumour: ['rumour', 'danger'], promotional: ['promotional', 'danger'], contradicted: ['contradicted', 'danger'], not_checked: ['not checked yet', 'neutral']};
const BUILD = {long_buildup: ['Long build-up', 'success', 'Price up, open interest up: new buyers'], short_buildup: ['Short build-up', 'danger', 'Price down, open interest up: new sellers'],
  short_covering: ['Short covering', 'info', 'Price up, open interest down: sellers closing'], long_unwinding: ['Long unwinding', 'warn', 'Price down, open interest down: buyers closing']};

function fmt(x, d = 2) { return x == null ? '—' : x.toLocaleString(LOC, {minimumFractionDigits: d, maximumFractionDigits: d}); }
function cur(c, x, d = 2) { return x == null ? '—' : (LOC === 'en-IN' ? '₹' : '$') + fmt(x, d); }
function big(x) { return x == null ? '—' : LOC === 'en-IN' ? `₹${fmt(x / 1e7, 0)} cr` : `$${fmt(x / 1e9, 1)}B`; }
function pct(x, d = 1) { return x == null ? '—' : `${x > 0 ? '+' : x < 0 ? '−' : ''}${fmt(Math.abs(x), d)}%`; }
function seg(c, label, opts, cur0, set) { return c.el('div', {class: 'md-segmented dense', role: 'group', 'aria-label': label}, ...opts.map(([k, v]) => c.el('button', {type: 'button', 'aria-pressed': String(cur0 === k), onclick: () => { set(k); c.rerender(); }}, v))); }
function head(c, title, sub) { return c.el('div', {class: 'sec-head'}, c.el('h2', {}, title), sub ? c.el('span', {class: 'sub'}, sub) : null); }
function fact(c, k, v, s) { return c.el('div', {class: 'mb-fact'}, c.el('span', {class: 'k'}, k), c.el('b', {}, v), s ? c.el('small', {}, s) : null); }
function gap(c, what) { return c.el('span', {class: 'mb-tag', 'data-tip': `${what}: not in the stock tool’s records yet (listed as a data gap)`}, 'not recorded yet'); }
function quarterOf(iso) { const d = new Date(iso + 'T00:00:00Z'); return d.toLocaleString('en-GB', {month: 'short', year: 'numeric', timeZone: 'UTC'}); }
function day(c, iso) { return c.dateShort(iso.length > 10 ? iso : iso + 'T10:00:00Z'); }
function groupTrades(T) {   /* one row per strategy and buy date: the horizons it holds for */
  const g = {}; for (const t of T) (g[t.name + '|' + t.entry_date] ||= {...t, hs: [], exits: [], pnl: 0}).hs.push(t.h), g[t.name + '|' + t.entry_date].exits.push(t.exit_date);
  for (const t of T) g[t.name + '|' + t.entry_date].pnl += (t.amount || 0) * t.ret / 100;
  return Object.values(g);
}
/* one small horizontal bar of a value against a scale, for P&L and comparisons (sign shown by side and word, not colour alone) */
function hbar(c, value, max, label) {
  const w = Math.min(50, Math.abs(value) / (max || 1) * 50).toFixed(1);
  return c.el('span', {class: 'hbar', role: 'img', 'aria-label': label}, c.el('i', {class: value < 0 ? 'neg' : 'pos', style: value < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`}));
}
