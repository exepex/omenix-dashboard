/* 45-strategy-lab-fno page runtime: the Strategy lab's F&O tab (ideas, approved strategies, paper results, real-money checks), drawn from the F&O data catalog's Mock
   examples (contract 2.10.0; story W3). Split by purpose: 1 state and helpers, 2 the page, 9 mount.
   The screen computes nothing beyond drawing: every figure is the payload's. Tokens only; never colour alone. */
let KEY = null;
/* URL: s (a state key of data.json); the default is the good case */
const KEYS = Object.keys(D.states);
const DEFAULT = KEYS.find(k => D.states[k].case === 'positive') || KEYS[0];
const CASE = {positive: 'Good case', negative: 'Bad case', empty: 'Empty case'};

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
function topPart(main, c, crumb, title, lede, tag) {
  const {el} = c;
  main.append(c.pagehead({crumbs: [['F&O'], [crumb]], title,
    meta: [el('span', {class: 'md-chip small'}, c.icon('public'), 'India · F&O'), tag ? c.paperTag() : null,
      el('span', {class: 'mb-tag mock', 'data-tip': 'Made-up numbers on a future date, from the F&O data catalog; never a real record.'}, 'Mock')].filter(Boolean)}));
  main.append(el('p', {class: 'lede'}, lede),
    el('div', {class: 'acts'}, el('span', {class: 'small muted'}, 'Mock state:'),
      el('div', {class: 'md-segmented dense qpick', role: 'group', 'aria-label': 'Mock state'}, ...KEYS.map(k => el('button', {type: 'button', 'aria-pressed': String(k === (KEY || DEFAULT)), 'data-tip': D.states[k].summary.replace(/^Mock \(india\): /, ''), onclick: () => { KEY = k; c.rerender(); }},
        CASE[D.states[k].case])))));
}
function srcLine(c, op, tip) {
  return c.el('div', {class: 'src', role: 'note', 'aria-label': 'Where the figures come from'},
    c.el('span', {class: 'mb-asof', 'data-tip': 'api/examples/fno-screens.json, operation ' + op}, c.icon('schedule'), 'F&O data catalog: ' + op),
    c.el('span', {class: 'mb-tag mock', 'data-tip': tip}, 'Mock: made up'));
}
