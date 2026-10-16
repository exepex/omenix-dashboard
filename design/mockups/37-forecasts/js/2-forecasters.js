/* The standing line, the protocols and the forecasters: who answers, how each is kept from seeing outcomes, and how
   many days counted (a missing day is shown, never treated as zero skill). */
const STATE = {running: ['success', 'check', 'Running'], not_running: ['neutral', 'timer', 'Not running'], not_started: ['neutral', 'remove', 'Not started']};
const KIND = {family: 'Book', baseline: 'Yardstick', weather: 'Weather', house: 'The card\'s forecast'};
function fname(id) { const f = pay().forecasters.find(x => x.id === id); return f ? f.name : id; }
function forecastersPart(main, c) {
  const {el} = c, P = pay();
  main.append(el('p', {class: 'small', style: 'margin:12px 0 0'}, c.icon('info'), ' ', P.standing),
    el('div', {class: 'stack'}, sec(c, 'Who forecasts', el('div', {class: 'chips'}, ...P.protocols.map(p => el('span', {class: 'md-chip small', 'data-tip': p.questions.join(', ')}, `Protocol ${p.version}: ${p.status === 'frozen' ? 'frozen' : 'draft (nothing counts yet)'}`))),
      el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
        el('thead', {}, el('tr', {}, ...['Forecaster', 'What it is', 'State', 'Kept from the answers by', 'Days counted'].map(h => el('th', {scope: 'col'}, h)))),
        el('tbody', {}, ...P.forecasters.map(f => { const [cls, g, w] = STATE[f.status], v = f.coverage;
          return el('tr', {}, el('td', {'data-k': 'Forecaster'}, f.family ? family(c, f.family) : f.name), el('td', {'data-k': 'What it is'}, KIND[f.kind]),
            el('td', {'data-k': 'State'}, el('span', {class: 'mb-label ' + cls}, c.icon(g), w)),
            el('td', {'data-k': 'Kept from the answers by'}, f.isolation === 'code' ? 'Plain code' : f.isolation_label || 'Full isolation'),
            el('td', {'data-k': 'Days counted'}, v ? `${v.counted_days} of ${v.pack_days}` : '—', v ? el('small', {}, `${v.missing_days} missing · ${v.late_days} late · ${v.unscored_days} not scored`) : null)); })))),
      howto(c, 'A late or missing forecast is not counted and is shown here, never filled in. "Sealed same day" means an AI book commits to its answer before the deadline; it is not full isolation.'))));
}
