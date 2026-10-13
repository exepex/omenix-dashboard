/* Ready for real money? (owner: "whether should I rely or trust the system ... with the actual money"): each family
   against its backend's own written bar: the stock tool's go-live bar (SPEC F7.2) for stocks, the F&O desk's
   evaluation rules (DESK_DESIGN 12.1, 12.8) for F&O. A family is ready only when every check passes. */
const WHY = {months: 'A few good weeks can be luck; the bar asks for months of trading.', trades: 'About 300 trades, so one lucky trade cannot decide.',
  beats: 'It must make more than the best simple rule (the baselines); otherwise there is no reason to use it.', luck: 'A statistical test: could this profit come from chance? It must pass.',
  drawdown: 'Its worst fall from a high must stay within the limit (10 times the money per trade).', regimes: 'It must make money both in calm markets and in stormy ones.',
  profit: 'After every charge, the account must be up.', risk: 'No trade may lose more than ₹10,000, charges included.'};

function checks(c, f, asset) { return ((state().ready[c.m] || {})[asset] || {})[f] || []; }
function readyState(c, f, asset = ASSET) {
  if (asset === 'all') { const s = ['stocks', 'fno'].map(a => readyState(c, f, a)).filter(x => x !== 'none'); return !s.length ? 'none' : s.every(x => x === 'ready') ? 'ready' : 'notyet'; }
  const L = checks(c, f, asset); return !L.length ? 'none' : L.every(x => x.ok) ? 'ready' : 'notyet';
}

function readyPart(main, c) {
  const {el} = c, sec = el('section', {class: 'card sec', 'aria-label': 'Ready for real money'}, head(c, 'Ready for real money?', 'each family against the bar it must pass first; since the start'));
  sec.append(el('div', {class: 'cards3'}, ...families().map(f => readyCard(c, f))),
    howto(c, 'Tick: passed. Cross: not passed. Timer: not enough trades yet to tell. The bar was written before any trade, and it is the same for every family.'));
  main.append(sec);
}

function readyCard(c, f) {
  const {el} = c, st = readyState(c, f), parts = ASSET === 'all' ? ['stocks', 'fno'] : [ASSET];
  const chip = st === 'ready' ? ['success', 'verified_user', 'Ready for real money'] : st === 'notyet' ? ['warn', 'timer', 'Not yet'] : ['neutral', 'block', 'No trades yet'];
  return el('article', {class: 'leader' + (st === 'ready' ? ' first' : '')}, el('div', {class: 'lh'}, badge(c, f), el('span', {class: 'mb-label ' + chip[0]}, c.icon(chip[1]), chip[2])),
    ...parts.map(a => { const L = checks(c, f, a), met = L.filter(x => x.ok).length;
      return el('div', {class: 'checks'}, parts.length > 1 ? el('b', {class: 'small'}, ASSETS[a]) : null,
        !L.length ? el('small', {class: 'muted'}, a === 'stocks' && f === 'hybrid' ? 'No Hybrid stock strategy yet: it trades F&O only.' : 'No closed trade yet, so nothing to check.')
          : el('small', {class: 'muted'}, `${met} of ${L.length} checks passed`),
        ...L.map(x => checkRow(c, x))); }));
}

function checkRow(c, x) {
  const {el} = c, g = x.ok === true ? ['check', 'ok'] : x.ok === false ? ['close', 'no'] : ['timer', 'wait'];
  return el('div', {class: 'chk ' + g[1], 'data-tip': WHY[x.key]}, el('span', {class: 'mb-mark ' + (x.ok ? 'hit' : x.ok === false ? 'miss' : 'na'), 'aria-label': x.ok ? 'passed' : x.ok === false ? 'not passed' : 'too early'}, c.icon(g[0])),
    el('span', {}, x.label, el('small', {}, checkValue(c, x))));
}

function checkValue(c, x) {
  switch (x.key) {
    case 'months': case 'trades': return `${x.value} (needs ${x.need})`;
    case 'beats': return x.need == null ? 'no baseline trades to compare yet' : `${money(c, x.value)} against ${money(c, x.need)} for the best baseline`;
    case 'luck': return x.value === 'passes' ? 'the profit is very unlikely to be chance' : x.value === 'fails' ? 'the profit could still be chance' : 'needs at least 20 trades';
    case 'drawdown': return `worst fall ${plain(c, x.value)} (limit ${plain(c, x.need)})`;
    case 'profit': return `${money(c, x.value)} after charges`;
    case 'risk': return `worst trade ${money(c, x.value)} (limit ${money(c, x.need)})`;
    case 'regimes': if (x.ok == null) return 'no stormy market yet to test it in'; return `calm markets ${money(c, x.value[0])}, stormy ${money(c, x.value[1])}`;
  }
  return '';
}
