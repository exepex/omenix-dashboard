/* Mount last: every function and state the render uses is defined by now (files 1-8). */
PF.mount({screen: 'lab', group: 'strategies', strip: false, dataLabel: 'Real records of 13 Oct 2026 and labelled Examples',
  readHash(h) { EX = h.get('ex') in EXAMPLES ? h.get('ex') : null; ASSET = h.get('asset') in ASSETS ? h.get('asset') : 'stocks'; VIEW = h.get('view') === 'pro' ? 'pro' : 'simple';
    RANGE = RANGES.some(r => r[0] === h.get('range')) ? h.get('range') : '21'; FROM = h.get('from'); TO = h.get('to'); RV = VIEWS.some(v => v[0] === h.get('rv')) ? h.get('rv') : 'total';
    SF = h.get('sf') in AP ? h.get('sf') : 'rule'; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (EX) h.set('ex', EX); if (ASSET !== 'stocks') h.set('asset', ASSET); if (VIEW !== 'simple') h.set('view', VIEW); if (RANGE !== '21') h.set('range', RANGE);
    if (RANGE === 'custom' && FROM && TO) { h.set('from', FROM); h.set('to', TO); } if (RV !== 'total') h.set('rv', RV); if (SF !== 'rule') h.set('sf', SF); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    topPart(main, c); readyPart(main, c); boardPart(main, c); periodPart(main, c); monthsPart(main, c); whyPart(main, c); strategiesPart(main, c); predictionsLink(main, c);
    main.append(c.el('div', {class: 'src', role: 'note', 'aria-label': 'Where the figures come from'},
      c.el('span', {class: 'mb-asof', 'data-tip': 'contactexepex/agentic-stock-prediction data/<market>/paper_trades_settled'}, c.icon('schedule'), 'Stock tool: settled paper trades'),
      c.el('span', {class: 'mb-asof', 'data-tip': 'exepex/trading: paper books (slice 3)'}, c.icon('schedule'), 'F&O tool: paper books, not started'),
      c.el('span', {class: 'mb-tag mock', 'data-tip': 'Every number in the Example states is made up, on future dates.'}, 'Examples: made up'),
      c.el('span', {class: 'mb-tag', 'data-tip': 'Updated once a day after the close, not live.'}, 'Not live')));
  }});
