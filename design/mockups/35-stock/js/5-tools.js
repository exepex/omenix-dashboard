/* Our strategies, for a beginner (owner, 13 Oct 2026): the price forecast explained in plain words, which families buy
   (not how they decide: that is ours to keep), who holds the stock now, which family is winning here (with a labelled
   winning and losing example until trades settle), and the AI team's view in plain words. */
function tools(main, c, S) {
  main.append(forecastCard(c, S), c.el('div', {class: 'sec'}, familiesCard(c, S)), c.el('div', {class: 'grid2 even sec'}, holdersCard(c, S), winningCard(c, S)),
    c.el('div', {class: 'sec'}, aiCard(c, S)));
}

/* the one forecast every strategy reads: where it comes from, how to read it, and how much it says today */
function forecastCard(c, S) {
  const {el} = c, T = S.tools, q = S.quote.close, P = T.horizons[0].peers, lo = Math.min(...T.horizons.map(h => h.lo80)), hi = Math.max(...T.horizons.map(h => h.hi80));
  const at = v => ((v - lo) / (hi - lo) * 100).toFixed(1), pc = v => `${fmt(v * 100, 1)}%`;
  return el('section', {class: 'card', 'aria-label': 'Our price forecast'}, head(c, 'Our price forecast for the next five sessions', `made before the open of ${day(c, T.session)}`),
    el('div', {class: 'explain'},
      el('p', {}, el('b', {}, 'Where it comes from. '), 'Our forecast model, built from this stock’s past prices and recent news. It is one forecast for everyone: it is not the rule-based, hybrid or AI team, and all of them read the same numbers.'),
      el('p', {}, el('b', {}, 'How to read it. '), `“Chance up” is how likely the price is to end higher on that day: 50% is a coin flip. The bar shows where the price may end: inside the darker part about 1 time in 2, inside the lighter part about 4 times in 5. The line is today’s ${fmt(q)}.`),
      P ? el('p', {class: 'warnline'}, c.icon('warning'), el('span', {}, el('b', {}, 'What it means today. '), `It gives almost every company the same chance (all ${P.n}: ${pc(P.lo)}–${pc(P.hi)}), so it says little about ${S.ticker}. It is not proven yet: none of its calls has been scored. Do not decide on it alone.`)) : null),
    el('div', {class: 'scroll'}, el('table', {class: 'md-table mb-fan stack'}, el('thead', {}, el('tr', {}, el('th', {}, 'Ends on'), el('th', {}, 'Chance up'), el('th', {}, 'Where the price may end (1 in 2 · 4 in 5)'))),
      el('tbody', {}, ...T.horizons.map(h => el('tr', {}, el('td', {'data-k': 'Ends on'}, day(c, h.target_date), el('small', {}, `in ${h.h} session${h.h === 1 ? '' : 's'}`)),
        el('td', {'data-k': 'Chance up'}, el('span', {class: 'chance', role: 'img', 'aria-label': `${fmt(h.prob * 100, 1)}% chance of a rise`}, el('i', {style: `width:${(h.prob * 100).toFixed(1)}%`})), el('small', {}, `${fmt(h.prob * 100, 1)}% · not proven`)),
        el('td', {'data-k': 'May end'}, el('span', {class: 'mb-fanbar', role: 'img', 'aria-label': `1 in 2: ${fmt(h.lo50)} to ${fmt(h.hi50)}; 4 in 5: ${fmt(h.lo80)} to ${fmt(h.hi80)}`},
          el('i', {class: 'b80', style: `left:${at(h.lo80)}%;width:${at(h.hi80) - at(h.lo80)}%`}), el('i', {class: 'b50', style: `left:${at(h.lo50)}%;width:${at(h.hi50) - at(h.lo50)}%`}), el('i', {class: 'now', style: `left:${at(q)}%`})),
          el('small', {}, `${fmt(h.lo50, 0)}–${fmt(h.hi50, 0)} · ${fmt(h.lo80, 0)}–${fmt(h.hi80, 0)}`))))))));
}

