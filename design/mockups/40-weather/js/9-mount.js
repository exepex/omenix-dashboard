/* Mount last: every function and state the render uses is defined by now (files 1-3). */
PF.mount({screen: 'weather', group: 'trade', strip: false, dataLabel: 'Mock examples from the F&O data catalog (story P1)',
  readHash(h) { KEY = h.get('s') in D.states ? h.get('s') : null; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (KEY) h.set('s', KEY); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    if (!c.P.fno) { location.replace('../31-dashboard/page.html#m=' + c.m); return; }   /* India only: absent in the US */
    topPart(main, c);
    const left = c.el('div', {class: 'stack'}), right = c.el('div', {class: 'stack'});
    recordPart(left, c); chancesPart(right, c);
    main.append(c.el('div', {class: 'cols'}, left, right),
      c.el('div', {class: 'src', role: 'note', 'aria-label': 'Where the figures come from'},
        c.el('span', {class: 'mb-asof', 'data-tip': 'api/examples/fno-screens.json, operation getFnoWeather'}, c.icon('schedule'), 'F&O data catalog: getFnoWeather'),
        c.el('span', {class: 'mb-tag mock', 'data-tip': 'Every number is made up; no weather record exists yet.'}, 'Mock: made up')));
  }});
