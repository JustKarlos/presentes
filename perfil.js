/* perfil.js — perfil público en /@usuario (rewrite de Vercel a perfil.html?u=…).
   Secciones a ancho completo: hero, estadísticas (4 categorías), colección y misiones.
   Sin fondo cosmético y sin fondos en la colección mientras estén en pausa. */
(() => {
  const root = document.getElementById('pfRoot');
  if (!root) return;

  const params = new URLSearchParams(location.search);
  let requested = (params.get('u') || '').trim();
  if (!requested) {
    const m = location.pathname.match(/^\/@(.+?)\/?$/);
    if (m) requested = decodeURIComponent(m[1]).trim();
  }
  const username = normUser(requested);
  const fondosOn = !(window.FEATURES && window.FEATURES.fondos === false);
  const TIPOS = { frame: 'Marcos', name_effect: 'Efectos de nombre', badge: 'Insignias', background: 'Fondos', profile_set: 'Sets de perfil' };
  const collTypes = fondosOn ? ['frame', 'name_effect', 'background', 'profile_set', 'badge'] : ['frame', 'name_effect', 'profile_set', 'badge'];

  const canonical = (u) => `${SITE_URL}/@${encodeURIComponent(u)}`;
  function setMeta(u){
    const link = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if(u){
      const name = u.display_name || u.username;
      document.title = `${name} (@${u.username}) · Ranking de presentes`;
      if(link) link.href = canonical(u.username);
      if(ogUrl) ogUrl.content = canonical(u.username);
      const d = document.querySelector('meta[name="description"]');
      if(d) d.content = `Perfil de ${name} en el ranking: nivel ${u.level}, ${nf(u.total_presentes)} presentes y ${nf(u.total_messages)} mensajes.`;
    } else {
      document.title = 'Perfil no encontrado · Ranking de presentes';
      if(link) link.href = `${SITE_URL}/`;
    }
  }

  const loading = () => {
    root.innerHTML = `<div class="pf-page">
      <section class="panel pf-card pf-span" aria-busy="true" aria-label="Cargando perfil">
        <div class="pf-load" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <p class="pf-note" role="status">Cargando perfil…</p>
      </section></div>`;
  };

  function searchPanel(title, text){
    root.innerHTML = `<div class="pf-page">
      <section class="panel pf-card pf-span pf-state">
        <h1>${title}</h1>
        <p>${text}</p>
        <form class="pf-search" data-search novalidate>
          <label class="sr" for="pfQ">Usuario de Kick</label>
          <input id="pfQ" name="pfQ" type="search" placeholder="Usuario de Kick…" autocomplete="off" value="${esc(requested)}">
          <button type="submit" class="btn">Buscar perfil</button>
        </form>
        <p><a class="btn ghost" href="/">Volver al ranking</a></p>
      </section></div>`;
    const form = root.querySelector('[data-search]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = normUser(new FormData(form).get('pfQ'));
      if(q) location.href = `/@${encodeURIComponent(q)}`;
      else form.querySelector('input').focus();
    });
  }

  function errorPanel(){
    root.innerHTML = `<div class="pf-page">
      <section class="panel pf-card pf-span pf-state">
        <h1>No pudimos cargar el perfil</h1>
        <p>Hubo un problema al pedir los datos. Revisá tu conexión y probá de nuevo.</p>
        <p><button type="button" class="btn" data-retry>Reintentar</button> <a class="btn ghost" href="/">Volver al ranking</a></p>
      </section></div>`;
    root.querySelector('[data-retry]').addEventListener('click', () => load());
  }

  const hasNameEffect = (u) => {
    const id = u.name_id ?? u.equipped_name_effect_id ?? u.equipped?.name_effect;
    if(!id) return false;
    if(window.PaintEngine && COS.get(id)?.meta?.paint) return true;
    return !!cosClass(id);
  };

  function heroName(u){
    if(hasNameEffect(u)) return `<h1 id="pfName" class="pf-name">${nameHtml(u)}</h1>`;
    return `<h1 id="pfName" class="pf-name pf-name-plain">${esc(u.display_name || u.username || '')}</h1>`;
  }

  function bdayPill(pp){
    const bd = pp?.birthday;
    if(!bd) return '';
    const label = bdayToday(bd) ? `🎉 ${esc(fmtBday(bd))}` : `🎂 ${esc(fmtBday(bd))}`;
    return `<span class="pf-bday">${label}</span>`;
  }

  function rankBlock(u){
    const title = u.rank_title || rankOf(u.level)[1];
    const start = Number(u.xp_level_start) || 0, next = Number(u.xp_next) || start;
    const span = Math.max(1, next - start);
    const pct = Math.max(0, Math.min(100, Math.round((Number(u.xp) - start) / span * 100)));
    const nt = nextTier(u.level);
    const falta = Math.max(0, next - Number(u.xp));
    return `<div class="pf-rank-card">
      <div class="pf-rank-head">${sprite(RankEngine.keyOfUser(u), 44)}<div class="pf-rank-titles"><b>${esc(title)}</b><span>Nivel ${nf(u.level)}</span></div></div>
      <div class="xpbar pf-xpbar" role="progressbar" aria-label="Progreso de XP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i><em>${nf(u.xp)} / ${nf(u.xp_next)} XP</em></div>
      <p class="pf-xpnote">${falta === 1 ? 'Falta' : 'Faltan'} ${nf(falta)} XP para el nivel ${nf(u.level + 1)}.${nt ? ` Siguiente rango: ${esc(nt[1])} (nivel ${nf(nt[0])}).` : ' Alcanzaste el rango máximo.'}</p>
    </div>`;
  }

  const isTop1 = (raw) => Number(raw) === 1 || String(raw) === '1' || String(raw) === '#1';
  function metric(label, value, top){
    const cls = top ? 'pf-metric-val is-top1' : 'pf-metric-val';
    return `<div class="pf-metric"><span class="pf-metric-label">${label}</span><b class="${cls}">${value}</b></div>`;
  }
  function statCard(title, items){
    return `<article class="pf-stat-card"><h3 class="pf-stat-title">${title}</h3><div class="pf-metric-grid">${items.map(i => metric(i[0], i[1], i[2])).join('')}</div></article>`;
  }

  function collectionBody(u, pp){
    if(!pp) return '<p class="pf-empty-note">La colección no está disponible en este momento.</p>';
    if(pp.owned == null) return '<p class="pf-empty-note">🔒 Esta persona mantiene su colección de cosméticos en privado.</p>';
    const items = (pp.owned || []).map(id => COS.get(id)).filter(c => c && collTypes.includes(c.type));
    if(!items.length) return '<p class="pf-empty-note">Todavía no tiene cosméticos.</p>';
    const eq = new Set([u.frame_id, u.name_id, u.badge_id, u.equipped_badge_id, u.equipped?.badge, setOf(u)?.id].filter(Boolean));
    const groups = collTypes.map(t => ({ t, label: TIPOS[t], list: items.filter(c => c.type === t) })).filter(g => g.list.length);
    if(!groups.length) return '<p class="pf-empty-note">Todavía no tiene cosméticos.</p>';

    const tabs = `<div class="pf-tabs" role="tablist" aria-label="Tipos de colección">${groups.map((g, i) =>
      `<button type="button" role="tab" class="pf-tab${i===0?' is-on':''}" id="pf-tab-${g.t}" aria-controls="pf-panel-${g.t}" aria-selected="${i===0?'true':'false'}" tabindex="${i===0?'0':'-1'}">${g.label}<span class="pf-tab-count">${g.list.length}</span></button>`
    ).join('')}</div>`;

    const panels = groups.map((g, i) => {
      const grid = `<div class="pf-coll-grid">${g.list.map(c => collItem(c, u, eq.has(c.id))).join('')}</div>`;
      return `<div role="tabpanel" class="pf-tabpanel${i===0?'':'[hidden]'}" id="pf-panel-${g.t}" aria-labelledby="pf-tab-${g.t}" ${i===0?'':'hidden'}>${grid}</div>`;
    }).join('').replace(/\[hidden\]/g, ' is-hidden');
    return tabs + panels;
  }

  function collItem(c, u, on){
    const badge = on ? '<span class="pf-equipped-badge">Equipado</span>' : '';
    if(c.type === 'name_effect'){
      const preview = `<span class="pf-ne-preview" style="font-size:1.35rem;font-family:var(--display);font-weight:700">${nameHtml({ ...u, name_id: c.id })}</span>`;
      return `<article class="pf-coll-item pf-coll-ne${on?' is-equipped':''}" title="${esc(c.name)}">${badge}<span class="pf-coll-vis">${preview}</span><span class="pf-coll-name">${esc(c.name)}</span></article>`;
    }
    let vis = '';
    if(c.type === 'frame'){
      vis = avatarF({ ...u, frame_id: c.id }, 56);
    } else if(c.type === 'badge'){
      const rk = window.RankEngine && RankEngine.byId ? RankEngine.byId(c.rank_id) : null;
      vis = rk ? sprite(rk.key, 48) : (c.url ? `<img src="${esc(c.url)}" width="48" height="48" style="object-fit:contain;image-rendering:pixelated" alt="">` : '<span style="font-size:1.6rem">🏅</span>');
    } else {
      vis = `<div class="swatch ${c.css}" style="${c.url ? `background-image:url('${esc(c.url)}');background-size:cover;background-position:center bottom;image-rendering:pixelated` : ''}"></div>`;
    }
    return `<article class="pf-coll-item${on?' is-equipped':''}" title="${esc(c.name)}">${badge}<span class="pf-coll-vis">${vis}</span><span class="pf-coll-name">${esc(c.name)}</span></article>`;
  }

  function pfQuestCard(q){
    const prog = Math.min(q.progress, q.target), pct = q.target ? Math.round(prog / q.target * 100) : 0;
    const done = !!q.completed;
    const status = done ? '¡Completada!' : `${nf(prog)}/${nf(q.target)}`;
    return `<article class="pf-quest${done ? ' is-done' : ''}">
      <div class="pf-quest-top"><span class="pf-quest-title">${esc(q.title)}</span><span class="pf-quest-xp">+${nf(q.xp_reward)} XP</span></div>
      <div class="xpbar pf-xpbar pf-xpbar-sm" role="progressbar" aria-label="${esc(q.title)}" aria-valuemin="0" aria-valuemax="${q.target}" aria-valuenow="${prog}"><i style="width:${pct}%"></i><em>${status}</em></div>
    </article>`;
  }

  function wireTabs(rootEl){
    const tabs = Array.from(rootEl.querySelectorAll('[role="tab"]'));
    const panels = Array.from(rootEl.querySelectorAll('[role="tabpanel"]'));
    if(tabs.length < 2) return;
    const activate = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(p => {
        const on = p.id === tab.getAttribute('aria-controls');
        p.hidden = !on;
        p.classList.toggle('is-hidden', !on);
      });
      if(focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab, false));
      tab.addEventListener('keydown', (e) => {
        let ni = i;
        if(e.key === 'ArrowRight') ni = (i + 1) % tabs.length;
        else if(e.key === 'ArrowLeft') ni = (i - 1 + tabs.length) % tabs.length;
        else if(e.key === 'Home') ni = 0;
        else if(e.key === 'End') ni = tabs.length - 1;
        else return;
        e.preventDefault();
        activate(tabs[ni], true);
      });
    });
  }

  function render(u, qs, pp){
    setMeta(u);
    const set = setOf(u) || setOf(pp);
    const own = !!sess && normUser(sess.user) === normUser(u.username);
    const title = u.rank_title || rankOf(u.level)[1];
    const quests = Array.isArray(qs) ? qs : [];

    const statsHtml = [
      statCard('Presentes y rachas', [
        ['Presentes totales', nf(u.total_presentes), false],
        ['Puesto en presentes', `#${nf(u.presentes_rank)}`, Number(u.presentes_rank) === 1],
        ['Racha actual', `${nf(u.streak)} ${plural(u.streak, 'día', 'días')}`, false],
        ['Mejor racha', `${nf(u.best_streak)} ${plural(u.best_streak, 'día', 'días')}`, false],
      ]),
      statCard('Chat y comunidad', [
        ['Mensajes totales', nf(u.total_messages), false],
        ['Puesto en el chat', `#${nf(u.chat_rank)}`, Number(u.chat_rank) === 1],
        ['Mensajes hoy', nf(u.messages_today), false],
        ['Mensajes últimos 7 días', nf(u.messages_7d), false],
      ]),
      statCard('Tiempo activo', [
        ['Tiempo activo total', fmtMin(u.active_total), false],
        ['Puesto en tiempo activo', `#${nf(u.active_rank)}`, Number(u.active_rank) === 1],
        ['Tiempo activo hoy', fmtMin(u.active_today), false],
        ['Tiempo activo últimos 7 días', fmtMin(u.active_7d), false],
      ]),
      statCard('Cuenta', [
        ['XP total', nf(u.xp), false],
        ['Puesto en XP', `#${nf(u.xp_rank)}`, Number(u.xp_rank) === 1],
        ['Miembro desde', fmtDay(u.member_since), false],
        ['Último presente', ago(u.last_presente_at), false],
      ]),
    ].join('');

    const bday = bdayPill(pp);

    root.innerHTML = `<div class="pf-page">
      <section class="panel pf-card pf-hero pf-span" aria-labelledby="pfName">
        <div class="pf-hero-inner">
          <div class="pf-hero-avatar">${avatarF(u, 110)}</div>
          <div class="pf-hero-id">
            <div class="pf-name-row">${heroName(u)}${bday}</div>
            <p class="pf-handle">@${esc(u.username)}</p>
            <div class="pf-summary-pills" aria-label="Resumen">
              <span class="pf-hero-pill">Nv. ${nf(u.level)}</span>
              <span class="pf-hero-pill">${nf(u.total_presentes)} presentes</span>
              <span class="pf-hero-pill">${nf(u.streak)} de racha</span>
            </div>
          </div>
        </div>
        ${rankBlock(u)}
        <div class="pf-acts">
          <button type="button" class="btn" data-share>Compartir perfil</button>
          ${own ? '<a class="btn ghost" href="/mi-perfil">Editar mi perfil</a>' : ''}
          <a class="btn ghost" href="/">Ver el ranking</a>
        </div>
        <p id="pfMsg" class="pf-status" role="status" aria-live="polite"></p>
      </section>

      <section class="panel pf-card pf-stats pf-span" aria-labelledby="pfStats">
        <h2 id="pfStats" class="pf-h">Estadísticas</h2>
        <div class="pf-stats-grid">${statsHtml}</div>
      </section>

      <section class="panel pf-card pf-coll pf-span" aria-labelledby="pfColl">
        <div class="pf-coll-head"><h2 id="pfColl" class="pf-h pf-h-tight">Colección</h2><span class="pf-role-badge">${esc(title)}</span></div>
        <div class="pf-coll-body">${collectionBody(u, pp)}</div>
      </section>

      <section class="panel pf-card pf-quests pf-span" aria-labelledby="pfQuests">
        <div class="pf-quests-head"><h2 id="pfQuests" class="pf-h pf-h-tight">Misiones</h2><p class="pf-quests-sub">hoy y esta semana</p></div>
        <div class="pf-quests-grid">${quests.length ? quests.map(pfQuestCard).join('') : '<p class="pf-empty-note">No hay misiones para mostrar.</p>'}</div>
      </section>
    </div>`;

    /* Set de perfil: fondo, variables --pf-* y toggles de arte. Sin set se limpia
       cualquier var inline que haya dejado un render anterior en esta página. */
    const setVarsMap = setVars(set?.meta);
    if(set && set.url) document.body.style.setProperty('--bg-img', `url("${set.url}")`);
    else document.body.style.removeProperty('--bg-img');
    applySetVars(document.body, set?.meta);
    const bodyCls = document.body.classList;
    bodyCls.toggle('has-set', !!set);
    bodyCls.toggle('has-pill-art', !!setVarsMap['--pf-pill-img']);
    bodyCls.toggle('has-card-art', !!setVarsMap['--pf-card-img']);

    wireTabs(root);

    const shareBtn = root.querySelector('[data-share]');
    const msg = root.querySelector('#pfMsg');
    const say = (t) => { msg.textContent = t; clearTimeout(say.t); say.t = setTimeout(() => { if(msg) msg.textContent = ''; }, 4000); };
    shareBtn.addEventListener('click', async () => {
      const url = canonical(u.username);
      try {
        await navigator.clipboard.writeText(url);
        say('Enlace copiado. Ya podés pegarlo donde quieras.');
      } catch {
        window.prompt('Copiá el enlace del perfil:', url);
      }
    });
  }

  async function load(){
    if(!username){ setMeta(null); searchPanel('Perfil público', 'Escribí el usuario de Kick de la persona que querés ver. También podés entrar desde el ranking, el podio o la actividad en vivo.'); return; }
    loading();
    setMeta(null);
    try {
      await Promise.all([
        window.RankEngine ? RankEngine.init(db) : null,
        loadCosmetics(),
      ]);
      const [stats, quests, pub] = await Promise.all([
        db.rpc('get_user_stats', { p_username: username }),
        db.rpc('get_quests', { p_username: username }).then(r => r.data || null, () => null),
        db.rpc('get_public_profile', { p_username: username }).then(r => r.data || null, () => null),
      ]);
      if(stats.error){
        console.error('get_user_stats', stats.error);
        errorPanel(); return;
      }
      if(!stats.data){
        setMeta(null);
        searchPanel(`No encontramos a @${esc(requested || username)}`,
          'Puede que todavía no haya escrito <code>!presente</code> en el chat durante un directo, o que el nombre de usuario no sea exacto. Probá con el usuario de Kick tal como aparece en su perfil.');
        return;
      }
      render(stats.data, quests, pub);
      if (typeof preloadPaintImages === 'function') {
        const paintIds = [stats.data.name_id, ...(pub && Array.isArray(pub.owned) ? pub.owned : [])].filter(Boolean);
        preloadPaintImages(paintIds.length ? paintIds : null);
      }
    } catch(err){
      console.error(err);
      errorPanel();
    }
  }

  load();
})();
