/* 38-strategy-lab page runtime (owner, 13 Oct 2026: which family makes money on paper, overall and over a period,
   stocks and F&O apart and together, for a first-time investor and a professional alike, so the owner can decide
   whether to trust it with real money). Split by purpose: 1 state and statistics, 2 the top, 3 ready for real money,
   4 since the start, 5 a chosen period, 6 month by month, 7 what drove the results, 8 the strategies inside each
   family, 9 mount. Tokens only; every gain or loss has its sign and word, never colour alone. */
let EX = null, ASSET = 'stocks', VIEW = 'simple', RANGE = '21', FROM = null, TO = null, RV = 'total', SF = 'rule';
/* URL: ex (early | review), asset (all | stocks | fno), view (simple | pro), range (5 | 21 | 63 | 126 | 252 | all |
   custom) with from and to, rv (total | week | month), sf (the family whose strategies are listed) */
const EXAMPLES = {early: 'Example: first month', review: 'Example: seven months in'};
const ASSETS = {all: 'Stocks + F&O', stocks: 'Stocks', fno: 'F&O'};
const AP = {rule: 'rule', hybrid: 'hybrid', ai: 'ai', baseline: 'baseline'};
const LINE = {rule: 'l1', hybrid: 'l2', ai: 'l3', baseline: 'ly', nifty: 'ly'};

function state() { return D.states[EX || 'real']; }
function mk(c) { return D.markets[c.m]; }
function inr(c) { return mk(c).currency === 'INR'; }
function money(c, x, d = 0) { if (x == null) return '—'; const a = Math.abs(x).toLocaleString(inr(c) ? 'en-IN' : 'en-US', {minimumFractionDigits: d, maximumFractionDigits: d}); return `${x < 0 ? '−' : x > 0 ? '+' : ''}${inr(c) ? '₹' : '$'}${a}`; }
function plain(c, x) { return money(c, Math.abs(x)).replace(/^[+−]/, ''); }
function pct(x, d = 1) { return x == null ? '—' : `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toFixed(d)}%`; }
function dateOf(day) { const S = state(); return S.dates[Math.max(1, Math.min(day, S.dates.length)) - 1]; }
function dlabel(iso) { return iso ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}) : '—'; }
function dshort(iso) { return iso ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'}) : ''; }
function dayText(day) { return dlabel(dateOf(day)); }
function dayOf(iso) { const i = state().dates.indexOf(iso); return i < 0 ? null : i + 1; }
function nameOf(f) { return f === 'baseline' ? 'Baselines' : D.families.find(x => x.id === f).name; }
function head(c, title, sub) { return c.el('div', {class: 'sec-head'}, c.el('h2', {}, title), sub ? c.el('span', {class: 'sub'}, sub) : null); }
function howto(c, text) { return c.el('p', {class: 'howto'}, c.icon('help'), c.el('span', {}, text)); }
function quiet(c, text) { return c.el('div', {class: 'quiet'}, text); }
function seg(c, label, opts, now, set) {
  return c.el('div', {class: 'md-segmented dense pick', role: 'group', 'aria-label': label}, ...opts.map(([k, v]) => c.el('button', {type: 'button', 'aria-pressed': String(now === k), onclick: () => { set(k); c.rerender(); }}, v)));
}
function badge(c, f) { return c.apBadge(AP[f]); }
function upDown(c, x, text) { return c.el('b', {class: 'pl ' + (x > 0 ? 'pos' : x < 0 ? 'neg' : '')}, c.icon(x > 0 ? 'trending_up' : x < 0 ? 'trending_down' : 'trending_flat'), text); }

/* the trades of one family in the asset shown: [entry day, exit day, symbol, net, return %, reason, strategy, asset] */
function tradesOf(c, fam, asset = ASSET) {
  const T = state().trades[c.m] || {}, pick = a => (((T[a] || {})[fam]) || []).map(t => [...t, a]);
  return asset === 'all' ? [...pick('stocks'), ...pick('fno')] : pick(asset);
}
function within(trades, a, b) { return trades.filter(t => t[1] >= a && t[1] <= b); }
/* every number the leaderboard shows, from the trades alone (profit is after all charges) */
function stats(trades) {
  const n = trades.length, wins = trades.filter(t => t[3] > 0), losses = trades.filter(t => t[3] <= 0), sum = a => a.reduce((s, t) => s + t[3], 0);
  const gw = sum(wins), gl = sum(losses);
  let run = 0, peak = 0, dd = 0;
  for (const t of [...trades].sort((x, y) => x[1] - y[1])) { run += t[3]; peak = Math.max(peak, run); dd = Math.min(dd, run - peak); }
  return {n, net: gw + gl, won: wins.length, lost: losses.length, rate: n ? 100 * wins.length / n : null, avgWin: wins.length ? gw / wins.length : null, avgLoss: losses.length ? gl / losses.length : null,
    pf: gl ? gw / -gl : null, per: n ? (gw + gl) / n : null, ret: n ? trades.reduce((s, t) => s + t[4], 0) / n : null, dd,
    best: n ? trades.reduce((a, t) => t[3] > a[3] ? t : a) : null, worst: n ? trades.reduce((a, t) => t[3] < a[3] ? t : a) : null};
}
/* the families shown for the asset, and the reference line each is compared with */
function families() { return D.families.map(f => f.id); }
function reference(asset = ASSET) { return asset === 'stocks' ? 'baseline' : asset === 'fno' ? 'nifty' : null; }
/* holding NIFTY with the F&O book's money (₹5 lakh), as daily P&L points from day a, for comparison */
function niftyLine(c, a, b) {
  const lv = (state().index || {})[c.m]; if (!lv) return [];
  const cap = mk(c).fno_capital || 500000, base = lv[a - 1];
  return Array.from({length: b - a + 1}, (_, i) => [a + i, cap * (lv[a + i - 1] / base - 1)]);
}
