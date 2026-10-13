/* Our strategies: the model's view that every strategy shares, how each family decides and votes, who holds the stock
   now with each paper trade's result, which family is winning here, and the AI team's written reading */
function tools(main, c, S) {
  main.append(modelView(c, S), c.el('div', {class: 'sec'}, familiesCard(c, S)), c.el('div', {class: 'grid2 sec'}, holdersCard(c, S), winningCard(c, S)),
    c.el('div', {class: 'sec'}, aiCard(c, S)));
}

/* How much the model's chance says about this company: the range over every company that day (orchestrator, 13 Oct 2026) */
function peerNote(c, P, prob) {
  if (!P) return null;
  const pc = v => `${fmt(v * 100, 1)}%`, flat = P.slope === 0;
  return c.el('small', {class: 'peer', 'data-tip': `On ${day(c, P.as_of)} all ${P.n} tracked companies got between ${pc(P.lo)} and ${pc(P.hi)}; ${P.common_n} of them got exactly ${pc(P.common)}, and this company ${pc(prob)}${P.same > 1 ? ` (with ${P.same - 1} others)` : ''}. ${flat ? 'Its calibration step flattens the chart and price signals (slope 0), so only the base rate and news move the number.' : `Its calibration slope is ${fmt(P.slope, 2)}, so the signals move the number only a little.`} The model has no settled track record yet: not proven.`},
    `all ${P.n}: ${pc(P.lo)}–${pc(P.hi)} · not proven`);
}

function modelView(c, S) {
  const {el} = c, T = S.tools, q = S.quote.close, lo = Math.min(...T.horizons.map(h => h.lo80)), hi = Math.max(...T.horizons.map(h => h.hi80)), at = v => ((v - lo) / (hi - lo) * 100).toFixed(1);
  return el('section', {class: 'card', 'aria-label': 'The model’s view'}, head(c, 'The model’s view, shared by all strategies', `for the session of ${day(c, T.session)}, made before the open (${c.when(T.made_at)})`),
    el('p', {class: 'small', style: 'margin:0 0 8px'}, 'The chance of a rise and the expected range come from the stock tool’s one model. Every strategy reads the same numbers; no family has its own range.'),
    el('div', {class: 'scroll'}, el('table', {class: 'md-table mb-fan stack'}, el('thead', {}, el('tr', {}, el('th', {}, 'Exit'), el('th', {class: 'num'}, 'Chance up'), el('th', {}, 'Model’s expected range (shared by all strategies): 50% · 80%'))),
      el('tbody', {}, ...T.horizons.map(h => el('tr', {}, el('td', {'data-k': 'Exit'}, `N+${h.h}`, el('small', {}, day(c, h.target_date))),
        el('td', {class: 'num', 'data-k': 'Chance up'}, h.prob == null ? '—' : `${fmt(h.prob * 100, 1)}%`, peerNote(c, h.peers, h.prob)),
        el('td', {'data-k': 'Expected range'}, el('span', {class: 'mb-fanbar', role: 'img', 'aria-label': `50%: ${fmt(h.lo50)} to ${fmt(h.hi50)}; 80%: ${fmt(h.lo80)} to ${fmt(h.hi80)}`},
          el('i', {class: 'b80', style: `left:${at(h.lo80)}%;width:${at(h.hi80) - at(h.lo80)}%`}), el('i', {class: 'b50', style: `left:${at(h.lo50)}%;width:${at(h.hi50) - at(h.lo50)}%`}), el('i', {class: 'now', style: `left:${at(q)}%`})),
          el('small', {}, `${fmt(h.lo50, 0)}–${fmt(h.hi50, 0)} · ${fmt(h.lo80, 0)}–${fmt(h.hi80, 0)} (line: today’s ${fmt(q)})`))))))));
}

