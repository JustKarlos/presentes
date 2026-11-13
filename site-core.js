/* site-core.js — núcleo compartido del sitio (ranking, tienda, perfiles).
   Script clásico: expone globales para las páginas; no usa módulos ni build.
   Se carga después de paint-engine.js y rank-engine.js. */
(() => {
  if (window.__siteCore) return;
  window.__siteCore = true;

  /* ---------- configuración ---------- */
  const CONFIG = {
    SUPABASE_URL:      "https://nlgkpoomhgehuabrkwhp.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ2twb29taGdlaHVhYnJrd2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NjE3NzAsImV4cCI6MjEwNzMzNzc3MH0.DM1cUzclLbu8ej8m7PAQEja6X20gBadNiuqMEzbk-_g",
    CHANNEL_NAME:      "Juliococi",
    KICK_CHANNEL:      "juliococi",
    BACKGROUND_IMAGE:  "",
  };
  const SITE_URL = "https://presentescoci.vercel.app";
  window.CONFIG = CONFIG;
  window.SITE_URL = SITE_URL;

  /* ---------- banderas de producto ---------- */
  // Los fondos de perfil están en pausa hasta el rediseño de la ficha pública.
  const FEATURES = { fondos: false };
  window.FEATURES = FEATURES;

  /* ---------- utilidades ---------- */
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nf = (n) => new Intl.NumberFormat('es-AR').format(Number(n) || 0);
  const plural = (n, a, b) => Number(n) === 1 ? a : b;
  const hue = (s) => { let h = 0; for(const c of String(s || '')) h = (h*31 + c.charCodeAt(0)) % 360; return h; };
  function ago(iso){
    if(!iso) return 'Sin registros';
    const s = Math.max(0,(Date.now()-new Date(iso))/1000);
    if(s < 60) return 'ahora mismo';
    if(s < 3600) return `hace ${Math.floor(s/60)} min`;
    if(s < 86400) return `hace ${Math.floor(s/3600)} h`;
    const d = Math.floor(s/86400);
    return `hace ${d} ${plural(d,'día','días')}`;
  }
  const fmtMin = (m) => { m = Number(m)||0; return m < 60 ? `${m} min` : `${Math.floor(m/60)} h ${m%60} min`; };
  const fmtDay = (iso) => iso ? new Date(iso).toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'}) : '—';
  const dm = (d) => d.split('-').reverse().slice(0,2).join('/');
  const kickUrl = (user) => `https://kick.com/${String(user || '').replace(/^@/, '').replace(/[^\w-]/g, '')}`;

  Object.assign(window, { $, esc, nf, plural, hue, ago, fmtMin, fmtDay, dm, kickUrl });

  /* ---------- rangos ---------- */
  const rankOf = (lv) => { const d = RankEngine.of(lv); return [d.min_level, d.title, d.key]; };
  const rankKey = (lv) => RankEngine.keyOf(lv);
  const nextTier = (lv) => { const n = RankEngine.nextOf(lv); return n ? [n.min_level, n.title] : null; };
  const sprite = (key, size) => RankEngine.sprite(key, size);
  const normUser = (raw) => String(raw || '').trim().toLowerCase().replace(/^@/, '').replace(/_/g, '-');
  Object.assign(window, { rankOf, rankKey, nextTier, sprite, normUser });

  /* ---------- cumpleaños ---------- */
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const TIPOS = { frame:'Marcos', name_effect:'Efectos de nombre', background:'Fondos' };
  const fmtBday = (s) => { const [m, d] = String(s || '').split('-').map(Number); return m ? `${d} de ${MESES[m - 1]}` : ''; };
  const bdayToday = (s) => { const n = new Date(); return s === String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); };
  Object.assign(window, { MESES, TIPOS, fmtBday, bdayToday });

  /* ---------- avatares ---------- */
  function avatar(u, size){
    u = u || {};
    const name = String(u.display_name || u.username || '?');
    const ini = esc(name.trim().slice(0,2).toUpperCase());
    const h = hue(u.username || name);
    const st = `width:${size}px;height:${size}px;font-size:${Math.round(size*.38)}px`;
    if(u.avatar_url && /^https:\/\//.test(u.avatar_url))
      return `<img class="av" style="${st}" src="${esc(u.avatar_url)}" alt="" width="${size}" height="${size}" loading="lazy" referrerpolicy="no-referrer" data-ini="${ini}" data-h="${h}">`;
    return `<span class="av" style="${st};background:hsl(${h} 30% 24%)">${ini}</span>`;
  }
  document.addEventListener('error', (e) => {
    const t = e.target;
    if(t.tagName === 'IMG' && t.classList.contains('av')){
      const s = document.createElement('span');
      s.className = 'av';
      s.style.cssText = t.style.cssText + `;background:hsl(${t.dataset.h} 30% 24%)`;
      s.textContent = t.dataset.ini;
      t.replaceWith(s);
    }
  }, true);
  window.avatar = avatar;

  /* ---------- Supabase ---------- */
  const db = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  async function rpc(fn, args){
    const { data, error } = await db.rpc(fn, args);
    if(error){
      console.error(fn, error);
      if(typeof window.onRpcError === 'function') window.onRpcError(fn, error);
      return null;
    }
    return data;
  }
  const FN_URL = `${CONFIG.SUPABASE_URL}/functions/v1/kick-webhook`;
  Object.assign(window, { db, rpc, FN_URL });

  /* ---------- cosméticos ---------- */
  const COS = new Map();                                    // id -> objeto de la tabla cosmetics
  const safeCls = (c) => /^[a-z0-9_-]{1,40}$/.test(c || '') ? c : '';
  async function loadCosmetics(){
    const { data, error } = await db.from('cosmetics').select('*').order('sort');
    if(error){ console.error('cosmetics', error); return; }
    COS.clear();
    data.forEach(c => COS.set(c.id, { ...c, css: safeCls(c.css_class), url: /^https:\/\//.test(c.asset_url || '') ? c.asset_url : '' }));
  }
  const cosClass = (id) => (id && COS.get(id)?.css) || '';
  const frameOf = (u) => cosClass(u.frame_id ?? u.equipped_frame_id ?? u.equipped?.frame);
  const nameFxOf = (u) => cosClass(u.name_id ?? u.equipped_name_effect_id ?? u.equipped?.name_effect);
  function avatarF(u, size){
    const id = u.frame_id ?? u.equipped_frame_id ?? u.equipped?.frame, c = id && COS.get(id);
    if(!c) return avatar(u, size);
    const cls = ['frame', c.css, c.url ? 'fr-img' : '', size < 60 ? 'sm' : ''].filter(Boolean).join(' ');
    const st = c.url ? ` style="--fi:url('${esc(c.url)}');--fin:${Number(c.meta?.inset) || -35.7}%"` : '';
    return `<span class="${cls}"${st}>${avatar(u, size)}</span>`;
  }
  /* Si el objeto trae meta.paint se dibuja con PaintEngine; si no, se usa css_class como siempre */
  function paintClsOf(id){
    const c = id && COS.get(id);
    return c?.meta?.paint && window.PaintEngine ? PaintEngine.register(c.id, c.meta.paint) : '';
  }
  const nameHtml = (u) => {
    const p = paintClsOf(u.name_id ?? u.equipped_name_effect_id ?? u.equipped?.name_effect);
    return `<span class="ne ${p || nameFxOf(u)}">${esc(u.display_name || u.username || '')}</span>`;
  };
  Object.assign(window, { COS, loadCosmetics, cosClass, frameOf, nameFxOf, avatarF, paintClsOf, nameHtml });

  /* ---------- misiones ---------- */
  function questCard(q, compact){
    const prog = Math.min(q.progress, q.target), pct = Math.round(prog / q.target * 100);
    const n = Number(q.completed_by) || 0;
    return `<div class="quest ${q.completed ? 'done' : ''}"><div class="qtop"><span class="qt">${esc(q.title)}</span><span class="qxp">+${q.xp_reward} XP</span></div>
      <div class="xpbar sm" role="progressbar" aria-valuemin="0" aria-valuemax="${q.target}" aria-valuenow="${prog}"><i style="width:${pct}%"></i><em><span>${q.completed ? '¡Completada!' : `${prog}/${q.target}`}</span></em></div>
      ${compact ? '' : `<small>${nf(n)} ${plural(n,'usuario completó','usuarios completaron')} esta misión ${q.scope === 'weekly' ? 'esta semana' : 'hoy'}</small>`}</div>`;
  }
  window.questCard = questCard;

  /* ---------- sesión con Kick ---------- */
  let sess = null, wallet = null;
  try { sess = JSON.parse(localStorage.getItem('kickSession') || 'null'); } catch {}
  const RETURN_KEY = 'kickReturn', RETURN_TTL = 15 * 60 * 1000;

  function rememberReturn(next){
    try { localStorage.setItem(RETURN_KEY, JSON.stringify({ p: next || location.pathname + location.search, t: Date.now() })); } catch {}
  }
  function takeReturn(){
    try {
      const raw = localStorage.getItem(RETURN_KEY);
      localStorage.removeItem(RETURN_KEY);
      if(!raw) return null;
      const o = JSON.parse(raw);
      if(!o || !o.p || !o.t || Date.now() - o.t > RETURN_TTL) return null;
      if(!/^\//.test(o.p) || o.p.startsWith('//')) return null;
      return o.p;
    } catch { return null; }
  }
  function goLogin(next){ rememberReturn(next); location.href = FN_URL + '/login/start'; }
  function loginHref(){ return FN_URL + '/login/start'; }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('[data-login]');
    if(a) rememberReturn(a.getAttribute('data-login') || null);
  });

  (() => {                                                    // al volver del login: #session=TOKEN&user=NOMBRE
    const h = new URLSearchParams(location.hash.slice(1));
    if(!h.get('session')) return;
    sess = { token: h.get('session'), user: h.get('user') || '' };
    try { localStorage.setItem('kickSession', JSON.stringify(sess)); } catch {}
    history.replaceState(null, '', location.pathname + location.search);
    const back = takeReturn();
    const here = location.pathname + location.search;
    if(back && back !== here) location.replace(back);
  })();

  async function shopApi(path, body){
    try {
      const r = await fetch(FN_URL + path, {
        method: body ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${sess?.token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await r.json().catch(() => ({}));
      if(r.status === 401){ clearSession(); return { ok:false, reason:'no_session' }; }
      return j;
    } catch(e){ console.error(e); return { ok:false, reason:'network' }; }
  }
  function clearSession(){
    sess = null; wallet = null;
    try { localStorage.removeItem('kickSession'); } catch {}
  }
  function logout(callApi){
    if(callApi && sess) shopApi('/shop/logout', {});
    clearSession();
    if(document.readyState !== 'loading') location.reload();
  }
  async function loadWallet(){
    if(!sess){ wallet = null; return null; }
    const r = await shopApi('/shop/wallet');
    wallet = r && r.ok ? r.wallet : null;
    return wallet;
  }
  async function ensureSession(){
    if(!sess) return false;
    const r = await shopApi('/shop/session');
    if(r && r.ok){ await loadWallet(); return true; }
    return false;
  }
  Object.assign(window, { goLogin, loginHref, shopApi, logout, loadWallet, ensureSession });
  Object.defineProperties(window, {
    sess:   { get: () => sess,   set: (v) => { sess = v; },   configurable: true },
    wallet: { get: () => wallet, set: (v) => { wallet = v; }, configurable: true },
  });
})();
