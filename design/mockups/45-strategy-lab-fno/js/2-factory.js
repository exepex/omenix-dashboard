/* The headline and the factory: how many ideas were tried, how many passed, and how many passes chance alone would
   give; then the ideas, newest first. Strategy internals are never shown, only what each idea is and how far it got. */
const ISTATUS = {idea: ['neutral', 'help', 'Idea'], screened_out: ['neutral', 'block', 'Screened out'], exploratory_shadow: ['neutral', 'science', 'Shadow only'],
  registered: ['neutral', 'event', 'Registered'], testing: ['warn', 'science', 'Testing'], passed: ['success', 'check', 'Passed'], failed: ['danger', 'close', 'Failed'], retired: ['neutral', 'remove', 'Retired']};
const SPLAIN = {idea: 'ideas', screened_out: 'screened out', exploratory_shadow: 'shadow only', registered: 'registered', testing: 'testing', passed: 'passed', failed: 'failed', retired: 'retired'};
function istatus(c, s) { const [cls, g, w] = ISTATUS[s]; return c.el('span', {class: 'mb-label ' + cls}, c.icon(g), w); }
function factoryPart(main, c) {
  const {el} = c, P = pay(), F = P.factory;
  main.append(el('section', {class: 'mb-verdict ' + (P.headline.any_passed ? 'yes-ok' : 'watch'), 'aria-label': 'Headline'}, el('span', {class: 'mb-verdict-box', 'aria-hidden': 'true'}, c.icon(P.headline.any_passed ? 'check' : 'timer')),
    el('div', {}, el('div', {class: 'mb-verdict-word'}, P.headline.any_passed ? 'A strategy passed' : 'No strategy has passed'), el('p', {class: 'why'}, P.headline.text))),
    el('div', {class: 'stack'}, sec(c, 'Every idea tried', el('div', {class: 'chips'}, ...Object.entries(F.by_status).filter(([, n]) => n).map(([s, n]) => el('span', {class: 'md-chip small'}, `${n} ${SPLAIN[s]}`))),
      el('p', {class: 'small', style: 'margin:0 0 8px'}, `${F.trials_total} ideas tried. At a pass level of ${(F.pass_level * 100).toFixed(0)}%, about ${F.expected_false_passes.toFixed(1)} would pass by chance alone.`),
      P.ideas.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
        el('thead', {}, el('tr', {}, ...['Trial', 'Idea', 'Rests on', 'Got to', 'Status', 'Evidence'].map(h => el('th', {scope: 'col'}, h)))),
        el('tbody', {}, ...P.ideas.map(i => el('tr', {}, el('td', {class: 'md-numeric', 'data-k': 'Trial'}, String(i.trial)), el('td', {'data-k': 'Idea'}, i.title),
          el('td', {'data-k': 'Rests on'}, i.rests_on || '—'), el('td', {'data-k': 'Got to'}, i.gate), el('td', {'data-k': 'Status'}, istatus(c, i.status)), el('td', {'data-k': 'Evidence'}, i.label))))))
      : el('p', {class: 'empty muted'}, 'No idea listed.'),
      howto(c, 'Every idea ever tried is counted, failures included, so one lucky pass cannot hide among many tries.'))));
}
