/* Pages held back (contract 2.13, page page_holds; judge 251): which F&O page is held, since when, why, and what its
   screen shows meanwhile, so a hold is always said on screen, never only by a page's age. Same case as the state. */
const PAGE = {forecast_lab: 'Forecast lab', paper_trades: 'Paper books', card: "Today's card", today: 'Picks', risk: 'Books on Home', weather: 'Market weather', weather_history: 'Weather history'};
function holds() { const s = Object.values(D.also.getFnoPageHolds).find(x => x.case === now().case); return s ? s.value.payload.holds : []; }
function holdsPart(main, c) {
  const {el} = c, H = holds();
  main.append(el('div', {class: 'stack'}, sec(c, ['Pages held back', H.length ? el('span', {class: 'mb-label warn'}, c.icon('warning'), `${H.length} held`) : el('span', {class: 'mb-label success'}, c.icon('check'), 'None')],
    H.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
      el('thead', {}, el('tr', {}, ...['Page', 'Held since', 'Why', 'What its screen shows'].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...H.map(h => el('tr', {}, el('td', {'data-k': 'Page'}, PAGE[h.page_key] || h.page_key), el('td', {'data-k': 'Held since'}, dlabel(h.since)),
        el('td', {'data-k': 'Why'}, h.reason), el('td', {'data-k': 'What its screen shows'}, h.shows === 'previous_page' ? 'Its last published page, dated, under a held-back notice' : 'Not published, with the notice')))))) : el('p', {class: 'empty muted'}, 'Every page was published normally.'),
    howto(c, 'A page is held back when publishing it would break a rule or state something no longer true. Each held page says so on its own screen too, not only by its date.'))));
}
