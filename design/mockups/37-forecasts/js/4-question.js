/* One question at a time: what is asked, today's chances from each family and yardstick, the miss score over time,
   and the head-to-head tests with their uncertainty. Each block has its empty state. */
function questionPart(main, c) {
  const {el} = c, S = state(), q = question(), B = S.questions[q.id];
  main.append(el('section', {class: 'sec', 'aria-label': 'Pick a question'}, head(c, 'The five questions', 'pick one to see its forecasts and scores'),
    seg(c, 'Question', D.questions.map((x, i) => [i, `${i + 1}. ${x.short}`]), Q, k => { Q = k; })));
  main.append(el('section', {class: 'card', 'aria-label': 'The question'}, el('p', {class: 'qtitle'}, `${Q + 1}. ${q.plain}`),
    el('p', {class: 'small muted', style: 'margin:4px 0 0'}, el('b', {}, 'Counts as yes when: '), q.yes_when, ` Answer known after ${q.days} trading days.`)));
  main.append(el('div', {class: 'grid2 sec'}, todayCard(c, S, q, B), missCard(c, S, q, B)));
  main.append(h2hCard(c, S, q, B));
}

/* today's chances: one bar per forecaster on a 0-100% scale with 50% marked; families first, then the yardsticks */
function todayCard(c, S, q, B) {
  const {el} = c, ids = [...D.families.map(f => f.id), ...q.yardsticks];
  const sec = el('section', {class: 'card', 'aria-label': 'Today’s chances'}, head(c, B ? `Chances given on ${dayLabel(B.made)}` : 'Today’s chances', B ? `answer known on ${dayLabel(B.resolves)}` : null));
  if (!B) return sec.append(el('div', {class: 'quiet'}, 'Empty: no forecast is made yet. Each family and yardstick will show its chance of “yes” here every trading day, saved before 15:00 IST.')), sec;
  ids.forEach((id, i) => { const p = B.today[id], running = S.forecasters[id].status === 'running' && id in B.today;
    sec.append(el('div', {class: 'chance' + (i === D.families.length ? ' sep' : '')}, who(c, id),
      p != null ? el('span', {class: 'track', role: 'img', 'aria-label': `${nameOf(id)}: ${chance(p)} chance of yes`}, el('i', {class: isFamily(id) ? '' : 'y', style: `width:${(p * 100).toFixed(0)}%`})) : null,
      p != null ? el('b', {}, chance(p)) : el('span', {class: 'na'}, running ? 'No forecast today (counted as missed, never guessed)' : 'Not running yet'))); });
  sec.append(howto(c, 'The line in the middle is 50%: a bar past it says “more likely yes than no”. The yardsticks say what simple methods would forecast; a family is only useful if it does better than them.'));
  return sec;
}

