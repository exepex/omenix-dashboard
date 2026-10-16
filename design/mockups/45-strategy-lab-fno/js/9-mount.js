/* Mount last: every function and state the render uses is defined by now (files 1-3). */
PF.mount({screen: 'lab', group: 'strategies', strip: false, dataLabel: 'Mock examples from the F&O data catalog (story P1)',
  readHash(h) { KEY = h.get('s') in D.states ? h.get('s') : null; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (KEY) h.set('s', KEY); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    if (!c.P.fno) { location.replace('../38-strategy-lab/page.html#m=' + c.m); return; }   /* India only: the US has stocks only (38) */
    topPart(main, c, 'Strategy lab', 'Strategy lab: F&O', 'Which F&O strategies passed their test, which books may trade them, and what they made on paper after every cost. The stock tab is separate and never combined with this one.', true);
    factoryPart(main, c); booksPart(main, c);
    main.append(srcLine(c, 'getFnoStrategyLab', 'Every number is made up.'));
  }});
