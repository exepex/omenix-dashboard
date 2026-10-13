/* Mount last: every function and state the render uses is defined by now (files 1-7). */
PF.mount({screen: 'stock', group: 'research', strip: false, dataLabel: 'Real records of 13 Oct 2026',
  readHash(h) { TAB = TABS.some(t => t[0] === h.get('tab')) ? h.get('tab') : 'overview'; PER = SPANS[h.get('per')] ? h.get('per') : '1y';
    CMP = h.get('cmp') === '1'; SEC = h.get('sec') === '1'; RES = h.get('res') === 'y' ? 'y' : 'q'; EX = ['win', 'lose'].includes(h.get('ex')) ? h.get('ex') : null; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (TAB !== 'overview') h.set('tab', TAB); if (PER !== '1y') h.set('per', PER); if (CMP) h.set('cmp', '1'); if (SEC) h.set('sec', '1');
    if (RES === 'y') h.set('res', 'y'); if (EX) h.set('ex', EX); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    const S = D.markets[c.m], {el} = c, it = c.item(S.ticker);
    LOC = c.m === 'india' ? 'en-IN' : 'en-US';
    if (TAB === 'fno' && !S.fno) TAB = 'overview';
    header(main, c, S, it);
    main.append(el('div', {class: 'md-segmented tabs', role: 'tablist', 'aria-label': 'Sections'}, ...TABS.filter(t => t[0] !== 'fno' || S.fno).map(([k, v]) => el('button', {type: 'button', role: 'tab', 'aria-selected': String(TAB === k), 'aria-pressed': String(TAB === k), onclick: () => { TAB = k; c.rerender(); }}, v))));
    ({overview, tools, news, results, fno: fnoTab})[TAB](main, c, S);
    main.append(el('div', {class: 'src', role: 'note', 'aria-label': 'Where the figures come from'},
      el('span', {class: 'mb-asof', 'data-tip': D.source}, c.icon('schedule'), 'The stock tool’s records'),
      S.fno ? el('span', {class: 'mb-asof', 'data-tip': 'NSE’s daily F&O files'}, c.icon('schedule'), `NSE F&O close of ${c.dateShort(S.fno.date + 'T10:00:00Z')}`) : null,
      el('span', {class: 'mb-tag derived', 'data-tip': 'Returns, 52-week figures, volatility, the trailing P/E, growth and margins, the agreement counts, build-up and IV: computed by us'}, 'Computed: ours'),
      el('span', {class: 'mb-tag', 'data-tip': 'No streaming prices: closes and the stock tool’s price checks.'}, 'Not live')));
  }});
