/* What drove the results (owner: "which strategy is winning and why"): for each family, in plain words, how it makes
   or loses its money (how often it wins against how big its wins and losses are), what moved its trades (the whole
   market, the sector, news, or the stock alone; for F&O, a calm or a moving NIFTY), how it did in calm and stormy
   markets, and its best and worst trade as sentences. Never how a family decides (strategy internals stay private). */
const REASON = {market_up: 'The whole market rose', market_down: 'The whole market fell', sector_lift: 'Its sector rose', sector_drag: 'Its sector fell',
  news_good: 'Good company news', news_bad: 'Bad company news', company: 'The stock moved on its own', company_specific: 'The stock moved on its own',
  calm_market: 'NIFTY stayed in a range', big_move: 'NIFTY made a big move', trend_right: 'NIFTY moved the way it bet', trend_wrong: 'NIFTY moved against it'};

function whyPart(main, c) {
  const {el} = c, fams = families().filter(f => tradesOf(c, f).length);
  const sec = el('section', {class: 'card sec', 'aria-label': 'What drove the results'}, head(c, 'What drove the results', 'since the start, in plain words'));
  if (!fams.length) { sec.append(quiet(c, 'Empty: once trades close, each family gets a card here saying why it made or lost money: how often it wins, how big its wins and losses are, what moved its trades, and its best and worst trade.')); main.append(sec); return; }
  sec.append(el('div', {class: 'cards3'}, ...fams.map(f => whyCard(c, f))));
  main.append(sec);
}

function whyCard(c, f) {
  const {el} = c, T = tradesOf(c, f), s = stats(T), by = {};
  for (const t of T) by[t[5]] = (by[t[5]] || 0) + t[3];
  const drivers = Object.entries(by).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5), max = Math.max(1, ...drivers.map(d => Math.abs(d[1])));
  const st = state().stormy, storm = T.filter(t => t[1] >= st[0] && t[1] <= st[1]), calm = T.filter(t => !(t[1] >= st[0] && t[1] <= st[1]));
  return el('article', {class: 'leader story'}, el('div', {class: 'lh'}, badge(c, f)), el('p', {class: 'why big2'}, storyLine(c, s, storm, calm)),
    el('div', {class: 'meter'}, el('span', {class: 'k'}, 'What moved its trades'), ...drivers.map(([r, v]) => el('div', {class: 'drv'}, el('span', {}, REASON[r] || r),
      el('span', {class: 'hbar wide', 'aria-hidden': 'true'}, el('i', {class: v < 0 ? 'neg' : 'pos', style: v < 0 ? `right:50%;width:${(Math.abs(v) / max * 50).toFixed(1)}%` : `left:50%;width:${(v / max * 50).toFixed(1)}%`})), el('b', {class: v >= 0 ? 'pos' : 'neg'}, short(c, v))))),
    storm.length ? el('div', {class: 'meter'}, el('span', {class: 'k'}, 'Calm and stormy markets'), el('small', {}, `In calm markets ${money(c, stats(calm).net)} on ${calm.length} trades; in the stormy month ${money(c, stats(storm).net)} on ${storm.length}.`)) : null,
    el('div', {class: 'meter'}, el('span', {class: 'k'}, 'Best and worst trade'), tradeLine(c, s.best, true), tradeLine(c, s.worst, false)));
}

/* one sentence on how the family makes its money: win rate against the size of wins and losses */
function storyLine(c, s, storm, calm) {
  const ratio = s.avgLoss ? Math.abs(s.avgLoss) / (s.avgWin || 1) : 0, sc = stats(storm).net, cc = stats(calm).net;
  let line = s.net >= 0 ? `Made ${money(c, s.net)} after charges. ` : `Lost ${plain(c, s.net)} after charges. `;
  if (s.rate >= 60 && ratio > 1.5) line += `It wins ${Math.round(s.rate)}% of its trades, but one loss wipes out about ${Math.round(ratio)} wins.`;
  else if (s.rate < 50 && s.net > 0) line += `It wins fewer than half its trades, but its wins are bigger than its losses.`;
  else if (s.net < 0 && s.rate >= 50) line += `It wins ${Math.round(s.rate)}% of its trades, but its losses are bigger than its wins.`;
  else if (s.net < 0) line += `It loses more trades than it wins (${s.lost} against ${s.won}).`;
  else line += `It wins ${Math.round(s.rate)}% of its trades, and its average win (${money(c, s.avgWin)}) covers its average loss (${money(c, s.avgLoss)}).`;
  if (storm.length && sc < 0 && cc > 0) line += ` The stormy month cost it ${plain(c, sc)}.`;
  return line;
}

function tradeLine(c, t, good) {
  if (!t) return null;
  const what = t[7] === 'fno' ? `${t[2]} on ${dayText(t[0])}, closed ${dayText(t[1])}` : `Traded ${t[2]} from ${dayText(t[0])} to ${dayText(t[1])}`;
  return c.el('p', {class: 'mistake'}, c.el('span', {class: 'mb-mark ' + (good ? 'hit' : 'miss'), 'aria-hidden': 'true'}, c.icon(good ? 'check' : 'close')),
    `${what}: ${money(c, t[3])}${t[7] === 'fno' ? '' : ` (${pct(t[4], 2)})`}. Main reason: ${(REASON[t[5]] || t[5]).toLowerCase()}.`);
}
