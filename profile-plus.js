/* profile-plus.js — perfil con vista horizontal (cargalo DESPUÉS de shop-plus.js, antes de </body>)
   · Vista vertical (la de siempre, 540 px) o horizontal (hasta 1040 px, dos columnas).
   · Automática: se usa la horizontal si el fondo equipado está marcado como «horizontal» en el admin (meta.wide).
   · El botón del perfil la cambia a mano y se recuerda en este navegador. */
(() => {
  if (window.__profilePlus) return; window.__profilePlus = true;
  const st = document.createElement('style'); st.id = 'pf-css';
  st.textContent = `
#modal .card .pf-tog{position:absolute;top:.15rem;right:2.6rem;z-index:2;padding:.05rem .6rem;border:2px solid var(--rim);border-radius:999px;background:rgba(26,28,26,.85);color:var(--cream);font-family:var(--display);font-weight:600;font-size:.9rem;text-shadow:none}
#modal .card .pf-tog:hover{border-color:var(--leaf);color:#7dff4a}
#modal .card.pf-has-tog .mh{padding-right:7.5rem}
@media (min-width:761px){
  #modal .card.pf-wide{max-width:min(1040px,96vw);max-height:min(92vh,700px);display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);
    grid-template-areas:"mh pairs" "rank pairs" "qh pairs" "qs pairs";grid-template-rows:auto auto auto 1fr;column-gap:1.1rem;align-content:start;background-position:center}
  #modal .card.pf-wide .mh{grid-area:mh}#modal .card.pf-wide #mRankBox{grid-area:rank}
  #modal .card.pf-wide .pairs{grid-area:pairs;align-content:start}
  #modal .card.pf-wide h3.qh{grid-area:qh;margin-top:.4rem}#modal .card.pf-wide #mQuests{grid-area:qs;align-content:start}
}
@media (max-width:760px){#modal .card .pf-tog{display:none}#modal .card.pf-has-tog .mh{padding-right:1.5rem}}
`;
  document.head.append(st);

  let lastStats = null;
  const _rpc = window.rpc;
  window.rpc = async (fn, a) => { const r = await _rpc(fn, a); if (fn === 'get_user_stats' && r) lastStats = r; return r; };
  const KEY = 'profileView';                                   // 'wide' | 'compact' | (vacío = automático)
  const pref = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } };
  const isWide = () => { const p = pref(), bg = lastStats?.background_id && COS.get(lastStats.background_id); return p === 'wide' || (p === 'auto' && !!bg?.meta?.wide); };
  function layout() {
    const card = $('modal').querySelector('.card'); if (!card) return;
    const wide = isWide();
    card.classList.toggle('pf-wide', wide); card.classList.add('pf-has-tog');
    let b = card.querySelector('.pf-tog');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.className = 'pf-tog'; card.append(b);
      b.onclick = () => { try { localStorage.setItem(KEY, isWide() ? 'compact' : 'wide'); } catch {} layout(); };
    }
    b.textContent = wide ? '↕ Vertical' : '↔ Horizontal';
    b.setAttribute('aria-pressed', String(wide)); b.title = wide ? 'Cambiar a la vista vertical' : 'Cambiar a la vista horizontal';
  }
  const _open = window.openProfile;
  window.openProfile = async (raw) => { const ok = await _open(raw); if (ok) layout(); return ok; };

  /* =================== «Mi perfil»: personalizar con lo que ya tienes + elegir la insignia de rango =================== */
  const mcss = document.createElement('style'); mcss.id = 'mp-css';
  mcss.textContent = `
.mpcard{max-width:min(1040px,96vw)!important;max-height:94vh}
.mp-grid{display:grid;grid-template-columns:minmax(0,330px) minmax(0,1fr);gap:1rem;align-items:start}
.mp-prev{position:sticky;top:0;display:grid;gap:.6rem}.mp-prev .card{max-width:none;max-height:none;overflow:visible}
.mp-sec{margin:0 0 1rem}.mp-sec h3{font-family:var(--display);font-weight:700;font-size:1.2rem;color:#fff;text-shadow:var(--ol);margin:0 0 .4rem;display:flex;gap:.6rem;align-items:baseline}
.mp-sec h3 small{font-family:var(--body);font-size:.75rem;color:var(--tan);font-weight:600}
.mp-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.45rem}
.mp-it{display:grid;gap:.3rem;justify-items:center;padding:.5rem .4rem;background:#1a1c1a;border:2px solid var(--rim);border-radius:10px;text-align:center;min-height:96px;align-content:center}
.mp-it:hover{filter:brightness(1.15)}.mp-it.on{border-color:#4be01a;box-shadow:inset 0 0 0 1px #4be01a}
.mp-it .swatch{height:46px}.mp-it span.n{font-size:.78rem;line-height:1.1;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap}
.mp-it .ne{max-width:100%}
.mp-rk{display:flex;align-items:center;gap:.7rem;width:100%;padding:.4rem .6rem;background:#1a1c1a;border:2px solid var(--rim);border-radius:10px}
.mp-rk:hover:not(:disabled){filter:brightness(1.15)}.mp-rk.on{border-color:#4be01a}.mp-rk:disabled{opacity:.45;cursor:not-allowed}
.mp-rk b{font-family:var(--display);font-size:1.1rem;color:#fff;line-height:1.1}.mp-rk small{display:block;color:var(--tan);font-size:.75rem}
.mp-list{display:grid;gap:.35rem}.mp-hint{color:var(--tan);font-size:.82rem}
.mp-acts{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}.mp-acts select{background:#1a1c1a;border:2px solid var(--rim);border-radius:8px;color:var(--cream);padding:.25rem .5rem;font:inherit;text-shadow:none}
.mp-chat{background:#0b0e0f;border-radius:8px;padding:.5rem .6rem;font:700 .85rem system-ui,sans-serif;color:#e6e6e6;text-shadow:none;display:flex;gap:.3rem;align-items:center;flex-wrap:wrap}.mp-chat small{color:#6b7370;font-weight:600}
@media (max-width:760px){.mp-grid{grid-template-columns:1fr}.mp-prev{position:static}}
`;
  document.head.append(mcss);

  const hr = document.querySelector('.hright'), shopBtn = $('shopBtn');
  const mpBtn = document.createElement('button'); mpBtn.className = 'shopbtn'; mpBtn.id = 'mpBtn'; mpBtn.type = 'button'; mpBtn.textContent = 'Mi perfil';
  if (hr) hr.insertBefore(mpBtn, shopBtn || null);
  const modal = document.createElement('div');
  modal.id = 'mpModal'; modal.className = 'modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'mpTitle');
  modal.innerHTML = '<div class="card mpcard"><button id="mpClose" class="close" aria-label="Cerrar">&times;</button><h2 id="mpTitle" class="shoptitle">Mi perfil</h2><p id="mpMsg" class="shopmsg" role="status"></p><div id="mpBody"></div></div>';
  document.body.append(modal);

  let busy = false, msgT;
  const mpMsg = (t, ok = true) => { const m = $('mpMsg'); m.style.color = ok ? '' : '#ff8a6a'; m.textContent = t; clearTimeout(msgT); msgT = setTimeout(() => { m.textContent = ''; }, 4000); };
  const eqOf = () => wallet?.equipped || {};
  const shownDef = () => RankEngine.shownFor(wallet.level, eqOf().rank);
  const bgSt = (c) => c.url ? `background-image:url('${esc(c.url)}');background-size:cover;background-position:center bottom;image-rendering:pixelated` : '';

  function previewHtml() {
    const e = eqOf(), u = {...wallet, frame_id: e.frame || '', name_id: e.name_effect || ''}, d = shownDef(), bg = COS.get(e.background || '');
    const cls = bg ? bg.css + (bg.url ? ' pb-img' + (bg.meta?.border ? ' pb-own' : '') : '') : '', st = bg?.url ? ` style="--pbimg:url('${esc(bg.url)}');--pbdim:${bg.meta?.dim ?? .15}"` : '';
    return `<div class="card sp-mini ${cls}"${st}><div class="mh">${avatarF(u, 64)}<div><h2>${nameHtml(u)}</h2><p>@${esc(u.username)} · Nv. ${wallet.level}</p></div></div>
        <div class="rankrow">${sprite(d.key, 28)}<b>${esc(d.title)}</b></div></div>
      <div class="mp-chat" aria-label="Así se ve en el chat"><small>12:34</small>${sprite(d.key, 18)}<b>${nameHtml(u)}</b><span>:</span><span style="font-weight:600">¡Hola a todos!</span></div>
      <div class="row" style="padding:.3rem .2rem"><span class="rk">1</span>${avatarF(u, 40)}<span class="info"><b>${nameHtml(u)}<span class="lvl">Nv. ${wallet.level}</span></b><small class="rk2">${sprite(d.key, 14)}<span>${esc(d.title)}</span></small></span></div>`;
  }
  function tiles(type, label) {
    const e = eqOf(), own = [...COS.values()].filter(c => c.type === type && wallet.owned?.includes(c.id));
    const none = `<button type="button" class="mp-it ${e[type] ? '' : 'on'}" data-mp="unequip" data-type="${type}" aria-pressed="${!e[type]}"><span class="n">Ninguno</span></button>`;
    const body = own.map(c => {
      const on = e[type] === c.id, v = type === 'frame' ? avatarF({...wallet, frame_id: c.id}, 48)
        : type === 'name_effect' ? `<span style="font-size:1.1rem;font-family:var(--display);font-weight:700">${nameHtml({...wallet, name_id: c.id})}</span>`
        : `<div class="swatch ${c.css}" style="${bgSt(c)};width:100%"></div>`;
      return `<button type="button" class="mp-it ${on ? 'on' : ''}" data-mp="equip" data-id="${esc(c.id)}" aria-pressed="${on}">${v}<span class="n" title="${esc(c.name)}">${esc(c.name)}</span></button>`;
    }).join('');
    return `<section class="mp-sec"><h3>${label} <small>${own.length ? own.length + ' tuyos' : 'todavía no tienes'}</small></h3>
      <div class="mp-tiles">${none}${body}</div>${own.length ? '' : '<p class="mp-hint">Consigue algunos en la tienda con tu XP.</p>'}</section>`;
  }
  function ranks() {
    const e = eqOf(), auto = RankEngine.of(wallet.level), sel = e.rank != null && RankEngine.byId(e.rank) && RankEngine.byId(e.rank).min_level <= wallet.level ? e.rank : null;
    const rows = RankEngine.all().map(d => {
      const locked = d.min_level > wallet.level;
      return `<button type="button" class="mp-rk ${sel === d.id ? 'on' : ''}" data-mp="rank" data-id="${d.id ?? ''}" ${locked || d.id == null ? 'disabled' : ''} aria-pressed="${sel === d.id}">${sprite(d.key, 28)}<span><b>${esc(d.title)}</b><small>${locked ? '🔒 Se desbloquea en el nivel ' + d.min_level : 'Desde el nivel ' + d.min_level}</small></span></button>`;
    }).join('');
    return `<section class="mp-sec"><h3>Insignia de rango <small>solo cambia lo que se ve: tu nivel y tu XP no se tocan</small></h3><div class="mp-list">
      <button type="button" class="mp-rk ${sel === null ? 'on' : ''}" data-mp="rank" data-id="" aria-pressed="${sel === null}">${sprite(auto.key, 28)}<span><b>Automática</b><small>La de tu nivel (${esc(auto.title)})</small></span></button>${rows}</div></section>`;
  }
  function mpRender() {
    const body = $('mpBody');
    if (!sess) { body.innerHTML = `<p>Inicia sesión con tu cuenta de Kick para personalizar tu perfil.</p><p style="margin-top:.6rem"><a class="btn" href="${FN_URL}/login/start">Iniciar sesión con Kick</a></p>`; return; }
    if (!wallet) { body.innerHTML = `<p>Sesión de <b>${esc(sess.user)}</b>: todavía no estás en el ranking. Escribe en el chat durante un directo y vuelve aquí.</p>`; return; }
    const v = (() => { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } })();
    body.innerHTML = `<div class="mp-grid"><aside class="mp-prev" aria-label="Vista previa">${previewHtml()}
        <div class="mp-acts"><button type="button" class="btn" data-mp="public">Ver mi perfil público</button><button type="button" class="btn ghost" data-mp="shop">Ir a la tienda</button></div>
        <label class="mp-hint">Vista del perfil público <select id="mpView"><option value="auto" ${v === 'auto' ? 'selected' : ''}>Automática</option><option value="compact" ${v === 'compact' ? 'selected' : ''}>Vertical</option><option value="wide" ${v === 'wide' ? 'selected' : ''}>Horizontal</option></select></label></aside>
      <div>${ranks()}${tiles('frame', 'Marco de avatar')}${tiles('name_effect', 'Efecto de nombre')}${tiles('background', 'Fondo de perfil')}</div></div>`;
  }
  async function mpAct(kind, id, type) {
    if (busy || !wallet) return; busy = true;
    const prev = JSON.parse(JSON.stringify(eqOf()));
    wallet.equipped = wallet.equipped || {};
    if (kind === 'equip') { const c = COS.get(id); if (!c) { busy = false; return; } wallet.equipped[c.type] = id; }
    else if (kind === 'unequip') wallet.equipped[type] = null;
    else wallet.equipped.rank = id === '' ? null : Number(id);
    mpRender();
    const res = kind === 'rank' ? await shopApi('/shop/rank', {rank_id: wallet.equipped.rank})
      : kind === 'equip' ? await shopApi('/shop/equip', {cosmetic_id: id}) : await shopApi('/shop/unequip', {type});
    busy = false;
    if (!res || !res.ok) {
      wallet.equipped = prev; mpRender();
      return mpMsg(({locked: 'Todavía no desbloqueaste ese rango.', item_not_found: 'Ese rango ya no está disponible.', not_owned: 'Primero tienes que comprarlo.', no_session: 'Tu sesión venció: inicia sesión de nuevo.'})[res?.reason]
        || (kind === 'rank' ? 'No se pudo guardar. Falta actualizar la función de Kick (ruta /shop/rank).' : 'No se pudo guardar. Inténtalo otra vez.'), false);
    }
    mpMsg('Guardado ✔');
    try { await loadWallet(); } catch {}
    mpRender(); try { loadBoard(); loadFeed(); } catch {}
  }
  function openMp() {
    modalOn(modal); $('mpClose').focus(); $('mpMsg').textContent = ''; mpRender();
    (async () => {
      if (!COS.size) await loadCosmetics();
      if (sess) { const ok = await shopApi('/shop/session'); if (ok.ok) await loadWallet(); }
      await RankEngine.init(db); mpRender();
    })();
  }
  const closeMp = () => modalOff(modal);
  mpBtn.onclick = openMp; $('mpClose').onclick = closeMp;
  modal.addEventListener('click', (e) => { if (e.target === modal) { closeMp(); return; }
    const b = e.target.closest('[data-mp]'); if (!b || b.disabled) return; const k = b.dataset.mp;
    if (k === 'public') { closeMp(); openProfile(sess.user); }
    else if (k === 'shop') { closeMp(); window.openShop && window.openShop(); }
    else mpAct(k, b.dataset.id, b.dataset.type); });
  modal.addEventListener('change', (e) => { if (e.target.id === 'mpView') { try { if (e.target.value === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, e.target.value); } catch {} mpMsg('Vista guardada ✔'); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeMp(); });
})();
