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
#modal .card .pf-tog:focus-visible{outline:2px solid var(--leaf);outline-offset:2px}
#modal .card.pf-has-tog .mh{padding-right:7.5rem}
@media (min-width:761px){
  #modal .card.pf-wide{max-width:min(1040px,96vw);max-height:min(92vh,760px);display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);
    grid-template-areas:"mh pairs" "rank pairs" "coll pairs" "qs pairs";grid-template-rows:auto auto auto 1fr;column-gap:1.1rem;align-content:start;background-position:center}
  #modal .card.pf-wide .mh{grid-area:mh}
  #modal .card.pf-wide #mRankBox{grid-area:rank}
  #modal .card.pf-wide #pairs{grid-area:pairs;align-content:start}
  #modal .card.pf-wide #mCollectionSec{grid-area:coll;margin-top:0}
  #modal .card.pf-wide .m-sec-quests{grid-area:qs;margin-top:0;min-height:0}
  #modal .card.pf-wide #mQuests{max-height:100%;overflow:auto}
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
.mpcard{max-width:min(1120px,97vw)!important;max-height:94vh;overflow:auto}
.mpcard .shoptitle{margin-bottom:.15rem}
.mp-lead{color:var(--tan);font-size:.88rem;margin:0 0 .5rem;line-height:1.35}
.mp-status{display:flex;flex-wrap:wrap;gap:.35rem .5rem;margin-bottom:.5rem}
.mp-pill{display:inline-flex;align-items:center;gap:.3rem;padding:.12rem .55rem;border:2px solid var(--rim);border-radius:999px;background:#1a1c1a;color:var(--cream);font-size:.78rem}
.mp-pill b{color:var(--gold);font-family:var(--display);font-size:.95rem}
.shopmsg{min-height:1.25rem;margin:.1rem 0 .55rem;font-weight:800}
.mp-grid{display:grid;grid-template-columns:minmax(280px,360px) minmax(0,1fr);gap:1rem;align-items:start}
.mp-prev{position:sticky;top:.25rem;display:grid;gap:.7rem;align-content:start}
.mp-box{background:rgba(20,22,20,.55);border:2px solid var(--rim);border-radius:12px;padding:.65rem .7rem}
.mp-box h3,.mp-sec h3{font-family:var(--display);font-weight:700;font-size:1.2rem;color:#fff;text-shadow:var(--ol);margin:0 0 .15rem;display:flex;flex-wrap:wrap;gap:.45rem;align-items:baseline}
.mp-box h3 small,.mp-sec h3 small{font-family:var(--body);font-size:.76rem;color:var(--tan);font-weight:600;text-shadow:none}
.mp-prev-stack{display:grid;gap:.45rem}
.mp-prev .card.sp-mini{max-width:none;min-height:0;overflow:visible}
.mp-mini-label{font-size:.72rem;color:var(--tan);margin-bottom:.15rem;text-transform:uppercase;letter-spacing:.03em}
.mp-prev .row{border:0;border-top:1px solid var(--line);margin:0;padding:.4rem .2rem 0}
.mp-acts{display:flex;flex-wrap:wrap;gap:.45rem}.mp-acts .btn{padding:.3rem .7rem;font-size:1rem}
.mp-ctrl{display:grid;gap:.25rem}
.mp-ctrl label{display:grid;gap:.2rem;color:var(--tan);font-size:.82rem}
.mp-ctrl select{background:#1a1c1a;border:2px solid var(--rim);border-radius:8px;color:var(--cream);padding:.35rem .55rem;font:inherit;text-shadow:none;max-width:100%}
.mp-main{display:grid;gap:.85rem}
.mp-sec{margin:0;padding:.7rem .75rem;background:rgba(20,22,20,.45);border:2px solid var(--rim);border-radius:12px}
.mp-sec-head{margin-bottom:.45rem}
.mp-sec-head p{margin:.1rem 0 0;color:var(--tan);font-size:.82rem;line-height:1.35}
.mp-sub{margin:.55rem 0 .3rem;font-weight:800;font-size:.88rem;color:var(--cream);display:flex;align-items:center;justify-content:space-between;gap:.5rem}
.mp-sub small{color:var(--tan);font-weight:600;font-size:.76rem}
.mp-list{display:grid;gap:.4rem}
.mp-rk{display:flex;align-items:center;gap:.7rem;width:100%;padding:.45rem .6rem;background:#1a1c1a;border:2px solid var(--rim);border-radius:10px;text-align:left;transition:filter .15s ease,border-color .15s ease}
.mp-rk:hover:not(:disabled){filter:brightness(1.12);border-color:#575c55}
.mp-rk.on{border-color:#4be01a;box-shadow:inset 0 0 0 1px rgba(75,224,26,.35),0 0 0 1px rgba(75,224,26,.08)}
.mp-rk:disabled{opacity:.48;cursor:not-allowed}
.mp-rk:focus-visible{outline:2px solid var(--leaf);outline-offset:2px}
.mp-rk .mp-rk-txt{min-width:0;flex:1}
.mp-rk b{display:block;font-family:var(--display);font-size:1.08rem;color:#fff;line-height:1.15}
.mp-rk small{display:block;color:var(--tan);font-size:.75rem;line-height:1.25}
.mp-rk .mp-tag{margin-left:auto;font-size:.68rem;font-weight:800;color:#0f2a08;background:#7fe044;border-radius:999px;padding:.05rem .45rem;white-space:nowrap}
.mp-rk .mp-lock{margin-left:auto;font-size:.72rem;color:var(--tan);white-space:nowrap}
.mp-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:.45rem}
.mp-it{position:relative;display:grid;gap:.3rem;justify-items:center;padding:.5rem .4rem;background:#1a1c1a;border:2px solid var(--rim);border-radius:10px;text-align:center;min-height:102px;align-content:center;width:100%;transition:filter .15s ease,border-color .15s ease,transform .12s ease}
.mp-it:hover{filter:brightness(1.12);border-color:#575c55}
.mp-it:active{transform:scale(.985)}
.mp-it.on{border-color:#4be01a;box-shadow:inset 0 0 0 1px rgba(75,224,26,.35)}
.mp-it:focus-visible{outline:2px solid var(--leaf);outline-offset:2px}
.mp-it .mp-vis{min-height:46px;display:grid;place-items:center;width:100%}
.mp-it .swatch{height:46px;width:100%}
.mp-it span.n{font-size:.78rem;line-height:1.15;color:var(--cream);max-width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.mp-it .ne{max-width:100%}
.mp-it.mp-none .mp-vis{font-size:1.4rem;color:var(--tan);font-family:var(--display)}
.mp-it.on::after{content:"En uso";position:absolute;top:.3rem;right:.3rem;font-size:.62rem;font-weight:800;color:#0f2a08;background:#7fe044;border-radius:4px;padding:0 .3rem;line-height:1.5}
.mp-hint{color:var(--tan);font-size:.82rem;margin:.35rem 0 0;line-height:1.35}
.mp-empty{display:flex;flex-wrap:wrap;gap:.4rem .6rem;align-items:center;margin-top:.3rem}
.mp-empty .btn{padding:.25rem .6rem;font-size:.95rem}
.mp-form{display:grid;gap:.6rem}
.mp-chk{display:flex;gap:.55rem;align-items:flex-start;cursor:pointer;line-height:1.35;font-size:.92rem}
.mp-chk input{margin-top:.2rem;accent-color:#53fc18;flex:none}
.mp-bday{display:grid;gap:.35rem;padding:.55rem .6rem;background:#1a1c1a;border:1px solid var(--line);border-radius:10px}
.mp-bday .mp-bday-row{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center}
.mp-bday label{font-size:.82rem;color:var(--tan)}
.mp-sec input[type=number],.mp-sec select{background:#181a18;border:2px solid var(--rim);border-radius:8px;color:var(--cream);padding:.35rem .55rem;font:inherit;text-shadow:none}
.mp-sec input[type=number]:focus,.mp-sec select:focus,.mp-ctrl select:focus{outline:2px solid var(--leaf);outline-offset:1px;border-color:var(--leaf)}
.mp-sec input[type=number]{width:5.2rem}
.mp-note{color:var(--tan);font-size:.78rem;line-height:1.35;margin:0}
.mpcard.is-busy{cursor:progress}
.mpcard.is-busy [data-mp],.mpcard.is-busy [data-ps],.mpcard.is-busy select,.mpcard.is-busy input,.mpcard.is-busy .btn{pointer-events:none}
.mpcard.is-busy .mp-it,.mpcard.is-busy .mp-rk{opacity:.75}
@media (max-width:820px){.mp-grid{grid-template-columns:1fr}.mp-prev{position:static}}
@media (max-width:480px){.mp-tiles{grid-template-columns:repeat(auto-fill,minmax(104px,1fr))}.mp-acts .btn{flex:1 1 auto;text-align:center}}
`;
  document.head.append(mcss);

  const hr = document.querySelector('.hright'), shopBtn = $('shopBtn');
  const mpBtn = document.createElement('button'); mpBtn.className = 'shopbtn'; mpBtn.id = 'mpBtn'; mpBtn.type = 'button'; mpBtn.textContent = 'Mi perfil';
  if (hr) hr.insertBefore(mpBtn, shopBtn || null);
  const modal = document.createElement('div');
  modal.id = 'mpModal'; modal.className = 'modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'mpTitle');
  modal.innerHTML = '<div class="card mpcard"><button id="mpClose" class="close" aria-label="Cerrar">&times;</button><h2 id="mpTitle" class="shoptitle">Mi perfil</h2><p id="mpMsg" class="shopmsg" role="status"></p><div id="mpBody"></div></div>';
  document.body.append(modal);

  let busy = false, msgT, PS = null;
  const setBusy = (on) => { busy = !!on; document.querySelector('.mpcard')?.classList.toggle('is-busy', busy); };
  const mpMsg = (t, ok = true) => { const m = $('mpMsg'); if (!m) return; m.style.color = ok ? 'var(--leaf)' : '#ff8a6a'; m.textContent = t || ''; clearTimeout(msgT); if (t) msgT = setTimeout(() => { if ($('mpMsg')) $('mpMsg').textContent = ''; }, 4200); };
  const eqOf = () => wallet?.equipped || {};
  const shownDef = () => RankEngine.shownFor(wallet.level, eqOf().rank);
  const bgSt = (c) => c.url ? `background-image:url('${esc(c.url)}');background-size:cover;background-position:center bottom;image-rendering:pixelated` : '';

  function previewHtml() {
    const e = eqOf(), u = {...wallet, frame_id: e.frame || '', name_id: e.name_effect || ''}, d = shownDef(), bg = COS.get(e.background || '');
    const cls = bg ? bg.css + (bg.url ? ' pb-img' + (bg.meta?.border ? ' pb-own' : '') : '') : '', st = bg?.url ? ` style="--pbimg:url('${esc(bg.url)}');--pbdim:${bg.meta?.dim ?? .15}"` : '';
    return `<div class="mp-prev-stack" aria-label="Vista previa de tu perfil">
      <div><div class="mp-mini-label">Perfil</div>
        <div class="card sp-mini ${cls}"${st}><div class="mh">${avatarF(u, 64)}<div><h2>${nameHtml(u)}</h2><p>@${esc(u.username)} · Nv. ${wallet.level}</p></div></div>
          <div class="rankrow">${sprite(d.key, 28)}<b>${esc(d.title)}</b></div></div></div>
      <div><div class="mp-mini-label">Chat</div>
        <div class="mp-chat" aria-label="Así se ve en el chat"><small>12:34</small>${sprite(d.key, 18)}<b>${nameHtml(u)}</b><span>:</span><span style="font-weight:600">¡Hola a todos!</span></div></div>
      <div><div class="mp-mini-label">Ranking</div>
        <div class="row" style="padding:.35rem .2rem 0"><span class="rk">1</span>${avatarF(u, 40)}<span class="info"><b>${nameHtml(u)}<span class="lvl">Nv. ${wallet.level}</span></b><small class="rk2">${sprite(d.key, 14)}<span>${esc(d.title)}</span></small></span></div></div>
    </div>`;
  }
  function tiles(type, label, hint) {
    const e = eqOf(), own = [...COS.values()].filter(c => c.type === type && wallet.owned?.includes(c.id));
    const none = `<button type="button" class="mp-it mp-none ${e[type] ? '' : 'on'}" data-mp="unequip" data-type="${type}" aria-pressed="${!e[type]}"><span class="mp-vis">—</span><span class="n">Ninguno</span></button>`;
    const body = own.map(c => {
      const on = e[type] === c.id, v = type === 'frame' ? avatarF({...wallet, frame_id: c.id}, 48)
        : type === 'name_effect' ? `<span style="font-size:1.1rem;font-family:var(--display);font-weight:700">${nameHtml({...wallet, name_id: c.id})}</span>`
        : `<div class="swatch ${c.css}" style="${bgSt(c)}"></div>`;
      return `<button type="button" class="mp-it ${on ? 'on' : ''}" data-mp="equip" data-id="${esc(c.id)}" aria-pressed="${on}" aria-label="${esc(c.name)}${on ? ', en uso' : ''}"><span class="mp-vis">${v}</span><span class="n" title="${esc(c.name)}">${esc(c.name)}</span></button>`;
    }).join('');
    const empty = own.length ? '' : `<div class="mp-empty"><p class="mp-hint" style="margin:0">Todavía no tienes ${label.toLowerCase()}.</p><button type="button" class="btn ghost" data-mp="shop">Ver en la tienda</button></div>`;
    return `<div class="mp-block"><div class="mp-sub"><span>${esc(label)}</span><small>${own.length ? `${nf(own.length)} ${own.length === 1 ? 'tuyo' : 'tuyos'}` : '0 tuyos'}</small></div>
      ${hint ? `<p class="mp-hint" style="margin-top:0">${esc(hint)}</p>` : ''}
      <div class="mp-tiles" role="group" aria-label="${esc(label)}">${none}${body}</div>${empty}</div>`;
  }
  function ranks() {
    const e = eqOf(), auto = RankEngine.of(wallet.level), sel = e.rank != null && RankEngine.byId(e.rank) && RankEngine.byId(e.rank).min_level <= wallet.level ? e.rank : null;
    const rows = RankEngine.all().map(d => {
      const locked = d.min_level > wallet.level, on = sel === d.id;
      const meta = locked ? `<span class="mp-lock">🔒 Nv. ${d.min_level}</span>` : (on ? '<span class="mp-tag">En uso</span>' : `<span class="mp-lock">Desde nv. ${d.min_level}</span>`);
      return `<button type="button" class="mp-rk ${on ? 'on' : ''}" data-mp="rank" data-id="${d.id ?? ''}" ${locked ? 'disabled' : ''} aria-pressed="${on}">${sprite(d.key, 30)}<span class="mp-rk-txt"><b>${esc(d.title)}</b><small>${locked ? 'Se desbloquea al llegar al nivel ' + d.min_level : 'Disponible para mostrar en tu perfil'}</small></span>${meta}</button>`;
    }).join('');
    const autoOn = sel === null;
    return `<section class="mp-sec" aria-label="Insignia de rango"><div class="mp-sec-head"><h3>Insignia de rango <small>solo cambia lo visible</small></h3><p>Tu nivel y tu XP no cambian. Puedes mostrar la insignia de tu nivel actual o una que ya hayas desbloqueado.</p></div>
      <div class="mp-list">
        <button type="button" class="mp-rk ${autoOn ? 'on' : ''}" data-mp="rank" data-id="" aria-pressed="${autoOn}">${sprite(auto.key, 30)}<span class="mp-rk-txt"><b>Automática</b><small>Usa la insignia de tu nivel actual: ${esc(auto.title)}</small></span>${autoOn ? '<span class="mp-tag">En uso</span>' : '<span class="mp-lock">Recomendada</span>'}</button>
        ${rows}
      </div></section>`;
  }
  const MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  function privacy() {
    if (!PS) return '<section class="mp-sec"><div class="mp-sec-head"><h3>Privacidad y cumpleaños</h3><p>No se pudieron cargar tus ajustes. Puede faltar actualizar la función de Kick o ejecutar <code>regalos_perfil.sql</code>.</p></div></section>';
    const hasBday = !!PS.birthday_month;
    const monthOpts = [`<option value="" ${hasBday ? '' : 'selected'} disabled>Mes</option>`].concat(MES.map((m, i) => `<option value="${i + 1}" ${PS.birthday_month === i + 1 ? 'selected' : ''}>${m}</option>`)).join('');
    return `<section class="mp-sec" aria-label="Privacidad y cumpleaños"><div class="mp-sec-head"><h3>Privacidad y cumpleaños <small>tú decides qué se muestra</small></h3><p>Estos ajustes controlan lo que otras personas pueden ver o hacer desde tu perfil.</p></div>
      <div class="mp-form">
        <label class="mp-chk"><input type="checkbox" data-ps="inventory_public" ${PS.inventory_public ? 'checked' : ''}><span><b>Mostrar mis cosméticos</b><br><span class="mp-note">Permite que se vea tu colección en tu perfil público.</span></span></label>
        <label class="mp-chk"><input type="checkbox" data-ps="allow_gifts" ${PS.allow_gifts ? 'checked' : ''}><span><b>Permitir regalos</b><br><span class="mp-note">Otras personas podrán regalarte cosméticos desde la tienda.</span></span></label>
        <div class="mp-bday">
          <b style="font-size:.95rem">Cumpleaños</b>
          <p class="mp-note" style="margin:0">Solo se guarda el día y el mes (nunca el año). Por defecto es privado.</p>
          <div class="mp-bday-row">
            <label for="psDay">Día</label><input id="psDay" type="number" min="1" max="31" placeholder="Día" value="${PS.birthday_day ?? ''}" aria-label="Día">
            <label for="psMonth">Mes</label><select id="psMonth" aria-label="Mes">${monthOpts}</select>
            <button type="button" class="btn" data-mp="bday">Guardar fecha</button>
            ${hasBday ? '<button type="button" class="btn ghost" data-mp="bdayclear">Borrar</button>' : ''}
          </div>
          <label class="mp-chk" style="margin-top:.1rem"><input type="checkbox" data-ps="birthday_public" ${PS.birthday_public ? 'checked' : ''} ${hasBday ? '' : 'disabled'}><span>Mostrar mi cumpleaños en mi perfil público${hasBday ? '' : ' <span class="mp-note">(guarda una fecha primero)</span>'}</span></label>
        </div>
      </div></section>`;
  }
  async function savePS(patch) {
    if (busy) return; setBusy(true);
    const r = await shopApi('/shop/profile', patch);
    if (!r || !r.ok) {
      mpMsg(r?.reason === 'invalid' ? 'Esa fecha no es válida. Revisa el día y el mes.' : 'No se pudo guardar. Inténtalo otra vez.', false);
      try { const g = await shopApi('/shop/profile'); if (g && g.ok) PS = g.settings; } catch {}
      setBusy(false); return mpRender();
    }
    PS = r.settings; setBusy(false); mpMsg('Guardado ✔'); mpRender();
  }
  function mpRender() {
    const body = $('mpBody'); if (!body) return;
    setBusy(false);
    if (!sess) { body.innerHTML = `<div class="mp-sec"><div class="mp-sec-head"><h3>Inicia sesión</h3><p>Conecta tu cuenta de Kick para personalizar tu perfil, equipar cosméticos y elegir tu insignia.</p></div><p style="margin-top:.6rem"><a class="btn" href="${FN_URL}/login/start">Iniciar sesión con Kick</a></p></div>`; return; }
    if (!wallet) { body.innerHTML = `<div class="mp-sec"><div class="mp-sec-head"><h3>Todavía no estás en el ranking</h3><p>Sesión iniciada como <b>${esc(sess.user)}</b>. Escribe en el chat durante un directo para aparecer en el ranking y poder personalizar tu perfil.</p></div></div>`; return; }
    const v = (() => { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } })();
    const vLabel = v === 'wide' ? 'Horizontal' : v === 'compact' ? 'Vertical' : 'Automática';
    body.innerHTML = `<p class="mp-lead">Personaliza cómo te ven en el ranking, el chat y tu perfil público. Los cambios se guardan al instante.</p>
      <div class="mp-status" aria-label="Resumen de tu cuenta"><span class="mp-pill"><b>${nf(wallet.balance ?? 0)}</b> XP disponibles</span><span class="mp-pill">Nivel <b>${nf(wallet.level ?? 0)}</b></span><span class="mp-pill">Vista pública: <b>${esc(vLabel)}</b></span></div>
      <div class="mp-grid">
        <aside class="mp-prev mp-box" aria-label="Vista previa">
          <h3>Así se ve</h3>
          ${previewHtml()}
          <div class="mp-acts"><button type="button" class="btn" data-mp="public">Ver mi perfil público</button><button type="button" class="btn ghost" data-mp="shop">Ir a la tienda</button></div>
          <div class="mp-ctrl"><label for="mpView">Vista de tu perfil público
            <select id="mpView"><option value="auto" ${v === 'auto' ? 'selected' : ''}>Automática (según el fondo)</option><option value="compact" ${v === 'compact' ? 'selected' : ''}>Vertical</option><option value="wide" ${v === 'wide' ? 'selected' : ''}>Horizontal</option></select>
          </label><p class="mp-note">Se recuerda en este navegador.</p></div>
        </aside>
        <div class="mp-main">
          ${ranks()}
          <section class="mp-sec" aria-label="Cosméticos"><div class="mp-sec-head"><h3>Cosméticos <small>usa lo que ya tienes</small></h3><p>Equipa o quita marcos, efectos de nombre y fondos. Para conseguir más, visita la tienda.</p></div>
            ${tiles('frame', 'Marco de avatar', 'Rodea tu foto en el ranking, el chat y tu perfil.')}
            ${tiles('name_effect', 'Efecto de nombre', 'Cambia cómo se ve tu nombre donde apareces.')}
            ${tiles('background', 'Fondo de perfil', 'Decora el fondo de tu tarjeta de perfil público.')}
          </section>
          ${privacy()}
        </div>
      </div>`;
  }
  async function mpAct(kind, id, type) {
    if (busy || !wallet) return; setBusy(true);
    const prev = JSON.parse(JSON.stringify(eqOf()));
    wallet.equipped = wallet.equipped || {};
    if (kind === 'equip') { const c = COS.get(id); if (!c) { setBusy(false); return; } wallet.equipped[c.type] = id; }
    else if (kind === 'unequip') wallet.equipped[type] = null;
    else wallet.equipped.rank = id === '' ? null : Number(id);
    mpRender();
    const res = kind === 'rank' ? await shopApi('/shop/rank', {rank_id: wallet.equipped.rank})
      : kind === 'equip' ? await shopApi('/shop/equip', {cosmetic_id: id}) : await shopApi('/shop/unequip', {type});
    setBusy(false);
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
      if (sess) { const ok = await shopApi('/shop/session'); if (ok.ok) { await loadWallet(); const g = await shopApi('/shop/profile'); PS = g && g.ok ? g.settings : null; } }
      await RankEngine.init(db); mpRender();
    })();
  }
  const closeMp = () => modalOff(modal);
  mpBtn.onclick = openMp; $('mpClose').onclick = closeMp;
  modal.addEventListener('click', (e) => { if (e.target === modal) { closeMp(); return; }
    const b = e.target.closest('[data-mp]'); if (!b || b.disabled) return; const k = b.dataset.mp;
    if (k === 'public') { closeMp(); openProfile(sess.user); }
    else if (k === 'shop') { closeMp(); window.openShop && window.openShop(); }
    else if (k === 'bday') { const d = +$('psDay').value; if (!d) return mpMsg('Escribe el día.', false); savePS({ birthday_month: +$('psMonth').value, birthday_day: d }); }
    else if (k === 'bdayclear') savePS({ birthday_month: null, birthday_day: null });
    else mpAct(k, b.dataset.id, b.dataset.type); });
  modal.addEventListener('change', (e) => { if (e.target.id === 'mpView') { try { if (e.target.value === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, e.target.value); } catch {} mpMsg('Vista guardada ✔'); } });
  modal.addEventListener('change', (e) => { const k = e.target.dataset.ps; if (k) savePS({ [k]: e.target.checked }); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeMp(); });
})();
