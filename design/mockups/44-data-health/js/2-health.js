/* The last publish and health check first (did today's data arrive?), then each source, worst first. Dates, counts
   and statuses only: never a data value. */
const SRC = {ok: ['success', 'check', 'Up to date'], stale: ['warn', 'schedule', 'Behind'], gaps: ['warn', 'warning', 'Days missing'], missing: ['danger', 'block', 'No file']};
const PUB = {published: ['success', 'check', 'Published'], failed: ['danger', 'close', 'Failed: yesterday\'s pages stay'], publishing: ['neutral', 'sync', 'Publishing'], not_run: ['neutral', 'remove', 'Not run yet']};
const HC = {ok: ['success', 'check', 'All expected files and runs found'], problems: ['danger', 'warning', 'Problems found'], not_run: ['neutral', 'remove', 'Not run yet']};
function lab(c, m, k) { const [cls, g, w] = m[k]; return c.el('span', {class: 'mb-label ' + cls}, c.icon(g), w); }
function healthPart(main, c) {
  const {el} = c, H = pay();
  main.append(el('div', {class: 'books'},
    sec(c, 'The last publish', lab(c, PUB, H.publish.status), el('p', {class: 'small', style: 'margin:8px 0 0'}, H.publish.run_on ? `For the session of ${dlabel(H.publish.run_on)}` : 'No publish yet.'),
      H.publish.reason ? el('p', {class: 'small', style: 'margin:4px 0 0'}, H.publish.reason) : null, howto(c, 'Runs every morning at 07:10 IST. A failed run keeps the previous pages; nothing half-written is shown.')),
    sec(c, 'The daily health check', lab(c, HC, H.health_check.status), el('p', {class: 'small', style: 'margin:8px 0 0'}, H.health_check.run_on ? `${dlabel(H.health_check.run_on)} · ${H.health_check.problems} problem${H.health_check.problems === 1 ? '' : 's'}` : 'No check yet.'),
      howto(c, 'Runs at 17:51 IST and checks that every expected file and job of the day exists.'))),
    el('div', {class: 'stack'}, sec(c, 'Data sources', H.sources.length ? el('div', {class: 'md-table-wrap'}, el('table', {class: 'md-table tstack'},
      el('thead', {}, el('tr', {}, ...['Source', 'Status', 'Last day', 'Rows', 'Days missing'].map(h => el('th', {scope: 'col'}, h)))),
      el('tbody', {}, ...H.sources.map(s => el('tr', {}, el('td', {'data-k': 'Source'}, s.plain, el('small', {}, s.source)), el('td', {'data-k': 'Status'}, lab(c, SRC, s.status)),
        el('td', {'data-k': 'Last day'}, s.last_day ? dlabel(s.last_day) : '—'), el('td', {class: 'md-numeric', 'data-k': 'Rows'}, s.rows.toLocaleString('en-IN')), el('td', {class: 'md-numeric', 'data-k': 'Days missing'}, String(s.gaps)))))))
      : el('p', {class: 'empty muted'}, 'No source checked yet.'),
      howto(c, 'Days missing are sessions the NSE calendar says should be there. A source behind means its newest day is older than it should be.'))));
}
