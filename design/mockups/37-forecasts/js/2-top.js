/* The top: the heading, what the contest is in one line, the standing rule (profit decides, not forecasts), which
   state is shown, and what is happening now: the empty state with its reason and its first-score dates, or the
   example's day. */
const STEP = {done: ['Done', 'success', 'check'], review: ['In review', 'warn', 'pending'], doing: ['Being built', 'info', 'construction'], not_started: ['Not started', 'neutral', 'schedule']};

function topPart(main, c) {
  const {el} = c, S = state();
  main.append(c.pagehead({crumbs: [['Strategies'], ['Forecast contest']], title: 'Forecast contest',
    meta: [el('span', {class: 'md-chip small'}, c.icon('public'), 'India · F&O · NIFTY'), c.paperTag(), S.kind === 'example' ? el('span', {class: 'mb-tag mock', 'data-tip': 'Made-up numbers to show every shape the data can take; never real NIFTY results.'}, 'Example') : el('span', {class: 'mb-tag live'}, 'Real today')]}));
  main.append(el('p', {class: 'lede'}, 'Every trading day each family gives its chance (0 to 100%) of five things happening to NIFTY. When the answer is known, the forecast gets a miss score. The family whose misses stay smallest, against simple yardsticks, reads the market best.'),
    el('p', {class: 'standing'}, c.icon('info'), el('span', {}, el('b', {}, 'Profit decides, not this contest. '), D.standing.replace(/^Profit decides which family trades\. /, ''))),
    el('div', {class: 'acts', style: 'margin-top:12px'}, el('span', {class: 'small muted'}, 'Showing:'),
      seg(c, 'Showing', [[null, 'Today (real)'], ...Object.entries(EXAMPLES)], EX, k => { EX = k; })));
  main.append(S.kind === 'real' ? emptyNow(c, S) : S.example === 'start' ? startNow(c, S) : dayNow(c, S));
}

/* the real state today: nothing to score, the reason, what each step waits for, when the first scores come */
function emptyNow(c, S) {
  const {el} = c, r = S.first_score_rule;
  return el('section', {class: 'card sec', 'aria-label': 'Where the contest stands'}, head(c, 'No forecast scored yet', 'real state of 13 Oct 2026'),
    el('p', {class: 'small', style: 'margin:0'}, S.reason),
    el('ol', {class: 'steps', 'aria-label': 'What the first score waits for'}, ...S.steps.map(s => { const [w, cls, g] = STEP[s.status];
      return el('li', {}, el('span', {class: 'mb-label ' + cls}, c.icon(g), w), el('span', {class: 'sid'}, s.story), el('span', {}, s.what, el('small', {}, s.detail))); })),
    el('div', {class: 'firsts'}, c.el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First forecast'), el('b', {}, 'Not set yet'), el('small', {}, 'The first trading day after steps G1 to G3 are done.')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First score, fear-gauge question'), el('b', {}, `${r.q4_vix_up_10d} trading days later`), el('small', {}, 'Its answer is known after 10 trading days.')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First scores, the other four'), el('b', {}, `${r.others} trading days later`), el('small', {}, 'About a month: their answers need 20 trading days.'))),
    howto(c, 'Nothing below shows a number until a forecast is scored. The real app never fills an empty block with example numbers.'));
}

/* Example: the first forecast is made; the first scores have real calendar dates (NSE sessions, muhurat left out) */
function startNow(c, S) {
  const {el} = c, f = S.first_forecast, d = iso => c.dateShort(iso + 'T10:00:00Z');
  return el('section', {class: 'card sec', 'aria-label': 'Where the contest stands'}, head(c, 'First forecasts made, waiting for answers', 'Example: if the first forecast were made on ' + d(f.first_forecast)),
    el('div', {class: 'firsts'}, el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First forecast'), el('b', {}, d(f.first_forecast)), el('small', {}, 'Rule-based’s five chances, saved before 15:00 IST.')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First score, fear-gauge question'), el('b', {}, d(f.q4)), el('small', {}, '10 trading days later.')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First scores, the other four'), el('b', {}, d(f.others)), el('small', {}, '20 trading days later. NSE holidays and the Diwali muhurat session are not counted as trading days.'))),
    howto(c, 'Until those dates every block below stays empty: a forecast is never scored before its answer is known.'));
}

/* Example: the contest has run for some days; who is ahead in one line, and how many tests are proven */
function dayNow(c, S) {
  const {el} = c;
  const line = S.review.reached ? 'The official verdicts are in each family’s card and in the question-by-question table below.'
    : 'No question has enough settled days for a test yet, and no verdict is given before the first review.';
  return el('section', {class: 'card sec', 'aria-label': 'Where the contest stands'}, head(c, `Day ${S.day} of the contest`, EXAMPLES[S.example]),
    el('p', {class: 'small', style: 'margin:0'}, S.review.reached ? `The first review came on day ${S.review.day}. ` : '', line),
    howto(c, S.review.reached ? 'Proven means the gap is too big to be luck, even after allowing for 45 comparisons at once. Most gaps are not proven: that is normal with half a year of days.'
      : 'Early leads often vanish. A verdict needs at least 40 settled days per test, and it is given only at the first review.'));
}
