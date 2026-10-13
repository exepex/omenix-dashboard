/* F&O (India only), for a beginner (owner, 13 Oct 2026): what futures and options are, what our families suggest on
   this stock's F&O, every listed contract with its NSE code and Buy / Sell (8-chain.js), and what open interest, IV
   and the last three months say, in plain words. Market data from NSE, not your position. */
let EXP = 0, SEL = null;   /* the expiry shown (index) and the strike picked in the chain */
const dm = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'}).toUpperCase();

function registerContracts(S) {   /* each contract becomes an item the shell's order window can open (end-of-day price) */
  const F = S.fno, items = SHELL.markets.india.items, asOf = F.date + 'T10:00:00Z', base = {source: 'eod', as_of: asOf, underlying: S.ticker, lot: F.lot};
  for (const f of F.expiries) items[f.code] ||= {...base, id: f.code, kind: 'future', sym: `${S.ticker} ${dm(f.expiry)} FUT`, code: f.code, name: `Future · lot ${F.lot}`, last: f.fut, chg_pct: f.chg_pct};
  for (const ch of F.chain) for (const r of ch.rows) for (const k of ['ce', 'pe']) {
    const o = r[k];
    if (o) items[o.code] ||= {...base, id: o.code, kind: 'option', sym: `${S.ticker} ${dm(ch.expiry)} ${r.strike} ${k.toUpperCase()}`, code: o.code, name: `Option · lot ${F.lot}`, last: o.price, chg_pct: o.chg_pct, iv: o.iv};
  }
}

function fnoTab(main, c, S) {
  const {el} = c, F = S.fno;
  registerContracts(S);
  main.append(el('p', {class: 'note small'}, c.icon('info'), `Market data from NSE’s daily F&O file (close of ${day(c, F.date)}), not your position. Stock F&O has monthly expiries only, no weeklies.`),
    basics(c, S), el('div', {class: 'sec'}, picksCard(c, S)), el('div', {class: 'sec'}, contractsCard(c, S)),
    el('div', {class: 'grid2 even sec'}, oiCard(c, S), el('div', {}, ivCard(c, S), el('section', {class: 'card sec', 'aria-label': 'Your F&O'}, head(c, `Your paper F&O on ${S.ticker}`), ownFno(c, S)))),
    el('div', {class: 'sec'}, monthsCard(c, S)));
}

/* three things a beginner needs before reading the rest */
function basics(c, S) {
  const {el} = c, F = S.fno, lot = F.lot, ch = F.chain[0], call = ch ? ch.rows.find(r => r.strike === ch.atm).ce : null;
  return el('details', {class: 'card basics', open: true}, el('summary', {}, el('b', {}, 'New to F&O? Three things to know')),
    el('ul', {class: 'tri'},
      el('li', {}, el('b', {}, 'A future'), ` is a deal to buy or sell ${fmt(lot, 0)} ${S.ticker} shares (one lot) on the expiry day at today’s agreed price. You put down a margin, not the full value, but you gain or lose on all ${fmt(lot, 0)} shares, and the loss has no fixed limit.`),
      el('li', {}, el('b', {}, 'A call (CE)'), ' pays when the price ends above its strike; ', el('b', {}, 'a put (PE)'), ` pays when it ends below. Buying one costs the premium × ${fmt(lot, 0)} shares, and that is the most you can lose.`),
      el('li', {}, el('b', {}, 'Every contract has a code'), `: ${F.expiries[0].code} is the ${dm(F.expiries[0].expiry)} future${call ? `; ${call.code} is the call at ${cur(c, ch.atm, 0)} for the same day` : ''}. You buy or sell by the code.`)));
}

