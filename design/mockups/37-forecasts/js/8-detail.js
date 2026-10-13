/* For the curious: the official statistics of one prediction at a time, folded away at the bottom (owner: the page
   must stay simple; these stay one tap away): the miss score over time, the official tests with their likely range,
   whether each family's chances can be trusted (calibration), the latest answered days, and every number. */
function detailPart(main, c) {
  const {el} = c, S = state(), q = question(), B = S.questions[q.id];
  const box = el('details', {class: 'md-expansion sec', ontoggle: e => { DET = e.target.open; }}, el('summary', {}, 'For the curious: the official statistics, one prediction at a time'),
    el('div', {class: 'inner'}, seg(c, 'Prediction', D.questions.map((x, i) => [i, `${i + 1}. ${x.short}`]), Q, k => { Q = k; }),
      el('p', {class: 'small', style: 'margin:0'}, el('b', {}, `${Q + 1}. ${q.plain}`)), el('p', {class: 'small muted', style: 'margin:2px 0 10px'}, `Counts as yes when: ${q.yes_when}`),
      el('div', {class: 'grid2'}, missCard(c, S, q, B), calibCard(c, S, q, B)), h2hCard(c, S, q, B), el('div', {class: 'sec'}, settledCard(c, B)), el('div', {class: 'sec'}, numbersCard(c, q, B))));
  box.open = DET;   /* stays open across re-renders (picking a prediction) and in the URL (det=1) */
  main.append(box, howItWorks(c));
}

/* miss score over time: the average of the last 20 answered days, families in colour, yardsticks dashed; lower is better */
function missCard(c, S, q, B) {
  const {el} = c, sec = el('section', {class: 'card', 'aria-label': 'Miss score over time'}, head(c, 'Miss score over time', 'lower is better'));
  const lines = B ? Object.entries(B.rolling).filter(([, pts]) => pts.length) : [];
  if (!lines.length) {
    sec.append(el('div', {class: 'quiet'}, B ? `Empty: the line starts after 20 answered days. So far ${Math.max(0, ...Object.values(B.scores).map(s => s.n_scored))} days are answered.` : 'Empty: no prediction is answered yet. The line starts after 20 answered days.'));
    return sec.append(missHow(c)), sec;
  }
  const W = 560, H = 210, L = 34, days = lines.flatMap(([, p]) => p.map(x => x[0])), d0 = Math.min(...days), d1 = Math.max(...days);
  const vals = lines.flatMap(([, p]) => p.map(x => x[1])), lo = 0.1, hi = Math.max(0.4, Math.ceil(Math.max(...vals) * 10) / 10), X = d => L + (d - d0) / (d1 - d0 || 1) * (W - L - 6), Y = v => 8 + (hi - Math.min(hi, Math.max(lo, v))) / (hi - lo) * (H - 28);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${H}`, class: 'plot', role: 'img', 'aria-label': lines.map(([id, p]) => `${nameOf(id)}: ${miss(p.at(-1)[1])} on ${dayText(p.at(-1)[0])}`).join('; ')});
  for (let v = lo; v <= hi + 1e-9; v += 0.1) { svg.append(c.svgEl('line', {class: 'grid', x1: L, x2: W, y1: Y(v), y2: Y(v)})); const t = c.svgEl('text', {x: 0, y: Y(v) + 4}); t.textContent = v.toFixed(2); svg.append(t); }
  svg.append(c.svgEl('line', {class: 'coin', x1: L, x2: W, y1: Y(0.25), y2: Y(0.25)}));
  for (const [id, pts] of lines) svg.append(c.svgEl('polyline', {class: 'line ' + (LINE[id] || 'y'), points: pts.map(([d, v]) => `${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}));
  for (const [d, a] of [[d0, 'start'], [d1, 'end']]) { const t = c.svgEl('text', {x: X(d), y: H - 4, 'text-anchor': a}); t.textContent = dayText(d); svg.append(t); }
  sec.append(svg, el('div', {class: 'keys'}, ...lines.filter(([id]) => isFamily(id)).map(([id]) => el('span', {}, el('i', {class: 'k' + LINE[id].slice(1)}), nameOf(id))),
    el('span', {}, el('i', {class: 'ky'}), 'Yardsticks'), el('span', {}, el('i', {class: 'kc'}), '0.25: always saying 50%')), missHow(c));
  return sec;
}

function missHow(c) {
  return howto(c, 'Miss score: the gap between the chance given and what happened, squared. 0 is perfect; 0.25 is what always saying 50% earns; 1 is “100% sure” and wrong. Below the dotted line means better than always saying 50%.');
}