/* which families buy, per exit: names, counts and votes only (how a family decides is not shown) */
function familiesCard(c, S) {
  const {el} = c;
  return el('section', {class: 'card', 'aria-label': 'Which families buy'}, head(c, 'Which of our strategies buy', 'per family, for each exit'),
    el('div', {class: 'fams'}, el('div', {class: 'fam hd'}, el('span', {}, 'Family'), el('span', {class: 'votes'}, ...S.tools.horizons.map(h => el('small', {}, `N+${h.h}`)))),
      ...S.families.map(f => el('div', {class: 'fam'}, el('span', {}, c.apBadge(f.family), ' ', el('small', {class: 'muted', style: 'display:inline'}, `${f.n} strateg${f.n === 1 ? 'y' : 'ies'}`)),
        f.n ? el('span', {class: 'votes'}, ...f.votes.map(v => v.of ? el('span', {class: 'vote', role: 'img', 'aria-label': `N+${v.h}: ${v.buy} of ${v.of} buy`, 'data-tip': `N+${v.h}: ${v.buy} of ${v.of} buy`},
          el('span', {class: 'stack'}, ...Array.from({length: v.of}, (_, i) => el('i', {class: i < v.buy ? 'on' : ''}))), el('small', {}, `${v.buy}/${v.of}`))
            : el('span', {class: 'vote', 'data-tip': `N+${v.h}: it stayed out`}, el('span', {class: 'stack'}), el('small', {}, 'out'))))
          : el('span', {class: 'votes none'}, el('span', {class: 'mb-tag'}, 'none built yet'))))),
    el('p', {class: 'muted small', style: 'margin:8px 0 0'}, 'Filled: strategies that buy for that exit. N+1 is the next session, N+5 five sessions ahead.'));
}

/* who holds the stock now, family by family, with each paper trade's result */
function holdersCard(c, S) {
  const {el} = c, G = groupTrades(S.trades), H = S.holders, max = Math.max(...G.map(t => Math.abs(t.pnl)), 1);
  const row = f => { const mine = G.filter(t => t.family === f.family);
    return el('li', {}, el('span', {}, c.apBadge(f.family), el('small', {class: 'muted'}, f.n ? (mine.length ? '' : ' · not holding') : ' · none built yet')),
      ...mine.map(t => el('div', {class: 'hold'}, el('span', {}, el('b', {}, t.name), el('small', {class: 'muted', style: 'display:block'}, `bought ${day(c, t.entry_date)} at ${fmt(t.entry)} · for ${t.hs.length} exit${t.hs.length === 1 ? '' : 's'}`)),
        el('span', {class: 'pnl'}, hbar(c, t.pnl, max, `Paper result ${cur(c, t.pnl, 0)}`), el('b', {}, c.moneyDelta(t.pnl, 0)), el('small', {}, `${pct(t.ret, 2)} `, el('span', {class: 'mb-tag paper'}, 'Paper')))))); };
  return el('section', {class: 'card', 'aria-label': 'Strategies holding the stock'}, head(c, `Strategies holding ${S.ticker} now (${H.holding} of ${H.of})`, G.length ? `at the price check of ${c.when(S.trades[0].check_at)}` : ''),
    el('ul', {class: 'list'}, ...S.families.map(row)),
    el('p', {class: 'muted small', style: 'margin:8px 0 0'}, `Each trade is ${cur(c, G[0] ? G[0].amount : null, 0)} of paper money per exit; results at the last price check, before charges.`));
}

/* which family is winning on this stock, per exit: none has settled yet, so the labelled examples show a winning and a
   losing case (made-up numbers) and the real view says when the first results arrive */
