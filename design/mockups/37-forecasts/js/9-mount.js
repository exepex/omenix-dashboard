/* Mount last: every function and state the render uses is defined by now (files 1-8). */
PF.mount({screen: 'forecasts', group: 'strategies', strip: false, dataLabel: 'Real state of 13 Oct 2026 (no forecast yet) and labelled Examples',
  readHash(h) { EX = h.get('ex') in EXAMPLES ? h.get('ex') : null; Q = Math.min(4, Math.max(0, (+h.get('q') || 1) - 1));
    WHO = h.get('who') in AP || D.yardsticks.some(y => y.id === h.get('who')) ? h.get('who') : 'book1_rules';
    RV = VIEWS.some(v => v[0] === h.get('rv')) ? h.get('rv') : 'total'; RQ = h.get('rq') >= '1' && h.get('rq') <= '5' ? +h.get('rq') - 1 : 'all';
    RANGE = RANGES.some(r => r[0] === h.get('range')) ? h.get('range') : '21'; FROM = h.get('from'); TO = h.get('to'); DET = h.get('det') === '1'; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (EX) h.set('ex', EX); if (Q) h.set('q', Q + 1); if (WHO !== 'book1_rules') h.set('who', WHO); if (RV !== 'total') h.set('rv', RV); if (RQ !== 'all') h.set('rq', RQ + 1);
    if (RANGE !== '21') h.set('range', RANGE); if (RANGE === 'custom' && FROM && TO) { h.set('from', FROM); h.set('to', TO); } if (DET) h.set('det', '1'); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    if (!c.P.fno) { location.replace('../31-dashboard/page.html#m=' + c.m); return; }   /* India only: absent in the US */
    topPart(main, c); todayPart(main, c); overallPart(main, c); periodPart(main, c); whyPart(main, c); questionsPart(main, c); detailPart(main, c);
    main.append(c.el('div', {class: 'src', role: 'note', 'aria-label': 'Where the figures come from'},
      c.el('span', {class: 'mb-asof', 'data-tip': 'exepex/trading research/forecasts/PROTOCOL.md, draft version 1'}, c.icon('schedule'), 'F&O tool: forecast protocol, draft 1'),
      c.el('span', {class: 'mb-tag mock', 'data-tip': 'Every number in the Example states is made up; no real NIFTY or India VIX result is used.'}, 'Examples: made up'),
      c.el('span', {class: 'mb-tag', 'data-tip': 'Scores are worked out once a day after NSE’s close, not live.'}, 'Not live')));
  }});
