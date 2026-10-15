/* The top: what the card is, which Mock state is shown, the verdict (TRADE, NO TRADE, WATCH) with its reason, and the
   card's three times in their order (market data frozen, decision final, card sent). */
function topPart(main, c) {
  const {el} = c, C = card();
  main.append(c.pagehead({crumbs: [['F&O'], ["Today's card"]], title: "Today's card",
    meta: [el('span', {class: 'md-chip small'}, c.icon('public'), 'India · F&O · NIFTY'), el('span', {class: 'mb-label paper'}, C.label),
      el('span', {class: 'mb-tag mock', 'data-tip': 'Made-up numbers on a future date, from the F&O data catalog; never a real card.'}, 'Mock')]}));
  main.append(el('p', {class: 'lede'}, 'Every trading day at about 15:08 the desk sends one card: a paper trade, no trade with the reason, or a shadow to watch. It says how much the trade can lose, why, how sure the forecast is, and what would prove it wrong. Paper only: no card ever asks you to place a real order.'),
    el('div', {class: 'acts'}, el('span', {class: 'small muted'}, 'Mock state:'),
      el('div', {class: 'md-segmented dense qpick', role: 'group', 'aria-label': 'Mock state'}, ...KEYS.map(k => el('button', {type: 'button', 'aria-pressed': String(k === (KEY || DEFAULT)), 'data-tip': D.states[k].about, onclick: () => { KEY = k; c.rerender(); }},
        `${CASE[D.states[k].case]}: ${D.states[k].value.payload.status}${D.states[k].value.payload.reason ? ' · ' + reasonShort(D.states[k].value.payload.reason) : ''}`)))));
  main.append(verdict(c, C), times(c, C));
}
function reasonShort(reason) { return {no_approved_strategy: 'no strategy', weather_red: 'RED', data_check_failed: 'data missing', risk_bucket_full: 'risk full', budget_stop: 'budget', cost_wall: 'costs', advocate_hard_rule: 'hard rule'}[reason]; }
function verdict(c, C) {
  const {el} = c, [cls, glyph, sub] = STATUS[C.status];
  return el('section', {class: 'mb-verdict ' + cls, 'aria-label': 'The card'},
    el('span', {class: 'mb-verdict-box', 'aria-hidden': 'true'}, c.icon(glyph)),
    el('div', {}, el('div', {class: 'mb-verdict-word'}, C.status, el('small', {}, `${sub} · ${dlabel(C.session)}`)), el('p', {class: 'why'}, C.reason_text)));
}
function times(c, C) {
  const {el} = c, T = C.timing, sent = T.delivery === 'sent';
  return el('div', {class: 'times', role: 'list', 'aria-label': 'The card’s times'},
    fact(c, '1. Market data frozen', ist(T.market_data_cutoff), 'No later price enters the card'),
    fact(c, '2. Decision final', ist(T.decision_finalized_at), 'Checks and objections on the same data'),
    fact(c, '3. Card sent', ist(T.card_sent_at), 'Slack’s own time stamp'),
    el('div', {class: 'mb-fact'}, el('span', {class: 'k'}, 'Delivery'), el('b', {}, el('span', {class: 'mb-label ' + (sent ? 'success' : 'danger')}, c.icon(sent ? 'check' : 'close'), sent ? 'Sent' : T.delivery === 'retrying' ? 'Retrying' : 'Alert NOT sent')), el('small', {}, 'To #fno-desk on your phone')));
}
