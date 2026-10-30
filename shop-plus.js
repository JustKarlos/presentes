/* Tienda v2 (complemento). Cargalo al final de index.html, DESPUÉS del script principal:
   <link rel="stylesheet" href="tienda-admin/shop-plus.css">   (después del <style>)
   <script src="tienda-admin/shop-plus.js"></script>          (antes de </body>)
   Reemplaza el modal de la tienda y suma: marcos/fondos con imagen, búsqueda, orden, filtros, vista previa en tu perfil y confirmación de compra. */
(() => {
  // el CSS viaja dentro de este archivo y se agrega al final del <head>, así siempre gana a las reglas de index.html
  if (!document.getElementById('sp-css')) { const st = document.createElement('style'); st.id = 'sp-css'; st.textContent = `/* Tienda v2 + soporte de marcos y fondos con imagen. Cargalo DESPUÉS del <style> de index.html. */
.frame.fr-img::after{inset:var(--fin,-35.7%);background-image:var(--fi);background-size:100% 100%;animation:none}
.modal .card.pb-img{border-color:transparent;image-rendering:pixelated;background-color:#0a0a12;background-size:cover;background-position:center bottom;background-repeat:no-repeat;
  background-image:linear-gradient(rgba(0,0,0,var(--pbdim,.15)),rgba(0,0,0,var(--pbdim,.15))),var(--pbimg)}
.modal .card.pb-img.pb-own{border-image:none;background-clip:border-box;background-origin:border-box}
.shopcard.sp{max-width:1040px}
.sp-eq{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem;margin-bottom:.4rem}
.sp-slot{display:flex;align-items:center;gap:.4rem;padding:.3rem .6rem;background:#1a1c1a;border:2px solid var(--rim);border-radius:10px;min-width:0}
.sp-slot>div{min-width:0}.sp-slot small{display:block;color:var(--tan);font-size:.7rem;line-height:1}
.sp-slot b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.9rem}
.sp-slot button{margin-left:auto;font-size:1.3rem;line-height:1;color:var(--tan)}.sp-slot button:hover{color:#fff}
.sp-tools{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:.5rem 0}
.sp-tools .search{min-width:150px}
.sp-sel{background:#1a1c1a;border:2px solid var(--rim);border-radius:999px;color:var(--cream);padding:.3rem .8rem;font:inherit;text-shadow:none}
.sp-body{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:.8rem;align-items:start}
.sp-prev{position:sticky;top:0;display:grid;gap:.5rem;padding:.6rem;background:#1a1c1a;border:2px solid var(--rim);border-radius:12px}
.sp-prev .sp-mini{max-width:none;min-height:150px}
.sp-hint{color:var(--tan);font-size:.8rem}
.sp-item{position:relative;cursor:pointer;transition:transform .15s}.sp-item:hover{transform:translateY(-2px)}
.sp-item.sel{outline:3px solid var(--gold);outline-offset:1px}
.sp-item.r1{border-color:#4aa0e0}.sp-item.r2{border-color:#b46bff}.sp-item.r3{border-color:var(--gold)}
.sp-rar{font-size:.7rem;padding:0 .4rem;border-radius:5px;background:#353934;color:var(--tan)}
.sp-rar.r1{background:#1d4a7a;color:#bfe3ff}.sp-rar.r2{background:#4a2a7a;color:#e0ccff}.sp-rar.r3{background:#7a5a0a;color:#fff0a0}
.sp-new{position:absolute;top:.35rem;right:.35rem;z-index:2;font-size:.65rem;font-weight:800;color:#0f2a08;background:#7fe044;border-radius:5px;padding:0 .4rem}
.sp-sk{min-height:190px;background:linear-gradient(100deg,#1a1c1a 30%,#262926 50%,#1a1c1a 70%) 0 0/200% 100%;animation:spsk 1.2s linear infinite}
@keyframes spsk{to{background-position:-200% 0}}
.sp-conf p{font-size:.85rem;margin-bottom:.4rem}.sp-conf .acts{display:flex;gap:.4rem}
@media (max-width:760px){.sp-body{grid-template-columns:1fr}.sp-eq{grid-template-columns:1fr}
  .sp-prev{position:fixed;left:.5rem;right:.5rem;bottom:.5rem;z-index:70;max-height:56vh;overflow:auto;box-shadow:0 0 30px #000}.sp-prev.empty{display:none}}
@media (prefers-reduced-motion:reduce){.sp-sk{animation:none}.sp-item{transition:none}}

.sp-item .prev{overflow:visible;min-height:120px}
.sp-new.sp-ret{background:#8a7650;color:#fff}

/* Visor de prueba */
.sp-item.tried{box-shadow:inset 0 0 0 2px var(--leaf)}
.sp-try{width:100%;font-size:.9rem}.sp-try[aria-pressed=true]{border-color:#4be01a;color:#7dff4a}
.sp-prev{max-height:calc(100vh - 2rem);overflow:auto}
.sp-vh{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center}.sp-vt{display:flex;gap:.3rem}
.sp-lv{display:grid;gap:.1rem;font-size:.8rem;color:var(--tan)}.sp-lv input{accent-color:#53fc18;width:100%}
.sp-who input{width:100%;background:#181a18;border:2px solid var(--rim);border-radius:8px;color:var(--cream);padding:.3rem .6rem;font:inherit;text-shadow:none}
.sp-tried,.sp-buys{display:grid;gap:.3rem}.sp-cost{font-size:.85rem}
.sp-chat{background:#0b0e0f;border-radius:8px;padding:.6rem;display:grid;gap:.35rem;font-family:system-ui,sans-serif;font-size:.85rem;font-weight:700;text-shadow:none;color:#e6e6e6}
.sp-chat .cl{display:flex;align-items:center;gap:.3rem;flex-wrap:wrap}.sp-chat small{color:#6b7370;font-weight:600}
.sp-pod{display:grid;justify-items:center;gap:.2rem;padding:1.6rem 0 .6rem;background:#161816;border-radius:8px;margin-bottom:.4rem}
.sp-det{border-top:1px solid var(--line);padding-top:.4rem;display:grid;gap:.3rem}
.sp-paused,.sp-paused *,.sp-paused *::after{animation-play-state:paused!important}
.sp-foldbtn{display:none}
@media (max-width:760px){.sp-foldbtn{display:inline-flex}.sp-prev.fold>*:not(.sp-vh){display:none}.sp-prev{max-height:56vh}}
`; document.head.append(st); }
  document.documentElement.dataset.shopPlus = '2'; console.info('[tienda v2] activa');
  const ST = {type: 'all', q: '', sort: 'new', mine: false, afford: false, sel: null, confirm: null, busy: false,
    try: {frame: null, name_effect: null, background: null}, tryUser: null, view: 'profile', lvl: null, pause: false, fold: false};
  const root = document.querySelector('#shopModal .card');
  root.classList.add('sp');
  root.innerHTML = `
    <button id="shopClose" class="close" aria-label="Cerrar">&times;</button>
    <h2 id="shopTitle" class="shoptitle">Tienda de cosméticos <small style="font-size:.9rem;color:var(--tan)">v2</small></h2>
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
  const cat = () => [...COS.values()].filter(c => c.active);                       // a la venta
  const visible = () => [...COS.values()].filter(c => c.active || own(c));        // a la venta + los tuyos aunque ya no se vendan
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
    let l = visible(); const q = ST.q.trim().toLowerCase();
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
      : list().map(c => `<div class="item sp-item r${rar(c, t)}${eqd(c) ? ' eq' : ''}${ST.sel === c.id ? ' sel' : ''}${tried(c.id) ? ' tried' : ''}" data-sel="${esc(c.id)}">${!c.active ? '<span class="sp-new sp-ret">Retirado</span>' : isNew(c) ? '<span class="sp-new">Nuevo</span>' : ''}
          <div class="prev">${tile(c, u)}</div><b class="in">${esc(c.name)}</b><small>${esc(c.description || '')}</small>
          <button type="button" class="btn ghost sp-try" data-try="${esc(c.id)}" aria-pressed="${tried(c.id)}">${tried(c.id) ? 'Probando' : 'Probar'}</button>
          <div class="ibot"><span class="cost">${own(c) ? (eqd(c) ? '<span class="badge-eq">Equipado</span>' : 'Tuyo') : nf(c.cost) + ' XP'}</span>${primary(c)}</div></div>`).join('')
        || '<p class="empty" style="grid-column:1/-1">No hay objetos con esos filtros.</p>';
  }
  // ---- visor de prueba: 100 % cliente, no llama a /shop/* hasta confirmar una compra ----
  const TL = {frame: 'Marco', name_effect: 'Nombre', background: 'Fondo'};
  const lvOf = xp => Math.floor(Math.pow(Math.max(Number(xp) || 0, 0) / 100, 1 / 1.5));
  const baseU = () => ST.tryUser || me();
  const baseLv = () => ST.tryUser ? (Number(ST.tryUser.level) || 0) : wallet ? lvOf(wallet.xp) : 5;
  const curLv = () => ST.lvl ?? baseLv();
  const pickT = t => ST.try[t] || (ST.tryUser ? '' : wallet?.equipped?.[t] || '');
  const tried = id => Object.values(ST.try).includes(id);
  const triedList = () => ['frame', 'name_effect', 'background'].map(t => COS.get(ST.try[t])).filter(Boolean);
  function stageHtml() {
    const u = {...baseU(), frame_id: pickT('frame') || '', name_id: pickT('name_effect') || ''}, l = curLv(), title = rankOf(l)[1];
    if (ST.view === 'chat') return `<div class="sp-chat" aria-label="Vista previa en el chat"><div class="cl"><small>12:34</small>${sprite(rankKey(l), 18)}<b>${nameHtml(u)}</b><span>:</span><span style="font-weight:600">¡Qué buen directo, vamos!</span></div><div class="cl"><small>12:34</small><b style="color:#7fb4ff">viewer123</b><span>:</span><span style="font-weight:600">jajaja GG</span></div></div>`;
    const xp = ST.tryUser?.xp ?? wallet?.xp ?? 1234;
    if (ST.view === 'rank') return `<div class="sp-pod" aria-label="Vista previa del podio">${avatarF(u, 72)}<span class="nm" style="font-family:var(--display);font-size:1.2rem">${nameHtml(u)}</span><span class="cost">${nf(xp)} XP</span></div>
      <div class="row" style="padding:.4rem .2rem"><span class="rk">1</span>${avatarF(u, 40)}<span class="info"><b>${nameHtml(u)}<span class="lvl">Nv. ${l}</span></b><small class="rk2">${sprite(rankKey(l), 14)}<span>${esc(title)} · ahora mismo</span></small></span><span class="total">${nf(xp)} XP</span></div>`;
    const bg = COS.get(pickT('background')), cls = bg ? bg.css + (bg.url ? ' pb-img' + (bg.meta?.border ? ' pb-own' : '') : '') : '', st = bg?.url ? ` style="--pbimg:url('${esc(bg.url)}');--pbdim:${bg.meta?.dim ?? .15}"` : '';
    return `<div class="card sp-mini ${cls}"${st}><div class="mh">${avatarF(u, 64)}<div><h2>${nameHtml(u)}</h2><p>@${esc(u.username)} · Nv. ${l}</p></div></div><div class="rankrow">${sprite(rankKey(l), 28)}<b>${esc(title)}</b></div><div class="pair"><div><span>XP total</span><b>${nf(xp)}</b></div><div><span>Puesto en XP</span><b>#1</b></div></div></div>`;
  }
  const stage = () => { const e = $('spStage'); if (e) e.innerHTML = stageHtml(); };
  function renderPrev() {
    const p = $('spPrev'), sel = ST.sel && COS.get(ST.sel), t = tiers(), list = triedList(), buys = list.filter(c => !own(c)), total = buys.reduce((s, c) => s + c.cost, 0);
    const a = document.activeElement, key = a && p.contains(a) ? (a.dataset.view ? `[data-view="${a.dataset.view}"]` : a.dataset.pv ? `[data-pv="${a.dataset.pv}"]${a.dataset.type ? `[data-type="${a.dataset.type}"]` : ''}` : '') : '';
    p.classList.toggle('empty', !list.length && !sel && !ST.tryUser); p.classList.toggle('fold', ST.fold); p.classList.toggle('sp-paused', ST.pause);
    p.innerHTML = `<div class="sp-vh"><div class="sp-vt" role="group" aria-label="Vista">${[['profile', 'Perfil'], ['chat', 'Chat'], ['rank', 'Ranking']].map(([v, l]) => `<button type="button" class="chip${ST.view === v ? ' on' : ''}" data-view="${v}" aria-pressed="${ST.view === v}">${l}</button>`).join('')}</div>
        <button type="button" class="chip" data-pv="pause" aria-pressed="${ST.pause}">${ST.pause ? 'Reanudar animaciones' : 'Pausar animaciones'}</button>
        <button type="button" class="chip sp-foldbtn" data-pv="fold" aria-expanded="${!ST.fold}">${ST.fold ? 'Mostrar visor' : 'Plegar'}</button></div>
      <div id="spStage">${stageHtml()}</div>
      <label class="sp-lv"><span>Nivel: <output id="spLvO">${curLv()}</output></span><input id="spLv" type="range" min="0" max="60" value="${curLv()}"></label>
      <div class="sp-who"><label><span class="sr">Probar con otro usuario de Kick</span><input id="spWho" type="search" placeholder="Probar con otro usuario de Kick…" autocomplete="off"></label>${ST.tryUser ? `<small class="sp-hint">Probando con @${esc(ST.tryUser.username)} <button type="button" class="chip" data-pv="me">Usar el mío</button></small>` : ''}</div>
      <div class="sp-tried">${['frame', 'name_effect', 'background'].map(k => { const c = COS.get(ST.try[k]); return `<div class="sp-slot"><div><small>${TL[k]} a probar</small><b>${c ? esc(c.name) : '—'}</b></div>${c ? `<button type="button" data-pv="rm" data-type="${k}" aria-label="Quitar prueba de ${TL[k]}">&times;</button>` : ''}</div>`; }).join('')}</div>
      ${list.length ? `<div class="sp-cost"><b>Total de lo probado: ${nf(total)} XP</b>${wallet && total ? ` · te faltan ${nf(Math.max(0, total - wallet.balance))} XP` : ''}</div>
        <div class="sp-buys">${buys.map(c => `<div class="ibot"><span>${esc(c.name)} · <span class="cost">${nf(c.cost)} XP</span></span>${primary(c)}</div>`).join('')}</div>
        <button type="button" class="btn ghost" data-pv="clear">Limpiar todo</button>` : '<small class="sp-hint">Pulsa «Probar» en cualquier objeto para verlo con tu nombre y avatar en el perfil, el chat y el ranking.</small>'}
      ${sel ? `<div class="sp-det"><div><b class="in">${esc(sel.name)}</b> <span class="sp-rar r${rar(sel, t)}">${RL[rar(sel, t)]}</span><small style="display:block;color:var(--tan)">${esc(sel.description || '')}</small></div><div class="ibot"><span class="cost">${own(sel) ? 'Tuyo' : nf(sel.cost) + ' XP'}</span>${primary(sel)}</div></div>` : ''}`;
    if (key) p.querySelector(key)?.focus();
  }
  function markTry() {
    document.querySelectorAll('#shopGrid .sp-item').forEach(el => { const on = tried(el.dataset.sel), b = el.querySelector('.sp-try'); el.classList.toggle('tried', on); if (b) { b.setAttribute('aria-pressed', on); b.textContent = on ? 'Probando' : 'Probar'; } });
  }
  function toggleTry(id) { const c = COS.get(id); if (!c || !(c.type in ST.try)) return; ST.try[c.type] = ST.try[c.type] === id ? null : id; markTry(); renderPrev(); }
  function pvAct(a, type) {
    if (a === 'pause') ST.pause = !ST.pause;
    else if (a === 'fold') ST.fold = !ST.fold;
    else if (a === 'rm') ST.try[type] = null;
    else if (a === 'clear') ST.try = {frame: null, name_effect: null, background: null};
    else if (a === 'me') { ST.tryUser = null; ST.lvl = null; }
    markTry(); renderPrev();
  }
  async function setWho(raw) {
    const name = normUser(raw); if (!name) return;
    const u = await rpc('get_user_stats', {p_username: name});
    if (!u) return msg(`No encontramos a «${raw.trim()}». Prueba con el nombre de usuario exacto.`, false);
    ST.tryUser = u; ST.lvl = null; renderPrev();
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
    if (a === 'cancel') { ST.confirm = null; return render(); }
    if (a === 'buy') {                                         // confirmación nativa: imposible de pasar por alto
      const c = COS.get(id); if (!c || !wallet) return; ST.sel = id;
      if (!confirm(`¿Comprar "${c.name}" por ${nf(c.cost)} XP?\nTe quedarán ${nf(wallet.balance - c.cost)} XP.`)) return render();
      a = 'confirm';
    }
    ST.busy = true; let res;
    try { res = a === 'confirm' ? await shopApi('/shop/buy', {cosmetic_id: id}) : a === 'equip' ? await shopApi('/shop/equip', {cosmetic_id: id}) : await shopApi('/shop/unequip', {type}); }
    catch (err) { console.error('[tienda v2]', err); res = {ok: false, reason: 'error'}; }
    ST.busy = false; ST.confirm = null;
    if (!res.ok) console.warn('[tienda v2] el servidor respondió:', res);
    msg(res.ok ? (a === 'confirm' ? '¡Compra realizada! Ya podés equiparlo.' : a === 'equip' ? 'Objeto equipado.' : 'Objeto quitado.') : (MSG[res.reason] || `No se pudo completar (${res.reason || res.error || res.message || 'error'}).`), !!res.ok);
    try { await loadWallet(); } catch (err) { console.error(err); }
    render(); if (res.ok) { loadBoard(); loadFeed(); }
  }
  root.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'), t = e.target.closest('#spTabs .chip'), it = e.target.closest('[data-sel]');
    if (e.target.id === 'logoutBtn') return logout(true);
    const tr = e.target.closest('[data-try]'); if (tr) { e.stopPropagation(); return toggleTry(tr.dataset.try); }
    const vw = e.target.closest('[data-view]'); if (vw) { ST.view = vw.dataset.view; return renderPrev(); }
    const pv = e.target.closest('[data-pv]'); if (pv) return pvAct(pv.dataset.pv, pv.dataset.type);
    if (t) { ST.type = t.dataset.t; return render(); }
    if (e.target.id === 'spMine') { ST.mine = !ST.mine; return render(); }
    if (e.target.id === 'spAfford') { ST.afford = !ST.afford; return render(); }
    if (a) { e.stopPropagation(); return act(a.dataset.act, a.dataset.id, a.dataset.type); }
    if (it) { ST.sel = it.dataset.sel; document.querySelectorAll('#shopGrid .sp-item').forEach(x => x.classList.toggle('sel', x.dataset.sel === ST.sel)); renderPrev(); }
  });
  root.addEventListener('input', e => {
    if (e.target.id === 'spQ') { ST.q = e.target.value; renderGrid(); }
    if (e.target.id === 'spLv') { ST.lvl = +e.target.value; $('spLvO').textContent = ST.lvl; stage(); }
  });
  root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'spWho') { e.preventDefault(); setWho(e.target.value); } });
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
    typeof modalOn === 'function' ? modalOn($('shopModal')) : $('shopModal').classList.add('open'); $('shopClose').focus(); msg(''); ST.sel = null; ST.confirm = null; ST.try = {frame: null, name_effect: null, background: null}; ST.tryUser = null; ST.lvl = null; render();
    await loadCosmetics(); if (sess) { const ok = await shopApi('/shop/session'); if (ok.ok) await loadWallet(); }
    render();
  };
  $('shopBtn').onclick = window.openShop; $('shopClose').onclick = closeShop;
})();
