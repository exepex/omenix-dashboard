/* Today's predictions, first on the page (owner: "anybody who wants to see is the today ... and past should be at the
   bottom"): one card per question, asked in plain words with its answer date, every family's chance next to the past
   average, and whether the families agree. These are about the coming weeks, not the past. */
function todayPart(main, c) {
  const {el} = c, S = state(), made = Object.keys(S.questions).length;
  const sec = el('section', {class: 'sec', 'aria-label': 'Today’s predictions'}, head(c, made ? `Today’s predictions, ${dayText(S.day)}` : 'Today’s predictions', 'what each family expects over the coming weeks; the answers come later'));
  if (!made) { sec.append(quiet(c, 'Empty: no prediction has been made yet. Every trading day, before 15:00 IST, each family’s five predictions will appear here, each with the date its answer is known.')); main.append(sec); return; }
  sec.append(el('div', {class: 'todays'}, ...D.questions.map((q, i) => todayCard(c, S, q, i))));
  sec.append(howto(c, 'Each bar is a family’s chance that the answer will be “yes”; the mark in the middle is 50%. Grey is the past average, the bar every family has to beat.'));
  main.append(sec);
}

function todayCard(c, S, q, i) {
  const {el} = c, B = S.questions[q.id], ans = S.day + q.days, ids = [...D.families.map(f => f.id), 'baseline_b'];
  const ps = D.families.map(f => B.today[f.id]).filter(p => p != null), spread = ps.length > 1 ? Math.max(...ps) - Math.min(...ps) : 0;
  const lean = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null;
  return el('article', {class: 'card today'}, el('div', {class: 'tq'}, el('span', {class: 'md-chip small'}, `${i + 1}. ${q.short}`),
      ps.length > 1 ? el('span', {class: 'mb-label ' + (spread >= 0.25 ? 'warn' : 'neutral')}, c.icon(spread >= 0.25 ? 'swap_vert' : 'check'), spread >= 0.25 ? 'Families disagree' : 'Families agree') : null),
    el('h3', {}, q.ask.replace('{date}', dayText(ans))),
    el('p', {class: 'small muted', style: 'margin:2px 0 8px'}, q.why),
    ...ids.map(id => { const p = B.today[id], on = id in B.today;
      return el('div', {class: 'chance' + (id === 'baseline_b' ? ' sep' : '')}, who(c, id),
        p != null ? el('span', {class: 'track', role: 'img', 'aria-label': `${nameOf(id)}: ${chance(p)} chance of yes`}, el('i', {class: isFamily(id) ? LINE[id] : 'y', style: `width:${(p * 100).toFixed(0)}%`})) : null,
        p != null ? el('b', {}, chance(p)) : el('span', {class: 'na'}, on ? 'No prediction today (counted as missed)' : 'Not running yet')); }),
    el('p', {class: 'small', style: 'margin:8px 0 0'}, lean == null ? '' : `On average the families say ${chance(lean)}: ${lean >= 0.55 ? 'more likely yes' : lean <= 0.45 ? 'more likely no' : 'close to a coin toss'}. Answer known on ${dayText(ans)}.`));
}
