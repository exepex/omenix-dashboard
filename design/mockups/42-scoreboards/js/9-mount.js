/* Mount last: every function and state the render uses is defined by now (files 1-2). */
PF.mount({screen: 'scoreboards', group: 'strategies', strip: false, dataLabel: 'Mock examples from the F&O data catalog (contract 2.14.0)',
  readHash(h) { KEY = h.get('s') in D.states ? h.get('s') : null; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (KEY) h.set('s', KEY); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    if (!c.P.fno) { location.replace('../31-dashboard/page.html#m=' + c.m); return; }   /* India only: absent in the US */
    topPart(main, c, 'Scoreboards', 'Scoreboards', 'Two scoreboards answer two different questions, so they are shown apart and never combined into one figure. Both are paper only.', true);
    boardsPart(main, c);
    main.append(srcLine(c, 'getFnoScoreboards', 'Every number is made up; no scoreboard has run yet.'));
  }});
