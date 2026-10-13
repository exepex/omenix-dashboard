/* Month by month (the view brokers' profit pages use): one row per family, one coloured cell per calendar month of
   closed trades, the total at the end, and how many months made money. */
function monthsPart(main, c) {
  const {el} = c, fams = families().filter(f => tradesOf(c, f).length);
  const sec = el('section', {class: 'card sec', 'aria-label': 'Month by month'}, head(c, 'Month by month', `profit ${basisWord()}, by the month trades closed`));
  if (!fams.length) { sec.append(quiet(c, 'Empty: no family trade has closed yet. Each month will get a green cell when the family made money and a red one when it lost.')); main.append(sec); return; }
  const month = d => dateOf(d).slice(0, 7), months = [...new Set(state().dates.map(d => d.slice(0, 7)))];
  const per = f => { const o = {}; for (const [d, v] of Object.entries(dailyNet(c, f, ...allDays()))) o[month(d)] = (o[month(d)] || 0) + v; return o; };
  const data = fams.map(f => [f, per(f)]), max = Math.max(1, ...data.flatMap(([, o]) => Object.values(o).map(Math.abs)));
  const label = ym => new Date(ym + '-01T00:00:00Z').toLocaleDateString('en-GB', {month: 'short', year: '2-digit', timeZone: 'UTC'});
  const cellOf = (v, m) => { if (v == null) return el('td', {class: 'mcell none', 'data-k': label(m)}, '—'); const s = Math.abs(v) / max > 0.6 ? ' s3' : Math.abs(v) / max > 0.25 ? ' s2' : ' s1';
    return el('td', {class: 'mcell ' + (v >= 0 ? 'up' : 'down') + s, 'data-tip': money(c, v), 'data-k': label(m)}, short(c, v)); };
  sec.append(el('div', {class: 'scroll'}, el('table', {class: 'md-table months'}, el('thead', {}, el('tr', {}, el('th', {}, 'Family'), ...months.map(m => el('th', {class: 'num'}, label(m))), el('th', {class: 'num'}, 'Total'), el('th', {}, 'Months up'))),
    el('tbody', {}, ...data.map(([f, o]) => { const vals = months.map(m => o[m]).filter(v => v != null), up = vals.filter(v => v > 0).length, tot = vals.reduce((a, b) => a + b, 0);
      return el('tr', {}, el('th', {scope: 'row'}, badge(c, f)), ...months.map(m => cellOf(o[m], m)), el('td', {class: 'num', 'data-k': 'Total'}, upDown(c, tot, short(c, tot))), el('td', {'data-k': 'Months up'}, `${up} of ${vals.length}`)); })))),
    howto(c, 'Green: the family made money that month; red: it lost (darker: more). A family you can trust has more green months than red, and its red months are small.'));
  main.append(sec);
}
