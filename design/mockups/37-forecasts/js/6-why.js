/* What made the difference (owner: "which strategy is winning and why ... what did they do differently"): one card per
   family telling, in plain words, what its own predictions show: how often it got the direction right, how sure it
   dares to be, whether its chances can be trusted, what it won and gave back, and its costliest mistakes as
   sentences. Never how it predicts (strategy internals stay private). Then each family against each other. */
function whyPart(main, c) {
  const {el} = c, O = ov(), fams = runningFams();
  const sec = el('section', {class: 'card sec', 'aria-label': 'What made the difference'}, head(c, 'What made the difference', 'what each family’s predictions show, overall since the start'));
  if (!O || !fams.length) { sec.append(quiet(c, 'Empty: once predictions are answered, each family gets a card here explaining in plain words why it is ahead or behind, with its costliest mistakes.')); main.append(sec); return; }
  const max = Math.max(...fams.map(f => Math.max(O.table[f.id].gains, -O.table[f.id].losses)));
  sec.append(el('div', {class: 'leaders'}, ...fams.map(f => storyCard(c, O, f, max))), pairs(c, O, fams));
  main.append(sec);
}

function storyCard(c, O, f, max) {
  const {el} = c, t = O.table[f.id], trust = t.honesty_gap <= 6 ? ['Trustworthy', 'success', 'check'] : t.honesty_gap <= 12 ? ['So-so', 'neutral', 'trending_flat'] : ['Overconfident', 'danger', 'warning'];
  const w = v => `${(Math.abs(v) / max * 50).toFixed(1)}%`;
  return el('article', {class: 'leader story'}, el('div', {class: 'lh'}, c.apBadge(AP[f.id])), el('p', {class: 'why big2'}, whyLine(t)),
    meter(c, 'Right direction', t.right_pct, `${Math.round(t.right_pct)}%`, 'How often it leaned the right way: above 50% and it happened, or below 50% and it did not.'),
    meter(c, 'Confidence', t.bold_pct, `${Math.round(t.bold_pct)}%`, 'How far from 50/50 it dares to go. High confidence pays only if it is right.'),
    el('div', {class: 'meter'}, el('span', {class: 'k'}, 'Can its chances be trusted?'), el('span', {class: 'mb-label ' + trust[1]}, c.icon(trust[2]), `${trust[0]} (${fmt1(t.honesty_gap)} pts off)`),
      el('small', {}, 'When it says 70%, does it happen about 7 times in 10? The gap is how far off it is on average.')),
    el('div', {class: 'meter'}, el('span', {class: 'k'}, 'Points won and given back'), el('span', {class: 'sbar', role: 'img', 'aria-label': `won ${signed(t.gains, 0)}, gave back ${signed(t.losses, 0)}`},
      el('i', {class: 'loss', style: `right:50%;width:${w(t.losses)}`}), el('i', {class: 'gain', style: `left:50%;width:${w(t.gains)}`})),
      el('small', {}, `Won ${signed(t.gains, 0)} on ${t.wins} predictions that beat the past average; gave back ${signed(t.losses, 0)} on ${t.defeats} that did worse. Net ${signed(t.points, 0)}.`)),
    el('div', {class: 'meter'}, el('span', {class: 'k'}, 'Costliest mistakes'), ...(O.misses[f.id] || []).slice(0, 2).map(m => el('p', {class: 'mistake'}, el('span', {class: 'mb-mark miss', 'aria-hidden': 'true'}, c.icon('close')), predictionSentence(m)))));
}
function meter(c, k, v, word, s) {
  return c.el('div', {class: 'meter'}, c.el('span', {class: 'k'}, k), c.el('span', {class: 'hb'}, c.el('span', {class: 'track'}, c.el('i', {class: 'good', style: `width:${Math.min(100, v).toFixed(0)}%`})), c.el('b', {}, word)), c.el('small', {}, s));
}

/* each pair of families, in one sentence: who is ahead, by how much per prediction, over how many shared predictions */
function pairs(c, O, fams) {
  const {el} = c, out = [];
  fams.forEach((a, i) => fams.slice(i + 1).forEach(b => { const x = O.h2h[a.id][b.id]; if (!x || !x.n) return;
    const [w, l, gap] = x.points_per_forecast >= 0 ? [a, b, x.points_per_forecast] : [b, a, -x.points_per_forecast];
    out.push(el('li', {}, c.apBadge(AP[w.id]), el('span', {}, el('b', {}, ` beat ${l.name}`), ` by ${fmt1(gap)} points per prediction, over ${x.n} predictions both made.`))); }));
  return el('div', {class: 'sec'}, el('h3', {class: 'sub3'}, 'Family against family'),
    out.length ? el('ul', {class: 'pairs'}, ...out) : quiet(c, 'Needs two running families. Until the others join, Rule-based is compared with the past average only.'),
    howto(c, 'Same day, same question: whose chance was closer to what happened. A family can be closer on most days and still lose if its misses are big.'));
}