/* head-to-head: the average gap in miss score with its 95% range; left of the centre line favours the first named */
function h2hCard(c, S, q, B) {
  const {el} = c, sec = el('section', {class: 'card sec', 'aria-label': 'Head to head'}, head(c, 'The official tests', 'every test of this prediction, as fixed before any score existed'));
  if (!B) return sec.append(el('div', {class: 'quiet'}, 'Empty: nothing to compare yet. Each family will be tested against the other families and against this prediction’s two yardsticks: 9 tests per question, 45 in all.')), sec;
  const rows = B.comparisons, span = Math.max(0.02, ...rows.filter(r => r.ci).flatMap(r => r.ci.map(Math.abs)));
  sec.append(el('div', {class: 'h2h-ends', 'aria-hidden': 'true'}, el('span', {}, ''), el('span', {}, el('span', {}, '◀ first named misses less'), el('span', {}, 'second misses less ▶')), el('span', {}, '')));
  sec.append(el('div', {class: 'h2h'}, ...rows.map(r => el('div', {class: 'h2h-row'},
    el('span', {}, el('b', {}, `${nameOf(r.a)} vs ${nameOf(r.b)}`), el('small', {}, r.n_dates ? `${r.n_dates} answered days` : 'no shared days yet')),
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

/* calibration: when a forecaster said about 70%, did it happen about 70% of the time? dots on the line are honest */
function calibCard(c, S, q, B) {
  const {el} = c, ids = [...D.families.map(f => f.id), ...q.yardsticks].filter(id => B && B.scores[id]);
  const sec = el('section', {class: 'card', 'aria-label': 'Honest about its confidence'}, head(c, 'Honest about its confidence?', 'said chance against how often it happened'));
  if (!ids.length) return sec.append(el('div', {class: 'quiet'}, 'Empty: needs answered predictions. Each dot will compare a chance given (say 70%) with how often “yes” then happened.')), sec;
  if (!ids.includes(WHO)) WHO = ids[0];
  sec.append(seg(c, 'Forecaster', ids.map(id => [id, nameOf(id)]), WHO, k => { WHO = k; }));
  const bins = B.scores[WHO].calibration.filter(b => b.n), W = 260, P = 30, X = v => P + v * (W - P - 8), Y = v => 8 + (1 - v) * (W - P - 8);
  const svg = c.svgEl('svg', {viewBox: `0 0 ${W} ${W}`, class: 'plot', style: 'max-width:300px;display:block', role: 'img', 'aria-label': bins.map(b => `said ${chance(b.mean_p)}, happened ${chance(b.freq)} (${b.n} days)`).join('; ')});
  for (const v of [0, 0.5, 1]) { const t = c.svgEl('text', {x: X(v), y: W - 10, 'text-anchor': 'middle'}); t.textContent = chance(v); const u = c.svgEl('text', {x: 0, y: Y(v) + 4}); u.textContent = chance(v); svg.append(t, u); }
  svg.append(c.svgEl('line', {class: 'diag', x1: X(0), y1: Y(0), x2: X(1), y2: Y(1)}));
  const most = Math.max(...bins.map(b => b.n));
  for (const b of bins) svg.append(c.svgEl('circle', {class: 'dot', cx: X(b.mean_p), cy: Y(b.freq), r: (3 + 7 * Math.sqrt(b.n / most)).toFixed(1)}));
  sec.append(svg, el('p', {class: 'small', style: 'margin:6px 0 0'}, calibWords(bins)),
    howto(c, 'Each dot is a group of days with similar chances; bigger dots hold more days. On the dashed line: honest. Dots flatter than the line: too sure of itself. Steeper: too timid.'));
  return sec;
}

function calibWords(bins) {
  const sure = bins.filter(b => b.mean_p >= 0.7 || b.mean_p < 0.3).sort((a, b) => b.n - a.n)[0];
  if (!sure) return `${nameOf(WHO)} rarely gives a strong chance: most of its forecasts sit between 30% and 70%.`;
  const gap = Math.round(Math.abs(sure.mean_p - sure.freq) * 100);
  return `When ${nameOf(WHO)} said about ${chance(sure.mean_p)}, “yes” happened ${chance(sure.freq)} of the time (${sure.n} days): ${gap <= 10 ? 'close to honest' : `${gap} points off, so ${(sure.mean_p - 0.5) * (sure.mean_p - sure.freq) > 0 ? 'too sure of itself' : 'too timid'}`}.`;
}

/* the latest answered days: each family's chance, what happened, and its miss score */
function settledCard(c, B) {
  const {el} = c, sec = el('section', {class: 'card', 'aria-label': 'Latest answered predictions'}, head(c, 'Latest answered predictions', 'newest first, by the day it was made'));
  if (!B || !B.recent.length) return sec.append(el('div', {class: 'quiet'}, B ? `Empty: the first answer is known on ${dayText(B.resolves - B.made + 1)}.` : 'Empty: no answer is known yet. Each answered day will show what every family said, what happened, and its miss score.')), sec;
  sec.append(el('ul', {class: 'settled'}, ...B.recent.map(r => el('li', {}, el('b', {}, dayText(r.day)),
    el('span', {class: 'said'}, ...D.families.filter(f => f.id in r.said).map(f => { const p = r.said[f.id], hit = p != null && (p >= 0.5) === (r.outcome === 1);
      return el('span', {'data-tip': p == null ? 'No prediction that day: counted as missed, never scored' : `Miss score ${miss((p - r.outcome) ** 2)}`}, c.apBadge(AP[f.id]), p == null ? 'no prediction' : chance(p),
        p == null ? null : el('span', {class: 'mb-mark ' + (hit ? 'hit' : 'miss'), 'aria-label': hit ? 'leaned the right way' : 'leaned the wrong way'}, c.icon(hit ? 'check' : 'close'))); })),
    el('span', {class: 'mb-label ' + (r.outcome ? 'success' : 'neutral')}, r.outcome ? 'Happened' : 'Did not happen')))));
  sec.append(howto(c, 'Tick: the family leaned the right way (above 50% and it happened, or below 50% and it did not). The miss score, in the tooltip, also counts how sure it was.'));
  return sec;
}

/* every number of this question in one table (the report fields of story G4) */
function numbersCard(c, q, B) {
  const {el} = c, ids = [...D.families.map(f => f.id), ...q.yardsticks];
  const row = id => { const s = B && B.scores[id], sp = s && s.split;
    const td = (k, v, small) => el('td', {class: 'num', 'data-k': k}, v, small ? el('small', {}, small) : null);
    return el('tr', {}, el('td', {}, who(c, id)), td('Predictions', s ? String(s.n_forecasts) : '—'), td('Missed days', s ? String(s.n_no_forecast) : '—'),
      td('Answered', s ? String(s.n_scored) : '—'), td('Miss score', s ? miss(s.brier) : '—'), td('Log score', s ? miss(s.log) : '—'),
      q.id.startsWith('q5') ? td('Miss: exact / estimated', sp ? `${miss(sp.interpolated.brier)} / ${miss(sp.flagged.brier)}` : '—', sp ? `${sp.interpolated.n} / ${sp.flagged.n} days` : null) : null); };
  return el('section', {class: 'card', 'aria-label': 'All the numbers'}, head(c, 'All the numbers', 'this prediction, since the start'),
    el('div', {}, el('div', {class: 'scroll'}, el('table', {class: 'md-table stack'},
      el('thead', {}, el('tr', {}, el('th', {}, 'Who'), el('th', {class: 'num'}, 'Predictions'), el('th', {class: 'num'}, 'Missed days'), el('th', {class: 'num'}, 'Answered'),
        el('th', {class: 'num'}, 'Miss score'), el('th', {class: 'num'}, 'Log score'), q.id.startsWith('q5') ? el('th', {class: 'num'}, 'Miss: exact / estimated') : null)),
      el('tbody', {}, ...ids.map(row)))),
      el('p', {class: 'small muted', style: 'margin:8px 0 0'}, `Lower is better for both scores. The log score punishes being very sure and wrong harder; it is shown, not tested.${B && B.void ? ` ${B.void} day had no answer (data missing) and is never scored.` : ''}${q.id.startsWith('q5') ? ' Question 5: on some days the 30-day option price has to be estimated from one expiry; those days are scored apart.' : ''}`)));
}

function howItWorks(c) {
  const {el} = c;
  return el('details', {class: 'md-expansion sec'}, el('summary', {}, 'How the Forecast lab works'), el('div', {class: 'inner'},
    el('p', {class: 'small', style: 'margin:0'}, 'Every trading day, before 15:00 IST, each family and yardstick gives its chance of “yes” for these five questions. A prediction can never be changed, and a missing one is counted, never guessed.'),
    el('div', {class: 'qcards'}, ...D.questions.map((x, i) => el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, `${i + 1}. ${x.short} · ${x.days} trading days`), el('b', {}, x.plain)))),
    el('p', {class: 'small', style: 'margin:14px 0 0'}, el('b', {}, 'The yardsticks. '), 'A family is only useful if it beats what simple methods already say:'),
    el('div', {class: 'qcards'}, ...D.yardsticks.map(y => el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, y.only), el('b', {}, y.name), el('small', {}, y.plain)))),
    el('p', {class: 'small', style: 'margin:14px 0 0'}, el('b', {}, 'When is a lead real? '), `A test needs at least ${D.rules.min_dates} answered days. Neighbouring days share most of their 20-day window, so the range of each gap is worked out on ${D.rules.block_days}-day blocks. With ${D.rules.comparisons} tests run at once, some would look good by luck, so the bar for “proven” is raised to match. No verdict is given before ${D.rules.review}.`),
    el('p', {class: 'small muted', style: 'margin:8px 0 0'}, 'The rules were fixed before any score existed and cannot change after; a change would start a new version of the lab.')));
}
