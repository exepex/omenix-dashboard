/* 41-paper-books page runtime: the F&O paper books, drawn from the F&O data catalog's Mock examples (story P1;
   exepex/trading design v2 section 3.2). Split by purpose: 1 state and helpers, 2 the books, 3 the trades, 9 mount.
   The screen computes nothing beyond drawing: every figure is the payload's. Tokens only; never colour alone.
   Each book is its own account: no figure is ever added across books. */
let KEY = null;
/* URL: s (a state key of data.json, e.g. india_lost); the default is the good case */
const KEYS = Object.keys(D.states);
const DEFAULT = KEYS.find(k => D.states[k].case === 'positive') || KEYS[0];
const CASE = {positive: 'Good case', negative: 'Bad case', empty: 'Empty case'};
const RESULT = {won: ['success', 'check', 'Won'], lost: ['danger', 'close', 'Lost'], flat: ['neutral', 'trending_flat', 'Flat']};
const EXIT = {take_profit: 'Took its profit', time_exit: 'Closed on time', max_loss_exit: 'Closed at its maximum loss',
  expiry_settlement: 'Settled at expiry', safety_stop: 'Safety stop', other: 'Other'};
const FILL = {filled: ['success', 'check', 'Filled'], missed_price_moved: ['warn', 'block', 'Missed: the price moved'], missed_no_quote: ['neutral', 'remove', 'Missed: no quote']};

function now() { return D.states[KEY || DEFAULT]; }
function pay() { return now().value.payload; }
function rs(c, x) { return c.money(x, 0, false, 'INR'); }
function signed(c, x) { return (x > 0 ? '+' : x < 0 ? '−' : '') + rs(c, Math.abs(x)); }
function dlabel(iso) { return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}); }
function sec(c, title, ...kids) { return c.el('section', {class: 'card sec', 'aria-label': typeof title === 'string' ? title : null}, c.el('h2', {}, title), ...kids); }
function howto(c, text) { return c.el('p', {class: 'mb-howto'}, c.icon('help'), c.el('span', {}, text)); }
function fact(c, k, v, small) { return c.el('div', {class: 'mb-fact'}, c.el('span', {class: 'k'}, k), c.el('b', {}, v), small ? c.el('small', {}, small) : null); }
function family(c, f) { const F = SHELL.families[f]; return c.el('span', {class: 'md-chip small'}, c.icon(F.icon), F.label); }
/* a profit or loss always with its sign, glyph and word, never colour alone */
function pnlLabel(c, x) {
  const [cls, g, w] = x > 0 ? ['success', 'trending_up', 'Up'] : x < 0 ? ['danger', 'trending_down', 'Down'] : ['neutral', 'trending_flat', 'Flat'];
  return c.el('span', {class: 'mb-label ' + cls}, c.icon(g), `${w} ${signed(c, x)}`);
}
