/* Omenix platform runtime, part 3 of 7: today's buy picks panel and the phone bottom tabs. Concatenated in file order by platform_build.py into one script. */
/* signals panel (owner, 13 Oct 2026): the left bar lists today's buy picks of the strategies, by approach (rule-based,
   AI team, hybrid), with the real figures: how many strategies agree, the model's chance of a rise, the expected gain after
   market costs (below costs is said in words) and the picking strategy's own record on that stock. Filter chips and
   pages instead of another search box; every row trades with B / S. */
const FAM = S.families, SIG_PAGE = 6;
const apBadge = f => el('span', {class: 'mb-ap ' + f, 'data-tip': `${FAM[f].long}: ${P().family_text[f]}`}, icon(FAM[f].icon), FAM[f].label);
const PICK = r => (r || []).map(k => S.pick_rules[k]).join(' and ');
function sigRows() {
  const keep = x => st.ap === 'all' || x.family === st.ap;
  const ex = st.fno === 'example' && P().fno_example ? P().fno_example.rows.map(x => ({...x, kind: 'fno'})) : [];
  return P().signals.filter(keep).map(x => ({...x, kind: 'stock'})).concat(ex.filter(keep));
}
function sigRow(x) {
  if (x.kind === 'fno') return el('li', {class: 'mb-sig-row'}, el('span', {class: 'mb-avatar sm info'}, icon('layers')),
    el('div', {class: 'top'}, el('b', {}, x.name), apBadge(x.family)),
    el('div', {class: 'px'}, el('span', {class: 'mb-tag mock', 'data-tip': P().fno_example.note}, 'Example')),
    el('div', {class: 'why'}, `Profit chance ${x.pop}% (risk-neutral) · max loss ${money(x.max_loss)} · ${x.credit ? 'credit ' + money(x.credit) : 'cost ' + money(x.debit)}`),
    el('div', {class: 'act', 'data-tip': tradeLock()}, el('button', {class: 'md-btn small buy', type: 'button', disabled: !!tradeLock(), onclick: () => openDrawer('basket:' + x.basket)}, 'Buy basket')));
  const it = item(x.id), a = asOf(it), clears = x.exp_gain_pct > 0, rec = x.record;
  return el('li', {class: 'mb-sig-row', 'data-inst': x.id, tabindex: '0', 'aria-label': `${it.sym}: ${FAM[x.family].label} buy pick, ${x.agree.buy} of ${x.agree.of} strategies agree`},
    el('span', {class: 'mb-score sm', style: `--v:${Math.round(x.agree.buy / x.agree.of * 100)}`, role: 'img', 'aria-label': `${x.agree.buy} of ${x.agree.of} strategies buy`, 'data-tip': `${x.agree.buy} of ${x.agree.of} strategies buy ${it.sym} at N+${x.horizon}: rule ${x.agree.by_family.rule.buy} of ${x.agree.by_family.rule.of}, AI ${x.agree.by_family.ai.buy} of ${x.agree.by_family.ai.of}, baselines ${x.agree.by_family.baseline.buy} of ${x.agree.by_family.baseline.of}.`}, el('b', {}, `${x.agree.buy}/${x.agree.of}`)),
    el('div', {class: 'top'}, el('a', {class: 'tk', href: '#', 'data-inst': x.id, onclick: e => { e.preventDefault(); openDrawer('quick:' + x.id); }}, it.sym), apBadge(x.family)),
    el('div', {class: 'px'}, num(it.last), el('small', {}, delta(it.chg_pct), ' · ' + a.short)),
    el('div', {class: 'why'}, el('b', {}, clears ? 'Worth a paper buy:' : 'Not a buy after costs:'), ` ${x.strategy} sees a ${(x.prob_up * 100).toFixed(1)}% chance of a rise over ${x.horizon} ${x.horizon === 1 ? 'day' : 'days'}${clears ? ', and the expected gain beats the costs.' : ', but the costs are larger than the expected gain.'}`),
    el('div', {class: 'cost'}, el('span', {class: 'mb-label ' + (clears ? 'success' : 'danger'), 'data-tip': `Expected gain after market costs of ${money(x.amount)}: ${(x.prob_up * 100).toFixed(1)}% × ${sgn(x.move_pct)} − ${((1 - x.prob_up) * 100).toFixed(1)}% × ${x.loss_pct}% − ${x.costs_pct}% costs. Picked by: ${PICK(x.pick_rules)}.`}, icon(clears ? 'check' : 'close'), `Expected ${sgn(x.exp_gain_pct)} after costs`)),
    el('div', {class: 'proof', 'data-tip': rec ? `${x.strategy} on ${it.sym} so far: ${rec.trades} settled paper trades, ${Math.round(rec.win_rate * rec.trades)} won, net ${money(rec.net_pnl, 2)}. Fewer than 20 is too few to rank.` : 'No settled trade of this strategy on this stock yet.'}, icon('history'), rec ? `Record here: ${Math.round(rec.win_rate * rec.trades)} of ${rec.trades} won, ` : 'No record here yet', rec ? moneyDelta(rec.net_pnl) : null, rec ? ' · too few to rank' : null),
    el('div', {class: 'act', 'data-tip': tradeLock()}, el('button', {class: 'md-btn small buy', type: 'button', disabled: !!tradeLock(), onclick: () => openOrder(x.id, 'buy')}, 'Buy'), el('button', {class: 'md-btn small sell', type: 'button', disabled: !!tradeLock(), onclick: () => openOrder(x.id, 'sell')}, 'Sell')));
}
function signalsBody(where) {
  const rows = sigRows(), pages = Math.max(1, Math.ceil(rows.length / SIG_PAGE)), G = P().go_live;
  st.pg = Math.min(st.pg, pages - 1);
  const shown = rows.slice(st.pg * SIG_PAGE, st.pg * SIG_PAGE + SIG_PAGE);
  const chip = (k, label) => el('button', {class: 'md-chip filter small', type: 'button', 'aria-pressed': String(st.ap === k), onclick: () => { st.ap = k; st.pg = 0; renderAll(); }}, label);
  const fs = P().fno_state;
  return [
    el('div', {class: 'mb-wl-head'},
      el('div', {class: 'mb-wl-title'}, el('h2', {}, 'Today’s buy picks'), help(`The head-to-head picks of each strategy family for today's session, from the stock tool. Not proven yet: ${G.months_forward} of 2 months of forward paper trading and about ${G.trades_needed} more settled trades are needed before any signal can be called strong.`),
        where === 'panel' && st.wlopen ? el('button', {class: 'md-icon-btn small', type: 'button', 'aria-label': 'Close the picks', onclick: () => { st.wlopen = false; applySettings(); renderTabs(); }}, icon('close')) : null),
      el('div', {class: 'mb-wl-chips', role: 'group', 'aria-label': 'Who picked'}, chip('all', 'All'), chip('rule', FAM.rule.label), chip('hybrid', FAM.hybrid.label), chip('ai', FAM.ai.label)),
      el('div', {class: 'mb-wl-meta'}, el('span', {}, `Not proven yet · ${G.trades_needed} trades to go`))),
    el('ul', {class: 'mb-wl-list', 'aria-label': 'Today’s buy picks'}, ...shown.map(sigRow), shown.length ? null : el('li', {class: 'quiet', style: 'margin:12px'}, st.ap === 'hybrid' ? `No hybrid pick yet: a hybrid stock strategy is planned${P().fno ? ', and no F&O strategy (Book 2) is approved yet' : ''}.` : 'No pick from this approach today.')),
    P().no_pick && P().no_pick.length && st.ap !== 'hybrid' ? el('div', {class: 'mb-wl-note'}, icon('remove'), el('span', {}, el('b', {}, P().no_pick.join(', ') + ': '), 'no strategy picks it today (no candidate clears the bar).')) : null,
    fs && st.fno !== 'example' ? el('div', {class: 'mb-wl-note'}, icon('science'), el('span', {}, el('b', {}, 'F&O: no approved strategy yet. '), fs.note.replace(/^No F&O strategy has passed testing yet: /, ''))) : null,
    el('div', {class: 'mb-wl-foot mb-pager'}, el('span', {}, rows.length ? `${st.pg * SIG_PAGE + 1}–${st.pg * SIG_PAGE + shown.length} of ${rows.length}` : '0 of 0'),
      el('button', {class: 'md-icon-btn small', type: 'button', 'aria-label': 'Previous page', disabled: st.pg === 0, onclick: () => { st.pg--; renderAll(); }}, icon('chevron_left')),
      el('button', {class: 'md-icon-btn small', type: 'button', 'aria-label': 'Next page', disabled: st.pg >= pages - 1, onclick: () => { st.pg++; renderAll(); }}, icon('chevron_right')))];
}
const signalsPanel = () => el('aside', {class: 'mb-wl mb-sig', id: 'wl', 'aria-label': 'Today’s buy picks'}, ...signalsBody('panel'));