let WH = 'all';   /* the exit shown in the winning card: all, or 1 / 3 / 5 */
function winningCard(c, S) {
  const {el} = c, X = S.examples, rows = EX ? X[EX] : null;
  const toggle = el('div', {class: 'acts wseg', style: 'margin-bottom:8px'}, seg(c, 'Show', [[null, 'Real today'], ['win', 'Example: a family is winning'], ['lose', 'Example: no family is winning']], EX, k => { EX = k; }));
  if (!rows) {
    const first = [1, 3, 5].map(h => [h, S.trades.filter(t => t.h === h).map(t => t.exit_date).sort()[0]]).filter(x => x[1]);
    return el('section', {class: 'card', 'aria-label': 'Which family is winning'}, head(c, 'Which family is winning here'), toggle,
      el('p', {}, el('span', {class: 'mb-label neutral'}, c.icon('schedule'), 'No settled trades yet')),
      el('p', {class: 'small'}, `This card will show, for ${S.ticker}, how many trades each family closed, how many made money, and its paper result, for each exit. No trade here has closed yet.`),
      first.length ? el('ul', {class: 'list'}, ...first.map(([h, d]) => el('li', {class: 'score'}, el('b', {class: 'small'}, `N+${h}`), el('span', {class: 'small'}, `first result on ${day(c, d)}`)))) : null, scoreLink(c));
  }
  const pick = r => WH === 'all' ? r : {family: r.family, ...(r.by_h[WH] || {settled: 0, wins: 0, pnl: null})};
  const R = rows.map(pick), max = Math.max(...R.map(r => Math.abs(r.pnl || 0)), 1), base = R.find(r => r.family === 'baseline');
  const lead = R.filter(r => r.pnl != null && r.settled).sort((a, b) => b.pnl - a.pnl)[0], wins = lead && lead.family !== 'baseline';
  const verdict = wins ? `▲ ${S.tools.families[lead.family].label} is winning here: ${cur(c, lead.pnl, 0)} over ${lead.settled} closed trades (${lead.wins} made money), more than the baselines’ ${cur(c, base.pnl, 0)}.`
    : `▼ No family beats the baselines here. A strategy that cannot beat “always buy” has no edge on ${S.ticker}.`;
  return el('section', {class: 'card', 'aria-label': 'Which family is winning'}, head(c, 'Which family is winning here', 'EXAMPLE, made-up numbers'), toggle,
    el('p', {class: 'small muted', style: 'margin:0 0 8px'}, el('span', {class: 'mb-tag'}, 'Example data'), ' Made-up numbers that show how this card will look once trades close. Not real results.'),
    el('div', {class: 'acts', style: 'margin-bottom:8px'}, seg(c, 'Exit', [['all', 'All exits'], ['1', 'N+1'], ['3', 'N+3'], ['5', 'N+5']], WH, k => { WH = k; })),
    el('p', {class: 'verdict ' + (wins ? 'good' : 'bad')}, verdict),
    el('ul', {class: 'list'}, ...R.map(r => el('li', {class: 'score'}, el('span', {}, c.apBadge(r.family)),
      r.settled ? [el('span', {class: 'small'}, `${r.wins} of ${r.settled} made money`), el('span', {class: 'pnl'}, hbar(c, r.pnl, max, `Paper result ${cur(c, r.pnl, 0)}`), el('b', {}, c.moneyDelta(r.pnl, 0)))]
        : el('span', {class: 'small muted'}, r.family === 'hybrid' ? 'none built yet' : 'no closed trade')))),
    el('p', {class: 'muted small', style: 'margin:8px 0 0'}, 'One stock gives few trades; the scoreboard compares the families across all stocks.'), scoreLink(c));
}
function scoreLink(c) { return c.el('button', {class: 'md-btn outlined small', type: 'button', onclick: () => c.go('scoreboards')}, c.icon('leaderboard'), 'Open the strategies scoreboard'); }

/* the AI team's view in plain words; its full recorded reasoning one tap away */
function aiCard(c, S) {
  const {el} = c, A = S.tools.ai_team, P = S.ai_plain;
  if (!A) return el('section', {class: 'card'}, head(c, 'What the AI team thinks'), el('p', {class: 'muted'}, 'The AI team recorded no view on this company today.'));
  return el('section', {class: 'card ai', 'aria-label': 'What the AI team thinks'}, head(c, 'What the AI team thinks', `today, ${c.when(A.made_at)}`),
    el('p', {class: 'muted small', style: 'margin:0 0 8px'}, 'The AI team is one of the four families above, and the only one that writes down why. Rule-based and hybrid strategies follow their own rules and give no reasons.'),
    el('p', {class: 'aisum'}, el('span', {class: 'mb-label neutral'}, c.icon('smart_toy'), A.decision_1d === 'abstain' && A.decision_5d === 'abstain' ? 'No buy or sell today' : `Next day: ${A.decision_1d} · Next week: ${A.decision_5d}`), ' ', P.summary),
    el('div', {class: 'grid2 even'}, el('div', {}, el('b', {class: 'small'}, '▲ What could push it up'), el('ul', {class: 'pts'}, ...P.up.map(x => el('li', {}, x)))),
      el('div', {}, el('b', {class: 'small'}, '▼ What could pull it down'), el('ul', {class: 'pts'}, ...P.down.map(x => el('li', {}, x))))),
    el('p', {class: 'small', style: 'margin:8px 0 0'}, el('span', {class: 'mb-tag', 'data-tip': P.note}, 'Example wording'), ' The plain words are written for this mockup from the AI team’s record; it does not record a beginner’s summary yet.'),
    el('details', {class: 'small'}, el('summary', {}, 'Read the AI team’s full reasoning, as recorded'),
      el('p', {}, el('b', {}, 'Verdict. '), A.verdict), el('p', {}, el('b', {}, 'For a rise. '), A.bull_case), el('p', {}, el('b', {}, 'Against. '), A.bear_case)));
}
