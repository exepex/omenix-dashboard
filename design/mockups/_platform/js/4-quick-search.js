/* Omenix platform runtime, part 4 of 6. Concatenated in file order by platform_build.py into one script. */
/* ---- quick search block (Home): find a stock, index or F&O contract and trade it from the result ---------------- */
function quickSearch() {
  let scope = 'all', sel = 0, rows = [];
  const box = el('div', {class: 'mb-qsearch', id: 'qsearch'});
  const res = el('div', {class: 'mb-qsearch-results', role: 'listbox', id: 'qs-list', 'aria-label': 'Results'});
  const input = el('input', {type: 'search', id: 'qs-input', autocomplete: 'off', placeholder: P().fno ? 'Search a stock, index or F&O contract to trade: reliance, nifty 24800 ce' : 'Search a stock or index to trade: apple, nvda', 'aria-label': 'Quick search to trade', 'aria-controls': 'qs-list', oninput: () => draw(), onfocus: () => { if (input.value) draw(); }, onkeydown: e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); mark(Math.min(rows.length - 1, sel + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(0, sel - 1)); }
    else if (e.key === 'Enter' && rows[sel]) { e.preventDefault(); openDrawer('quick:' + rows[sel].id); }
    else if (e.key === 'Escape') { box.classList.remove('open'); }
  }});
  const scopes = [['all', 'All'], ['stock', 'Stocks'], ...(P().fno ? [['fno', 'F&O']] : [])];
  const seg = el('div', {class: 'md-segmented dense mb-qsearch-scope', role: 'group', 'aria-label': 'Search in'}, ...scopes.map(([k, v]) => el('button', {type: 'button', 'aria-pressed': String(k === scope), onclick: e => { scope = k; $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); draw(); input.focus(); }}, v)));
  function match() {
    const q = input.value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
    return Object.values(P().items).filter(it => (scope === 'all' || (scope === 'stock' ? !isFno(it) : isFno(it) || it.fno && it.kind === 'index')) && words.every(w => (it.sym + ' ' + it.name).toLowerCase().includes(w))).slice(0, 8);
  }
  function mark(i) { sel = i; $$('.mb-qs-row', res).forEach((n, j) => n.setAttribute('aria-selected', String(j === i))); }
  function draw() {
    const q = input.value.trim(); rows = q ? match() : []; sel = 0; st.qs = q || null;
    box.classList.toggle('open', !!q);
    res.replaceChildren(...rows.map((it, i) => el('div', {class: 'mb-qs-row', role: 'option', 'data-inst': it.id, 'aria-selected': String(i === 0), onclick: () => openDrawer('quick:' + it.id), onpointermove: () => mark(i)},
      el('span', {class: 'mb-avatar ' + (isFno(it) ? 'info' : it.kind === 'index' ? 'neutral' : '')}, icon(isFno(it) ? 'layers' : it.kind === 'index' ? 'monitoring' : 'apartment')),
      el('span', {style: 'min-width:0'}, el('b', {}, it.sym, it.held ? el('span', {class: 'mb-label paper', style: 'margin-left:6px;padding:0 5px;font-size:10.5px;line-height:16px'}, 'held') : null), el('small', {}, it.name)),
      el('span', {class: 'px'}, price(it), el('small', {}, delta(it.chg_pct), ' · ', asOf(it).short + (asOf(it).stale ? ' · stale' : ''))),
      tradable(it) ? bsPair(it.id, () => box.classList.remove('open')) : el('small', {class: 'muted', style: 'max-width:110px;white-space:normal'}, P().fno && it.fno ? 'Index: trade its options' : 'Index: not traded'))));
    if (q && !rows.length) res.append(el('div', {class: 'quiet', style: 'margin:6px'}, `Nothing matches “${q}”${scope !== 'all' ? ' in this tab' : ''}.${!P().fno && /nifty|fut|\bce\b|\bpe\b/i.test(q) ? ' F&O is India only.' : ''}`));
  }
  document.addEventListener('click', e => { if (!box.contains(e.target)) box.classList.remove('open'); });
  const recent = el('div', {class: 'mb-qsearch-recent'}, el('span', {}, 'Recent:'), ...P().recent.map(id => { const it = item(id); return el('button', {class: 'md-chip assist', type: 'button', 'data-inst': id, onclick: () => openDrawer('quick:' + id)}, it.sym, ' ', delta(it.chg_pct)); }));
  box.append(el('label', {class: 'mb-qsearch-field'}, icon('search'), input, seg), res);
  if (st.qs) { input.value = st.qs; setTimeout(draw, 0); }
  return el('div', {}, box, recent);
}