/* miss score over time: the average of the last 20 settled days, families in colour, yardsticks dashed; lower is better */
function missCard(c, S, q, B) {
  const {el} = c, sec = el('section', {class: 'card', 'aria-label': 'Miss score over time'}, head(c, 'Miss score over time', 'lower is better'));
  const lines = B ? Object.entries(B.rolling).filter(([, pts]) => pts.length) : [];
  if (!lines.length) {
    sec.append(el('div', {class: 'quiet'}, B ? `Empty: the line starts after 20 settled days. So far ${Math.max(0, ...Object.values(B.scores).map(s => s.n_scored))} days are settled.` : 'Empty: no forecast is settled yet. The line starts after 20 settled days.'));
    return sec.append(missHow(c)), sec;
  }
  const W = 560, H = 210, L = 34, days = lines.flatMap(([, p]) => p.map(x => x[0])), d0 = Math.min(...days), d1 = Math.max(...days);
  const vals = lines.flatMap(([, p]) => p.map(x => x[1])), lo = 0.1, hi = Math.max(0.4, Math.ceil(Math.max(...vals) * 10) / 10), X = d => L + (d - d0) / (d1 - d0 || 1) * (W - L - 6), Y = v => 8 + (hi - Math.min(hi, Math.max(lo, v))) / (hi - lo) * (H - 28);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot', role: 'img', 'aria-label': lines.map(([id, p]) => `${nameOf(id)}: ${miss(p.at(-1)[1])} on ${dayLabel(p.at(-1)[0])}`).join('; ')});
  for (let v = lo; v <= hi + 1e-9; v += 0.1) { svg.append(c.svgEl('line', {class: 'grid', x1: L, x2: W, y1: Y(v), y2: Y(v)})); const t = c.svgEl('text', {x: 0, y: Y(v) + 4}); t.textContent = v.toFixed(2); svg.append(t); }
  svg.append(c.svgEl('line', {class: 'coin', x1: L, x2: W, y1: Y(0.25), y2: Y(0.25)}));
  for (const [id, pts] of lines) svg.append(c.svgEl('polyline', {class: 'line ' + (LINE[id] || 'y'), points: pts.map(([d, v]) => `${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}));
  for (const [d, a] of [[d0, 'start'], [d1, 'end']]) { const t = c.svgEl('text', {x: X(d), y: H - 4, 'text-anchor': a}); t.textContent = dayLabel(d); svg.append(t); }
  sec.append(svg, el('div', {class: 'keys'}, ...lines.filter(([id]) => isFamily(id)).map(([id]) => el('span', {}, el('i', {class: 'k' + LINE[id].slice(1)}), nameOf(id))),
    el('span', {}, el('i', {class: 'ky'}), 'Yardsticks'), el('span', {}, el('i', {class: 'kc'}), '0.25: always saying 50%')), missHow(c));
  return sec;
}

function missHow(c) {
  return howto(c, 'Miss score: the gap between the chance given and what happened, squared. 0 is perfect; 0.25 is what always saying 50% earns; 1 is “100% sure” and wrong. Below the dotted line means better than always saying 50%.');
}

/* head-to-head: the average gap in miss score with its 95% range; left of the centre line favours the first named */
function h2hCard(c, S, q, B) {
  const {el} = c, sec = el('section', {class: 'card sec', 'aria-label': 'Head to head'}, head(c, 'Head to head', 'every test of this question, as fixed before any score existed'));
  if (!B) return sec.append(el('div', {class: 'quiet'}, 'Empty: nothing to compare yet. Each family will be tested against the other families and against this question’s two yardsticks: 9 tests per question, 45 in all.')), sec;
  const rows = B.comparisons, span = Math.max(0.02, ...rows.filter(r => r.ci).flatMap(r => r.ci.map(Math.abs)));
  sec.append(el('div', {class: 'h2h-ends', 'aria-hidden': 'true'}, el('span', {}, ''), el('span', {}, el('span', {}, '◀ first named misses less'), el('span', {}, 'second misses less ▶')), el('span', {}, '')));
  sec.append(el('div', {class: 'h2h'}, ...rows.map(r => el('div', {class: 'h2h-row'},
    el('span', {}, el('b', {}, `${nameOf(r.a)} vs ${nameOf(r.b)}`), el('small', {}, r.n_dates ? `${r.n_dates} settled days` : 'no shared days yet')),
    r.ci ? gapBar(c, r, span) : proof(c, r.n_dates),
    verdictEl(c, r.verdict, sub(r))))));
  sec.append(howto(c, 'The dot is the average gap in miss score; the bar is its likely range. Left of the centre line: the first named misses less; right: the second does. A bar crossing the centre line could be luck. Only the first review gives verdicts, after a strict correction for running 45 tests at once.'));
  return sec;
}

function sub(r) {
  if (r.verdict === 'not_running') return 'one side has no forecasts';
  if (r.verdict === 'too_few_dates') return `${r.n_dates} of ${D.rules.min_dates} days`;
  if (r.verdict === 'before_review') return 'shown, not judged, until the first review';
  return r.mean_diff == null ? '' : `gap ${r.mean_diff > 0 ? '+' : '−'}${Math.abs(r.mean_diff).toFixed(3)}`;
}

function gapBar(c, r, span) {
  const W = 300, X = v => W / 2 + v / span * (W / 2 - 6), cls = r.verdict === 'better' ? 'good' : r.verdict === 'worse' ? 'bad' : 'flat';
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} 26`, role: 'img', class: 'plot', 'aria-label': `Average gap ${r.mean_diff.toFixed(3)}, likely between ${r.ci[0].toFixed(3)} and ${r.ci[1].toFixed(3)}`});
  svg.append(c.svgEl('line', {class: 'zero', x1: W / 2, x2: W / 2, y1: 2, y2: 24}), c.svgEl('line', {class: 'ci ' + cls, x1: X(r.ci[0]), x2: X(r.ci[1]), y1: 13, y2: 13}),
    c.svgEl('circle', {class: 'mean', cx: X(r.mean_diff), cy: 13, r: 4}));
  return svg;
}
