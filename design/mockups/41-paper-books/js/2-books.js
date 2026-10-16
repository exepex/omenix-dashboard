/* The top and the three books: which Mock state is shown, then one card per book, its own account (never summed). */
function topPart(main, c) {
  const {el} = c;
  main.append(c.pagehead({crumbs: [['F&O'], ['Paper books']], title: 'Paper books',
    meta: [el('span', {class: 'md-chip small'}, c.icon('public'), 'India · F&O · NIFTY'), c.paperTag(),
      el('span', {class: 'mb-tag mock', 'data-tip': 'Made-up numbers on a future date, from the F&O data catalog; never a real paper record.'}, 'Mock')]}));
  main.append(el('p', {class: 'lede'}, 'Three paper books trade F&O on their own: Rule-based, Hybrid and the AI team. Each has its own paper account, so their results are never added together. No real order is ever placed.'),
    el('div', {class: 'acts'}, el('span', {class: 'small muted'}, 'Mock state:'),
      el('div', {class: 'md-segmented dense qpick', role: 'group', 'aria-label': 'Mock state'}, ...KEYS.map(k => el('button', {type: 'button', 'aria-pressed': String(k === (KEY || DEFAULT)), 'data-tip': D.states[k].summary.replace(/^Mock \(india\): /, ''), onclick: () => { KEY = k; c.rerender(); }},
        CASE[D.states[k].case])))));
}
function bookCard(c, a) {
  const {el} = c, change = a.value - a.opening_value, cap = 150000;
  return el('section', {class: 'card sec', 'aria-label': `${SHELL.families[a.family].label} book`},
    el('h2', {}, family(c, a.family), c.paperTag()),
    fact(c, 'Value', rs(c, a.value), `at the marks of ${dlabel(a.as_of)}`),
    el('p', {style: 'margin:6px 0 0'}, pnlLabel(c, change), el('small', {class: 'muted'}, ` since its opening ${rs(c, a.opening_value)}`)),
    el('div', {class: 'facts2', style: 'margin-top:8px'}, fact(c, 'Cash', rs(c, a.cash)), fact(c, 'Open positions', String(a.open_trades))),
    el('div', {class: 'cap'}, el('div', {class: 'bar', role: 'img', 'aria-label': `Open risk ${rs(c, a.open_max_loss)} of the ${rs(c, cap)} cap`}, el('i', {style: `width:${Math.min(100, a.open_max_loss / cap * 100).toFixed(1)}%`})),
      el('small', {class: 'muted'}, `Open risk ${rs(c, a.open_max_loss)} of its ${rs(c, cap)} cap (the open positions' maximum losses)`)),
    howto(c, 'Value is cash plus the open positions at their latest quotes. A book with no trade stays at its opening value.'));
}
function booksPart(main, c) {
  main.append(c.el('div', {class: 'books'}, ...pay().accounts.map(a => bookCard(c, a))));
}
