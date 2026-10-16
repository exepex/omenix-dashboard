/* 46-weather-history page runtime: the market weather's history (each session's colour and label, the counts), drawn
   from the F&O data catalog's Mock examples (contract 2.9.0; story W3a part 2). Split by purpose: 1 state and helpers,
   2 the counts, 3 session by session, 4 the chances, 9 mount. The screen computes nothing beyond drawing. Tokens only;
   never colour alone. */
let KEY = null;
/* URL: s (a state key of data.json); the default is the good case */
const KEYS = Object.keys(D.states);
const DEFAULT = KEYS.find(k => D.states[k].case === 'positive') || KEYS[0];
const CASE = {positive: 'Good case', negative: 'Bad case', empty: 'Empty case'};
const COLOUR = {GREEN: ['success', 'check'], AMBER: ['warn', 'warning'], RED: ['danger', 'block']};

function now() { return D.states[KEY || DEFAULT]; }
function pay() { return now().value.payload; }
function dshort(iso) { return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'}); }
function month(iso) { return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {month: 'long', year: 'numeric', timeZone: 'UTC'}); }
function sec(c, title, ...kids) { return c.el('section', {class: 'card sec', 'aria-label': typeof title === 'string' ? title : null}, c.el('h2', {}, title), ...kids); }
function howto(c, text) { return c.el('p', {class: 'mb-howto'}, c.icon('help'), c.el('span', {}, text)); }
function fact(c, k, v, small) { return c.el('div', {class: 'mb-fact'}, c.el('span', {class: 'k'}, k), c.el('b', {}, v), small ? c.el('small', {}, small) : null); }
/* a weather colour always with its glyph and its word */
function colourLabel(c, colour) {
  if (!colour) return c.el('span', {class: 'mb-label neutral'}, c.icon('remove'), 'No colour');
  const [cls, glyph] = COLOUR[colour];
  return c.el('span', {class: 'mb-label ' + cls}, c.icon(glyph), colour);
}
function topPart(main, c) {
  const {el} = c;
  main.append(c.pagehead({crumbs: [['F&O'], ['Market weather', '../40-weather/page.html'], ['History']], title: 'Weather history',
    meta: [el('span', {class: 'md-chip small'}, c.icon('public'), 'India · F&O'),
      el('span', {class: 'mb-tag mock', 'data-tip': 'Made-up colours and chances on a future date, from the F&O data catalog; never a real record.'}, 'Mock')]}));
  main.append(el('p', {class: 'lede'}, 'Every session’s weather colour and its chance of a big move, and whether it was made on the day or rebuilt later from history.'),
    el('div', {class: 'acts'}, el('span', {class: 'small muted'}, 'Mock state:'),
      el('div', {class: 'md-segmented dense qpick', role: 'group', 'aria-label': 'Mock state'}, ...KEYS.map(k => el('button', {type: 'button', 'aria-pressed': String(k === (KEY || DEFAULT)), 'data-tip': D.states[k].summary.replace(/^Mock \(india\): /, ''), onclick: () => { KEY = k; c.rerender(); }},
        CASE[D.states[k].case])))));
}
function srcLine(c) {
  return c.el('div', {class: 'src', role: 'note', 'aria-label': 'Where the figures come from'},
    c.el('span', {class: 'mb-asof', 'data-tip': 'api/examples/fno-screens.json, operation getFnoWeatherHistory'}, c.icon('schedule'), 'F&O data catalog: getFnoWeatherHistory'),
    c.el('span', {class: 'mb-tag mock', 'data-tip': 'Every colour is made up; no weather record exists yet.'}, 'Mock: made up'));
}
