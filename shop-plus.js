/* Tienda v3 (complemento). Cargalo al final de index.html, DESPUÉS del script principal.
   Reemplaza el modal de la tienda con una UI más clara: catálogo con jerarquía, vista previa organizada y acciones explícitas. */
(() => {
  if (!document.getElementById('sp-css')) { const st = document.createElement('style'); st.id = 'sp-css'; st.textContent = `/* Tienda v3 + soporte de marcos y fondos con imagen */
.frame.fr-img::after{inset:var(--fin,-35.7%);background-image:var(--fi);background-size:100% 100%;animation:none}
.modal .card.pb-img{border-color:transparent;image-rendering:pixelated;background-color:#241b12;background-size:cover;background-position:center bottom;background-repeat:no-repeat;
  background-image:linear-gradient(rgba(0,0,0,var(--pbdim,.15)),rgba(0,0,0,var(--pbdim,.15))),var(--pbimg)}
.modal .card.pb-img.pb-own{border-image:none;background-clip:border-box;background-origin:border-box}

.shopcard.sp{max-width:min(1240px,96vw)}
.sp-head{display:grid;gap:.45rem;margin-bottom:.35rem}
.sp-head-top{display:flex;flex-wrap:wrap;align-items:flex-start;gap:.5rem .9rem}
.sp-head .shoptitle{margin:0;flex:none}
.sp-wallet-wrap{flex:1 1 360px;min-width:0}
.sp-wallet{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .8rem;margin:0;padding:.5rem .7rem}
.sp-wallet-id{display:flex;align-items:center;gap:.5rem;min-width:0}
.sp-wallet-id b,.sp-wallet b{display:block;line-height:1.1}
.sp-wallet small{display:block;color:var(--tan);font-size:.74rem;line-height:1.25}
.sp-wallet-bal{margin-left:auto;text-align:right}
.sp-wallet-bal .bal{display:block;font-family:var(--display);font-weight:700;font-size:1.45rem;color:var(--gold);text-shadow:var(--ol);line-height:1}
.sp-wallet .btn{margin-left:0}
.sp-eq{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem}
.sp-slot{display:flex;align-items:center;gap:.45rem;padding:.35rem .6rem;background:#241b12;border:2px solid var(--rim);border-radius:10px;min-width:0}
.sp-slot.on{border-color:#4a6b3f}
.sp-slot>div{min-width:0}.sp-slot small{display:block;color:var(--tan);font-size:.7rem;line-height:1}
.sp-slot b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.92rem}
.sp-slot button{margin-left:auto;font-size:1.3rem;line-height:1;color:var(--tan)}.sp-slot button:hover{color:#fff}

.sp-toolbar{display:grid;gap:.4rem;margin:.25rem 0 .15rem}
.sp-tabs,.sp-filters{display:flex;flex-wrap:wrap;gap:.35rem}
.sp-tools{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center}
.sp-search{min-width:180px;flex:1 1 220px}
.sp-sel{background:#241b12;border:2px solid var(--rim);border-radius:999px;color:var(--cream);padding:.32rem .8rem;font:inherit;text-shadow:none;min-height:44px}
.shopmsg{min-height:1.2rem;margin:.15rem 0 .35rem;font-weight:800}

.sp-body{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:.8rem;align-items:start}
.sp-catalog{align-content:start}
.sp-aside{position:sticky;top:0;display:grid;gap:.55rem;padding:.65rem;background:#241b12;border:2px solid var(--rim);border-radius:12px}
.sp-aside.fold>*:not(.sp-pv-head){display:none}
.sp-pv-head{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;justify-content:space-between}
.sp-vt,.sp-pv-tools{display:flex;flex-wrap:wrap;gap:.3rem}
.sp-stage{display:grid;gap:.4rem}
.sp-stage .sp-mini{max-width:none;min-height:150px}
.sp-sec{display:grid;gap:.4rem;padding-top:.5rem;border-top:1px solid var(--line)}
.sp-sec-h{display:flex;align-items:center;justify-content:space-between;gap:.5rem}
.sp-sec-h b{font-family:var(--display);font-size:1.05rem;color:#fff}
.linkbtn{background:none;border:0;color:var(--tan);font:inherit;font-size:.82rem;cursor:pointer;text-decoration:underline}
.linkbtn:hover{color:#fff}
.sp-tried{display:grid;gap:.3rem}
.sp-trychip{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.3rem .5rem;background:#1e1710;border:1px solid var(--line);border-radius:8px}
.sp-trychip small{display:block;color:var(--tan);font-size:.7rem;line-height:1}
.sp-trychip b{display:block;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-trychip button{color:var(--tan);font-size:1.2rem;line-height:1}
.sp-summary{display:flex;flex-wrap:wrap;align-items:baseline;gap:.3rem .6rem}
.sp-summary small{color:var(--tan)}
.sp-buys{display:grid;gap:.35rem}
.sp-buyrow{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.3rem 0;border-top:1px dashed var(--line)}
.sp-buyrow small{display:block;color:var(--tan);font-size:.72rem}
.sp-sec-adv{padding-top:.45rem}
.sp-sec-adv summary{cursor:pointer;color:var(--cream);font-weight:800;list-style:none;min-height:44px;display:flex;align-items:center}
.sp-sec-adv summary::-webkit-details-marker{display:none}
.sp-sec-adv summary::before{content:"▸ ";color:var(--tan)}
.sp-sec-adv[open] summary::before{content:"▾ "}
.sp-adv-body{display:grid;gap:.5rem;margin-top:.4rem}
.sp-lv{display:grid;gap:.1rem;font-size:.82rem;color:var(--tan)}.sp-lv input{accent-color:#53fc18;width:100%;min-height:44px}
.sp-who input{width:100%;background:#221a11;border:2px solid var(--rim);border-radius:8px;color:var(--cream);padding:.35rem .6rem;font:inherit;text-shadow:none;min-height:44px}
.sp-sel-info{display:grid;gap:.25rem}
.sp-sel-actions{display:flex;flex-wrap:wrap;gap:.4rem}
.sp-hint{color:var(--tan);font-size:.8rem}
.sp-paused,.sp-paused *,.sp-paused *::after{animation-play-state:paused!important}
.sp-foldbtn{display:none}

/* Catálogo / tarjetas */
.sp-card{position:relative;cursor:pointer;display:flex;flex-direction:column;gap:.4rem;padding:.55rem;transition:transform var(--dur-press) var(--ease-out),border-color .15s ease,box-shadow .15s ease}
@media (hover:hover) and (pointer:fine){.sp-card:hover{transform:translateY(-2px);border-color:#6a563a}}
.sp-card:active{transform:scale(.985)}
.sp-card:focus-visible{outline:2px solid var(--leaf);outline-offset:2px}
.sp-card.sel{outline:3px solid var(--gold);outline-offset:1px}
.sp-card.tried{box-shadow:inset 0 0 0 2px rgba(83,252,24,.35)}
.sp-card.eq{border-color:#4be01a}
.sp-card.retired{opacity:.92}
.sp-card.r1{border-color:#4aa0e0}.sp-card.r2{border-color:#b46bff}.sp-card.r3{border-color:var(--gold)}
.sp-card.eq.r1,.sp-card.eq.r2,.sp-card.eq.r3{border-color:#4be01a}
.sp-prevbox{min-height:118px;overflow:visible;background:radial-gradient(ellipse at center,#2c2318 0%,#1e1710 70%);border:1px solid #33291c}
.sp-card-body{display:grid;gap:.15rem}
.sp-card-body .in{font-size:1.12rem;line-height:1.1}
.sp-card-body small{min-height:2.1em;line-height:1.3}
.sp-meta{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;margin-top:.1rem}
.sp-type{font-size:.7rem;color:var(--tan)}
.sp-badge{font-size:.68rem;font-weight:800;border-radius:5px;padding:.05rem .4rem}
.sp-badge-eq{color:#0f2a08;background:#7fe044}
.sp-badge-own{color:var(--cream);background:#463829;border:1px solid var(--rim)}
.sp-flag{position:absolute;top:.4rem;right:.4rem;z-index:2;font-size:.64rem;font-weight:800;border-radius:5px;padding:.05rem .4rem}
.sp-newf{color:#0f2a08;background:#7fe044}
.sp-ret{color:#fff;background:#8a7650}
.sp-rar{font-size:.68rem;padding:0 .4rem;border-radius:5px;background:#3d3122;color:var(--tan)}
.sp-rar.r1{background:#1d4a7a;color:#bfe3ff}.sp-rar.r2{background:#4a2a7a;color:#e0ccff}.sp-rar.r3{background:#7a5a0a;color:#fff0a0}
.sp-card-actions{display:flex;flex-wrap:wrap;gap:.35rem}
.sp-card-actions .btn{padding:.2rem .55rem;font-size:.9rem}
.sp-try.on{border-color:#4be01a;color:#7dff4a}
.sp-card-foot{margin-top:auto;padding-top:.25rem;border-top:1px solid var(--line)}
.sp-card-foot .btn{padding:.3rem .7rem}
.sp-empty{display:grid;justify-items:center;gap:.5rem;padding:2rem 1rem;text-align:center;color:var(--tan);background:#241b12;border:2px dashed var(--rim);border-radius:12px}
.sp-tile-name{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-chat{background:#1e1710;border-radius:8px;padding:.6rem;display:grid;gap:.35rem;font-family:var(--body);font-size:.85rem;font-weight:700;text-shadow:none;color:var(--cream)}
.sp-chat .cl{display:flex;align-items:center;gap:.3rem;flex-wrap:wrap}.sp-chat small{color:#a8946a;font-weight:600}
.sp-pod{display:grid;justify-items:center;gap:.2rem;padding:1.6rem 0 .6rem;background:#1e1710;border-radius:8px}
.sp-sk{min-height:230px;background:linear-gradient(100deg,#241b12 30%,#262926 50%,#241b12 70%) 0 0/200% 100%;animation:spsk 1.2s linear infinite;border-color:var(--rim)}
@keyframes spsk{to{background-position:-200% 0}}
@keyframes sp-buy-pop{0%{transform:scale(1)}35%{transform:scale(1.12)}100%{transform:scale(1)}}
.wallet .bal.sp-pop{animation:sp-buy-pop 420ms var(--ease-out)}

/* Tamaño y scroll por columnas */
@media (min-width:761px){
  .shopcard.sp{height:min(94vh,920px);max-height:94vh;display:flex;flex-direction:column;overflow:hidden}
  .sp-body{flex:1 1 auto;min-height:340px;align-items:stretch}
  .sp-catalog{min-height:0;overflow:auto;align-content:start;padding-right:.25rem}
  .sp-aside{position:static;min-height:0;max-height:none;overflow:auto}
}
@media (max-width:760px){
  .shopcard.sp{max-height:94vh}
  .sp-body{grid-template-columns:1fr}
  .sp-eq{grid-template-columns:1fr}
  .sp-wallet-bal{margin-left:0;text-align:left;width:100%}
  .sp-foldbtn{display:inline-flex}
  .sp-aside{position:fixed;left:.5rem;right:.5rem;bottom:.5rem;z-index:70;max-height:58vh;overflow:auto;box-shadow:0 0 30px #000}
  .sp-aside.empty{display:none}
}
@media (max-width:480px){
  .sp-tools{flex-direction:column;align-items:stretch}
  .sp-search{min-width:0;width:100%}
}
@media (prefers-reduced-motion:reduce){.sp-sk{animation:none}.sp-card{transition:none}.sp-card:hover,.sp-card:active{transform:none}.wallet .bal.sp-pop{animation:none}}
`; document.head.append(st); }

  document.documentElement.dataset.shopPlus = '3'; console.info('[tienda v3] activa');
  const ST = {type: 'all', q: '', sort: 'new', mine: false, afford: false, sel: null, confirm: null, busy: false,
    try: {frame: null, name_effect: null, background: null, badge: null}, tryUser: null, view: 'profile', lvl: null, pause: false, fold: false, adv: false};
  const root = document.querySelector('#shopModal .card');
  root.classList.add('sp');
  root.innerHTML = `
    <button id="shopClose" class="close" aria-label="Cerrar">&times;</button>
    <div class="sp-head">
      <div class="sp-head-top"><h2 id="shopTitle" class="shoptitle">Tienda de cosméticos</h2><div id="shopWallet" class="sp-wallet-wrap"></div></div>
      <div id="spEq" class="sp-eq" aria-label="Cosméticos equipados"></div>
    </div>
    <div class="sp-toolbar">
      <div class="sp-tabs" id="spTabs" role="tablist" aria-label="Categorías">
        <button class="chip" data-t="all">Todos</button><button class="chip" data-t="frame">Marcos</button><button class="chip" data-t="name_effect">Nombres</button><button class="chip" data-t="background">Fondos</button><button class="chip" data-t="badge">Insignias</button>
      </div>
      <div class="sp-tools">
        <label class="search sp-search"><span class="sr">Buscar objeto</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="spQ" type="search" placeholder="Buscar objeto…" autocomplete="off"></label>
        <select id="spSort" class="sp-sel" aria-label="Ordenar por"><option value="new">Novedades</option><option value="asc">Precio: menor</option><option value="desc">Precio: mayor</option><option value="name">Nombre</option></select>
        <div class="chips sp-filters"><button class="chip" id="spMine">Míos</button><button class="chip" id="spAfford">Puedo comprar</button></div>
      </div>
    </div>
    <p id="shopMsg" class="shopmsg" role="status" aria-live="polite"></p>
    <div class="sp-body"><div id="shopGrid" class="shopgrid sp-catalog"></div><aside id="spPrev" class="sp-prev sp-aside" aria-label="Vista previa y compra"></aside></div>`;

  const me = () => wallet ? {username: wallet.username, display_name: wallet.display_name, avatar_url: wallet.avatar_url} : {username: 'tu', display_name: 'Tu nombre', avatar_url: null};
  const cat = () => [...COS.values()].filter(c => c.active);
  const visible = () => [...COS.values()].filter(c => c.active || own(c));
  const own = c => !!wallet?.owned?.includes(c.id), eqd = c => !!wallet && (c.type === 'badge' ? wallet.equipped?.rank === c.id : wallet.equipped?.[c.type] === c.id);
  const isNew = c => c.meta?.new || (c.created_at && Date.now() - new Date(c.created_at) < 10 * 864e5);
  const RL = ['Común', 'Raro', 'Épico', 'Legendario'];
  const TYPEL = {frame: 'Marco', name_effect: 'Nombre', background: 'Fondo', badge: 'Insignia'};
  const tiers = () => { const cs = cat().map(c => c.cost).sort((a, b) => a - b), q = p => cs[Math.min(cs.length - 1, Math.floor(cs.length * p))] ?? 0; return [q(.4), q(.7), q(.9)]; };
  const rar = (c, t) => c.cost >= t[2] && t[2] > t[0] ? 3 : c.cost >= t[1] && t[1] > t[0] ? 2 : c.cost > t[0] ? 1 : 0;
  const bgSt = c => c.url ? `background-image:url('${esc(c.url)}');background-size:cover;background-position:center bottom;image-rendering:pixelated` : '';
  const btn = (a, t, c, cls = '') => `<button class="btn ${cls}" data-act="${a}" data-id="${esc(c?.id || '')}" data-type="${c?.type || ''}">${t}</button>`;
  const msg = (t, ok = true) => { const m = $('shopMsg'); m.style.color = ok ? 'var(--leaf)' : '#ff8a6a'; m.textContent = t; clearTimeout(msg.t); msg.t = setTimeout(() => m.textContent = '', 4500); };

  const tile = (c, u) => c.type === 'frame' ? avatarF({...u, frame_id: c.id}, 64)
    : c.type === 'name_effect' ? `<span class="sp-tile-name" style="font-size:1.45rem;font-family:var(--display);font-weight:700">${nameHtml({...u, name_id: c.id})}</span>`
    : c.type === 'badge' ? (() => { const rk = window.RankEngine && window.RankEngine.byId ? window.RankEngine.byId(c.rank_id) : null; return rk ? window.RankEngine.sprite(rk.key, 64) : (c.asset_url ? `<img src="${esc(c.asset_url)}" width="64" height="64" style="object-fit:contain;image-rendering:pixelated">` : '<span style="font-size:2rem">🏅</span>'); })()
    : `<div class="swatch ${c.css}" style="${bgSt(c)}"></div>`;

  function primary(c) {
    if (!sess) return btn('login', 'Iniciar sesión', c);
    if (!wallet) return '<button class="btn" disabled>Comprar</button>';
    if (eqd(c)) return btn('unequip', 'Quitar', c, 'ghost');
    if (own(c)) return btn('equip', 'Equipar', c);
    const s = c.cost - wallet.balance;
    return s > 0 ? `<button class="btn" disabled>Faltan ${nf(s)} XP</button>` : btn('buy', 'Comprar', c);
  }

  function list() {
    let l = visible(); const q = ST.q.trim().toLowerCase();
    if (ST.type !== 'all') l = l.filter(c => c.type === ST.type);
    if (q) l = l.filter(c => `${c.name} ${c.description || ''} ${c.meta?.collection || ''} ${TYPEL[c.type]||''}`.toLowerCase().includes(q));
    if (ST.mine) l = l.filter(own);
    if (ST.afford && wallet) l = l.filter(c => !own(c) && c.cost <= wallet.balance);
    const by = {new: (a, b) => (new Date(b.created_at || 0) - new Date(a.created_at || 0)) || a.sort - b.sort, asc: (a, b) => a.cost - b.cost, desc: (a, b) => b.cost - a.cost, name: (a, b) => a.name.localeCompare(b.name)};
    return l.sort(by[ST.sort]);
  }

  function renderGrid() {
    const t = tiers(), u = me(), items = list();
    if (!COS.size) { $('shopGrid').innerHTML = '<div class="item sp-card sp-sk"></div>'.repeat(6); return; }
    $('shopGrid').innerHTML = items.map(c => {
      const r = rar(c, t), trying = tried(c.id), status = eqd(c) ? '<span class="sp-badge sp-badge-eq">Equipado</span>' : own(c) ? '<span class="sp-badge sp-badge-own">Tuyo</span>' : '';
      const top = !c.active ? '<span class="sp-flag sp-ret">Retirado</span>' : isNew(c) ? '<span class="sp-flag sp-newf">Nuevo</span>' : '';
      const meta = `<span class="sp-rar r${r}">${RL[r]}</span><span class="sp-type">${TYPEL[c.type] || ''}</span>${status}`;
      const acts = [`<button type="button" class="btn ghost sp-try${trying ? ' on' : ''}" data-try="${esc(c.id)}" aria-pressed="${trying}">${trying ? 'Probando' : 'Probar'}</button>`];
      if (c.active && wallet) acts.push(`<button type="button" class="btn ghost sp-gift" data-act="gift" data-id="${esc(c.id)}">🎁 Regalar</button>`);
      return `<div class="item sp-card sp-item r${r}${eqd(c) ? ' eq' : ''}${ST.sel === c.id ? ' sel' : ''}${trying ? ' tried' : ''}${!c.active ? ' retired' : ''}" data-sel="${esc(c.id)}" tabindex="0" role="button" aria-label="${esc(c.name)}">${top}
          <div class="prev sp-prevbox">${tile(c, u)}</div>
          <div class="sp-card-body"><b class="in">${esc(c.name)}</b><small>${esc(c.description || 'Cosmético para tu perfil.')}</small>
          <div class="sp-meta">${meta}</div></div>
          <div class="sp-card-actions">${acts.join('')}</div>
          <div class="ibot sp-card-foot"><span class="cost">${own(c) ? (eqd(c) ? 'En uso' : 'En tu colección') : nf(c.cost) + ' XP'}</span>${primary(c)}</div></div>`;
    }).join('') || `<div class="sp-empty" style="grid-column:1/-1"><p>No hay objetos con esos filtros.</p><button type="button" class="btn ghost" id="spClearFilters">Limpiar filtros</button></div>`;
  }

  // ---- visor de prueba ----
  const TL = {frame: 'Marco', name_effect: 'Nombre', background: 'Fondo', badge: 'Insignia'};
  const lvOf = xp => Math.floor(Math.pow(Math.max(Number(xp) || 0, 0) / 100, 1 / 1.5));
  const baseU = () => ST.tryUser || me();
  const baseLv = () => ST.tryUser ? (Number(ST.tryUser.level) || 0) : wallet ? lvOf(wallet.xp) : 5;
  const curLv = () => ST.lvl ?? baseLv();
  const pickT = t => ST.try[t] || (ST.tryUser ? '' : wallet?.equipped?.[t] || '');
  const tried = id => Object.values(ST.try).includes(id);
  const triedList = () => ['frame', 'name_effect', 'background', 'badge'].map(t => COS.get(ST.try[t])).filter(Boolean);

  function stageHtml() {
    const u = {...baseU(), frame_id: pickT('frame') || '', name_id: pickT('name_effect') || ''}, l = curLv();
    const _bc = COS.get(ST.try.badge), _br = _bc && window.RankEngine && window.RankEngine.byId ? window.RankEngine.byId(_bc.rank_id) : null;
    const title = _br ? _br.title : rankOf(l)[1]; const rKey = _br ? _br.key : rankKey(l);
    if (ST.view === 'chat') return `<div class="sp-chat" aria-label="Vista previa en el chat"><div class="cl"><small>12:34</small>${sprite(rKey, 18)}<b>${nameHtml(u)}</b><span>:</span><span style="font-weight:600">¡Qué buen directo, vamos!</span></div><div class="cl"><small>12:34</small><b style="color:var(--tan)">viewer123</b><span>:</span><span style="font-weight:600">jajaja GG</span></div></div>`;
    const xp = ST.tryUser?.xp ?? wallet?.xp ?? 1234;
    if (ST.view === 'rank') return `<div class="sp-pod" aria-label="Vista previa del podio">${avatarF(u, 72)}<span class="nm" style="font-family:var(--display);font-size:1.2rem">${nameHtml(u)}</span><span class="cost">${nf(xp)} XP</span></div>
      <div class="row" style="padding:.4rem .2rem"><span class="rk">1</span>${avatarF(u, 40)}<span class="info"><b>${nameHtml(u)}<span class="lvl">Nv. ${l}</span></b><small class="rk2">${sprite(rKey, 14)}<span>${esc(title)} · ahora mismo</span></small></span><span class="total">${nf(xp)} XP</span></div>`;
    const bg = COS.get(pickT('background')), cls = bg ? bg.css + (bg.url ? ' pb-img' + (bg.meta?.border ? ' pb-own' : '') : '') : '', st = bg?.url ? ` style="--pbimg:url('${esc(bg.url)}');--pbdim:${bg.meta?.dim ?? .15}"` : '';
    return `<div class="card sp-mini ${cls}"${st}><div class="mh">${avatarF(u, 64)}<div><h2>${nameHtml(u)}</h2><p>@${esc(u.username)} · Nv. ${l}</p></div></div><div class="rankrow">${sprite(rKey, 28)}<b>${esc(title)}</b></div><div class="pair"><div><span>XP total</span><b>${nf(xp)}</b></div><div><span>Puesto en XP</span><b>#1</b></div></div></div>`;
  }
  const stage = () => { const e = $('spStage'); if (e) e.innerHTML = stageHtml(); };

  function renderPrev() {
    const p = $('spPrev'), sel = ST.sel && COS.get(ST.sel), t = tiers(), listT = triedList(), buys = listT.filter(c => !own(c)), total = buys.reduce((s, c) => s + c.cost, 0);
    const a = document.activeElement, key = a && p.contains(a) ? (a.dataset.view ? `[data-view="${a.dataset.view}"]` : a.dataset.pv ? `[data-pv="${a.dataset.pv}"]${a.dataset.type ? `[data-type="${a.dataset.type}"]` : ''}` : '') : '';
    p.classList.toggle('fold', ST.fold); p.classList.toggle('sp-paused', ST.pause);
    const triedChips = ['frame', 'name_effect', 'background', 'badge'].map(k => { const c = COS.get(ST.try[k]); return `<div class="sp-trychip"><span><small>${TL[k]}</small><b>${c ? esc(c.name) : 'Sin probar'}</b></span>${c ? `<button type="button" data-pv="rm" data-type="${k}" aria-label="Quitar prueba de ${TL[k]}">&times;</button>` : ''}</div>`; }).join('');
    p.innerHTML = `<div class="sp-pv-head"><div class="sp-vt" role="group" aria-label="Vista previa">${[['profile', 'Perfil'], ['chat', 'Chat'], ['rank', 'Ranking']].map(([v, l]) => `<button type="button" class="chip${ST.view === v ? ' on' : ''}" data-view="${v}" aria-pressed="${ST.view === v}">${l}</button>`).join('')}</div>
        <div class="sp-pv-tools"><button type="button" class="chip" data-pv="pause" aria-pressed="${ST.pause}">${ST.pause ? 'Reanudar' : 'Pausar anim.'}</button><button type="button" class="chip sp-foldbtn" data-pv="fold" aria-expanded="${!ST.fold}">${ST.fold ? 'Mostrar' : 'Plegar'}</button></div></div>
      <div id="spStage" class="sp-stage">${stageHtml()}</div>
      <div class="sp-sec sp-sec-try">
        <div class="sp-sec-h"><b>Probando</b>${listT.length ? `<button type="button" class="linkbtn" data-pv="clear">Limpiar</button>` : ''}</div>
        <div class="sp-tried">${triedChips}</div>
        ${listT.length ? `<div class="sp-summary"><span>Total a comprar: <b class="cost">${nf(total)} XP</b></span>${wallet ? `<small>${total > wallet.balance ? `Te faltan ${nf(total - wallet.balance)} XP` : `Te quedarían ${nf(wallet.balance - total)} XP`}</small>` : ''}</div>
        <div class="sp-buys">${buys.map(c => `<div class="sp-buyrow"><span><b>${esc(c.name)}</b><small>${nf(c.cost)} XP</small></span>${primary(c)}</div>`).join('') || '<small class="sp-hint">Ya tienes todo lo que estás probando.</small>'}</div>` : '<small class="sp-hint">Pulsa «Probar» en un objeto para verlo aquí en tu perfil, chat y ranking.</small>'}
      </div>
      <details class="sp-sec sp-sec-adv" ${ST.adv ? 'open' : ''}><summary>Ajustes de prueba</summary>
        <div class="sp-adv-body">
          <label class="sp-lv"><span>Nivel simulado: <output id="spLvO">${curLv()}</output></span><input id="spLv" type="range" min="0" max="60" value="${curLv()}"></label>
          <div class="sp-who"><label><span class="sr">Probar con otro usuario de Kick</span><input id="spWho" type="search" placeholder="Usuario de Kick…" autocomplete="off"></label>${ST.tryUser ? `<small class="sp-hint">Viendo como @${esc(ST.tryUser.username)} <button type="button" class="chip" data-pv="me">Volver a mí</button></small>` : '<small class="sp-hint">Escribe un usuario y presiona Enter.</small>'}</div>
        </div></details>
      ${sel ? `<div class="sp-sec sp-sec-sel"><div class="sp-sec-h"><b>Seleccionado</b><span class="sp-rar r${rar(sel, t)}">${RL[rar(sel, t)]}</span></div>
        <div class="sp-sel-info"><b class="in">${esc(sel.name)}</b><small>${esc(sel.description || '')}</small><div class="sp-meta"><span class="sp-type">${TYPEL[sel.type] || ''}</span>${eqd(sel) ? '<span class="sp-badge sp-badge-eq">Equipado</span>' : own(sel) ? '<span class="sp-badge sp-badge-own">Tuyo</span>' : `<span class="cost">${nf(sel.cost)} XP</span>`}</div></div>
        <div class="sp-sel-actions">${primary(sel)}${sel.active && wallet ? btn('gift','🎁 Regalar', sel, 'ghost') : ''}</div></div>` : ''}`;
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
    else if (a === 'clear') ST.try = {frame: null, name_effect: null, background: null, badge: null};
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
    $('shopWallet').innerHTML = !sess ? `<div class="wallet sp-wallet"><div><b>Inicia sesión con Kick</b><small>Compra, equipa, regala y prueba cosméticos con tu cuenta.</small></div><a class="btn" href="${FN_URL}/login/start">Iniciar sesión con Kick</a></div>`
      : wallet ? `<div class="wallet sp-wallet"><div class="sp-wallet-id">${avatarF(wallet, 32)}<div><b>${esc(wallet.display_name)}</b><small>@${esc(wallet.username || sess.user || '')}</small></div></div><div class="sp-wallet-bal"><span class="bal">${nf(wallet.balance)} XP</span><small>disponibles · ganada ${nf(wallet.xp)} · gastada ${nf(wallet.xp_spent)}</small></div><button class="btn ghost" id="logoutBtn">Cerrar sesión</button></div>`
      : `<div class="wallet sp-wallet"><div><b>Sesión: ${esc(sess.user)}</b><small>Todavía no estás en el ranking. Escribe en el chat durante un directo.</small></div><button class="btn ghost" id="logoutBtn">Cerrar sesión</button></div>`;
    $('spEq').hidden = !wallet;
    $('spEq').innerHTML = [['frame', 'Marco'], ['name_effect', 'Nombre'], ['background', 'Fondo'], ['badge', 'Insignia']].map(([t, l]) => { const eqKey = t === 'badge' ? 'rank' : t; const c = wallet && COS.get(wallet.equipped?.[eqKey]);
      return `<div class="sp-slot${c ? ' on' : ''}"><div><small>${l} equipado</small><b>${c ? esc(c.name) : 'Ninguno'}</b></div>${c ? `<button data-act="unequip" data-type="${t}" aria-label="Quitar ${l}">&times;</button>` : ''}</div>`; }).join('');
    document.querySelectorAll('#spTabs .chip').forEach(b => b.classList.toggle('on', b.dataset.t === ST.type));
    $('spMine').classList.toggle('on', ST.mine); $('spAfford').classList.toggle('on', ST.afford);
    renderGrid(); renderPrev();
  }

  function popBalance(){
    const b = document.querySelector('#shopWallet .bal');
    if (!b) return;
    b.classList.remove('sp-pop'); void b.offsetWidth; b.classList.add('sp-pop');
    b.addEventListener('animationend', () => b.classList.remove('sp-pop'), { once: true });
  }

  async function act(a, id, type) {
    if (ST.busy) return;
    if (a === 'login') { location.href = FN_URL + '/login/start'; return; }
    if (a === 'cancel') { ST.confirm = null; return render(); }
    if (a === 'gift') {
      const c = COS.get(id); if (!c || !wallet) return; ST.sel = id;
      if (wallet.balance < c.cost) return msg(MSG.insufficient, false);
      const raw = prompt(`¿A quién le regalas «${c.name}»? Escribe su usuario de Kick.`);
      if (!raw || !raw.trim()) return;
      const to = normUser(raw);
      if (!confirm(`¿Regalar "${c.name}" a @${to} por ${nf(c.cost)} XP?\nTe quedarán ${nf(wallet.balance - c.cost)} XP. No se puede deshacer.`)) return;
      ST.busy = true; let r;
      try { r = await shopApi('/shop/gift', {cosmetic_id: id, to}); } catch (err) { console.error(err); r = {ok: false, reason: 'error'}; }
      ST.busy = false;
      msg(r.ok ? `🎁 ¡Regalo enviado a @${to}!` : (MSG[r.reason] || MSG.error), !!r.ok);
      try { await loadWallet(); } catch (err) { console.error(err); }
      render(); return;
    }
    if (a === 'buy') {
      const c = COS.get(id); if (!c || !wallet) return; ST.sel = id;
      if (!confirm(`¿Comprar "${c.name}" por ${nf(c.cost)} XP?\nTe quedarán ${nf(wallet.balance - c.cost)} XP.`)) return render();
      a = 'confirm';
    }
    ST.busy = true; let res;
    try { res = a === 'confirm' ? await shopApi('/shop/buy', {cosmetic_id: id}) : a === 'equip' ? await shopApi('/shop/equip', {cosmetic_id: id}) : await shopApi('/shop/unequip', {type}); }
    catch (err) { console.error('[tienda v3]', err); res = {ok: false, reason: 'error'}; }
    ST.busy = false; ST.confirm = null;
    if (!res.ok) console.warn('[tienda v3] el servidor respondió:', res);
    msg(res.ok ? (a === 'confirm' ? '¡Compra realizada! Ya podés equiparlo.' : a === 'equip' ? 'Objeto equipado.' : 'Objeto quitado.') : (MSG[res.reason] || `No se pudo completar (${res.reason || res.error || res.message || 'error'}).`), !!res.ok);
    try { await loadWallet(); } catch (err) { console.error(err); }
    render(); if (res.ok) { if (a === 'confirm') popBalance(); loadBoard(); loadFeed(); }
  }

  root.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'), t = e.target.closest('#spTabs .chip'), it = e.target.closest('[data-sel]');
    if (e.target.id === 'logoutBtn') return logout(true);
    if (e.target.id === 'spClearFilters') { ST.type='all'; ST.q=''; ST.mine=false; ST.afford=false; const q=$('spQ'); if(q) q.value=''; return render(); }
    const tr = e.target.closest('[data-try]'); if (tr) { e.stopPropagation(); return toggleTry(tr.dataset.try); }
    const vw = e.target.closest('[data-view]'); if (vw) { ST.view = vw.dataset.view; return renderPrev(); }
    const pv = e.target.closest('[data-pv]'); if (pv) return pvAct(pv.dataset.pv, pv.dataset.type);
    if (t) { ST.type = t.dataset.t; return render(); }
    if (e.target.id === 'spMine') { ST.mine = !ST.mine; return render(); }
    if (e.target.id === 'spAfford') { ST.afford = !ST.afford; return render(); }
    if (a) { e.stopPropagation(); return act(a.dataset.act, a.dataset.id, a.dataset.type); }
    if (it) { ST.sel = it.dataset.sel; document.querySelectorAll('#shopGrid .sp-item').forEach(x => x.classList.toggle('sel', x.dataset.sel === ST.sel)); renderPrev(); }
  });
  root.addEventListener('toggle', e => { if (e.target && e.target.classList && e.target.classList.contains('sp-sec-adv')) ST.adv = e.target.open; }, true);
  root.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'spWho') { e.preventDefault(); setWho(e.target.value); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('sp-item') && e.target.dataset.sel) {
      if (e.target.closest('[data-try],[data-act],button,a,input,select')) return;
      e.preventDefault(); ST.sel = e.target.dataset.sel; document.querySelectorAll('#shopGrid .sp-item').forEach(x => x.classList.toggle('sel', x.dataset.sel === ST.sel)); renderPrev();
    }
  });
  root.addEventListener('input', e => {
    if (e.target.id === 'spQ') { ST.q = e.target.value; renderGrid(); }
    if (e.target.id === 'spLv') { ST.lvl = +e.target.value; const o=$('spLvO'); if(o) o.textContent = ST.lvl; stage(); }
  });
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
    typeof modalOn === 'function' ? modalOn($('shopModal')) : $('shopModal').classList.add('open'); $('shopClose').focus(); msg(''); ST.sel = null; ST.confirm = null; ST.try = {frame: null, name_effect: null, background: null, badge: null}; ST.tryUser = null; ST.lvl = null; ST.adv = false; render();
    await loadCosmetics(); if (sess) { const ok = await shopApi('/shop/session'); if (ok.ok) await loadWallet(); }
    render();
  };
  $('shopBtn').onclick = window.openShop; $('shopClose').onclick = closeShop;
})();
