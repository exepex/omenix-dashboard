/* Omenix platform runtime, part 7 of 7: tooltip, global events, hash-driven states, the page API. Concatenated in file order by platform_build.py into one script. */
/* ---- tooltip (hover, focus, tap; Escape closes) ------------------------------------------------------------- */
let pinned = null;
function showTip(t, text) { const tip = $('#tip'); tip.textContent = text; tip.classList.add('on'); const r = t.getBoundingClientRect(); let left = r.left + r.width / 2 - tip.offsetWidth / 2, top = r.top - tip.offsetHeight - 8; left = Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, left)); if (top < 8) top = r.bottom + 8; tip.style.left = left + 'px'; tip.style.top = top + 'px'; }
function hideTip() { if (!pinned) $('#tip').classList.remove('on'); }

/* ---- global events ------------------------------------------------------------------------------------------ */
function closeTop() {
  if (F.menu.classList.contains('on')) return closeMenu();
  if (F.hc.classList.contains('on')) return closeHc();
  if (F.pal.classList.contains('on')) return closePal();
  if (F.keys.classList.contains('on')) return closeKeys();
  if (F.drawer.classList.contains('open')) return closeDrawer();
  if (st.wlopen) { st.wlopen = false; applySettings(); renderTabs(); }
}
function closeAll() { closeMenu(); closeHc(); closePal(); closeKeys(); closeDrawer(); }
let gPending = 0;
function bind() {
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-tip]'); if (t && !pinned && !e.target.closest('.mb-menu')) showTip(t, t.dataset.tip);
    const a = e.target.closest('a[data-inst], .tk[data-inst]');
    if (a && matchMedia('(hover: hover)').matches) { clearTimeout(hcTimer); hcTimer = setTimeout(() => openHc(a.dataset.inst, a), 350); }
  });
  document.addEventListener('pointerout', e => {
    if (e.target.closest('[data-tip]')) hideTip();
    if (e.target.closest('a[data-inst], .tk[data-inst]')) { clearTimeout(hcTimer); hcTimer = setTimeout(() => { if (!F.hc.matches(':hover') && hcAnchor && !hcAnchor.closest('.mb-wl')) closeHc(); }, 300); }
  });
  F.hc.addEventListener('pointerleave', () => { if (hcAnchor && !hcAnchor.closest('.mb-wl')) hcTimer = setTimeout(closeHc, 250); });
  F.hc.addEventListener('pointerenter', () => clearTimeout(hcTimer));
  document.addEventListener('focusin', e => { const t = e.target.closest('[data-tip]'); if (t) showTip(t, t.dataset.tip); });
  document.addEventListener('focusout', e => { if (e.target.closest('[data-tip]')) { pinned = null; hideTip(); } });
  document.addEventListener('click', e => {
    const t = e.target.closest('.md-help, span[data-tip], small[data-tip]');
    if (t) { e.preventDefault(); if (pinned === t) { pinned = null; hideTip(); } else { pinned = t; showTip(t, t.dataset.tip); } } else if (pinned) { pinned = null; hideTip(); }
    if (F.menu.classList.contains('on') && !e.target.closest('.mb-menu, [aria-haspopup="menu"], #bell, #me')) closeMenu();
    if (F.hc.classList.contains('on') && !e.target.closest('.mb-hcard, [data-inst]')) closeHc();
  });
  document.addEventListener('keydown', e => {
    const typing = e.target.closest('input, textarea, select');
    if (e.key === 'Escape') { pinned = null; hideTip(); closeTop(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPal(''); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); openPal(''); return; }
    if (e.key === '?') { e.preventDefault(); openKeys(); return; }
    if (gPending && Date.now() - gPending < 1200) { gPending = 0; const to = {h: 'dashboard', p: 'positions', o: 'orders', s: 'screener'}[e.key]; if (to) { e.preventDefault(); go(to); } return; }
    if (e.key === 'g') { gPending = Date.now(); return; }
    if (e.key === 'b' || e.key === 's') { const r = e.target.closest('[data-inst]'); if (r && tradable(item(r.dataset.inst))) { e.preventDefault(); if (tradeLock()) { snack(tradeLock()); return; } openOrder(r.dataset.inst, e.key === 'b' ? 'buy' : 'sell'); } }
  });
  addEventListener('scroll', () => $('#appbar')?.classList.toggle('scrolled', scrollY > 4), {passive: true});
  addEventListener('hashchange', () => { readHash(); closeAll(); renderAll(); openFromHash(); });
}
/* screenshot and bookmark states held in the hash */
function openFromHash() {
  if (st.drawer) openDrawer(st.drawer);
  if (st.pal) openPal(st.pal === '1' ? '' : st.pal);
  if (st.keys) openKeys();
  if (st.fly) $$('.mb-rail-fly').forEach(f => f.closest('.mb-rail-grp').querySelector('.mb-rail-item .mb-nav-label').textContent.toLowerCase() === st.fly && f.classList.add('on'));
  const anchor = id => $(`.mb-wl [data-inst="${id}"]`) && getComputedStyle($('.mb-wl')).display !== 'none' ? $(`.mb-wl [data-inst="${id}"]`) : $(`#page [data-inst="${id}"]`);
  if (st.hc) { const id = st.hc; const a = anchor(id); if (a) { a.classList.add('open'); openHc(id, a); } }
  if (st.menu) { const id = st.menu; const a = anchor(id); if (a) { a.classList.add('open'); const b = a.querySelector('[aria-haspopup="menu"]'); openMenu(id, b && b.offsetParent ? b : a); } }
  if (st.notif) openNotif($('#bell'));
}

/* ---- the page API ------------------------------------------------------------------------------------------- */
function pagehead({crumbs = [], title, meta = [], actions = []}) {
  return el('div', {class: 'mb-pagehead'},
    el('ol', {class: 'mb-crumbs', 'aria-label': 'Breadcrumb'}, ...crumbs.map(([label, href], i) => el('li', {}, i === crumbs.length - 1 ? el('span', {'aria-current': 'page'}, label) : el('a', {href: href || '#'}, label)))),
    el('div', {style: 'min-width:0'}, el('h1', {}, title)), el('div', {class: 'mb-pagehead-meta'}, ...meta), el('div', {class: 'mb-pagehead-actions'}, ...actions));
}
const inst = (id, text) => { const it = item(id); return el('a', {class: 'tk', href: '#', 'data-inst': id, onclick: e => { e.preventDefault(); openDrawer('quick:' + id); }}, text || (it ? it.sym : id)); };
function ctx() { return {m: st.m, P: P(), S, st, cur: cur(), el, icon, svgEl, help, num, money, sgn, dir, delta, moneyDelta, when, dateShort, nowLabel, asOf, asOfEl, item, inst, isFno, paperTag, mockTag, pagehead, openOrder, openDrawer, openPal, openKeys, openHc, openMenu, go, snack, screen, bsPair, market, tradeLock, tradable, apBadge, signalsBody, rerender: renderAll}; }
function mount(cfg) { page = cfg; frame(); readHash(); renderAll(); bind(); openFromHash(); }
return {mount, el, icon, svgEl, money, num, sgn, delta, P, st};
})();
