/* 39-trade-card page runtime: the daily trade card, drawn from the F&O data catalog's Mock examples (story P1;
   exepex/trading design v2 section 4.1). Split by purpose: 1 state and helpers, 2 the top, 3 the position, 4 why and how
   sure, 9 mount. The screen computes nothing: every figure is the payload's. Tokens only; never colour alone. */
let KEY = null;
/* URL: s (a state key of data.json, e.g. india_trade); the default is the empty case, the shape of today's real state */
const KEYS = Object.keys(D.states);
const DEFAULT = KEYS.find(k => D.states[k].case === 'empty') || KEYS[0];
const CASE = {positive: 'Good case', negative: 'Bad case', empty: 'Empty case'};
const STATUS = {TRADE: ['yes-ok', 'check', 'A paper trade today'], 'NO TRADE': ['no', 'block', 'Nothing to do today'], WATCH: ['watch', 'science', 'For learning only: never traded']};
const COLOUR = {GREEN: ['success', 'check'], AMBER: ['warn', 'warning'], RED: ['danger', 'block']};
const RUNGS = [['0', 'Idea'], ['1', 'Its forecast beat the yardstick'], ['2', 'Forward shadow'], ['3', 'Approved to paper'], ['4', 'Real-money gate met']];

function now() { return D.states[KEY || DEFAULT]; }
function card() { return now().value.payload; }
function rs(c, x) { return c.money(x, 0, false, 'INR'); }
function rsUnit(c, x) { return c.money(x, 2, false, 'INR'); }
function pct(p) { return p == null ? '—' : `${Math.round(p * 100)}%`; }
function ist(iso) { return iso ? new Date(iso).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'}) + ' IST' : 'not sent'; }
function dlabel(iso) { return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}); }
function sec(c, title, ...kids) { return c.el('section', {class: 'card sec', 'aria-label': typeof title === 'string' ? title : null}, c.el('h2', {}, title), ...kids); }
function howto(c, text) { return c.el('p', {class: 'mb-howto'}, c.icon('help'), c.el('span', {}, text)); }
function fact(c, k, v, small) { return c.el('div', {class: 'mb-fact'}, c.el('span', {class: 'k'}, k), c.el('b', {}, v), small ? c.el('small', {}, small) : null); }
function owner(c) { return c.el('span', {class: 'owner', 'data-tip': 'Owner only: live strikes and entry ranges are kept in Google Drive and your signed-in dashboard, never in a public repository (owner, 15 Oct 2026).'}, c.icon('lock'), 'Owner only'); }
/* a weather colour always with its glyph and its word */
function colourLabel(c, colour) {
  if (!colour) return c.el('span', {class: 'mb-label neutral'}, c.icon('remove'), 'No weather');
  const [cls, glyph] = COLOUR[colour];
  return c.el('span', {class: 'mb-label ' + cls}, c.icon(glyph), colour);
}
