/* Mount last: every function and state the render uses is defined by now (files 1-4). */
PF.mount({screen: 'weather', group: 'markets', strip: false, dataLabel: 'Mock examples from the F&O data catalog (contract 2.11.0)',
  readHash(h) { KEY = h.get('s') in D.states ? h.get('s') : null; HORIZON = h.get('h') === '5d' ? '5d' : '1d'; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (KEY) h.set('s', KEY); if (HORIZON !== '1d') h.set('h', HORIZON); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    if (!c.P.fno) { location.replace('../31-dashboard/page.html#m=' + c.m); return; }   /* India only: absent in the US */
    topPart(main, c); countsPart(main, c); chancesPart(main, c); sessionsPart(main, c);
    main.append(srcLine(c));
  }});
