/* Mount last: every function and state the render uses is defined by now (files 1-3). */
PF.mount({screen: 'paper-books', group: 'portfolio', strip: false, dataLabel: 'Mock examples from the F&O data catalog (story P1)',
  readHash(h) { KEY = h.get('s') in D.states ? h.get('s') : null; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (KEY) h.set('s', KEY); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    if (!c.P.fno) { location.replace('../31-dashboard/page.html#m=' + c.m); return; }   /* India only: absent in the US */
    topPart(main, c); booksPart(main, c); shadowsPart(main, c);
    const stack = c.el('div', {class: 'stack'}); openPart(stack, c); closedPart(stack, c);
    main.append(stack, c.el('div', {class: 'src', role: 'note', 'aria-label': 'Where the figures come from'},
      c.el('span', {class: 'mb-asof', 'data-tip': 'api/examples/fno-screens.json, operation getFnoPaperTrades'}, c.icon('schedule'), 'F&O data catalog: getFnoPaperTrades'),
      c.el('span', {class: 'mb-tag mock', 'data-tip': 'Every number is made up; no paper trade exists yet.'}, 'Mock: made up')));
  }});