/* what each family suggests on this stock's F&O; today none (no F&O strategy has passed testing), or the labelled example */
function picksCard(c, S) {
  const {el} = c, X = S.fno.examples, books = [['rule', 'Book 1'], ['hybrid', 'Book 2'], ['ai', 'Book 3']];
  const STATE = {open: ['Suggested', 'info'], refused: ['Refused by your limit', 'danger'], out: ['Stays out', 'neutral']};
  const real = el('ul', {class: 'list'}, ...books.map(([f, b]) => el('li', {}, el('span', {}, c.apBadge(f), el('small', {class: 'muted'}, ` · F&O ${b}`)), el('span', {class: 'small'}, 'No suggestion: no F&O strategy has passed testing yet.'))));
  const ex = X.picks && el('ul', {class: 'list'}, ...X.picks.map(p => el('li', {}, el('span', {}, c.apBadge(p.family), ' ', el('span', {class: 'mb-label ' + STATE[p.state][1]}, STATE[p.state][0]),
      p.code ? el('span', {class: 'pick'}, el('b', {}, `${p.side === 'buy' ? 'Buy' : 'Sell'} ${p.code}`), el('small', {class: 'muted'}, `${p.lots} lot (${fmt(p.lots * p.lot, 0)} shares) at ${fmt(p.price)}`)) : null),
    el('span', {class: 'small'}, p.why, p.max_loss != null ? [' Most you can lose: ', el('b', {}, cur(c, p.max_loss, 0)), '.'] : null, ' ', el('span', {class: 'mb-tag paper'}, 'Paper')))));
  return el('section', {class: 'card', 'aria-label': 'What our families suggest'}, head(c, `What our families suggest on ${S.ticker} F&O`, EX ? 'EXAMPLE, not today' : `as of ${day(c, S.fno.date)}`),
    el('div', {class: 'acts', style: 'margin-bottom:6px'}, el('button', {class: 'md-chip filter', type: 'button', 'aria-pressed': String(EX), onclick: () => { EX = EX ? null : 'win'; c.rerender(); }}, 'Show an example'),
      EX ? el('span', {class: 'mb-tag', 'data-tip': X.note}, 'Example data') : null),
    EX && ex ? ex : real,
    el('p', {class: 'muted small', style: 'margin:6px 0 0'}, EX ? `${X.note} It shows a suggestion, one refused by your loss limit and one staying out.` : 'Each F&O book belongs to one family; baselines trade shares only. Suggestions appear here once a book’s strategy passes testing.'));
}

/* where the open contracts sit by strike: calls and puts as bars, with today's price marked */
function oiCard(c, S) {
  const {el} = c, ch = S.fno.chain[EXP], rows = ch.rows, max = Math.max(...rows.flatMap(r => [(r.ce || {}).oi || 0, (r.pe || {}).oi || 0]), 1), W = 640, H = 170, slot = W / rows.length;
  const s = c.svgEl('svg', {viewBox: `0 0 ${W} ${H + 16}`, class: 'plot bars', role: 'img', 'aria-label': `Open contracts by strike, ${day(c, ch.expiry)}: most calls at ${ch.most_calls}, most puts at ${ch.most_puts}`});
  const h = v => (v || 0) / max * (H - 10);
  rows.forEach((r, i) => { const x = i * slot;
    s.append(c.svgEl('rect', {class: 'callb', x: x + slot * 0.1, y: H - h((r.ce || {}).oi), width: slot * 0.38, height: h((r.ce || {}).oi)}), c.svgEl('rect', {class: 'putb', x: x + slot * 0.52, y: H - h((r.pe || {}).oi), width: slot * 0.38, height: h((r.pe || {}).oi)}));
    const ai = rows.findIndex(x => x.strike === ch.atm);
    if (r.strike === ch.atm || (i % 4 === 0 && Math.abs(i - ai) > 2)) { const t = c.svgEl('text', {x: x + slot / 2, y: H + 13, 'text-anchor': 'middle', class: 'lbl'}); t.textContent = r.strike; s.append(t); } });
  const at = rows.findIndex(r => r.strike === ch.atm); s.append(c.svgEl('line', {class: 'spot', x1: at * slot + slot / 2, x2: at * slot + slot / 2, y1: 0, y2: H}));
  return el('section', {class: 'card', 'aria-label': 'Open contracts by strike'}, head(c, 'Where traders hold contracts', `${day(c, ch.expiry)} expiry`), s,
    el('div', {class: 'axis'}, el('span', {}, el('i', {class: 'key callk'}), 'calls (CE)'), el('span', {}, el('i', {class: 'key putk'}), 'puts (PE)'), el('span', {}, el('i', {class: 'key spotk'}), 'today’s price')),
    el('p', {class: 'small', style: 'margin:8px 0 0'}, `Most calls are open at ${cur(c, ch.most_calls, 0)} and most puts at ${cur(c, ch.most_puts, 0)}. Big piles show the prices many traders are betting around: a crowd’s position, not a forecast.`));
}

