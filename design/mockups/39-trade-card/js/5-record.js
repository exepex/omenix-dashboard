/* What the card has on record beyond today's decision (T1's sections): paper trades so far per book, every question's
   house forecast with its live and back-fill records, and the gaps and earlier misses the card names. */
function trades(c, C) {
  const {el} = c, T = C.paper_trades_so_far;
  return sec(c, 'Paper trades so far', el('div', {class: 'facts3'}, ...T.by_book.map(b => fact(c, apName(b.family), String(b.trades), 'paper trades'))),
    el('p', {class: 'small muted', style: 'margin:8px 0 0'}, `${T.total} in all. Each book is its own experiment; their money is never added together.`));
}
function stressPart(c, C) {
  const {el} = c, X = C.stress;
  return sec(c, ['If the market jumps overnight', c.paperTag(), owner(c)],
    el('p', {class: 'small muted', style: 'margin:0 0 6px'}, `${X.open_positions} open paper position${X.open_positions === 1 ? '' : 's'}; together they can lose at most ${rs(c, X.max_loss_sum)}.`),
    ...X.scenarios.map(s => el('div', {class: 'cap'}, el('b', {class: 'small'}, `NIFTY ${s.nifty_move_pct > 0 ? '+' : '−'}${Math.abs(s.nifty_move_pct)}%${s.vix_move_pct ? `, India VIX +${s.vix_move_pct}%` : ', volatility unchanged'}: lose ${rs(c, s.loss)}`),
      el('div', {class: 'bar', role: 'img', 'aria-label': `${rs(c, s.loss)} of at most ${rs(c, X.max_loss_sum)}`}, el('i', {style: `width:${X.max_loss_sum ? (s.loss / X.max_loss_sum * 100).toFixed(1) : 0}%`})))),
    howto(c, 'Information only. Every position has a fixed maximum loss, so no line can go past the total; the bars show how close the book is to it.'));
}
function onRecordPart(main, c) {
  const {el} = c, R = card().forecasts_on_record;
  if (!R) return;
  main.append(sec(c, 'Every forecast on record', el('p', {class: 'small muted', style: 'margin:0 0 6px'},
      `From the live capture of ${dlabel(R.capture_day)}${R.report_day ? `; records from the score report of ${dlabel(R.report_day)}` : '; no score report yet'}. ${R.other_forecasters} other forecasters are on the Forecast lab.`),
    R.late_generated_at ? el('p', {class: 'small', style: 'margin:0 0 6px'}, el('span', {class: 'mb-label warn'}, c.icon('timer'), 'Late'), ` Generated at ${ist(R.late_generated_at)}, after the 15:15 deadline: these forecasts are not scored.`) : null,
    el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table'}, el('thead', {}, el('tr', {}, ...['Question', 'Chance', 'Live record', 'Back-fill record'].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...R.questions.map(q => el('tr', {}, el('td', {}, q.plain), el('td', {class: 'md-numeric'}, pct(q.probability)), el('td', {}, trackText(q.live)), el('td', {}, trackText(q.backfill))))))),
    howto(c, 'The house forecast is the past average until a forecaster passes its test. The back-fill was made after the fact from end-of-day data, so only the live record is evidence.')));
}
function misses(c, C) {
  const {el} = c;
  return sec(c, ['What the card is missing', el('span', {class: 'mb-label warn'}, c.icon('warning'), String(C.missing.length + C.previous_misses.length))],
    C.missing.length ? el('ul', {class: 'list'}, ...C.missing.map(m => el('li', {}, m))) : null,
    C.previous_misses.length ? el('p', {class: 'small', style: 'margin:8px 0 0'}, el('b', {}, 'Earlier cards: '), C.previous_misses.join('; ')) : null);
}
