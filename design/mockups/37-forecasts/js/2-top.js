/* The top: what the Forecast lab is in three steps, how long it runs, the standing rule (profit decides), which state
   is shown, and where things stand: the empty state with its reason, or how long the Example has been running. */
const STEP = {done: ['Done', 'success', 'check'], review: ['In review', 'warn', 'pending'], doing: ['Being built', 'info', 'construction'], not_started: ['Not started', 'neutral', 'schedule']};

function topPart(main, c) {
  const {el} = c, S = state();
  main.append(c.pagehead({crumbs: [['Strategies'], ['Forecast lab']], title: 'Forecast lab',
    meta: [el('span', {class: 'md-chip small'}, c.icon('public'), 'India · F&O · NIFTY'), c.paperTag(), S.kind === 'example' ? el('span', {class: 'mb-tag mock', 'data-tip': 'Made-up numbers on future dates, to show every shape the data can take; never real results.'}, 'Example') : el('span', {class: 'mb-tag live'}, 'Real today')]}));
  main.append(el('p', {class: 'lede'}, 'Which family reads the market best? Every trading day, Rule-based, Hybrid and AI team each predict five things about NIFTY over the coming weeks. When the answer is known, each prediction is scored. Over time the scores show who reads the market best.'),
    el('div', {class: 'steps3'}, step3(c, 'event', '1. Every trading day', 'Each family gives its chance (0 to 100%) of five things happening in the next 2 to 4 weeks.'),
      step3(c, 'schedule', '2. Two to four weeks later', 'The answer is known and each prediction is scored against the past average.'),
      step3(c, 'leaderboard', '3. Scores add up', 'The track record shows who is ahead overall and in any period you pick.')),
    el('p', {class: 'standing'}, c.icon('timer'), el('span', {}, el('b', {}, 'How long does it run? '), 'Every trading day, with no end date. Leads can come from luck, so the official verdict comes only at the review after six months of the three families paper trading together, and every month after that.')),
    el('p', {class: 'standing'}, c.icon('info'), el('span', {}, el('b', {}, 'Profit decides, not predictions. '), D.standing.replace(/^Profit decides which family trades\. /, ''))),
    el('div', {class: 'acts', style: 'margin-top:12px'}, el('span', {class: 'small muted'}, 'Showing:'), seg(c, 'Showing', [[null, 'Today (real)'], ...Object.entries(EXAMPLES)], EX, k => { EX = k; FROM = TO = null; })));
  main.append(S.kind === 'real' ? emptyNow(c, S) : S.example === 'start' ? startNow(c, S) : runningNow(c, S));
}
function step3(c, icon, title, text) { return c.el('div', {class: 'step3'}, c.el('span', {class: 'mb-avatar sm info'}, c.icon(icon)), c.el('div', {}, c.el('b', {}, title), c.el('small', {}, text))); }

/* the real state today: nothing to score, the reason, what each step waits for, when the first scores come */
function emptyNow(c, S) {
  const {el} = c, r = S.first_score_rule;
  return el('section', {class: 'card sec', 'aria-label': 'Where the lab stands'}, head(c, 'Not started yet: no prediction has been made', 'real state of 13 Oct 2026'),
    el('p', {class: 'small', style: 'margin:0'}, S.reason),
    el('ol', {class: 'steps', 'aria-label': 'What the first score waits for'}, ...S.steps.map(s => { const [w, cls, g] = STEP[s.status];
      return el('li', {}, el('span', {class: 'mb-label ' + cls}, c.icon(g), w), el('span', {class: 'sid'}, s.story), el('span', {}, s.what, el('small', {}, s.detail))); })),
    el('div', {class: 'firsts'}, el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First predictions'), el('b', {}, 'Date not set yet'), el('small', {}, 'The first trading day after steps G1 to G3 are done.')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First answer: “Fear rising”'), el('b', {}, `${r.q4_vix_up_10d} trading days later`), el('small', {}, 'About two weeks.')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First answers: the other four'), el('b', {}, `${r.others} trading days later`), el('small', {}, 'About a month.'))),
    howto(c, 'Every block below stays empty until predictions are scored. The real app never fills an empty block with example numbers.'));
}

function startNow(c, S) {
  const {el} = c, f = S.first_forecast;
  return el('section', {class: 'card sec', 'aria-label': 'Where the lab stands'}, head(c, 'First predictions made, waiting for answers', `Example: if the first predictions were made on ${dlabel(f.first_forecast)}`),
    el('div', {class: 'firsts'}, el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First predictions'), el('b', {}, dlabel(f.first_forecast)), el('small', {}, 'Rule-based’s five chances, saved before 15:00 IST.')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First answer: “Fear rising”'), el('b', {}, dlabel(f.q4)), el('small', {}, '10 trading days later.')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'First answers: the other four'), el('b', {}, dlabel(f.others)), el('small', {}, '20 trading days later; NSE holidays are not counted.'))),
    howto(c, 'Until those dates the track record stays empty: a prediction is never scored before its answer is known.'));
}

/* an Example running: since when, how many days, how many predictions answered, and where the review stands */
function runningNow(c, S) {
  const {el} = c, O = ov(), n = runningFams().reduce((s, f) => s + O.table[f.id].n, 0);
  return el('section', {class: 'card sec status', 'aria-label': 'Where the lab stands'},
    el('div', {class: 'firsts four'}, el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Running since'), el('b', {}, dayText(1)), el('small', {}, `${S.day} trading days, to ${dayText(S.day)}`)),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Predictions answered'), el('b', {}, n.toLocaleString('en-IN')), el('small', {}, 'across the families and five questions')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Next answers'), el('b', {}, dayText(S.day + 1)), el('small', {}, 'every trading day after the close')),
      el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Official verdict'), el('b', {}, S.review.reached ? `Given on ${dayText(S.review.day)}` : 'Not yet'), el('small', {}, S.review.reached ? 'at the six-month review; next one monthly' : 'comes at the six-month review'))));
}
