/* The details of one question: is each forecaster honest about its confidence (calibration), the latest settled
   forecasts with hit or miss, every number in a table; then how the contest works, in plain words. */
function detailPart(main, c) {
  const S = state(), q = question(), B = S.questions[q.id];
  main.append(c.el('div', {class: 'grid2 sec'}, calibCard(c, S, q, B), settledCard(c, B)), numbersCard(c, q, B), howItWorks(c));
}

/* calibration: when a forecaster said about 70%, did it happen about 70% of the time? dots on the line are honest */
function calibCard(c, S, q, B) {
  const {el} = c, ids = [...D.families.map(f => f.id), ...q.yardsticks].filter(id => B && B.scores[id]);
  const sec = el('section', {class: 'card', 'aria-label': 'Honest about its confidence'}, head(c, 'Honest about its confidence?', 'said chance against how often it happened'));
  if (!ids.length) return sec.append(el('div', {class: 'quiet'}, 'Empty: needs settled forecasts. Each dot will compare a chance given (say 70%) with how often “yes” then happened.')), sec;
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

/* the latest settled days: each family's chance, what happened, and its miss score */
function settledCard(c, B) {
  const {el} = c, sec = el('section', {class: 'card', 'aria-label': 'Latest settled forecasts'}, head(c, 'Latest settled forecasts', 'newest first'));
  if (!B || !B.recent.length) return sec.append(el('div', {class: 'quiet'}, B ? `Empty: the first answer is known on ${dayLabel(B.resolves - B.made + 1)}.` : 'Empty: no answer is known yet. Each settled day will show what every family said, what happened, and its miss score.')), sec;
  sec.append(el('ul', {class: 'settled'}, ...B.recent.map(r => el('li', {}, el('b', {}, dayLabel(r.day)),
    el('span', {class: 'said'}, ...D.families.filter(f => f.id in r.said).map(f => { const p = r.said[f.id], hit = p != null && (p >= 0.5) === (r.outcome === 1);
      return el('span', {'data-tip': p == null ? 'No forecast that day: counted as missed, never scored' : `Miss score ${miss((p - r.outcome) ** 2)}`}, c.apBadge(AP[f.id]), p == null ? 'no forecast' : chance(p),
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
    return el('tr', {}, el('td', {}, who(c, id)), td('Forecasts', s ? String(s.n_forecasts) : '—'), td('Missed days', s ? String(s.n_no_forecast) : '—'),
      td('Settled', s ? String(s.n_scored) : '—'), td('Miss score', s ? miss(s.brier) : '—'), td('Log score', s ? miss(s.log) : '—'),
      q.id.startsWith('q5') ? td('Exact / estimated option price', sp ? `${miss(sp.interpolated.brier)} / ${miss(sp.flagged.brier)}` : '—', sp ? `${sp.interpolated.n} / ${sp.flagged.n} days` : null) : null); };
  return el('details', {class: 'md-expansion sec'}, el('summary', {}, 'All the numbers for this question'),
    el('div', {class: 'inner'}, el('div', {class: 'scroll'}, el('table', {class: 'md-table stack'},
      el('thead', {}, el('tr', {}, el('th', {}, 'Forecaster'), el('th', {class: 'num'}, 'Forecasts'), el('th', {class: 'num'}, 'Missed days'), el('th', {class: 'num'}, 'Settled'),
        el('th', {class: 'num'}, 'Miss score'), el('th', {class: 'num'}, 'Log score'), q.id.startsWith('q5') ? el('th', {class: 'num'}, 'Miss score: exact / estimated option price') : null)),
      el('tbody', {}, ...ids.map(row)))),
      el('p', {class: 'small muted', style: 'margin:8px 0 0'}, `Lower is better for both scores. The log score punishes being very sure and wrong harder; it is shown, not tested.${B && B.void ? ` ${B.void} day had no answer (data missing) and is never scored.` : ''}${q.id.startsWith('q5') ? ' Question 5: on some days the 30-day option price has to be estimated from one expiry; those days are scored apart.' : ''}`)));
}

function howItWorks(c) {
  const {el} = c;
  return el('details', {class: 'md-expansion sec'}, el('summary', {}, 'How the contest works'), el('div', {class: 'inner'},
    el('p', {class: 'small', style: 'margin:0'}, 'Every trading day, before 15:00 IST, each family and yardstick gives its chance of “yes” for these five questions. A forecast can never be changed, and a missing one is counted, never guessed.'),
    el('div', {class: 'qcards'}, ...D.questions.map((x, i) => el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, `${i + 1}. ${x.short} · ${x.days} trading days`), el('b', {}, x.plain)))),
    el('p', {class: 'small', style: 'margin:14px 0 0'}, el('b', {}, 'The yardsticks. '), 'A family is only useful if it beats what simple methods already say:'),
    el('div', {class: 'qcards'}, ...D.yardsticks.map(y => el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, y.only), el('b', {}, y.name), el('small', {}, y.plain)))),
    el('p', {class: 'small', style: 'margin:14px 0 0'}, el('b', {}, 'When is a lead real? '), `A test needs at least ${D.rules.min_dates} settled days. Neighbouring days share most of their 20-day window, so the range of each gap is worked out on ${D.rules.block_days}-day blocks. With ${D.rules.comparisons} tests run at once, some would look good by luck, so the bar for “proven” is raised to match. No verdict is given before ${D.rules.review}.`),
    el('p', {class: 'small muted', style: 'margin:8px 0 0'}, 'The rules were fixed before any score existed and cannot change after; a change would start a new version of the contest.')));
}
