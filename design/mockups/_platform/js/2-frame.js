/* Omenix platform runtime, part 2 of 6. Concatenated in file order by platform_build.py into one script. */
/* ---- the frame ---------------------------------------------------------------------------------------------- */
let F = {};
function frame() {
  document.body.prepend(el('div', {id: 'tip', class: 'md-tooltip', role: 'tooltip'}));
  F.pf = el('div', {class: 'mb-pf', id: 'pf'});
  F.main = el('main', {class: 'mb-pf-main', id: 'main'}, el('div', {class: 'mb-pf-inner', id: 'page'}));
  F.veil = el('div', {class: 'mb-veil', id: 'veil', onclick: closeTop});
  F.drawer = el('aside', {class: 'mb-drawer', id: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'drawer-title'});
  F.hc = el('div', {class: 'mb-hcard', id: 'hcard', role: 'dialog', 'aria-label': 'Quick view'});
  F.pal = el('div', {class: 'mb-modal palette', id: 'palette', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Search'});
  F.keys = el('div', {class: 'mb-modal', id: 'keys', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'keys-title'});
  F.menu = el('div', {class: 'mb-menu', id: 'menu', role: 'menu'});
  F.snack = el('div', {class: 'mb-snack', id: 'snack', role: 'status', 'aria-live': 'polite'});
  document.body.append(F.pf, F.veil, F.drawer, F.hc, F.pal, F.keys, F.menu, F.snack);
}
function applySettings() {
  const root = document.documentElement;
  if (st.theme === 'system') root.removeAttribute('data-theme'); else root.dataset.theme = st.theme;
  F.pf.classList.toggle('compact', st.density === 'compact');
  F.pf.classList.toggle('rail-compact', st.rail === 'icons');
  F.pf.classList.toggle('wl-off', st.wlOff);
  F.pf.classList.toggle('wl-on', st.wlopen);
}
function renderAll() {
  applySettings();
  const inner = $('#page', F.main);
  F.pf.replaceChildren(appbar(), navrail(), watchlist(), F.main, tabbar());
  inner.replaceChildren();
  page.render(inner, ctx());
  inner.append(el('footer', {}, 'Omenix · research and paper trading only: nothing here places a real order · ', el('b', {}, 'Mock data'), ` as of ${nowLabel()}`));
  writeHash();
}

/* app bar */
function appbar() {
  const unread = (S.notifications[st.m] || []).filter(n => n.unread).length;
  return el('header', {class: 'mb-appbar', id: 'appbar'},
    el('a', {class: 'mb-appbar-brand', href: B('31-dashboard') + hashCarry(), 'aria-label': 'Omenix: Dashboard'}, el('span', {class: 'mb-brand-mark'}, 'OM')),
    el('div', {class: 'mb-appbar-name'}, 'Omenix', el('small', {}, 'Research · Paper only')),
    el('button', {class: 'mb-gsearch', type: 'button', onclick: () => openPal(''), 'aria-label': 'Search stocks, F&O, screens (slash)'}, icon('search'), el('span', {}, P().fno ? 'Search stocks, F&O, screens…' : 'Search stocks, screens, news…'), el('span', {class: 'mb-kbd'}, '/')),
    el('div', {class: 'md-segmented dense light', role: 'group', 'aria-label': 'Market'}, ...Object.entries(S.markets).map(([k, v]) => el('button', {type: 'button', 'aria-pressed': String(k === st.m), onclick: () => { if (st.m !== k) { st.m = k; st.wl = 0; closeAll(); renderAll(); } }}, v.label))),
    el('div', {class: 'mb-idx-strip', 'aria-label': 'Indices'}, ...P().indices.map(id => { const it = item(id), a = asOf(it); return el('a', {class: 'mb-idx' + (a.stale ? ' stale' : ''), href: '#', 'data-tip': `${it.sym}: ${a.tip}`, onclick: e => { e.preventDefault(); go('markets'); }}, el('span', {class: 'n'}, it.sym), el('span', {class: 'v'}, price(it)), delta(it.chg_pct)); })),
    el('div', {class: 'mb-appbar-end'},
      el('button', {class: 'md-icon-btn hide-phone', type: 'button', 'aria-label': st.wlOff ? 'Show the watchlist' : 'Hide the watchlist', 'data-tip': (st.wlOff ? 'Show' : 'Hide') + ' the watchlist panel', onclick: () => { if (innerWidth < 1200) { st.wlopen = !st.wlopen; applySettings(); } else { st.wlOff = !st.wlOff; applySettings(); writeHash(); } }}, icon('dock_to_left')),
      el('button', {class: 'md-icon-btn mb-badged', type: 'button', id: 'bell', 'aria-label': `Notifications, ${unread} unread`, onclick: e => openNotif(e.currentTarget)}, icon('notifications'), unread ? el('span', {class: 'md-badge count'}, unread) : null),
      el('button', {class: 'md-icon-btn hide-phone', type: 'button', 'aria-label': 'Switch theme', 'data-tip': document.documentElement.dataset.theme === 'dark' ? 'Light theme' : 'Dark theme', onclick: () => { st.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; renderAll(); }}, icon(document.documentElement.dataset.theme === 'dark' ? 'light_mode' : 'dark_mode')),
      el('button', {class: 'mb-me', type: 'button', id: 'me', 'aria-label': 'Profile and settings', onclick: e => openProfile(e.currentTarget)}, 'OW')));
}

/* navigation rail */
function navrail() {
  const nav = el('nav', {class: 'mb-navrail', 'aria-label': 'Screens'});
  for (const g of NAV) {
    if (!g) { nav.append(el('div', {class: 'mb-rail-sep', role: 'separator'})); continue; }
    const items = g.items.filter(shown); if (!items.length) continue;
    const first = items.find(i => i.href) || items[0];
    const cur = page.group === g.id;
    const fly = el('div', {class: 'mb-rail-fly' + (st.fly === g.id ? ' on' : ''), role: 'menu', 'aria-label': g.label}, el('div', {class: 't'}, g.label),
      ...items.map(i => el('a', {href: i.href ? i.href + hashCarry() : '#', role: 'menuitem', 'aria-current': page.screen === i.id ? 'page' : null, 'aria-disabled': !i.href && !i.action ? 'true' : null, 'data-tip': !i.href && !i.action ? SOON : null, onclick: e => { if (!i.href) { e.preventDefault(); go(i.id); } }}, icon(i.icon), i.label, i.key ? el('small', {}, i.key) : !i.href && !i.action ? el('small', {}, 'soon') : null)));
    nav.append(el('div', {class: 'mb-rail-grp'}, el('a', {class: 'mb-rail-item', href: first.href ? first.href + hashCarry() : '#', 'aria-current': cur ? 'page' : null, 'aria-haspopup': items.length > 1 ? 'menu' : null, onclick: e => { if (!first.href) { e.preventDefault(); go(first.id); } }}, el('span', {class: 'mb-nav-ind'}, icon(g.icon)), el('span', {class: 'mb-nav-label'}, g.label)), items.length > 1 || !first.href ? fly : null));
  }
  const pins = PINS.filter(shown);
  if (pins.length) { nav.append(el('div', {class: 'mb-rail-sep', role: 'separator'})); for (const p of pins) nav.append(el('a', {class: 'mb-rail-pin', href: '#', 'data-tip': p.label, 'aria-label': p.label, onclick: e => { e.preventDefault(); go(p.screen); }}, p.short)); }
  return nav;
}

/* watchlist panel */
let dragId = null;
function watchlist() {
  const L = P().watchlists[st.wl];
  const list = el('ul', {class: 'mb-wl-list', id: 'wl-list', 'aria-label': `Watchlist ${L.name}`});
  for (const id of L.items) list.append(wlRow(item(id)));
  if (!L.items.length) list.append(el('li', {class: 'quiet', style: 'margin:12px'}, `“${L.name}” is empty. Type in the field above to add stocks${P().fno ? ', F&O underlyings or contracts' : ''}; or use “Add all to watchlist” in the Screener.`));
  const find = el('input', {type: 'search', placeholder: P().fno ? 'Search and add: infy, nifty 24500 ce' : 'Search and add: aapl, msft', 'aria-label': 'Filter or add to this watchlist', oninput: e => { const q = e.target.value.trim().toLowerCase(); for (const r of $$('.mb-wl-row', list)) r.hidden = q && !r.dataset.text.includes(q); }, onkeydown: e => { if (e.key === 'Enter') openPal(e.target.value); }});
  return el('aside', {class: 'mb-wl', id: 'wl', 'aria-label': 'Watchlist'},
    el('div', {class: 'mb-wl-head'}, el('label', {class: 'mb-wl-find'}, icon('search'), find),
      el('div', {class: 'mb-wl-meta'}, el('span', {}, el('b', {}, L.name), ` · ${L.items.length} / 50`), el('span', {class: 'mb-asof', 'data-tip': 'Every row shows its own as-of time: these are end-of-day files, the 3 pm option snapshot and the stock tool’s runs, not a live feed.'}, icon('schedule'), 'not live'),
        st.wlopen ? el('button', {class: 'md-icon-btn small', type: 'button', 'aria-label': 'Close the watchlist', onclick: () => { st.wlopen = false; applySettings(); renderTabs(); }}, icon('close')) : null)),
    list,
    el('div', {class: 'mb-wl-foot', role: 'tablist', 'aria-label': 'Watchlists'}, ...P().watchlists.map((w, i) => el('button', {type: 'button', role: 'tab', 'aria-pressed': String(i === st.wl), 'aria-selected': String(i === st.wl), 'data-tip': `${w.name} (${w.items.length})`, onclick: () => { st.wl = i; F.pf.replaceChild(watchlist(), $('#wl', F.pf)); writeHash(); }}, i + 1)),
      el('button', {type: 'button', 'aria-label': 'Watchlist settings: columns, sort', 'data-tip': 'Sort, columns and list names (Settings)', onclick: () => snack('Watchlist settings: sort, columns and names live in Settings.')}, icon('tune'))));
}
function wlRow(it) {
  const a = asOf(it), held = it.held;
  const acts = el('div', {class: 'mb-wl-acts'},
    el('button', {class: 'mb-bs buy', type: 'button', 'aria-label': `Paper buy ${it.sym}`, 'data-tip': tradable(it) ? 'Paper buy (B)' : 'An index cannot be traded: use its futures or options', disabled: !tradable(it), onclick: e => { e.stopPropagation(); openOrder(it.id, 'buy'); }}, 'B'),
    el('button', {class: 'mb-bs sell', type: 'button', 'aria-label': `Paper sell ${it.sym}`, 'data-tip': tradable(it) ? 'Paper sell (S)' : 'An index cannot be traded', disabled: !tradable(it), onclick: e => { e.stopPropagation(); openOrder(it.id, 'sell'); }}, 'S'),
    el('button', {class: 'md-icon-btn', type: 'button', 'aria-label': 'Chart', 'data-tip': 'Chart', onclick: e => { e.stopPropagation(); go('chart'); }}, icon('show_chart')),
    P().fno && (it.fno || isFno(it)) ? el('button', {class: 'md-icon-btn', type: 'button', 'aria-label': 'Option chain', 'data-tip': 'Option chain', onclick: e => { e.stopPropagation(); go('chain'); }}, icon('layers')) : null,
    el('button', {class: 'md-icon-btn', type: 'button', 'aria-label': `More actions for ${it.sym}`, 'aria-haspopup': 'menu', onclick: e => { e.stopPropagation(); openMenu(it.id, e.currentTarget); }}, icon('more_vert')));
  const row = el('li', {class: 'mb-wl-row' + (a.stale ? ' stale' : ''), tabindex: '0', draggable: 'true', 'data-inst': it.id, 'data-text': (it.sym + ' ' + it.name).toLowerCase(), 'aria-label': `${it.sym}, ${price(it)}, ${sgn(it.chg_pct)}, ${a.short}${a.stale ? ', stale' : ''}`,
      onclick: () => openHc(it.id, row), onkeydown: e => { if (e.key === 'Enter') openHc(it.id, row); },
      ondragstart: e => { dragId = it.id; e.dataTransfer.effectAllowed = 'move'; }, ondragover: e => e.preventDefault(),
      ondrop: e => { e.preventDefault(); const L = P().watchlists[st.wl].items; if (!dragId || dragId === it.id) return; L.splice(L.indexOf(dragId), 1); L.splice(L.indexOf(it.id), 0, dragId); dragId = null; F.pf.replaceChild(watchlist(), $('#wl', F.pf)); }},
    icon('drag_indicator', 'ms grip'),
    el('div', {style: 'min-width:0'}, el('div', {class: 'sym'}, it.sym, held ? el('span', {class: 'mb-label paper', style: 'padding:0 5px;font-size:10.5px;line-height:16px', 'data-tip': `Held in ${P().accounts[held.account].name}: ${held.qty} at ${num(held.avg)} (Paper)`}, 'held') : null), el('div', {class: 'sub'}, it.name)),
    el('div', {class: 'px'}, el('div', {}, price(it)), el('small', {'data-tip': a.tip}, delta(it.chg_pct), ' · ' + a.short + (a.stale ? ' · stale' : ''))),
    acts);
  return row;
}

/* phone bottom tabs: Home · Watchlist · Orders · Portfolio · More */
function tabbar() {
  const t = (id, label, ic, on, fn) => el('a', {class: 'mb-nav-item', href: '#', 'aria-current': on ? 'page' : null, onclick: e => { e.preventDefault(); fn(); }}, el('span', {class: 'mb-nav-ind'}, icon(ic)), label);
  const w = st.wlopen;
  return el('nav', {class: 'mb-navbar', id: 'tabs', 'aria-label': 'Main'},
    t('home', 'Home', 'home', !w && page.screen === 'dashboard', () => go('dashboard')),
    t('wl', 'Watchlist', 'star', w, () => { st.wlopen = !st.wlopen; applySettings(); renderTabs(); }),
    t('orders', 'Orders', 'receipt_long', !w && page.screen === 'orders', () => go('orders')),
    t('portfolio', 'Portfolio', 'account_balance_wallet', !w && page.group === 'portfolio' && page.screen !== 'orders', () => go('positions')),
    t('more', 'More', 'menu', !w && !['dashboard', 'orders'].includes(page.screen) && page.group !== 'portfolio', () => openDrawer('nav')));
}
const renderTabs = () => { const t = $('#tabs', F.pf); if (t) F.pf.replaceChild(tabbar(), t); };

