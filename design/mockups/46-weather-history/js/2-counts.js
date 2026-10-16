/* The counts: how many sessions each colour, as numbers and as one bar (each part also named), then how many were
   made live and how many rebuilt from history. */
function share(n, total) { return total ? `${Math.round(n / total * 100)}%` : '0%'; }
function countsPart(main, c) {
  const {el} = c, N = pay().counts, total = N.green + N.amber + N.red + N.not_scored;
  const parts = [['g', N.green, 'GREEN'], ['a', N.amber, 'AMBER'], ['r', N.red, 'RED'], ['n', N.not_scored, 'not scored']];
  main.append(el('div', {class: 'stack'}, sec(c, 'How often each colour',
    total ? el('div', {}, el('div', {class: 'facts4'}, fact(c, 'GREEN (calm)', String(N.green), share(N.green, total)), fact(c, 'AMBER (take care)', String(N.amber), share(N.amber, total)),
        fact(c, 'RED (no new trades)', String(N.red), share(N.red, total)), fact(c, 'Not scored', String(N.not_scored), 'An input was missing; blocks like RED')),
      el('div', {class: 'mix', role: 'img', 'aria-label': parts.map(([, n, w]) => `${n} ${w}`).join(', ')}, ...parts.filter(([, n]) => n).map(([k, n]) => el('i', {class: k, style: `width:${(n / total * 100).toFixed(2)}%`}))),
      el('p', {class: 'small', style: 'margin:10px 0 0'}, el('b', {}, `${N.live} made live`), ` · ${N.backfill} rebuilt from history (exploratory)`))
      : el('p', {class: 'empty muted'}, 'No weather record yet: the first colour appears after the first session the weather runs.'),
    howto(c, 'A “rebuilt” session was coloured later from past data, to give the weather a history; it was never a live call, so it counts as exploratory, not as proof.'))));
}
