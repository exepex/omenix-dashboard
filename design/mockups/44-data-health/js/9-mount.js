/* Mount last: every function and state the render uses is defined by now (files 1-2). */
PF.mount({screen: 'data-health', group: 'control', strip: false, dataLabel: 'Mock examples from the F&O data catalog (contract 2.8.0)',
  readHash(h) { KEY = h.get('s') in D.states ? h.get('s') : null; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (KEY) h.set('s', KEY); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    if (!c.P.fno) { location.replace('../31-dashboard/page.html#m=' + c.m); return; }   /* India only: absent in the US */
    topPart(main, c, 'Data health', 'Data health', 'Did today\'s data arrive? Each F&O data source, the morning publish and the evening health check. Only dates, counts and statuses: never the data itself.', false);
    healthPart(main, c);
    main.append(srcLine(c, 'getFnoDataHealth', 'Every number is made up.'));
  }});
