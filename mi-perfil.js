/* mi-perfil.js — edición del perfil propio en /mi-perfil.
   Requiere sesión de Kick; sin ranking explica cómo entrar. Sin modal, sin selector
   de vista y sin sección de fondos (en pausa): insignia, marcos, efectos, privacidad,
   regalos y cumpleaños siguen igual que antes. */
(() => {
  const root = document.getElementById('miperfil-body');
  if (!root) return;

  let busy = false, msgT, PS = null;
  const setBusy = (on) => { busy = !!on; document.querySelector('#miperfil-body .mp-page')?.classList.toggle('is-busy', busy); };
  const mpMsg = (t, ok = true) => {
    const m = $('mpMsg'); if (!m) return;
    m.style.color = ok ? 'var(--leaf)' : '#ff8a6a';
    m.textContent = t || '';
    clearTimeout(msgT);
    if(t) msgT = setTimeout(() => { if($('mpMsg')) $('mpMsg').textContent = ''; }, 4200);
  };
  const eqOf = () => wallet?.equipped || {};
  const shownDef = () => RankEngine.shownFor(wallet?.level, eqOf().rank);
  const publicUrl = () => `/@${encodeURIComponent(wallet?.username || sess?.user || '')}`;

  const stateHtml = (title, text, extra = '') => `<div class="mp-page" style="grid-template-columns:1fr">
    <div class="mp-col"><section class="panel mp-card">
      <h1 class="mp-h">${title}</h1>
      <p class="mp-note">${text}</p>
      <div class="mp-acts" style="margin-top:.7rem">${extra}</div>
    </section></div></div>`;

  function stateLogin(){
    setBusy(false);
    root.innerHTML = stateHtml('Iniciá sesión', 'Conectá tu cuenta de Kick para personalizar tu perfil, equipar cosméticos y elegir tu insignia.',
      `<a class="btn" href="${FN_URL}/login/start" data-login="/mi-perfil">Iniciar sesión con Kick</a>
       <a class="btn ghost" href="/">Volver al ranking</a>`);
  }
  function stateNoRank(){
    setBusy(false);
    root.innerHTML = stateHtml('Todavía no estás en el ranking',
      `La sesión está activa como <b>@${esc(sess?.user || '')}</b>, pero tu cuenta no aparece en el ranking. Escribí en el chat durante un directo para sumar tu primer presente y desbloquear el perfil.`,
      `<a class="btn" href="/">Ir al ranking</a>
       <button type="button" class="btn ghost" data-mp="logout">Cerrar sesión</button>`);
  }
  function stateLoading(){
    root.innerHTML = `<div class="mp-page" style="grid-template-columns:1fr"><div class="mp-col">
      <section class="panel mp-card" aria-busy="true"><h1 class="mp-h">Mi perfil</h1><p class="mp-note" role="status">Cargando tu cuenta…</p></section>
    </div></div>`;
  }

  function previewHtml(){
    const e = eqOf(), u = {...wallet, frame_id: e.frame || '', name_id: e.name_effect || ''}, d = shownDef(), lvl = wallet.level ?? 0;
    return `<div class="mp-prev-stack" aria-label="Vista previa de tu perfil">
      <div><div class="mp-mini-label">Perfil</div>
        <div class="mp-pv-card"><div class="mh">${avatarF(u, 64)}<div class="mh-info"><b class="mp-pv-name">${nameHtml(u)}</b><p>@${esc(u.username)} · Nv. ${lvl}</p></div></div>
          <div class="rankrow" style="margin:0">${sprite(d.key, 28)}<b>${esc(d.title)}</b></div></div></div>
      <div><div class="mp-mini-label">Chat</div>
        <div class="mp-chat" aria-label="Así se ve en el chat"><small>12:34</small>${sprite(d.key, 18)}<b>${nameHtml(u)}</b><span>:</span><span style="font-weight:600">¡Hola a todos!</span></div></div>
      <div><div class="mp-mini-label">Ranking</div>
        <div class="row" style="padding:.35rem .2rem 0"><span class="rk">1</span>${avatarF(u, 40)}<span class="info"><b>${nameHtml(u)}<span class="lvl">Nv. ${lvl}</span></b><small class="rk2">${sprite(d.key, 14)}<span>${esc(d.title)}</span></small></span></div></div>
    </div>`;
  }

  function tiles(type, label, hint){
    const e = eqOf(), own = [...COS.values()].filter(c => c.type === type && wallet.owned?.includes(c.id));
    const none = `<button type="button" class="mp-it mp-none ${e[type] ? '' : 'on'}" data-mp="unequip" data-type="${type}" aria-pressed="${!e[type]}"><span class="mp-vis">—</span><span class="n">Ninguno</span></button>`;
    const body = own.map(c => {
      const on = e[type] === c.id, v = type === 'frame' ? avatarF({...wallet, frame_id: c.id}, 48)
        : `<span style="font-size:1.1rem;font-family:var(--display);font-weight:700">${nameHtml({...wallet, name_id: c.id})}</span>`;
      return `<button type="button" class="mp-it ${on ? 'on' : ''}" data-mp="equip" data-id="${esc(c.id)}" aria-pressed="${on}" aria-label="${esc(c.name)}${on ? ', en uso' : ''}"><span class="mp-vis">${v}</span><span class="n" title="${esc(c.name)}">${esc(c.name)}</span></button>`;
    }).join('');
    const empty = own.length ? '' : `<div class="mp-empty"><p class="mp-hint" style="margin:0">Todavía no tenés ${label.toLowerCase()}.</p><a class="btn ghost" href="/tienda">Ver en la tienda</a></div>`;
    return `<div><div class="mp-sub"><span>${esc(label)}</span><small>${own.length ? `${nf(own.length)} ${own.length === 1 ? 'tuyo' : 'tuyos'}` : '0 tuyos'}</small></div>
      ${hint ? `<p class="mp-note" style="margin-top:0">${esc(hint)}</p>` : ''}
      <div class="mp-tiles" role="group" aria-label="${esc(label)}">${none}${body}</div>${empty}</div>`;
  }

  function ranks(){
    const e = eqOf(), auto = RankEngine.of(wallet.level), sel = e.rank != null && RankEngine.byId(e.rank) && RankEngine.byId(e.rank).min_level <= wallet.level ? e.rank : null;
    const rows = RankEngine.all().map(d => {
      const locked = d.min_level > wallet.level, on = sel === d.id;
      const meta = locked ? `<span class="mp-lock">🔒 Nv. ${d.min_level}</span>` : (on ? '<span class="mp-tag">En uso</span>' : `<span class="mp-lock">Desde nv. ${d.min_level}</span>`);
      return `<button type="button" class="mp-rk ${on ? 'on' : ''}" data-mp="rank" data-id="${d.id ?? ''}" ${locked ? 'disabled' : ''} aria-pressed="${on}">${sprite(d.key, 30)}<span class="mp-rk-txt"><b>${esc(d.title)}</b><small>${locked ? 'Se desbloquea al llegar al nivel ' + d.min_level : 'Disponible para mostrar en tu perfil'}</small></span>${meta}</button>`;
    }).join('');
    const autoOn = sel === null;
    return `<section class="panel mp-card" aria-labelledby="mpRanks">
      <h2 id="mpRanks" class="mp-h">Insignia de rango <small>solo cambia lo visible</small></h2>
      <p class="mp-note">Tu nivel y tu XP no cambian. Podés mostrar la insignia de tu nivel actual o una que ya hayas desbloqueado.</p>
      <div class="mp-list" style="margin-top:.55rem">
        <button type="button" class="mp-rk ${autoOn ? 'on' : ''}" data-mp="rank" data-id="" aria-pressed="${autoOn}">${sprite(auto.key, 30)}<span class="mp-rk-txt"><b>Automática</b><small>Usa la insignia de tu nivel actual: ${esc(auto.title)}</small></span>${autoOn ? '<span class="mp-tag">En uso</span>' : '<span class="mp-lock">Recomendada</span>'}</button>
        ${rows}
      </div></section>`;
  }

  const MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  function privacy(){
    if(!PS) return `<section class="panel mp-card" aria-labelledby="mpPriv">
      <h2 id="mpPriv" class="mp-h">Privacidad y cumpleaños</h2>
      <p class="mp-note">No se pudieron cargar tus ajustes. Probá recargar la página; si sigue igual, avisale al equipo del canal.</p></section>`;
    const hasBday = !!PS.birthday_month;
    const monthOpts = [`<option value="" ${hasBday ? '' : 'selected'} disabled>Mes</option>`].concat(MES.map((m, i) => `<option value="${i + 1}" ${PS.birthday_month === i + 1 ? 'selected' : ''}>${m}</option>`)).join('');
    return `<section class="panel mp-card" aria-labelledby="mpPriv">
      <h2 id="mpPriv" class="mp-h">Privacidad y cumpleaños <small>vos decidís qué se muestra</small></h2>
      <p class="mp-note">Estos ajustes controlan lo que otras personas pueden ver o hacer desde tu perfil.</p>
      <div class="mp-form" style="margin-top:.55rem">
        <label class="mp-chk"><input type="checkbox" data-ps="inventory_public" ${PS.inventory_public ? 'checked' : ''}><span><b>Mostrar mis cosméticos</b><br><span class="mp-note">Permite que se vea tu colección en tu perfil público.</span></span></label>
        <label class="mp-chk"><input type="checkbox" data-ps="allow_gifts" ${PS.allow_gifts ? 'checked' : ''}><span><b>Permitir regalos</b><br><span class="mp-note">Otras personas podrán regalarte cosméticos desde la tienda.</span></span></label>
        <div class="mp-bday">
          <b style="font-size:.95rem">Cumpleaños</b>
          <p class="mp-note">Solo se guarda el día y el mes (nunca el año). Por defecto es privado.</p>
          <div class="mp-bday-row">
            <label for="psDay">Día</label><input id="psDay" type="number" min="1" max="31" placeholder="Día" value="${PS.birthday_day ?? ''}" aria-label="Día">
            <label for="psMonth">Mes</label><select id="psMonth" aria-label="Mes">${monthOpts}</select>
            <button type="button" class="btn" data-mp="bday">Guardar fecha</button>
            ${hasBday ? '<button type="button" class="btn ghost" data-mp="bdayclear">Borrar</button>' : ''}
          </div>
          <label class="mp-chk" style="margin-top:.1rem"><input type="checkbox" data-ps="birthday_public" ${PS.birthday_public ? 'checked' : ''} ${hasBday ? '' : 'disabled'}><span>Mostrar mi cumpleaños en mi perfil público${hasBday ? '' : ' <span class="mp-note">(guardá una fecha primero)</span>'}</span></label>
        </div>
      </div></section>`;
  }

  function render(){
    setBusy(false);
    mpMsg('');
    if(!sess) return stateLogin();
    if(!wallet) return stateNoRank();
    const lvl = wallet.level ?? 0;
    root.innerHTML = `<p class="mp-lead">Personalizá cómo te ven en el ranking, el chat y tu perfil público. Los cambios se guardan al instante.</p>
      <div class="mp-summary" aria-label="Resumen de tu cuenta">
        <span class="mp-pill"><b>${nf(wallet.balance ?? 0)}</b> XP disponibles</span>
        <span class="mp-pill">Nivel <b>${nf(lvl)}</b></span>
        <span class="mp-pill"><b>${nf(eqCount())}</b> cosméticos en uso</span>
      </div>
      <div class="mp-page">
        <aside class="panel mp-card mp-prev" aria-label="Vista previa">
          <h2 class="mp-h">Así se ve <small>sin fondo</small></h2>
          ${previewHtml()}
          <div class="mp-acts" style="margin-top:.8rem">
            <a class="btn" href="${publicUrl()}">Ver mi perfil público</a>
            <a class="btn ghost" href="/tienda">Ir a la tienda</a>
          </div>
          <div class="mp-box-actions" style="margin-top:.7rem">
            <p class="mp-note">Los fondos de perfil están en pausa mientras rediseñamos la ficha pública. Si ya compraste alguno, queda guardado y vuelve cuando se active.</p>
            <button type="button" class="linkbtn" data-mp="logout">Cerrar sesión</button>
          </div>
        </aside>
        <div class="mp-col">
          ${ranks()}
          <section class="panel mp-card" aria-labelledby="mpCos">
            <h2 id="mpCos" class="mp-h">Cosméticos <small>usá lo que ya tenés</small></h2>
            <p class="mp-note">Equipá o quitá marcos y efectos de nombre. Para conseguir más, visitá la tienda.</p>
            <div class="mp-form" style="margin-top:.55rem">
              ${tiles('frame', 'Marco de avatar', 'Rodea tu foto en el ranking, el chat y tu perfil.')}
              ${tiles('name_effect', 'Efecto de nombre', 'Cambia cómo se ve tu nombre donde apareces.')}
            </div>
          </section>
          ${privacy()}
        </div>
      </div>`;
  }

  const eqCount = () => wallet ? ['frame', 'name_effect', 'badge'].filter(t => eqOf()[t === 'badge' ? 'rank' : t]).length : 0;

  async function savePS(patch){
    if(busy || !wallet) return; setBusy(true);
    const r = await shopApi('/shop/profile', patch);
    if(!r || !r.ok){
      mpMsg(r?.reason === 'invalid' ? 'Esa fecha no es válida. Revisá el día y el mes.' : 'No se pudo guardar. Intentá otra vez.', false);
      try { const g = await shopApi('/shop/profile'); if(g && g.ok) PS = g.settings; } catch {}
      setBusy(false); render(); return;
    }
    PS = r.settings; setBusy(false); render(); mpMsg('Guardado ✔');
  }

  async function mpAct(kind, id, type){
    if(busy || !wallet) return; setBusy(true);
    const prev = JSON.parse(JSON.stringify(eqOf()));
    wallet.equipped = {...eqOf()};
    if(kind === 'equip'){ const c = COS.get(id); if(!c){ setBusy(false); return; } wallet.equipped[c.type] = id; }
    else if(kind === 'unequip') wallet.equipped[type] = null;
    else if(kind === 'rank') wallet.equipped.rank = id === '' ? null : Number(id);
    render();
    const res = kind === 'rank' ? await shopApi('/shop/rank', {rank_id: wallet.equipped.rank})
      : kind === 'equip' ? await shopApi('/shop/equip', {cosmetic_id: id}) : await shopApi('/shop/unequip', {type});
    setBusy(false);
    if(!res || !res.ok){
      wallet.equipped = prev; render();
      return mpMsg(({locked: 'Todavía no desbloqueaste ese rango.', item_not_found: 'Ese rango ya no está disponible.', not_owned: 'Primero tenés que comprarlo.', no_session: 'Tu sesión venció: iniciá sesión de nuevo.'})[res?.reason]
        || (kind === 'rank' ? 'No se pudo guardar la insignia.' : 'No se pudo guardar. Intentá otra vez.'), false);
    }
    try { await loadWallet(); } catch {}
    render(); mpMsg('Guardado ✔');
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mp]'); if(!b || b.disabled) return;
    const k = b.dataset.mp;
    if(k === 'logout') return logout(true);
    if(k === 'bday'){
      const d = +$('psDay').value;
      if(!d || d < 1 || d > 31) return mpMsg('Escribí un día entre 1 y 31.', false);
      return savePS({ birthday_month: +$('psMonth').value, birthday_day: d });
    }
    if(k === 'bdayclear') return savePS({ birthday_month: null, birthday_day: null });
    return mpAct(k, b.dataset.id, b.dataset.type);
  });
  root.addEventListener('change', (e) => {
    const k = e.target.dataset.ps; if(k) savePS({ [k]: e.target.checked });
  });

  (async function boot(){
    if(!sess){ return stateLogin(); }
    stateLoading();
    try {
      if(!COS.size) await loadCosmetics();
      if(window.RankEngine) await RankEngine.init(db);
      await ensureSession();
      if(!sess) return stateLogin();
      if(!wallet) return stateNoRank();
      const g = await shopApi('/shop/profile');
      PS = g && g.ok ? g.settings : null;
      render();
    } catch(err){
      console.error(err);
      render();
    }
  })();
})();
