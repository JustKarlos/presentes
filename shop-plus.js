/* Tienda v2 (complemento). Cargalo al final de index.html, DESPUÉS del script principal:
   <link rel="stylesheet" href="tienda-admin/shop-plus.css">   (después del <style>)
   <script src="tienda-admin/shop-plus.js"></script>          (antes de </body>)
   Reemplaza el modal de la tienda y suma: marcos/fondos con imagen, búsqueda, orden, filtros, vista previa en tu perfil y confirmación de compra. */
(() => {
  // carga sola el CSS que está junto a este script (si no lo pusiste a mano) y deja una marca para comprobar que se cargó
  const me_ = document.currentScript;
  if (me_ && !document.querySelector('link[href*="shop-plus.css"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = me_.src.replace(/\.js(\?.*)?$/, '.css$1'); document.head.append(l); }
  document.documentElement.dataset.shopPlus = '2'; console.info('[tienda v2] activa');
  const ST = {type: 'all', q: '', sort: 'new', mine: false, afford: false, sel: null, confirm: null, busy: false};
  const root = document.querySelector('#shopModal .card');
  root.classList.add('sp');
  root.innerHTML = `
    <button id="shopClose" class="close" aria-label="Cerrar">&times;</button>
    <h2 id="shopTitle" class="shoptitle">Tienda de cosméticos</h2>
    <div id="shopWallet"></div><div id="spEq" class="sp-eq"></div>
    <div class="sp-tools">
      <div class="chips" id="spTabs"><button class="chip" data-t="all">Todos</button><button class="chip" data-t="frame">Marcos</button><button class="chip" data-t="name_effect">Nombres</button><button class="chip" data-t="background">Fondos</button></div>
      <label class="search"><span class="sr">Buscar objeto</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="spQ" type="search" placeholder="Buscar objeto…" autocomplete="off"></label>
      <select id="spSort" class="sp-sel" aria-label="Ordenar por"><option value="new">Novedades</option><option value="asc">Precio: menor</option><option value="desc">Precio: mayor</option><option value="name">Nombre</option></select>
    </div>
    <div class="chips"><button class="chip" id="spMine">Míos</button><button class="chip" id="spAfford">Puedo comprar</button></div>
    <p id="shopMsg" class="shopmsg" role="status"></p>
    <div class="sp-body"><div id="shopGrid" class="shopgrid"></div><aside id="spPrev" class="sp-prev"></aside></div>`;

  const me = () => wallet ? {username: wallet.username, display_name: wallet.display_name, avatar_url: wallet.avatar_url} : {username: 'tu', display_name: 'Tu nombre', avatar_url: null};
  const cat = () => [...COS.values()].filter(c => c.active);
  const own = c => !!wallet?.owned?.includes(c.id), eqd = c => !!wallet && wallet.equipped?.[c.type] === c.id;
  const isNew = c => c.meta?.new || (c.created_at && Date.now() - new Date(c.created_at) < 10 * 864e5);
  const RL = ['Común', 'Raro', 'Épico', 'Legendario'];
  const tiers = () => { const cs = cat().map(c => c.cost).sort((a, b) => a - b), q = p => cs[Math.min(cs.length - 1, Math.floor(cs.length * p))] ?? 0; return [q(.4), q(.7), q(.9)]; };
  const rar = (c, t) => c.cost >= t[2] && t[2] > t[0] ? 3 : c.cost >= t[1] && t[1] > t[0] ? 2 : c.cost > t[0] ? 1 : 0;
  const bgSt = c => c.url ? `background-image:url('${esc(c.url)}');background-size:cover;background-position:center bottom;image-rendering:pixelated` : '';
  const btn = (a, t, c, cls = '') => `<button class="btn ${cls}" data-act="${a}" data-id="${esc(c?.id || '')}" data-type="${c?.type || ''}">${t}</button>`;
  const msg = (t, ok = true) => { const m = $('shopMsg'); m.style.color = ok ? '' : '#ff8a6a'; m.textContent = t; clearTimeout(msg.t); msg.t = setTimeout(() => m.textContent = '', 4500); };

  const tile = (c, u) => c.type === 'frame' ? avatarF({...u, frame_id: c.id}, 56)
    : c.type === 'name_effect' ? `<span style="font-size:1.5rem;font-family:var(--display);font-weight:700">${nameHtml({...u, name_id: c.id})}</span>`
    : `<div class="swatch ${c.css}" style="${bgSt(c)}"></div>`;
  function mini(c) {                                         // tu perfil con el objeto puesto
    const e = wallet?.equipped || {}, pick = t => c && c.type === t ? c.id : e[t], u = {...me(), frame_id: pick('frame'), name_id: pick('name_effect')}, bg = COS.get(pick('background'));
    const cls = bg ? bg.css + (bg.url ? ' pb-img' + (bg.meta?.border ? ' pb-own' : '') : '') : '', st = bg?.url ? ` style="--pbimg:url('${esc(bg.url)}');--pbdim:${bg.meta?.dim ?? .15}"` : '';
    return `<div class="card sp-mini ${cls}"${st}><div class="mh">${avatarF(u, 64)}<div><h2>${nameHtml(u)}</h2><p>Vista previa</p></div></div><div class="pair"><div><span>XP total</span><b>${nf(wallet?.xp || 0)}</b></div><div><span>Puesto en XP</span><b>#1</b></div></div></div>`;
  }
  function primary(c) {
    if (!sess) return btn('login', 'Comprar', c);
    if (!wallet) return '<button class="btn" disabled>Comprar</button>';
    if (eqd(c)) return btn('unequip', 'Quitar', c, 'ghost');
    if (own(c)) return btn('equip', 'Equipar', c);
    const s = c.cost - wallet.balance;
    return s > 0 ? `<button class="btn" disabled>Faltan ${nf(s)} XP</button>` : btn('buy', 'Comprar', c);
  }
  function list() {
    let l = cat(); const q = ST.q.trim().toLowerCase();
    if (ST.type !== 'all') l = l.filter(c => c.type === ST.type);
    if (q) l = l.filter(c => `${c.name} ${c.description || ''} ${c.meta?.collection || ''}`.toLowerCase().includes(q));
    if (ST.mine) l = l.filter(own);
    if (ST.afford && wallet) l = l.filter(c => !own(c) && c.cost <= wallet.balance);
    const by = {new: (a, b) => (new Date(b.created_at || 0) - new Date(a.created_at || 0)) || a.sort - b.sort, asc: (a, b) => a.cost - b.cost, desc: (a, b) => b.cost - a.cost, name: (a, b) => a.name.localeCompare(b.name)};
    return l.sort(by[ST.sort]);
  }
  function renderGrid() {
    const t = tiers(), u = me();
    $('shopGrid').innerHTML = !COS.size ? '<div class="item sp-sk"></div>'.repeat(6)
      : list().map(c => `<div class="item sp-item r${rar(c, t)}${eqd(c) ? ' eq' : ''}${ST.sel === c.id ? ' sel' : ''}" data-sel="${esc(c.id)}">${isNew(c) ? '<span class="sp-new">Nuevo</span>' : ''}
          <div class="prev">${tile(c, u)}</div><b class="in">${esc(c.name)}</b><small>${esc(c.description || '')}</small>
          <div class="ibot"><span class="cost">${own(c) ? (eqd(c) ? '<span class="badge-eq">Equipado</span>' : 'Tuyo') : nf(c.cost) + ' XP'}</span>${primary(c)}</div></div>`).join('')
        || '<p class="empty" style="grid-column:1/-1">No hay objetos con esos filtros.</p>';
  }
  function renderPrev() {
    const c = ST.sel && COS.get(ST.sel), t = tiers(), p = $('spPrev'); p.classList.toggle('empty', !c);
    p.innerHTML = mini(c) + (!c ? '<small class="sp-hint">Elegí un objeto para verlo en tu perfil.</small>' : `<div><b class="in">${esc(c.name)}</b> <span class="sp-rar r${rar(c, t)}">${RL[rar(c, t)]}</span><small style="display:block;color:var(--tan)">${esc(c.description || '')}</small></div>`
      + (ST.confirm === c.id && wallet ? `<div class="sp-conf"><p>¿Comprar <b>${esc(c.name)}</b> por ${nf(c.cost)} XP? Te quedarán ${nf(wallet.balance - c.cost)} XP.</p><div class="acts">${btn('confirm', 'Confirmar', c)}${btn('cancel', 'Cancelar', c, 'ghost')}</div></div>`
        : `<div class="ibot"><span class="cost">${own(c) ? 'Tuyo' : nf(c.cost) + ' XP'}</span>${primary(c)}</div>`));
  }
  function render() {
    $('shopWallet').innerHTML = !sess ? `<div class="wallet"><span>Inicia sesión con tu cuenta de Kick para comprar y equipar.</span><a class="btn" href="${FN_URL}/login/start">Iniciar sesión con Kick</a></div>`
      : wallet ? `<div class="wallet"><span style="display:flex;align-items:center;gap:.5rem">${avatarF(wallet, 28)}<b>${esc(wallet.display_name)}</b></span><span class="bal">${nf(wallet.balance)} XP disponibles</span><button class="btn ghost" id="logoutBtn">Cerrar sesión</button><small>XP total ganada: ${nf(wallet.xp)} · gastada: ${nf(wallet.xp_spent)}. Gastar XP no baja tu nivel.</small></div>`
      : `<div class="wallet"><span>Sesión de <b>${esc(sess.user)}</b>: todavía no estás en el ranking. Escribe en el chat durante un directo.</span><button class="btn ghost" id="logoutBtn">Cerrar sesión</button></div>`;
    $('spEq').hidden = !wallet;
    $('spEq').innerHTML = [['frame', 'Marco'], ['name_effect', 'Nombre'], ['background', 'Fondo']].map(([t, l]) => { const c = wallet && COS.get(wallet.equipped?.[t]);
      return `<div class="sp-slot"><div><small>${l}</small><b>${c ? esc(c.name) : '—'}</b></div>${c ? `<button data-act="unequip" data-type="${t}" aria-label="Quitar ${l}">&times;</button>` : ''}</div>`; }).join('');
    document.querySelectorAll('#spTabs .chip').forEach(b => b.classList.toggle('on', b.dataset.t === ST.type));
    $('spMine').classList.toggle('on', ST.mine); $('spAfford').classList.toggle('on', ST.afford);
    renderGrid(); renderPrev();
  }
  async function act(a, id, type) {
    if (ST.busy) return;
    if (a === 'login') { location.href = FN_URL + '/login/start'; return; }
    if (a === 'buy') { ST.sel = id; ST.confirm = id; return render(); }
    if (a === 'cancel') { ST.confirm = null; return render(); }
    ST.busy = true;
    const res = a === 'confirm' ? await shopApi('/shop/buy', {cosmetic_id: id}) : a === 'equip' ? await shopApi('/shop/equip', {cosmetic_id: id}) : await shopApi('/shop/unequip', {type});
    ST.busy = false; ST.confirm = null;
    msg(res.ok ? (a === 'confirm' ? '¡Compra realizada! Ya podés equiparlo.' : a === 'equip' ? 'Objeto equipado.' : 'Objeto quitado.') : (MSG[res.reason] || MSG.error), !!res.ok);
    await loadWallet(); render(); if (res.ok) { loadBoard(); loadFeed(); }
  }
  root.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'), t = e.target.closest('#spTabs .chip'), it = e.target.closest('[data-sel]');
    if (e.target.id === 'logoutBtn') return logout(true);
    if (t) { ST.type = t.dataset.t; return render(); }
    if (e.target.id === 'spMine') { ST.mine = !ST.mine; return render(); }
    if (e.target.id === 'spAfford') { ST.afford = !ST.afford; return render(); }
    if (a) { e.stopPropagation(); return act(a.dataset.act, a.dataset.id, a.dataset.type); }
    if (it) { ST.sel = it.dataset.sel; ST.confirm = null; render(); }
  });
  root.addEventListener('input', e => { if (e.target.id === 'spQ') { ST.q = e.target.value; renderGrid(); } });
  root.addEventListener('change', e => { if (e.target.id === 'spSort') { ST.sort = e.target.value; render(); } });

  // ---- marcos con imagen (asset_url) en todo el sitio ----
  window.avatarF = (u, size) => {
    const id = u.frame_id ?? u.equipped_frame_id ?? u.equipped?.frame, c = id && COS.get(id);
    if (!c) return avatar(u, size);
    const cls = ['frame', c.css, c.url ? 'fr-img' : '', size < 60 ? 'sm' : ''].filter(Boolean).join(' ');
    const st = c.url ? ` style="--fi:url('${esc(c.url)}');--fin:${Number(c.meta?.inset) || -35.7}%"` : '';
    return `<span class="${cls}"${st}>${avatar(u, size)}</span>`;
  };
  // ---- fondos con imagen en el perfil ----
  let lastU = null; const _rpc = window.rpc, _open = window.openProfile;
  window.rpc = async (fn, a) => { const r = await _rpc(fn, a); if (fn === 'get_user_stats' && r) lastU = r; return r; };
  window.openProfile = async (raw) => {
    const ok = await _open(raw), bg = ok && lastU?.background_id && COS.get(lastU.background_id);
    if (bg?.url) { const card = $('modal').querySelector('.card'); card.style.removeProperty('background-image'); card.classList.add('pb-img'); if (bg.meta?.border) card.classList.add('pb-own');
      card.style.setProperty('--pbimg', `url("${bg.url}")`); card.style.setProperty('--pbdim', bg.meta?.dim ?? .15); }
    return ok;
  };
  window.renderShop = render;
  window.openShop = async () => {
    $('shopModal').classList.add('open'); $('shopClose').focus(); msg(''); ST.sel = null; ST.confirm = null; render();
    await loadCosmetics(); if (sess) { const ok = await shopApi('/shop/session'); if (ok.ok) await loadWallet(); }
    render();
  };
  $('shopBtn').onclick = window.openShop; $('shopClose').onclick = closeShop;
})();
