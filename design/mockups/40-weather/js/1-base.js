/* 40-weather page runtime: the market weather, drawn from the F&O data catalog's Mock examples (story P1;
   exepex/trading design v2 section 2.3). Split by purpose: 1 state and helpers, 2 the top, 3 the record, 9 mount.
   The screen computes nothing beyond drawing: every figure is the payload's. Tokens only; never colour alone. */
let KEY = null;
/* URL: s (a state key of data.json, e.g. india_red); the default is the good case */
const KEYS = Object.keys(D.states);
const DEFAULT = KEYS.find(k => D.states[k].case === 'positive') || KEYS[0];
const CASE = {positive: 'Good case', negative: 'Bad case', empty: 'Empty case'};
const COLOUR = {GREEN: ['success', 'check', 'yes-ok', 'Calm'], AMBER: ['warn', 'warning', 'watch', 'Take care'], RED: ['danger', 'block', 'no', 'A big move is much more likely than usual']};
const VERDICT = {better: ['success', 'check', 'Better'], worse: ['danger', 'close', 'Worse'], no_difference: ['neutral', 'trending_flat', 'No clear difference'], not_tested: ['neutral', 'timer', 'Not enough data yet']};

function now() { return D.states[KEY || DEFAULT]; }
function wx() { return now().value.payload; }
function rs(c, x) { return c.money(x, 0, false, 'INR'); }
function pct(p, d = 0) { return p == null ? '—' : `${(p * 100).toFixed(d)}%`; }
function ist(iso) { return new Date(iso).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'}) + ' IST'; }
function dshort(iso) { return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'}); }
function dlabel(iso) { return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}); }
function sec(c, title, ...kids) { return c.el('section', {class: 'card sec', 'aria-label': typeof title === 'string' ? title : null}, c.el('h2', {}, title), ...kids); }
function howto(c, text) { return c.el('p', {class: 'mb-howto'}, c.icon('help'), c.el('span', {}, text)); }
function fact(c, k, v, small) { return c.el('div', {class: 'mb-fact'}, c.el('span', {class: 'k'}, k), c.el('b', {}, v), small ? c.el('small', {}, small) : null); }
/* a weather colour always with its glyph and its word */
function colourLabel(c, colour) {
  if (!colour) return c.el('span', {class: 'mb-label neutral'}, c.icon('remove'), 'No colour');
  const [cls, glyph] = COLOUR[colour];
  return c.el('span', {class: 'mb-label ' + cls}, c.icon(glyph), colour);
}
