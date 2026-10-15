/* Why and how sure: the weather, the forecast with its record, the devil's advocate, the data checks, how far the
   strategy has come (the rungs), the price of staying out, what happens if you cannot act, and the record hashes. */
function whyPart(col, c) {
  const {el} = c, C = card();
  col.append(sec(c, ['Weather', colourLabel(c, C.weather.colour)], el('p', {class: 'small', style: 'margin:0'}, C.weather.why),
    howto(c, 'RED means a big move is much more likely than usual: no new trade that day. The weather screen has the details.')));
  col.append(forecast(c, C), advocate(c, C), checks(c, C), evidence(c, C));
  if (C.price_of_staying_out) col.append(stayOut(c, C.price_of_staying_out));
  col.append(sec(c, 'If you cannot act in time', el('p', {class: 'small', style: 'margin:0'}, C.if_you_cannot_act)),
    sec(c, 'Records behind this card', el('div', {class: 'hashes'}, ...C.footer.record_hashes.map(h => el('code', {'data-tip': h.sha256}, `${h.kind} ${h.sha256.slice(0, 12)}`))),
      howto(c, 'Each number on the card is copied from these records; their fingerprints (SHA-256) are in the Slack post, so the card can be checked later.')));
}
function forecast(c, C) {
  const {el} = c, F = C.forecast;
  if (!F) return sec(c, 'The forecast', el('p', {class: 'small muted', style: 'margin:0'}, 'This card rests on no forecast.'));
  const R = F.record;
  return sec(c, 'The forecast', el('p', {class: 'small', style: 'margin:0'}, F.plain),
    el('div', {class: 'chance', role: 'img', 'aria-label': `${F.forecaster}: ${pct(F.probability)}`}, el('span', {class: 'track'}, el('i', {style: `width:${(F.probability * 100).toFixed(1)}%`})), el('b', {}, pct(F.probability))),
    el('p', {class: 'small muted', style: 'margin:0'}, `${F.forecaster}. ` + (R.days ? `Its record: it said ${pct(R.said_from)} to ${pct(R.said_to)} on ${R.days} days; it happened on ${pct(R.happened_share)} of them.` : `No record yet: it has never said ${pct(R.said_from)} to ${pct(R.said_to)} before.`)),
    howto(c, 'A chance, not a promise. The record says whether its chances have been honest so far.'));
}
function advocate(c, C) {
  const {el} = c, A = C.advocate;
  const head = {answered: ['info', 'gavel', 'Answered'], advocate_unavailable: ['warn', 'timer', 'Did not answer in time'], not_needed: ['neutral', 'remove', 'Not needed']}[A.status];
  return sec(c, ["Devil's advocate", el('span', {class: 'mb-label ' + head[0]}, c.icon(head[1]), head[2])],
    A.objections.length ? el('ol', {class: 'list'}, ...A.objections.map(o => el('li', {}, o))) : el('p', {class: 'small muted', style: 'margin:0'}, A.status === 'advocate_unavailable' ? 'The card went out with the code checks only; no objection is ever invented.' : 'No position to object to.'),
    A.verdict ? el('p', {class: 'small', style: 'margin:8px 0 0'}, el('span', {class: 'mb-label ' + (A.verdict === 'no_hard_rule_breach' ? 'success' : 'danger')}, c.icon(A.verdict === 'no_hard_rule_breach' ? 'check' : 'close'), A.verdict === 'no_hard_rule_breach' ? 'No hard-rule breach' : 'Hard-rule breach')) : null);
}
function checks(c, C) {
  const {el} = c, K = C.data_checks;
  return sec(c, ['Data checks', el('span', {class: 'mb-label ' + (K.passed ? 'success' : 'danger')}, c.icon(K.passed ? 'check' : 'close'), K.passed ? 'Passed' : 'Failed')],
    K.missing_inputs.length ? el('ul', {class: 'missing'}, ...K.missing_inputs.map(m => el('li', {}, el('span', {class: 'mb-label danger'}, c.icon('warning'), m.story), el('span', {}, m.input, el('small', {}, m.detail)))))
      : el('p', {class: 'small muted', style: 'margin:0'}, 'Every input was there and checked before the decision.'));
}
function evidence(c, C) {
  const {el} = c, E = C.evidence;
  return sec(c, 'How far the strategy has come', el('div', {class: 'ladder', role: 'list'}, ...RUNGS.map(([n, w]) => el('span', {role: 'listitem', class: String(E.rung) === n ? 'on' : null, 'aria-current': String(E.rung) === n ? 'step' : null}, el('b', {}, 'Rung ' + n), w))),
    el('p', {class: 'small', style: 'margin:0'}, E.label ? el('b', {}, E.label + ': ') : null, E.text),
    el('p', {class: 'small', style: 'margin:6px 0 0'}, el('span', {class: 'mb-label danger'}, c.icon('block'), 'Real money: not eligible')));
}
function stayOut(c, P) {
  const {el} = c, text = {not_measured_yet: 'Not measured yet: the shadow fills of the skipped trade come later.', nothing_skipped: 'Nothing was skipped: no approved strategy wanted a trade.', measured: !P.shadow_net ? 'Staying out made no difference on paper.' : `Staying out ${P.shadow_net > 0 ? 'cost' : 'saved'} ${rs(c, Math.abs(P.shadow_net))} on paper.`}[P.status];
  return sec(c, 'The price of staying out', el('p', {class: 'small', style: 'margin:0'}, text));
}
