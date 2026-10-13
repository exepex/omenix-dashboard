/* Why a family wins or loses, from its own forecasts only (owner: never how it forecasts): where its points come
   from, its habits side by side with the yardsticks, its biggest misses, who beats whom, and what each says today. */
function whyPart(main, c) {
  const {el} = c, O = ov(), fams = runningFams();
  const sec = el('section', {class: 'card sec', 'aria-label': 'Why they win or lose'}, head(c, 'Why they win or lose', 'what each family’s forecasts show, never how it makes them'));
  if (!O || !fams.length) return main.append(sec.append(el('div', {class: 'quiet'}, 'Empty: once forecasts settle, this shows where each family’s points come from (right calls against costly misses), how sure and how honest it is, and its biggest misses.')), sec), todayGrid(main, c), void 0;
  sec.append(el('div', {class: 'grid2'}, el('div', {}, el('h3', {class: 'sub3'}, 'Where the points come from'), pointsSplit(c, O, fams)), el('div', {}, el('h3', {class: 'sub3'}, 'Biggest misses'), missesList(c, O, fams))));
  sec.append(el('div', {class: 'sec'}, el('h3', {class: 'sub3'}, 'Habits, side by side'), habits(c, O, fams)), el('div', {class: 'sec'}, el('h3', {class: 'sub3'}, 'Who beats whom'), whoBeats(c, O, fams)));
  main.append(sec);
  todayGrid(main, c);
}

/* gains on forecasts that missed less than the yardstick (right), losses on those that missed more (left), and the net */
function pointsSplit(c, O, fams) {
  const {el} = c, max = Math.max(...fams.map(f => Math.max(O.table[f.id].gains, -O.table[f.id].losses)));
  return el('div', {class: 'split'}, ...fams.map(f => { const t = O.table[f.id], w = v => `${(Math.abs(v) / max * 50).toFixed(1)}%`;
    return el('div', {class: 'srow'}, c.apBadge(AP[f.id]),
      el('span', {class: 'sbar', role: 'img', 'aria-label': `${f.name}: won ${signed(t.gains, 0)} on ${t.wins} forecasts, lost ${signed(t.losses, 0)} on ${t.defeats}; net ${signed(t.points, 0)}`},
        el('i', {class: 'loss', style: `right:50%;width:${w(t.losses)}`}), el('i', {class: 'gain', style: `left:50%;width:${w(t.gains)}`})),
      el('small', {}, `won ${signed(t.gains, 0)} on ${t.wins} · lost ${signed(t.losses, 0)} on ${t.defeats} · `, el('b', {}, `net ${signed(t.points, 0)}`))); }),
    howto(c, 'Green: points won on forecasts that missed less than the yardstick. Red: points lost on those that missed more. A family can win most days and still lose overall if its losses are big.'));
}

/* each habit as a bar, the yardstick "How often it happened" as the reference row */
function habits(c, O, fams) {
  const {el} = c, rows = [...fams.map(f => f.id), O.ref];
  const bar = (v, good) => el('span', {class: 'hb'}, el('span', {class: 'track'}, el('i', {class: good ? 'good' : 'bad', style: `width:${Math.min(100, v).toFixed(0)}%`})), el('b', {}, `${Math.round(v)}%`));
  return el('div', {class: 'scroll'}, el('table', {class: 'md-table habits stack'},
    el('thead', {}, el('tr', {}, el('th', {}, 'Who'), el('th', {}, 'Leaned the right way'), el('th', {}, 'How sure'), el('th', {class: 'num'}, 'Honesty gap'))),
    el('tbody', {}, ...rows.map(id => { const t = O.table[id];
      return el('tr', {}, el('td', {}, who(c, id)), el('td', {'data-k': 'Leaned the right way'}, bar(t.right_pct, t.right_pct >= 50)), el('td', {'data-k': 'How sure'}, bar(t.bold_pct, true)),
        el('td', {class: 'num', 'data-k': 'Honesty gap'}, el('span', {class: 'mb-label ' + (t.honesty_gap <= 6 ? 'success' : t.honesty_gap <= 12 ? 'neutral' : 'danger')}, c.icon(t.honesty_gap <= 6 ? 'check' : t.honesty_gap <= 12 ? 'trending_flat' : 'warning'), `${fmt1(t.honesty_gap)} pts`))); }))),
    howto(c, 'Leaned the right way: above 50% and it happened, or below 50% and it did not. How sure: 0% always says 50/50, 100% always says 0 or 100%. Honesty gap: how far its chances were from what then happened (lower is more honest).'));
}