/* one row per family: how it thinks, and its vote per horizon as small stacked bars (buy of its strategies) */
function familiesCard(c, S) {
  const {el} = c;
  return el('section', {class: 'card', 'aria-label': 'How each family decides'}, head(c, 'How each family decides', 'and how many of its strategies buy, per exit'),
    el('div', {class: 'fams'}, el('div', {class: 'fam hd'}, el('span', {}, 'Family'), el('span', {class: 'votes'}, ...S.tools.horizons.map(h => el('small', {}, `N+${h.h}`)))),
      ...S.families.map(f => el('div', {class: 'fam'},
        el('span', {}, c.apBadge(f.family), ' ', el('b', {}, `${f.n} strateg${f.n === 1 ? 'y' : 'ies'}`), el('small', {}, f.thinks)),
        f.n ? el('span', {class: 'votes'}, ...f.votes.map(v => v.of ? el('span', {class: 'vote', role: 'img', 'aria-label': `N+${v.h}: ${v.buy} of ${v.of} buy`, 'data-tip': `N+${v.h}: ${v.buy} of ${v.of} buy`},
          el('span', {class: 'stack'}, ...Array.from({length: v.of}, (_, i) => el('i', {class: i < v.buy ? 'on' : ''}))), el('small', {}, `${v.buy}/${v.of}`))
            : el('span', {class: 'vote', 'data-tip': `N+${v.h}: no view recorded (it stayed out)`}, el('span', {class: 'stack'}), el('small', {}, 'out'))))
          : el('span', {class: 'votes none'}, el('span', {class: 'mb-tag'}, 'none built yet'))))),
    el('p', {class: 'muted small', style: 'margin:8px 0 0'}, 'Filled: strategies that buy for that exit. A strategy buys only when its own rule clears its bar.'));
}

function holdersCard(c, S) {
  const {el} = c, G = groupTrades(S.trades), H = S.holders, max = Math.max(...G.map(t => Math.abs(t.pnl)), 1);
  const cost = S.tools.cost && el('p', {class: 'small', style: 'margin:10px 0 0'}, `A buy and sell of ${cur(c, S.tools.cost.amount, 0)} costs about ${fmt(S.tools.cost.round_trip_pct, 2)}% in market charges, so a trade needs to gain more than that to make money.`);
  return el('section', {class: 'card', 'aria-label': 'Strategies holding the stock'}, head(c, `Strategies holding ${S.ticker} now (${H.holding} of ${H.of})`, G.length ? `at the price check of ${c.when(S.trades[0].check_at)}` : ''),
    G.length ? el('ul', {class: 'list'}, ...G.map(t => el('li', {}, el('span', {}, c.apBadge(t.family), ' ', el('b', {}, t.name), el('small', {class: 'muted', style: 'display:block'}, `N+${t.hs.join(', N+')} · bought ${day(c, t.entry_date)} at ${fmt(t.entry)}`)),
      el('span', {class: 'pnl'}, hbar(c, t.pnl, max, `Paper result ${cur(c, t.pnl, 0)}`), el('b', {}, c.moneyDelta(t.pnl, 0)), el('small', {}, `${pct(t.ret, 2)} · `, el('span', {class: 'mb-tag paper'}, 'Paper')))))) : el('p', {class: 'muted'}, 'No strategy holds a paper trade here.'),
    el('p', {class: 'muted small', style: 'margin:8px 0 0'}, `Each trade is ${cur(c, G[0] ? G[0].amount : null, 0)} of paper money per exit; the result is at the last price check.`), cost || null);
}

function winningCard(c, S) {
  const {el} = c;
  return el('section', {class: 'card', 'aria-label': 'Which is winning'}, head(c, 'Which family is winning here'),
    el('p', {}, el('span', {class: 'mb-label neutral'}, c.icon('schedule'), 'No settled trades yet')),
    el('ul', {class: 'list'}, ...S.families.map(f => el('li', {}, el('span', {}, c.apBadge(f.family), el('small', {class: 'muted'}, f.n ? ` · no settled trade on ${S.ticker} yet` : ' · none built yet'))))),
    el('p', {class: 'muted small'}, 'One stock gives too few trades to name a winner. The full comparison across stocks belongs on the scoreboard.'),
    el('button', {class: 'md-btn outlined small', type: 'button', onclick: () => c.go('scoreboards')}, c.icon('leaderboard'), 'Open the strategies scoreboard'));
}

function aiCard(c, S) {
  const {el} = c, A = S.tools.ai_team;
  return el('section', {class: 'card ai', 'aria-label': 'The AI team'}, head(c, 'The AI team’s reading', A ? `made ${c.when(A.made_at)}` : 'none recorded'),
    A ? [el('span', {class: 'mb-label ' + (A.decision_5d === 'abstain' ? 'neutral' : 'info')}, c.icon('smart_toy'), `N+1: ${A.decision_1d || '—'} · N+5: ${A.decision_5d || '—'}`),
      el('p', {}, el('b', {}, 'Verdict. '), A.verdict), el('p', {}, el('b', {}, 'For a rise. '), A.bull_case), el('p', {}, el('b', {}, 'Against. '), A.bear_case),
      el('p', {class: 'muted small'}, 'Written by the AI team (several agents with their own expertise); quoted as recorded. Codes in brackets are the evidence’s ids.')] : el('p', {class: 'muted'}, 'The AI team recorded no reading for this company.'));
}
