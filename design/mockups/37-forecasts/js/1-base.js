/* 37-forecasts page runtime (the Forecast contest; exepex/trading docs/BUILD_MAP.md slice 2). Split by purpose: 1 state
   and helpers, 2 the top (heading, what is happening now), 3 the scoreboard, 4 one question, 5 the details and how the
   contest works, 9 mount. Every colour is a design-system token; every verdict has a glyph and a word, never colour alone. */
let EX = null, Q = 0, WHO = 'book1_rules', RV = 'total', RQ = 'all';   /* URL: ex (start | early | review), q (1-5), who, rv (total | week | month), rq (all | 1-5) */
/* EX null is the real state of today (no forecast exists); the others are labelled Example states (owner, 13 Oct 2026:
   every mockup shows the good, the bad and the empty case) */
const EXAMPLES = {start: 'Example: first forecast made', early: 'Example: too early to tell', review: 'Example: after the first review'};
const AP = {book1_rules: 'rule', book2_hybrid: 'hybrid', book3_ai: 'ai'};
const LINE = {book1_rules: 'l1', book2_hybrid: 'l2', book3_ai: 'l3'};
/* each comparison's verdict: [glyph, word, mb-dir class] (protocol section 8: tested only from 40 settled days, and
   called proven only at the first review, with the strict multiple-comparison correction) */
const VERDICT = {better: ['check', 'Better, proven', 'up'], worse: ['close', 'Worse, proven', 'dn'], no_difference: ['trending_flat', 'No clear difference', 'flat'],
  before_review: ['timer', 'Not proven yet', 'unk'], too_few_dates: ['timer', 'Not proven yet', 'unk'], not_running: ['block', 'Not running yet', 'flat']};

function state() { return D.states[EX || 'real']; }
function question() { return D.questions[Q]; }
function nameOf(id) { return (D.families.find(f => f.id === id) || D.yardsticks.find(y => y.id === id)).name; }
function isFamily(id) { return id in AP; }
function chance(p) { return p == null ? '—' : `${Math.round(p * 100)}%`; }
function miss(x) { return x == null ? '—' : x.toFixed(3); }
function dayLabel(n) { return `day ${n}`; }
function head(c, title, sub) { return c.el('div', {class: 'sec-head'}, c.el('h2', {}, title), sub ? c.el('span', {class: 'sub'}, sub) : null); }
function howto(c, text) { return c.el('p', {class: 'howto'}, c.icon('help'), c.el('span', {}, text)); }
function seg(c, label, opts, now, set) {
  return c.el('div', {class: 'md-segmented dense qpick', role: 'group', 'aria-label': label}, ...opts.map(([k, v]) => c.el('button', {type: 'button', 'aria-pressed': String(now === k), onclick: () => { set(k); c.rerender(); }}, v)));
}
function verdictEl(c, v, sub) {
  const [g, word, cls] = VERDICT[v];
  return c.el('span', {class: 'cellv'}, c.el('span', {class: 'mb-dir ' + cls, 'aria-hidden': 'true'}, c.icon(g)), c.el('span', {}, word, sub ? c.el('small', {}, sub) : null));
}
function who(c, id) {
  if (isFamily(id)) return c.el('span', {class: 'who'}, c.apBadge(AP[id]));
  return c.el('span', {class: 'who', 'data-tip': D.yardsticks.find(y => y.id === id).plain}, c.el('span', {class: 'mb-ap baseline', 'aria-hidden': 'true'}, c.icon('trending_flat')), c.el('span', {class: 't'}, nameOf(id)));
}
/* "not proven yet" in numbers: settled days so far against the 40 the protocol needs before any test */
function proof(c, n) {
  const need = D.rules.min_dates, w = Math.min(100, n / need * 100);
  return c.el('div', {class: 'proof'}, c.el('div', {class: 'md-progress', role: 'img', 'aria-label': `${n} of ${need} settled days`}, c.el('i', {style: `width:${w.toFixed(0)}%`})),
    n >= need ? 'Enough days to test; verdict at the first review' : `${n} of ${need} settled days; ${need - n} more needed before any test`);
}
/* overview helpers (owner's feedback of 13 Oct 2026: one race of all families, who wins and why) */
function ov() { return state().overview; }
function runningFams() { const O = ov(); return O ? D.families.filter(f => (O.table[f.id] || {}).n) : []; }
function signed(x, d = 1) { return x == null ? '—' : `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toLocaleString('en-IN', {minimumFractionDigits: d, maximumFractionDigits: d})}`; }
function refName() { return nameOf(ov().ref); }
/* a family's best and weakest question by points per forecast against the yardstick */
function bestWorst(t) {
  const qs = Object.entries(t.questions).filter(([, x]) => x.points_per_forecast != null).sort((a, b) => b[1].points_per_forecast - a[1].points_per_forecast);
  const short = id => D.questions.find(q => q.id === id).short.toLowerCase();
  return qs.length ? {best: short(qs[0][0]), worst: short(qs.at(-1)[0]), bestPts: qs[0][1].points_per_forecast, worstPts: qs.at(-1)[1].points_per_forecast} : null;
}
/* why, in one line, from what the family's own forecasts show (never how it forecasts) */
function whyLine(t) {
  const bw = bestWorst(t);
  if (!bw) return 'No settled forecast yet.';
  if (t.bold_pct > 50 && t.honesty_gap > 15) return `Very sure of itself: it leans the right way ${Math.round(t.right_pct)}% of the time, but when wrong it was nearly certain, so its big misses cost more than all its wins.`;
  if (t.points > 0 && t.honesty_gap <= 6) return `Honest about its confidence and bold enough to use it: when it says 70%, it happens about 70% of the time. Strongest on “${bw.best}”.`;
  if (t.points > 0) return `Careful: it rarely strays far from 50%, so it wins small and loses small. Strongest on “${bw.best}”, weakest on “${bw.worst}”.`;
  return `Misses more than the simple yardstick, most on “${bw.worst}”.`;
}
