/* perfil.js — perfil público en /@usuario (rewrite de Vercel a perfil.html?u=…).
   Ficha de dos columnas: identidad y stats a la izquierda, colección y misiones a la
   derecha. Sin fondo cosmético y sin fondos en la colección mientras estén en pausa. */
(() => {
  const root = document.getElementById('pfRoot');
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const requested = (params.get('u') || '').trim();
  const username = normUser(requested);
  const fondosOn = !(window.FEATURES && window.FEATURES.fondos === false);
  const TIPOS = { frame: 'Marcos', name_effect: 'Efectos de nombre', badge: 'Insignias', background: 'Fondos' };
  const collTypes = fondosOn ? ['frame', 'name_effect', 'background', 'badge'] : ['frame', 'name_effect', 'badge'];

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
    root.innerHTML = `<div class="pf-page"><div class="pf-col" style="grid-column:1/-1">
      <section class="panel pf-card" aria-busy="true" aria-label="Cargando perfil">
        <div class="pf-load" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <p class="pf-note" role="status">Cargando perfil…</p>
      </section></div></div>`;
  };

  function searchPanel(title, text){
    root.innerHTML = `<div class="pf-page"><div class="pf-col" style="grid-column:1/-1">
      <section class="panel pf-card pf-state">
        <h1>${title}</h1>
        <p>${text}</p>
        <form class="pf-search" data-search novalidate>
          <label class="sr" for="pfQ">Usuario de Kick</label>
          <input id="pfQ" name="pfQ" type="search" placeholder="Usuario de Kick…" autocomplete="off" value="${esc(requested)}">
          <button type="submit" class="btn">Buscar perfil</button>
        </form>
        <p><a class="btn ghost" href="/">Volver al ranking</a></p>
      </section></div></div>`;
    const form = root.querySelector('[data-search]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = normUser(new FormData(form).get('pfQ'));
      if(q) location.href = `/@${encodeURIComponent(q)}`;
      else form.querySelector('input').focus();
    });
  }

  function errorPanel(){
    root.innerHTML = `<div class="pf-page"><div class="pf-col" style="grid-column:1/-1">
      <section class="panel pf-card pf-state">
        <h1>No pudimos cargar el perfil</h1>
        <p>Hubo un problema al pedir los datos. Revisá tu conexión y probá de nuevo.</p>
        <p><button type="button" class="btn" data-retry>Reintentar</button> <a class="btn ghost" href="/">Volver al ranking</a></p>
      </section></div></div>`;
    root.querySelector('[data-retry]').addEventListener('click', () => load());
  }

  const pair = (l1, v1, l2, v2) => `<div class="pair"><div><span>${l1}</span><b>${v1}</b></div><div><span>${l2}</span><b>${v2}</b></div></div>`;

  function cosTile(c, u, on){
    const v = c.type === 'frame' ? avatarF({ ...u, frame_id: c.id }, 40)
      : c.type === 'name_effect' ? `<span style="font-size:1rem;font-family:var(--display);font-weight:700">${nameHtml({ ...u, name_id: c.id })}</span>`
      : c.type === 'badge' ? (() => {
          const rk = window.RankEngine && RankEngine.byId ? RankEngine.byId(c.rank_id) : null;
          return rk ? sprite(rk.key, 40) : (c.url ? `<img src="${esc(c.url)}" width="40" height="40" style="object-fit:contain;image-rendering:pixelated" alt="">` : '<span style="font-size:1.4rem">🏅</span>');
        })()
      : `<div class="swatch ${c.css}" style="${c.url ? `background-image:url('${esc(c.url)}');background-size:cover;background-position:center bottom;image-rendering:pixelated` : ''}"></div>`;
    return `<div class="cos${on ? ' on' : ''}" title="${esc(c.name)}"><span class="cosv">${v}</span><small>${esc(c.name)}${on ? ' · puesto' : ''}</small></div>`;
  }

  function collectionHtml(u, pp){
    if(!pp) return '<p class="pf-empty-note">La colección no está disponible en este momento.</p>';
    if(pp.owned == null) return '<p class="pf-empty-note">🔒 Esta persona mantiene su colección de cosméticos en privado.</p>';
    const items = (pp.owned || []).map(id => COS.get(id)).filter(c => c && collTypes.includes(c.type));
    if(!items.length) return '<p class="pf-empty-note">Todavía no tiene cosméticos.</p>';
    const eq = new Set([u.frame_id, u.name_id]);
    return collTypes.map(t => {
      const l = items.filter(c => c.type === t); if(!l.length) return '';
      return `<h3 class="pf-sub">${TIPOS[t]}</h3><div class="cosgrid">${l.map(c => cosTile(c, u, eq.has(c.id))).join('')}</div>`;
    }).join('');
  }

  function rankBlock(u){
    const title = u.rank_title || rankOf(u.level)[1];
    const start = Number(u.xp_level_start) || 0, next = Number(u.xp_next) || start;
    const span = Math.max(1, next - start);
    const pct = Math.max(0, Math.min(100, Math.round((Number(u.xp) - start) / span * 100)));
    const nt = nextTier(u.level);
    const falta = Math.max(0, next - Number(u.xp));
    return `<div class="m-progress">
      <div class="rankrow">${sprite(RankEngine.keyOfUser(u), 44)}<div><b>${esc(title)}</b><span>Nivel ${u.level}</span></div></div>
      <div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i><em>${nf(u.xp)} / ${nf(u.xp_next)} XP</em></div>
      <p class="xpnote">${falta === 1 ? 'Falta' : 'Faltan'} ${nf(falta)} XP para el nivel ${u.level + 1}.${nt ? ` Siguiente rango: ${esc(nt[1])} (nivel ${nt[0]}).` : ' Alcanzaste el rango máximo.'}</p>
    </div>`;
  }

  function bdayLine(pp){
    const bd = pp?.birthday;
    if(!bd) return '';
    return bdayToday(bd)
      ? ' · <span class="today">🎉 ¡Hoy cumple años!</span>'
      : ` · 🎂 ${esc(fmtBday(bd))}`;
  }

  function render(u, qs, pp){
    setMeta(u);
    const own = !!sess && normUser(sess.user) === normUser(u.username);
    const title = u.rank_title || rankOf(u.level)[1];
    const quests = Array.isArray(qs) ? qs : [];
    const stats = [
      ['Presentes y rachas', [
        pair('Presentes totales', nf(u.total_presentes), 'Puesto en presentes', `#${nf(u.presentes_rank)}`),
        pair('Racha actual', `${u.streak} ${plural(u.streak, 'día', 'días')}`, 'Mejor racha', `${u.best_streak} ${plural(u.best_streak, 'día', 'días')}`),
      ]],
      ['Chat y comunidad', [
        pair('Mensajes totales', nf(u.total_messages), 'Puesto en el chat', `#${nf(u.chat_rank)}`),
        pair('Mensajes hoy', nf(u.messages_today), 'Mensajes últimos 7 días', nf(u.messages_7d)),
      ]],
      ['Tiempo activo', [
        pair('Tiempo activo total', fmtMin(u.active_total), 'Puesto en tiempo activo', `#${nf(u.active_rank)}`),
        pair('Tiempo activo hoy', fmtMin(u.active_today), 'Tiempo activo últimos 7 días', fmtMin(u.active_7d)),
      ]],
      ['Cuenta', [
        pair('XP total', nf(u.xp), 'Puesto en XP', `#${nf(u.xp_rank)}`),
        pair('Miembro desde', fmtDay(u.member_since), 'Último presente', ago(u.last_presente_at)),
      ]],
    ].map(([h, pairs]) => `<div><h3 class="pf-sub">${h}</h3><div class="pf-pairs">${pairs.join('')}</div></div>`).join('');

    root.innerHTML = `<div class="pf-page">
      <div class="pf-col">
        <section class="panel pf-card pf-id" aria-labelledby="pfName">
          <div class="mh">${avatarF(u, 96)}<div class="mh-info">
            <h1 id="pfName" class="pf-name">${nameHtml(u)}</h1>
            <p class="pf-handle">@${esc(u.username)}${bdayLine(pp)}</p>
            <div class="pf-chips" aria-label="Resumen">
              <span class="m-chip gold"><b>Nv. ${u.level}</b></span>
              <span class="m-chip"><b>${nf(u.total_presentes)}</b> presentes</span>
              <span class="m-chip green"><b>${u.streak}</b> de racha</span>
            </div>
          </div></div>
          ${rankBlock(u)}
          <div class="pf-acts">
            <button type="button" class="btn" data-share>Compartir perfil</button>
            ${own ? '<a class="btn ghost" href="/mi-perfil">Editar mi perfil</a>' : ''}
            <a class="btn ghost" href="/">Ver el ranking</a>
          </div>
          <p id="pfMsg" class="pf-status" role="status" aria-live="polite"></p>
        </section>
        <section class="panel pf-card pf-stats" aria-labelledby="pfStats">
          <h2 id="pfStats" class="pf-h">Estadísticas</h2>
          <div class="pf-groups">${stats}</div>
        </section>
      </div>
      <div class="pf-col">
        <section class="panel pf-card pf-coll" aria-labelledby="pfColl">
          <h2 id="pfColl" class="pf-h">Colección <small>${esc(title)}</small></h2>
          ${collectionHtml(u, pp)}
        </section>
        <section class="panel pf-card pf-quests" aria-labelledby="pfQuests">
          <h2 id="pfQuests" class="pf-h">Misiones <small>hoy y esta semana</small></h2>
          <div class="quests">${quests.length ? quests.map(q => questCard(q, true)).join('') : '<p class="pf-note">No hay misiones para mostrar.</p>'}</div>
        </section>
      </div>
    </div>`;

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
    } catch(err){
      console.error(err);
      errorPanel();
    }
  }

  load();
})();
