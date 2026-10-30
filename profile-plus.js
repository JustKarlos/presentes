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
})();