/* IV in plain words: how big a move option prices expect, and how dear options are against their own 3 months */
function ivCard(c, S) {
  const {el} = c, F = S.fno;
  if (F.iv == null || F.iv_hi <= F.iv_lo) return el('section', {class: 'card'}, head(c, 'How big a move options expect'), el('p', {class: 'muted'}, 'Not enough traded options to compute it.'));
  const at = Math.round((F.iv - F.iv_lo) / (F.iv_hi - F.iv_lo) * 100), lvl = at < 34 ? 'low' : at > 66 ? 'high' : 'middle';
  const words = {low: 'options cost less than usual', middle: 'options cost about as usual', high: 'options cost more than usual, so buyers pay up'}[lvl];
  return el('section', {class: 'card', 'aria-label': 'Implied volatility'}, head(c, 'How big a move options expect', 'implied volatility (IV), ours'),
    el('div', {class: 'mb-pos52 wide', role: 'img', 'aria-label': `IV ${F.iv}%, ${at}% of the way from its 3-month low ${F.iv_lo}% to its high ${F.iv_hi}%`},
      el('small', {}, `${F.iv_lo}%`), el('span', {class: 'track'}, el('i', {style: `left:${at}%`})), el('small', {}, `${F.iv_hi}%`)),
    el('p', {class: 'small', style: 'margin:8px 0 0'}, el('span', {class: `lvl ${lvl === 'high' ? 'bad' : lvl === 'low' ? 'good' : 'mid'}`}, `${lvl === 'high' ? '▲' : lvl === 'low' ? '▼' : '●'} ${lvl}`),
      ` Options price in a move of about ±${F.move_pct}% by ${day(c, F.expiry)}. IV is ${F.iv}%, ${lvl} for ${S.ticker} over 3 months: ${words}.`));
}

/* the last three months of the near future, with what to read in it */
function monthsCard(c, S) {
  const {el} = c, H = S.fno.history, first = H.fut[0], last = H.fut.at(-1), o0 = H.oi[0], o1 = H.oi.at(-1), B = BUILD[S.fno.buildup];
  return el('section', {class: 'card', 'aria-label': 'Three months'}, head(c, 'The last three months', `near-month future, ${day(c, H.dates[0])} to ${day(c, H.dates.at(-1))}`),
    futOiChart(c, H), el('div', {class: 'axis'}, el('span', {}, el('i', {class: 'key fut'}), `Future price ${fmt(first)} → ${fmt(last)}`), el('span', {}, el('i', {class: 'key oi'}), `Open contracts ${fmt(o0 / 1e7, 1)} → ${fmt(o1 / 1e7, 1)} crore shares`)),
    el('p', {class: 'small', style: 'margin:8px 0 0'}, `The price ${last < first ? 'fell' : 'rose'} ${fmt(Math.abs(last / first - 1) * 100, 1)}% while open contracts ${o1 > o0 ? 'grew' : 'shrank'} ${fmt(Math.abs(o1 / o0 - 1) * 100, 1)}%. Today’s reading: `,
      el('span', {class: 'mb-label ' + B[1]}, B[0]), ` (${B[2].toLowerCase()}). It describes what traders did, not what comes next.`));
}

function futOiChart(c, H) {
  const W = 640, Hh = 170, n = H.dates.length, fut = H.fut, oi = H.oi, flo = Math.min(...fut), fhi = Math.max(...fut), ohi = Math.max(...oi);
  const s = c.svgEl('svg', {viewBox: `0 0 ${W} ${Hh}`, preserveAspectRatio: 'none', class: 'plot', role: 'img', style: `height:${Hh}px`,
    'aria-label': `Future from ${fmt(fut[0])} to ${fmt(fut.at(-1))}; open interest from ${fmt(oi[0], 0)} to ${fmt(oi.at(-1), 0)}`});
  const x = i => i / (n - 1) * W, bw = Math.max(1, W / n * 0.6);
  oi.forEach((v, i) => s.append(c.svgEl('rect', {class: 'oi', x: x(i) - bw / 2, y: Hh - v / ohi * (Hh * 0.45), width: bw, height: v / ohi * (Hh * 0.45)})));
  s.append(c.svgEl('polyline', {class: 'futl', points: fut.map((v, i) => `${x(i).toFixed(1)},${(Hh * 0.52 - (v - flo) / (fhi - flo || 1) * (Hh * 0.48) + 4).toFixed(1)}`).join(' '), 'vector-effect': 'non-scaling-stroke'}));
  return s;
}

/* your own paper F&O, kept apart from the market data above */
function ownFno(c, S) {
  const acc = Object.values(SHELL.markets.india.accounts).find(a => a.kind === 'manual'), open = acc ? acc.open_structures || 0 : 0;
  return c.el('p', {class: 'small', style: 'margin:0'}, open ? `${open} open paper F&O structure${open === 1 ? '' : 's'} in your account (the records do not split them by stock).` : `None: your paper account holds no F&O on ${S.ticker}.`, ' ', c.el('span', {class: 'mb-tag paper'}, 'Paper'));
}
