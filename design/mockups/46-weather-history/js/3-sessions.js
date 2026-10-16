/* Session by session, one strip per month, oldest first: the colour (glyph and word) and a "rebuilt" mark. */
function byMonth(sessions) {
  const groups = [];
  for (const s of sessions) { const m = month(s.session); if (!groups.length || groups.at(-1)[0] !== m) groups.push([m, []]); groups.at(-1)[1].push(s); }
  return groups;
}
function sessionsPart(main, c) {
  const {el} = c, S = pay().sessions;
  if (!S.length) return;
  main.append(el('div', {class: 'stack'}, sec(c, 'Session by session', ...byMonth(S).flatMap(([m, rows]) => [el('h3', {}, m),
    el('div', {class: 'strip', role: 'list', 'aria-label': m}, ...rows.map(s => el('span', {role: 'listitem'}, dshort(s.session), colourLabel(c, s.colour),
      s.label === 'backfill_exploratory' ? el('small', {}, 'rebuilt') : el('small', {}, 'live'))))]),
    howto(c, 'Read it left to right, oldest first. A run of RED means the weather kept new trades off for those sessions; whether that was right shows on the weather page’s record.'))));
}
