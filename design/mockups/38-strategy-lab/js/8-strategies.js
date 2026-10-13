/* Inside each family: its strategies (stocks) or what it traded (F&O), each with trades, win rate and profit, so a
   professional can see which part of a family carries it. The AI team is one team and is not split (owner, 13 Oct). */
function strategiesPart(main, c) {
  const {el} = c, fams = families().filter(f => tradesOf(c, f).length);
  const sec = el('section', {class: 'card sec', 'aria-label': 'Inside each family'}, head(c, 'Inside each family', 'which of its strategies made the money; since the start'));
  if (!fams.length) { sec.append(quiet(c, 'Empty: once trades close, each family’s strategies are listed here with their own trades, win rate and profit.')); main.append(sec); return; }
  if (!fams.includes(SF)) SF = fams[0];
  const groups = {};
  for (const t of tradesOf(c, SF)) { const k = t[7] === 'fno' ? `F&O: ${t[2]}` : t[6]; (groups[k] ||= []).push(t); }
  const rows = Object.entries(groups).map(([k, T]) => [k, stats(T)]).sort((a, b) => b[1].net - a[1].net), max = Math.max(1, ...rows.map(r => Math.abs(r[1].net)));
  sec.append(seg(c, 'Family', fams.map(f => [f, nameOf(f)]), SF, k => { SF = k; }),
    el('div', {class: 'scroll'}, el('table', {class: 'md-table ptable stack'}, el('thead', {}, el('tr', {}, el('th', {}, SF === 'ai' ? 'What it traded' : 'Strategy'), el('th', {}, 'Profit after charges'), el('th', {class: 'num'}, 'Trades'), el('th', {class: 'num'}, 'Win rate'), el('th', {class: 'num'}, 'Per trade'))),
      el('tbody', {}, ...rows.map(([k, s]) => el('tr', {}, el('td', {}, k), el('td', {'data-k': 'Profit after charges'}, el('span', {class: 'pbar'}, hbar(s.net, max, c), upDown(c, s.net, money(c, s.net)))),
        el('td', {class: 'num', 'data-k': 'Trades'}, String(s.n)), el('td', {class: 'num', 'data-k': 'Win rate'}, `${Math.round(s.rate)}%`), el('td', {class: 'num', 'data-k': 'Per trade'}, money(c, s.per))))))),
    howto(c, SF === 'ai' ? 'The AI team decides as one team, so it is shown by what it traded rather than by strategy.' : 'A family is only as good as its strategies together; a single strong strategy can carry the others, and a weak one can be dropped in a new version.'));
  main.append(sec);
}

/* predictions are a side view: how well each family reads NIFTY, in the Forecast lab (F&O only; profit decides) */
function predictionsLink(main, c) {
  if (ASSET === 'stocks' || c.m !== 'india') return;
  main.append(c.el('a', {class: 'card sec linkcard', href: '../37-forecasts/page.html' + (EX ? '#ex=review' : '')}, c.el('span', {class: 'mb-avatar sm info'}, c.icon('query_stats')),
    c.el('span', {}, c.el('b', {}, 'How well each family reads the market'), c.el('small', {}, 'Every day each F&O family also predicts five things about NIFTY. The Forecast lab scores those predictions. It is a side view: profit decides, not predictions.')), c.icon('chevron_right')));
}