/* phone bottom tabs: Home · Watchlist · Orders · Portfolio · More */
function tabbar() {
  const t = (id, label, ic, on, fn) => el('a', {class: 'mb-nav-item', href: '#', 'aria-current': on ? 'page' : null, onclick: e => { e.preventDefault(); fn(); }}, el('span', {class: 'mb-nav-ind'}, icon(ic)), label);
  const w = st.wlopen;
  return el('nav', {class: 'mb-navbar', id: 'tabs', 'aria-label': 'Main'},
    t('home', 'Home', 'home', !w && page.screen === 'dashboard', () => go('dashboard')),
    t('wl', 'Picks', 'bolt', w, () => { st.wlopen = !st.wlopen; applySettings(); renderTabs(); }),
    t('orders', 'Orders', 'receipt_long', !w && page.screen === 'orders', () => go('orders')),
    t('portfolio', 'Portfolio', 'account_balance_wallet', !w && page.group === 'portfolio' && page.screen !== 'orders', () => go('positions')),
    t('more', 'More', 'menu', !w && !['dashboard', 'orders'].includes(page.screen) && page.group !== 'portfolio', () => openDrawer('nav')));
}
const renderTabs = () => { const t = $('#tabs', F.pf); if (t) F.pf.replaceChild(tabbar(), t); };

