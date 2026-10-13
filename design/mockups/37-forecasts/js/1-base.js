/* 37-forecasts page runtime: the Forecast lab (exepex/trading docs/BUILD_MAP.md slice 2; owner's feedback of 13 Oct
   2026: today's predictions first, then the track record overall and over a period the user picks, in plain words).
   Split by purpose: 1 state and helpers, 2 the top, 3 today's predictions, 4 overall, 5 a chosen period, 6 what made
   the difference, 7 each prediction, 8 the official statistics, 9 mount. Tokens only; never colour alone. */
let EX = null, Q = 0, WHO = 'book1_rules', RV = 'total', RQ = 'all', RANGE = '21', FROM = null, TO = null, DET = false;
/* URL: ex (start | early | review), q, who (official statistics), rv (total | day | week | month), rq (all | 1-5),
   range (5 | 10 | 21 | 42 | 63 | all | custom) with from and to (dates), det=1 (the official statistics open) */
const EXAMPLES = {start: 'Example: first predictions made', early: 'Example: too early to tell', review: 'Example: six months in'};
const AP = {book1_rules: 'rule', book2_hybrid: 'hybrid', book3_ai: 'ai'};
const LINE = {book1_rules: 'l1', book2_hybrid: 'l2', book3_ai: 'l3'};
/* each official test's verdict: [glyph, word, mb-dir class] (protocol section 8: tested only from 40 answered days, and
   called proven only at the first review, with the strict multiple-comparison correction) */
const VERDICT = {better: ['check', 'Better, proven', 'up'], worse: ['close', 'Worse, proven', 'dn'], no_difference: ['trending_flat', 'No clear difference', 'flat'],
  before_review: ['timer', 'Not proven yet', 'unk'], too_few_dates: ['timer', 'Not proven yet', 'unk'], not_running: ['block', 'Not running yet', 'flat']};

function state() { return D.states[EX || 'real']; }
function question() { return D.questions[Q]; }
function qOf(id) { return D.questions.find(q => q.id === id); }
function nameOf(id) { return (D.families.find(f => f.id === id) || D.yardsticks.find(y => y.id === id)).name; }
function isFamily(id) { return id in AP; }
function chance(p) { return p == null ? '—' : `${Math.round(p * 100)}%`; }
function miss(x) { return x == null ? '—' : x.toFixed(3); }
function fmt1(x) { return x == null ? '—' : x.toFixed(1); }
function signed(x, d = 1) { return x == null ? '—' : `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toLocaleString('en-IN', {minimumFractionDigits: d, maximumFractionDigits: d})}`; }
/* Example states carry their own trading dates (future dates from 2 Nov 2026, so they can never pass for history) */
function dateOf(day) { const S = state(); return S.dates ? S.dates[Math.min(day, S.dates.length) - 1] : null; }
function dlabel(iso) { return iso ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}) : '—'; }
function dayText(day) { return dlabel(dateOf(day)); }
function dayOf(iso) { const i = (state().dates || []).indexOf(iso); return i < 0 ? null : i + 1; }

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
function proof(c, n) {
  const need = D.rules.min_dates, w = Math.min(100, n / need * 100);
  return c.el('div', {class: 'proof'}, c.el('div', {class: 'md-progress', role: 'img', 'aria-label': `${n} of ${need} answered days`}, c.el('i', {style: `width:${w.toFixed(0)}%`})),
    n >= need ? 'Enough days to test; verdict at the first review' : `${n} of ${need} answered days; ${need - n} more before any test`);
}
function quiet(c, text) { return c.el('div', {class: 'quiet'}, text); }

/* the track record */
function ov() { return state().overview; }
function runningFams() { const O = ov(); return O ? D.families.filter(f => (O.table[f.id] || {}).n) : []; }
function refName() { return nameOf(ov().ref); }
/* answered days on the family's slowest question: no rank before every question has the protocol's 40 */
function settledDays(O, fid) { return Math.min(...Object.values(O.table[fid].questions).map(q => q.n || 0)); }
function bestWorst(t) {
  const qs = Object.entries(t.questions).filter(([, x]) => x.points_per_forecast != null).sort((a, b) => b[1].points_per_forecast - a[1].points_per_forecast);
  return qs.length > 1 ? {best: qOf(qs[0][0]).short, worst: qOf(qs.at(-1)[0]).short} : null;
}
/* why, in plain words, from what the family's own predictions show (never how it makes them) */
function whyLine(t) {
  const bw = bestWorst(t);
  if (!bw) return 'Too few answered predictions to say why yet.';
  if (t.bold_pct > 50 && t.honesty_gap > 15) return `Right about the direction ${Math.round(t.right_pct)}% of the time, but far too sure of itself: when it was wrong it had often said 90% or more, and those mistakes cost more than all its good calls.`;
  if (t.points > 0 && t.honesty_gap <= 6) return `Its chances can be trusted: when it says 70%, it happens about 7 times in 10. Sure when it should be, careful when it should be. Best at “${bw.best}”.`;
  if (t.points > 0) return `Plays it safe: its chances stay close to 50%, so it wins a little and loses a little. Best at “${bw.best}”, weakest at “${bw.worst}”.`;
  return `Does worse than the past average, mostly at “${bw.worst}”.`;
}
/* a prediction as a sentence: "On 2 Nov 2026 it said 92% sure fear would rise by 16 Nov 2026; fear fell." */
function predictionSentence(m) {
  const q = qOf(m.question), yes = m.said >= 0.5, sure = Math.round((yes ? m.said : 1 - m.said) * 100);
  return `On ${dayText(m.day)} it said ${sure}% sure ${yes ? q.said_yes : q.said_no} by ${dayText(m.day + q.days)}; ${m.outcome ? q.was_yes : q.was_no}.`;
}