function missesList(c, O, fams) {
  const {el} = c, qn = id => D.questions.findIndex(q => q.id === id) + 1;
  return el('ul', {class: 'settled'}, ...fams.map(f => el('li', {class: 'miss3'}, c.apBadge(AP[f.id]),
    el('span', {class: 'said'}, ...(O.misses[f.id] || []).map(m => el('span', {'data-tip': `${dayLabel(m.day)}, question ${qn(m.question)}: said ${chance(m.said)}, ${m.outcome ? 'it happened' : 'it did not happen'}; miss score ${m.miss}`},
      el('span', {class: 'mb-mark miss', 'aria-hidden': 'true'}, c.icon('close')), `Q${qn(m.question)} said ${chance(m.said)}, ${m.outcome ? 'happened' : 'did not'}`))))),
    el('li', {class: 'note'}, howto(c, 'Each family’s three costliest forecasts. Saying 99% and being wrong costs almost a full point of miss score; saying 60% and being wrong costs a third of that.')));
}

/* each family against each other, over every question and day both forecast */
function whoBeats(c, O, fams) {
  const {el} = c;
  if (fams.length < 2) return el('div', {class: 'quiet'}, 'Needs two running families. Until the others join, Rule-based is compared with the yardsticks only.');
  return el('div', {class: 'scroll'}, el('table', {class: 'md-table vs'}, el('thead', {}, el('tr', {}, el('th', {}, 'Row against column'), ...fams.map(f => el('th', {}, f.name)))),
    el('tbody', {}, ...fams.map(a => el('tr', {}, el('th', {scope: 'row'}, c.apBadge(AP[a.id])), ...fams.map(b => { const x = a === b ? null : (O.h2h[a.id] || {})[b.id];
      if (!x) return el('td', {class: 'muted'}, '—');
      const up = x.points_per_forecast >= 0;
      return el('td', {class: 'vs-cell ' + (up ? 'up' : 'down')}, el('b', {}, c.icon(up ? 'trending_up' : 'trending_down'), `${signed(x.points_per_forecast, 1)} pts`), el('small', {}, `missed less on ${Math.round(x.win_pct)}% of ${x.n}`)); }))))),
    howto(c, 'Read across: the row family against the column family, points per forecast (green: the row is ahead). “Missed less on 61%” counts forecasts; the points also count by how much.'));
}

/* what every family and the yardstick say today, one row per question */
function todayGrid(main, c) {
  const {el} = c, S = state(), cols = [...D.families.map(f => f.id), 'baseline_b'];
  const sec = el('section', {class: 'card sec', 'aria-label': 'Today’s calls'}, head(c, S.day ? `Today’s calls (${dayLabel(S.day)})` : 'Today’s calls', 'the chance of “yes” each family gives, question by question'));
  if (!Object.keys(S.questions).length) return main.append(sec.append(el('div', {class: 'quiet'}, 'Empty: no forecast is made yet. Every trading day, before 15:00 IST, each family’s five chances will appear here next to the yardstick’s.')), sec), void 0;
  const cell = (q, id) => { const B = S.questions[q.id], p = B.today[id];
    if (!(id in B.today)) return el('td', {class: 'muted', 'data-k': nameOf(id)}, 'not running');
    return el('td', {'data-k': nameOf(id)}, p == null ? el('span', {class: 'muted'}, 'no forecast') : el('span', {class: 'tc'}, el('span', {class: 'track'}, el('i', {class: isFamily(id) ? LINE[id] : 'y', style: `width:${(p * 100).toFixed(0)}%`})), el('b', {}, chance(p)))); };
  sec.append(el('div', {class: 'scroll'}, el('table', {class: 'md-table today stack'}, el('thead', {}, el('tr', {}, el('th', {}, 'Question'), ...cols.map(id => el('th', {}, nameOf(id))))),
    el('tbody', {}, ...D.questions.map((q, i) => el('tr', {}, el('td', {}, el('b', {}, `${i + 1}. ${q.short}`), el('small', {}, `answer in ${q.days} trading days`)), ...cols.map(id => cell(q, id))))))),
    howto(c, 'The bar is the chance of “yes”; the tick in the middle is 50%. Where the families disagree most, the contest learns the most.'));
  main.append(sec);
}
