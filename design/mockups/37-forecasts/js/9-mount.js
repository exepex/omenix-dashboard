/* Mount last: every function and state the render uses is defined by now (files 1-3). */
PF.mount({screen: 'forecasts', group: 'strategies', strip: false, dataLabel: 'Mock examples from the F&O data catalog (story P1)',
  readHash(h) { KEY = h.get('s') in D.states ? h.get('s') : null; PF.st.wlOff = h.get('wloff') !== '0'; },
  writeHash(h) { if (KEY) h.set('s', KEY); if (!PF.st.wlOff) h.set('wloff', '0'); },
  render(main, c) {
    if (!c.P.fno) { location.replace('../31-dashboard/page.html#m=' + c.m); return; }   /* India only: absent in the US */
    topPart(main, c, 'Forecast lab', 'Forecast lab', 'Every forecaster answers the same questions each day before the deadline. Each is scored against a fixed yardstick, so you can see who reads the market better than plain history.', false);
    standingPart(main, c); todayPart(main, c); bestPart(main, c); questionsPart(main, c); forecastersPart(main, c);
    main.append(srcLine(c, 'getFnoForecastLab', 'Every number is made up.'));
  }});
