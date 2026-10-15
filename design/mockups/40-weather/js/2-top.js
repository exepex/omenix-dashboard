/* The top: what the weather is, which Mock state is shown, today's colour with its meaning, the two chances against
   the usual chance, and what moved it. */
function topPart(main, c) {
  const {el} = c, W = wx();
  main.append(c.pagehead({crumbs: [['F&O'], ['Market weather']], title: 'Market weather',
    meta: [el('span', {class: 'md-chip small'}, c.icon('public'), 'India · F&O · NIFTY'), c.paperTag(),
      el('span', {class: 'mb-tag mock', 'data-tip': 'Made-up numbers on a future date, from the F&O data catalog; never a real weather record.'}, 'Mock')]}));
  main.append(el('p', {class: 'lede'}, 'Is today dangerous? At 15:00 every trading day the desk works out the chance of a big NIFTY move (2% or more) and turns it into a colour. RED means no new paper trade that day. It is a survival rule, not a profit signal.'),
    el('div', {class: 'acts'}, el('span', {class: 'small muted'}, 'Mock state:'),
      el('div', {class: 'md-segmented dense qpick', role: 'group', 'aria-label': 'Mock state'}, ...KEYS.map(k => el('button', {type: 'button', 'aria-pressed': String(k === (KEY || DEFAULT)), 'data-tip': D.states[k].about, onclick: () => { KEY = k; c.rerender(); }},
        `${CASE[D.states[k].case]}: ${D.states[k].value.payload.colour || 'not published'}`)))));
  main.append(W.status === 'published' ? verdict(c, W) : missing(c, W));
}
function verdict(c, W) {
  const {el} = c, [, glyph, cls, words] = COLOUR[W.colour];
  return el('section', {class: 'mb-verdict ' + cls, 'aria-label': 'Today’s weather'}, el('span', {class: 'mb-verdict-box', 'aria-hidden': 'true'}, c.icon(glyph)),
    el('div', {}, el('div', {class: 'mb-verdict-word'}, W.colour, el('small', {}, `${words} · for ${dlabel(W.session)} · ${W.model_version}`)),
      el('p', {class: 'why'}, W.blocks_new_entries ? 'No new paper trade today. Open positions follow their exit plans.' : 'New paper trades are allowed today.')));
}
function missing(c, W) {
  const {el} = c;
  return el('section', {class: 'mb-verdict no', 'aria-label': 'No weather today'}, el('span', {class: 'mb-verdict-box', 'aria-hidden': 'true'}, c.icon('warning')),
    el('div', {}, el('div', {class: 'mb-verdict-word'}, 'No weather', el('small', {}, `for ${dlabel(W.session)}: not published`)),
      el('ul', {class: 'list'}, ...W.missing_inputs.map(m => el('li', {}, `${m.input} (${m.story}): ${m.detail}`)))));
}
function chancesPart(col, c) {
  const {el} = c, W = wx();
  const row = (label, p, base, times) => [el('p', {class: 'small', style: 'margin:8px 0 0'}, label),
    el('div', {class: 'chance', role: 'img', 'aria-label': `${label}: ${pct(p)}, usually ${pct(base, 1)}`},
      el('span', {class: 'track'}, p == null ? null : el('i', {style: `width:${Math.min(100, p * 200).toFixed(1)}%`}), base == null ? null : el('span', {class: 'base', style: `left:${Math.min(100, base * 200).toFixed(1)}%`})),
      el('b', {}, pct(p, 1))),
    el('small', {class: 'muted'}, base == null ? '' : `Usually ${pct(base, 1)} (last 750 sessions)` + (times == null ? '' : ` · ${times} times the usual chance`))];
  col.append(sec(c, 'The chance of a big move', ...row('A 2% move next session', W.p_big_1d, W.base_rate_1d, W.times_usual_1d),
    ...row('A 2% move within 5 sessions', W.p_big_5d, W.base_rate_5d, W.times_usual_5d),
    howto(c, 'The bar is the chance today; the black tick is the usual chance. The scale ends at 50%.')),
  sec(c, 'What moved it', W.drivers.length ? el('ul', {class: 'drivers'}, ...W.drivers.map(d => el('li', {}, el('span', {class: 'mb-label ' + (d.push === 'riskier' ? 'danger' : 'success')}, c.icon(d.push === 'riskier' ? 'trending_up' : 'trending_down'), d.push === 'riskier' ? 'Riskier' : 'Calmer'), d.text)))
    : el('p', {class: 'small muted', style: 'margin:0'}, 'Nothing to show: no weather was worked out today.')),
  sec(c, 'During the session', W.intraday.length ? el('ul', {class: 'drivers'}, ...W.intraday.map(u => el('li', {}, el('b', {}, ist(u.at)), colourLabel(c, u.from), c.icon('chevron_right'), colourLabel(c, u.to), u.why)))
    : el('p', {class: 'small muted', style: 'margin:0'}, 'No change during the session.'), howto(c, 'The live monitor can only raise the colour during a session (AMBER to RED), never lower it.')));
}
