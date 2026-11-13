/* Tienda v4 como página. Se carga al final de tienda.html, después de site-core.js.
   El catálogo ocupa la página; el probador es un panel lateral fijo (hoja inferior en
   celular) con scrim. No hay modal ni monkeypatches: todo vive en #spRoot. */
(() => {
  const root = document.getElementById('spRoot');
  if (!root) return;

  const MSG = { insufficient:'No te alcanza la XP.', already_owned:'Ya tenés este objeto.', user_not_found:'Todavía no estás en el ranking: escribí en el chat durante un directo.',
    item_not_found:'Ese objeto ya no está disponible.', not_owned:'Primero tenés que comprarlo.', no_session:'Tu sesión venció: iniciá sesión de nuevo.',
    self_gift:'No podés regalarte algo a vos mismo.', recipient_not_found:'Esa persona todavía no está en el ranking: tiene que haber escrito en el chat durante un directo.',
    recipient_has_it:'Esa persona ya tiene ese objeto.', recipient_blocks_gifts:'Esa persona no acepta regalos.',
    network:'No pude conectar con el servidor.', error:'Algo salió mal. Intentalo otra vez.' };

  if (!document.getElementById('sp-css')) { const st = document.createElement('style'); st.id = 'sp-css'; st.textContent = `/* Tienda v4 en página */
.frame.fr-img::after{inset:var(--fin,-35.7%);background-image:var(--fi);background-size:100% 100%;animation:none}

/* ---------- armazón ---------- */
.sp-page{max-width:min(1280px,96vw);margin:0 auto;padding:1rem .25rem 3rem;display:flex;flex-direction:column;min-height:60vh}
.sp-head{display:flex;align-items:center;gap:.5rem .9rem;flex-wrap:wrap;min-height:56px;flex:none}
.sp-head .shoptitle{margin:0;flex:1 1 auto;min-width:0;font-size:1.75rem;line-height:1}
.sp-wallet-wrap{flex:none;margin-left:auto;min-width:0}
.sp-lead{margin:.15rem 0 .35rem;max-width:62ch;color:var(--tan);font-size:.9rem;line-height:1.4}
.sp-lead a{color:var(--leaf2);display:inline-flex;align-items:center;min-height:44px;padding:0 .25rem;border-radius:6px}
.sp-money{display:flex;align-items:center;gap:.5rem;min-height:44px;max-width:100%;padding:.2rem .6rem .2rem .25rem;background:#241b12;border:2px solid var(--rim);border-radius:10px;color:var(--cream);font:inherit;text-align:left;cursor:pointer;
  transition:border-color var(--dur-press) var(--ease-out),background var(--dur-press) var(--ease-out)}
@media (hover:hover) and (pointer:fine){.sp-money:hover{border-color:var(--gold);background:#2c2318}}
.sp-money:active{transform:translateY(1px)}
.sp-money .av{flex:none}
.sp-money b{display:block;font-family:var(--display);font-weight:700;font-size:1.2rem;line-height:1.05;color:var(--gold);text-shadow:var(--ol-soft);font-variant-numeric:tabular-nums;white-space:nowrap}
.sp-money small{display:block;color:var(--tan);font-size:.7rem;line-height:1.2;white-space:nowrap}
.sp-wallet-wrap>.btn{min-height:44px}

/* ---------- barra: categorías, búsqueda, filtros ---------- */
.sp-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem .6rem;margin:.5rem 0 .35rem;flex:none}
.sp-tabs{display:flex;gap:.3rem;flex:1 1 auto;min-width:0;overflow-x:auto;scrollbar-width:none;padding:2px 0}
.sp-tabs::-webkit-scrollbar{display:none}
.sp-tabs .chip{flex:none}
.sp-tools{display:flex;align-items:center;gap:.4rem;flex:1 1 200px;min-width:0}
.sp-search{flex:1 1 190px;min-width:120px}
.sp-filters{position:relative;flex:none}
.sp-filterbtn{display:inline-flex;align-items:center;gap:.4rem;min-height:44px;padding:.3rem .8rem;border:2px solid var(--rim);border-radius:999px;background:#3d3122;color:#e3dcc6;font-family:var(--display);font-weight:600;font-size:1rem;cursor:pointer;
  transition:border-color var(--dur-press) var(--ease-out),color var(--dur-press) var(--ease-out)}
.sp-filterbtn.on{border-color:var(--ok);color:var(--leaf2);background:#2c3a20}
@media (hover:hover) and (pointer:fine){.sp-filterbtn:hover{border-color:var(--leaf);color:#fff}}
.sp-fcount{display:inline-grid;place-items:center;min-width:1.25rem;height:1.25rem;padding:0 .25rem;border-radius:999px;background:var(--gold);color:#2a1608;font-family:var(--body);font-size:.72rem;font-weight:800}
.sp-fcount[hidden]{display:none}
.sp-pop{position:absolute;right:0;top:calc(100% + .35rem);z-index:72;width:min(290px,calc(100vw - 3rem));display:grid;gap:.55rem;padding:.7rem;background:#241b12;border:2px solid var(--rim);border-radius:10px;box-shadow:0 14px 30px rgba(0,0,0,.6)}
.sp-pop[hidden]{display:none}
.sp-pop label{display:grid;gap:.25rem;font-size:.78rem;color:var(--tan);font-weight:700}
.sp-pop .sp-sel{width:100%;background:#1e1710;border:2px solid var(--rim);border-radius:8px;color:var(--cream);padding:.35rem .55rem;font:inherit;min-height:44px}
.sp-pop .chips{display:grid;gap:.3rem}
.sp-pop .chip{justify-content:flex-start}
.sp-pop .linkbtn{justify-self:start}

/* ---------- cuerpo: catálogo + probador ---------- */
.shopmsg{min-height:0;margin:0;padding:.1rem 0;color:var(--leaf);font-weight:800;font-size:.85rem;line-height:1.25;flex:none}
.shopmsg:empty{display:none}
.sp-body{position:relative;flex:1 1 auto;min-height:0;display:block}
.sp-catalog{overflow:visible;align-content:start}
.shopgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.55rem;align-content:start}

/* ---------- tarjeta ---------- */
.sp-card{position:relative;display:flex;flex-direction:column;gap:.3rem;padding:.45rem;border:2px solid var(--rim);border-radius:8px;
  background:linear-gradient(rgba(20,13,7,.5),rgba(20,13,7,.74)),url("assets/tab.png") left top/auto 100% repeat-x,#241b12;
  transition:transform var(--dur-press) var(--ease-out),border-color var(--dur-press) var(--ease-out)}
@media (hover:hover) and (pointer:fine){.sp-card:hover{transform:translateY(-2px);border-color:#6a563a}}
.sp-card.sel{border-color:var(--gold);box-shadow:inset 0 0 0 1px var(--gold)}
.sp-card.eq{border-color:var(--ok)}
.sp-card.tried{box-shadow:inset 0 0 0 2px rgba(83,252,24,.35)}
.sp-card.retired{opacity:.94}
.sp-card.r1{border-color:#5c7a3c}.sp-card.r2{border-color:#8a6a1c}.sp-card.r3{border-color:var(--gold)}
.sp-card.eq.r1,.sp-card.eq.r2,.sp-card.eq.r3{border-color:var(--ok)}
.sp-open{appearance:none;background:none;border:0;padding:0;margin:0;color:inherit;font:inherit;text-align:left;display:grid;gap:.3rem;width:100%;cursor:pointer;border-radius:6px}
.sp-open:focus-visible{outline:3px solid var(--leaf);outline-offset:2px}
.sp-prevbox{display:grid;place-items:center;height:104px;overflow:hidden;background:radial-gradient(ellipse at center,#2c2318 0%,#1e1710 70%);border:1px solid #33291c;border-radius:6px}
.sp-card-body{display:grid;gap:.1rem;min-width:0}
.sp-card-body .in{font-family:var(--display);font-weight:700;font-size:1.05rem;line-height:1.12;color:#fff;text-shadow:var(--ol-soft);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.24em;word-break:break-word}
.sp-meta{display:flex;flex-wrap:wrap;gap:.25rem;align-items:center;min-height:1.2rem}
.sp-type{font-size:.7rem;color:var(--tan)}
.sp-rar{font-size:.66rem;font-weight:800;padding:.02rem .38rem;border-radius:4px;background:#3d3122;color:var(--tan)}
.sp-rar.r1{background:#2c3a20;color:var(--leaf2)}
.sp-rar.r2{background:#4a360c;color:#ffd27a}
.sp-rar.r3{background:#5a2418;color:#ffb08a}
.sp-badge{font-size:.66rem;font-weight:800;border-radius:4px;padding:.02rem .38rem}
.sp-badge-eq{color:#0f2a08;background:#7fe044}
.sp-badge-own{color:var(--cream);background:#463829;border:1px solid var(--rim)}
.sp-flag{position:absolute;top:.35rem;right:.35rem;z-index:2;font-size:.62rem;font-weight:800;border-radius:4px;padding:.04rem .38rem}
.sp-newf{color:#0f2a08;background:#7fe044}
.sp-ret{color:#fff;background:#6f5c3a}
.sp-card-foot{display:flex;align-items:center;gap:.4rem;margin-top:auto;padding-top:.25rem;border-top:1px solid var(--line);min-height:48px}
.sp-card-foot .cost{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--display);font-weight:700;font-size:1rem;color:var(--gold);font-variant-numeric:tabular-nums}
.sp-card-foot .btn{flex:none;padding:.2rem .5rem;font-size:.84rem;min-height:44px}
.sp-empty{grid-column:1/-1;display:grid;justify-items:center;gap:.5rem;padding:2rem 1rem;text-align:center;color:var(--tan);background:#241b12;border:2px dashed var(--rim);border-radius:10px}
.sp-skel{min-height:230px;background:linear-gradient(100deg,#241b12 30%,#262926 50%,#241b12 70%) 0 0/200% 100%;animation:spsk 1.2s linear infinite;border-color:var(--rim)}
.sp-skel .sp-prevbox,.sp-skel .in{visibility:hidden}
@keyframes spsk{to{background-position:-200% 0}}
.sp-tile-name{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ---------- probador ---------- */
.sp-drawer{position:fixed;z-index:76;top:0;right:0;bottom:0;width:min(400px,94vw);display:flex;flex-direction:column;
  background:linear-gradient(rgba(20,13,7,.6),rgba(20,13,7,.82)),url("assets/tab.png") left top/auto 100% repeat-x,#241b12;
  border-left:2px solid var(--edge);box-shadow:-14px 0 34px rgba(0,0,0,.55);
  transform:translateX(16px);opacity:0;visibility:hidden;pointer-events:none;
  transition:transform var(--dur-fast) var(--ease-out),opacity var(--dur-fast) var(--ease-out),visibility 0s var(--dur-fast)}
.sp-drawer.on{transform:none;opacity:1;visibility:visible;pointer-events:auto;transition:transform var(--dur-fast) var(--ease-out),opacity var(--dur-fast) var(--ease-out)}
.sp-drawer[hidden]{display:none}
.sp-scrim{position:fixed;inset:0;z-index:70;background:rgba(4,10,6,.6);opacity:0;pointer-events:none;transition:opacity var(--dur-fast) var(--ease-out)}
.sp-scrim.on{opacity:1;pointer-events:auto}
.sp-scrim[hidden]{display:none}
.sp-dw-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.55rem .65rem;border-bottom:1px solid var(--line);flex:none}
.sp-dw-head small{display:block;color:var(--tan);font-size:.68rem;line-height:1;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.sp-dw-head b{display:block;font-family:var(--display);font-weight:700;font-size:1.2rem;line-height:1.1;color:#fff;text-shadow:var(--ol)}
.sp-dw-close{min-width:44px;min-height:44px;display:grid;place-items:center;border-radius:8px;color:var(--tan);font-size:1.6rem;line-height:1}
@media (hover:hover) and (pointer:fine){.sp-dw-close:hover{color:#fff}}
.sp-dw-body{flex:1 1 auto;min-height:0;overflow:auto;display:grid;gap:.55rem;align-content:start;padding:.6rem .65rem}
.sp-stage{display:grid;gap:.4rem}
.sp-stage .sp-mini{max-width:none;width:100%;min-height:150px;border:2px solid var(--rim);border-image:none;border-radius:8px;box-shadow:none;
  background:linear-gradient(rgba(24,16,9,.72),rgba(24,16,9,.84)),#241b12;padding:.55rem}
.sp-vt{display:flex;flex-wrap:wrap;gap:.3rem}
.sp-vt .chip{font-size:.9rem}
.sp-sec{display:grid;gap:.4rem;padding-top:.55rem;border-top:1px solid var(--line)}
.sp-sec:first-child{border-top:0;padding-top:0}
.sp-sec-h{display:flex;align-items:center;justify-content:space-between;gap:.5rem}
.sp-sec-h b{font-family:var(--display);font-weight:700;font-size:1.05rem;color:#fff;text-shadow:var(--ol-soft)}
.sp-tried{display:grid;gap:.28rem}
.sp-trychip{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.25rem .45rem;background:#1e1710;border:1px solid var(--line);border-radius:6px;min-height:44px}
.sp-trychip small{display:block;color:var(--tan);font-size:.66rem;line-height:1}
.sp-trychip b{display:block;font-size:.86rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-trychip button{min-width:44px;min-height:44px;color:var(--tan);font-size:1.2rem;line-height:1}
.sp-summary{display:flex;flex-wrap:wrap;align-items:baseline;gap:.25rem .6rem;font-size:.9rem}
.sp-summary small{color:var(--tan)}
.sp-buys{display:grid;gap:.3rem}
.sp-buyrow{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.3rem 0;border-top:1px dashed var(--line)}
.sp-buyrow small{display:block;color:var(--tan);font-size:.7rem}
.sp-buyrow .btn{flex:none}
.sp-hint{color:var(--tan);font-size:.8rem;line-height:1.35}
.sp-sel-info{display:grid;gap:.2rem}
.sp-sel-info .in{font-family:var(--display);font-weight:700;font-size:1.2rem;color:#fff;line-height:1.1}
.sp-sel-info>small{color:var(--tan);font-size:.84rem;line-height:1.35}
.sp-sel-actions{display:flex;flex-wrap:wrap;gap:.4rem}
.sp-eqlist{display:grid;gap:.28rem}
.sp-eqrow{display:flex;align-items:center;gap:.5rem;padding:.2rem .45rem;background:#1e1710;border:1px solid var(--line);border-radius:6px;min-height:44px}
.sp-eq-ic{flex:none;display:grid;place-items:center;width:34px;height:34px;overflow:hidden}
.sp-eq-ic .swatch{width:34px;height:34px;border-radius:5px}
.sp-eq-ic .frame{--fin:-35.7%}
.sp-eq-copy{min-width:0;flex:1 1 auto}
.sp-eq-copy small{display:block;color:var(--tan);font-size:.66rem;line-height:1}
.sp-eq-copy b{display:block;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-eqrow button{flex:none;min-width:44px;min-height:44px;color:var(--tan);font-size:1.2rem;line-height:1}
.sp-eqrow button:hover{color:#fff}
.sp-lv{display:grid;gap:.1rem;font-size:.82rem;color:var(--tan)}
.sp-lv input{accent-color:#53fc18;width:100%;min-height:44px}
.sp-who input{width:100%;background:#221a11;border:2px solid var(--rim);border-radius:8px;color:var(--cream);padding:.35rem .6rem;font:inherit;text-shadow:none;min-height:44px}
.sp-sel-info .sp-meta{margin:.1rem 0}
.sp-actions-row{display:flex;flex-wrap:wrap;gap:.4rem}
.sp-actions-row .btn{min-height:44px}
.sp-wallet-detail{display:flex;flex-wrap:wrap;align-items:baseline;gap:.25rem .7rem;font-size:.82rem;color:var(--tan)}
.sp-wallet-detail b{color:var(--gold);font-family:var(--display);font-size:1.1rem;font-variant-numeric:tabular-nums}
.sp-wallet-detail .linkbtn{margin-left:auto}
.sp-sec-adv{padding-top:.5rem}
.sp-sec-adv summary{cursor:pointer;color:var(--cream);font-weight:800;list-style:none;min-height:44px;display:flex;align-items:center}
.sp-sec-adv summary::-webkit-details-marker{display:none}
.sp-sec-adv summary::before{content:"▸ ";color:var(--tan)}
.sp-sec-adv[open] summary::before{content:"▾ "}
.sp-adv-body{display:grid;gap:.5rem;margin-top:.35rem}
.sp-sec-adv:not([open]) .sp-adv-body{display:none}
.linkbtn{background:none;border:0;color:var(--tan);font:inherit;font-size:.82rem;cursor:pointer;text-decoration:underline;min-height:44px;padding:0}
.linkbtn:hover{color:#fff}
.sp-paused,.sp-paused *,.sp-paused *::after{animation-play-state:paused!important}

/* vista previa en el probador */
.sp-chat{background:#1e1710;border-radius:8px;padding:.6rem;display:grid;gap:.35rem;font-family:var(--body);font-size:.85rem;font-weight:700;text-shadow:none;color:var(--cream)}
.sp-chat .cl{display:flex;align-items:center;gap:.3rem;flex-wrap:wrap}.sp-chat small{color:#a8946a;font-weight:600}
.sp-pod{display:grid;justify-items:center;gap:.2rem;padding:1.4rem 0 .6rem;background:#1e1710;border-radius:8px}
@keyframes sp-buy-pop{0%{transform:scale(1)}35%{transform:scale(1.12)}100%{transform:scale(1)}}
.wallet .bal.sp-pop,.sp-money b.sp-pop{animation:sp-buy-pop 420ms var(--ease-out)}

/* ---------- pantallas chicas ---------- */
@media (max-width:760px){
  .sp-page{padding:.75rem .25rem 2rem}
  .sp-head{min-height:48px;gap:.4rem}
  .sp-head .shoptitle{font-size:1.5rem}
  .sp-title-long{display:none}
  .sp-money{gap:.4rem;padding:.15rem .45rem .15rem .2rem}
  .sp-money b{font-size:1.02rem}
  .sp-money small{font-size:.64rem}
  .sp-tabs{flex:1 1 100%}
  .sp-tools{flex:1 1 100%}
  .sp-search{flex:1 1 auto;min-width:0}
  .sp-pop{position:fixed;left:.5rem;right:.5rem;top:auto;bottom:.5rem;width:auto;z-index:80}
  .sp-drawer{left:.5rem;right:.5rem;bottom:.5rem;top:auto;width:auto;max-height:76vh;border:2px solid var(--edge);border-radius:10px;
    transform:translateY(14px);box-shadow:0 -10px 40px rgba(0,0,0,.6)}
  .sp-drawer.on{transform:none}
  .sp-card-foot{display:grid;gap:.25rem}
  .sp-card-foot .btn{width:100%}
  .sp-prevbox{height:92px}
  .sp-card-body .in{font-size:.98rem}
}
@media (max-width:700px){
  .shopgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem}
}
@media (max-width:359px){
  .shopgrid{grid-template-columns:1fr}
  .sp-card{padding:.4rem;gap:.15rem}
  .sp-open{grid-template-columns:84px minmax(0,1fr);grid-template-areas:"prev body";align-items:center;gap:.5rem}
  .sp-open>.sp-prevbox{grid-area:prev}
  .sp-open>.sp-card-body{grid-area:body}
  .sp-prevbox{height:80px}
  .sp-card-foot{grid-column:1/-1;display:flex;align-items:center;gap:.5rem;padding-top:.25rem}
  .sp-card-foot .btn{width:auto;min-width:108px;flex:none}
  .sp-card-body .in{min-height:0;font-size:.95rem}
}
@media (prefers-reduced-motion:reduce){
  .sp-skel{animation:none}
  .sp-card,.sp-money,.sp-drawer,.sp-drawer.on,.sp-scrim{transition:none}
  .sp-card:hover,.sp-money:active{transform:none}
  .wallet .bal.sp-pop,.sp-money b.sp-pop{animation:none}
}
`; document.head.append(st); }

  /* ---------- estado ---------- */
  const bgOn = !(window.FEATURES && window.FEATURES.fondos === false);   // fondos en pausa
  const SLOTS = ['frame', 'name_effect', ...(bgOn ? ['background'] : []), 'badge'];
  const clearTry = () => { ST.try = {frame: null, name_effect: null, background: null, badge: null}; };
  const ST = {type: 'all', q: '', sort: 'new', mine: false, afford: false, sel: null, busy: false,
    try: {frame: null, name_effect: null, background: null, badge: null}, tryUser: null, view: 'profile', lvl: null, pause: false, adv: false,
    drawer: false, drawerFrom: null, drawerReturn: null};

  root.classList.add('sp-page');
  root.innerHTML = `
    <div class="sp-head">
      <h1 id="shopTitle" class="shoptitle">Tienda<span class="sp-title-long"> de cosméticos</span></h1>
      <div id="shopWallet" class="sp-wallet-wrap"></div>
    </div>
    <p class="sp-lead">Marcos, efectos de nombre e insignias para tu perfil y el ranking. Se pagan con XP y gastarla no baja tu nivel. <a href="/mi-perfil">Ver mi perfil</a>.</p>
    <div class="sp-toolbar">
      <div class="sp-tabs" id="spTabs" role="group" aria-label="Categorías">
        <button type="button" class="chip on" data-t="all" aria-pressed="true">Todos</button><button type="button" class="chip" data-t="frame" aria-pressed="false">Marcos</button><button type="button" class="chip" data-t="name_effect" aria-pressed="false">Nombres</button>${bgOn ? '<button type="button" class="chip" data-t="background" aria-pressed="false">Fondos</button>' : ''}<button type="button" class="chip" data-t="badge" aria-pressed="false">Insignias</button>
      </div>
      <div class="sp-tools">
        <label class="search sp-search"><span class="sr">Buscar objeto</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="spQ" type="search" placeholder="Buscar objeto…" autocomplete="off"></label>
        <div class="sp-filters">
          <button type="button" id="spFilterBtn" class="sp-filterbtn" aria-expanded="false" aria-controls="spFilters"><span aria-hidden="true">▾</span> Filtros <span id="spFCount" class="sp-fcount" hidden></span></button>
          <div id="spFilters" class="sp-pop" hidden>
            <label>Ordenar por<select id="spSort" class="sp-sel" tabindex="0"><option value="new">Novedades</option><option value="asc">Precio: menor</option><option value="desc">Precio: mayor</option><option value="name">Nombre</option></select></label>
            <div class="chips"><button type="button" class="chip" id="spMine" aria-pressed="false">Míos</button><button type="button" class="chip" id="spAfford" aria-pressed="false">Puedo comprar</button></div>
            <button type="button" class="linkbtn" id="spClearFilters">Limpiar filtros</button>
          </div>
        </div>
      </div>
    </div>
    <p id="shopMsg" class="shopmsg" role="status" aria-live="polite"></p>
    <div class="sp-body">
      <div id="shopGrid" class="shopgrid sp-catalog" aria-busy="true"></div>
      <aside id="spPrev" class="sp-drawer" role="region" aria-label="Probador" aria-hidden="true" hidden></aside>
      <div id="spScrim" class="sp-scrim" hidden></div>
    </div>`;

  const me = () => wallet ? {username: wallet.username, display_name: wallet.display_name, avatar_url: wallet.avatar_url} : {username: 'tu', display_name: 'Tu nombre', avatar_url: null};
  const cat = () => [...COS.values()].filter(c => c.active && (bgOn || c.type !== 'background'));
  const visible = () => [...COS.values()].filter(c => (c.active || own(c)) && (bgOn || c.type !== 'background'));
  const own = c => !!wallet?.owned?.includes(c.id), eqd = c => !!wallet && (c.type === 'badge' ? wallet.equipped?.rank === c.id : wallet.equipped?.[c.type] === c.id);
  const isNew = c => c.meta?.new || (c.created_at && Date.now() - new Date(c.created_at) < 10 * 864e5);
  const RL = ['Común', 'Raro', 'Épico', 'Legendario'];
  const TYPEL = {frame: 'Marco', name_effect: 'Nombre', background: 'Fondo', badge: 'Insignia'};
  const tiers = () => { const cs = cat().map(c => c.cost).sort((a, b) => a - b), q = p => cs[Math.min(cs.length - 1, Math.floor(cs.length * p))] ?? 0; return [q(.4), q(.7), q(.9)]; };
  const rar = (c, t) => c.cost >= t[2] && t[2] > t[0] ? 3 : c.cost >= t[1] && t[1] > t[0] ? 2 : c.cost > t[0] ? 1 : 0;
  const bgSt = c => c.url ? `background-image:url('${esc(c.url)}');background-size:cover;background-position:center bottom;image-rendering:pixelated` : '';
  const btn = (a, t, c, cls = '', k = '') => `<button type="button" class="btn ${cls}" data-act="${a}" data-id="${esc(c?.id || '')}" data-type="${c?.type || ''}" data-k="${esc(k || a + '-' + (c?.id || c?.type || ''))}">${t}</button>`;
  const msg = (t, ok = true) => { const m = $('shopMsg'); m.style.color = ok ? 'var(--leaf)' : '#ff8a6a'; m.textContent = t; clearTimeout(msg.t); msg.t = setTimeout(() => m.textContent = '', 4500); };

  const tile = (c, u) => c.type === 'frame' ? avatarF({...u, frame_id: c.id}, 64)
    : c.type === 'name_effect' ? `<span class="sp-tile-name" style="font-size:1.45rem;font-family:var(--display);font-weight:700">${nameHtml({...u, name_id: c.id})}</span>`
    : c.type === 'badge' ? (() => { const rk = window.RankEngine && window.RankEngine.byId ? window.RankEngine.byId(c.rank_id) : null; return rk ? window.RankEngine.sprite(rk.key, 64) : (c.asset_url ? `<img src="${esc(c.asset_url)}" width="64" height="64" style="object-fit:contain;image-rendering:pixelated" alt="">` : '<span style="font-size:2rem">🏅</span>'); })()
    : `<div class="swatch ${c.css}" style="${bgSt(c)}"></div>`;

  function primary(c) {
    if (!sess) return btn('login', 'Iniciar sesión', c);
    if (!wallet) return '<button type="button" class="btn" disabled>Comprar</button>';
    if (eqd(c)) return btn('unequip', 'Quitar', c, 'ghost');
    if (own(c)) return btn('equip', 'Equipar', c);
    const s = c.cost - wallet.balance;
    return s > 0 ? `<button type="button" class="btn" disabled>Faltan ${nf(s)} XP</button>` : btn('buy', 'Comprar', c);
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

  const eqCount = () => wallet ? SLOTS.filter(t => wallet.equipped?.[t === 'badge' ? 'rank' : t]).length : 0;

  function renderHead() {
    const w = $('shopWallet');
    if (!sess) w.innerHTML = `<a class="btn" href="${FN_URL}/login/start" data-login="/tienda">Iniciar sesión con Kick</a>`;
    else if (!wallet) w.innerHTML = `<button type="button" class="sp-money" id="spLookBtn" aria-haspopup="region" aria-controls="spPrev" aria-expanded="${ST.drawer}"><span class="sp-money-txt"><b>@${esc(sess.user)}</b><small>Sesión sin ranking</small></span></button>`;
    else w.innerHTML = `<button type="button" class="sp-money" id="spLookBtn" aria-haspopup="region" aria-controls="spPrev" aria-expanded="${ST.drawer}">${avatarF(wallet, 32)}<span class="sp-money-txt"><b>${nf(wallet.balance)} XP</b><small>Tu look · ${eqCount()} de ${SLOTS.length}</small></span></button>`;
  }

  function syncFilters() {
    const tabs = document.querySelectorAll('#spTabs .chip');
    tabs.forEach(b => { const on = b.dataset.t === ST.type; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const mine = $('spMine'), afford = $('spAfford');
    if (mine) { mine.classList.toggle('on', ST.mine); mine.setAttribute('aria-pressed', ST.mine); }
    if (afford) { afford.classList.toggle('on', ST.afford); afford.setAttribute('aria-pressed', ST.afford); }
    const n = (ST.mine ? 1 : 0) + (ST.afford ? 1 : 0), fb = $('spFilterBtn'), fc = $('spFCount');
    if (fb) fb.classList.toggle('on', n > 0);
    if (fc) { fc.hidden = !n; fc.textContent = n || ''; }
  }

  function renderGrid() {
    const t = tiers(), u = me(), items = list(), grid = $('shopGrid');
    grid.setAttribute('aria-busy', COS.size ? 'false' : 'true');
    if (!COS.size) { grid.innerHTML = '<div class="sp-card sp-skel" aria-hidden="true"></div>'.repeat(8); return; }
    grid.innerHTML = items.map(c => {
      const r = rar(c, t), trying = tried(c.id), status = eqd(c) ? '<span class="sp-badge sp-badge-eq">Equipado</span>' : own(c) ? '<span class="sp-badge sp-badge-own">Tuyo</span>' : '';
      const top = !c.active ? '<span class="sp-flag sp-ret">Retirado</span>' : isNew(c) ? '<span class="sp-flag sp-newf">Nuevo</span>' : '';
      const meta = `<span class="sp-rar r${r}">${RL[r]}</span><span class="sp-type">${TYPEL[c.type] || ''}</span>${status}`;
      return `<article class="sp-card r${r}${eqd(c) ? ' eq' : ''}${ST.sel === c.id ? ' sel' : ''}${trying ? ' tried' : ''}${!c.active ? ' retired' : ''}">${top}
          <button type="button" class="sp-open" data-sel="${esc(c.id)}" data-k="open-${esc(c.id)}" aria-label="Ver «${esc(c.name)}» en el probador">
            <span class="prev sp-prevbox">${tile(c, u)}</span>
            <span class="sp-card-body"><b class="in">${esc(c.name)}</b><span class="sp-meta">${meta}</span></span>
          </button>
          <div class="sp-card-foot"><span class="cost">${own(c) ? (eqd(c) ? 'En uso' : 'En tu colección') : nf(c.cost) + ' XP'}</span>${primary(c)}</div></article>`;
    }).join('') || `<div class="sp-empty"><p>No hay objetos con esos filtros.</p><button type="button" class="btn ghost" data-clear>Limpiar filtros</button></div>`;
  }

  // ---- probador ----
  const TL = {frame: 'Marco', name_effect: 'Nombre', background: 'Fondo', badge: 'Insignia'};
  const lvOf = xp => Math.floor(Math.pow(Math.max(Number(xp) || 0, 0) / 100, 1 / 1.5));
  const baseU = () => ST.tryUser || me();
  const baseLv = () => ST.tryUser ? (Number(ST.tryUser.level) || 0) : wallet ? lvOf(wallet.xp) : 5;
  const curLv = () => ST.lvl ?? baseLv();
  const pickT = t => ST.try[t] || (ST.tryUser ? '' : wallet?.equipped?.[t] || '');
  const tried = id => Object.values(ST.try).includes(id);
  const triedList = () => SLOTS.map(t => COS.get(ST.try[t])).filter(Boolean);

  function stageHtml() {
    const u = {...baseU(), frame_id: pickT('frame') || '', name_id: pickT('name_effect') || ''}, l = curLv();
    const _bc = COS.get(ST.try.badge), _br = _bc && window.RankEngine && window.RankEngine.byId ? window.RankEngine.byId(_bc.rank_id) : null;
    const title = _br ? _br.title : rankOf(l)[1]; const rKey = _br ? _br.key : rankKey(l);
    if (ST.view === 'chat') return `<div class="sp-chat" aria-label="Vista previa en el chat"><div class="cl"><small>12:34</small>${sprite(rKey, 18)}<b>${nameHtml(u)}</b><span>:</span><span style="font-weight:600">¡Qué buen directo, vamos!</span></div><div class="cl"><small>12:34</small><b style="color:var(--tan)">viewer123</b><span>:</span><span style="font-weight:600">jajaja GG</span></div></div>`;
    const xp = ST.tryUser?.xp ?? wallet?.xp ?? 1234;
    if (ST.view === 'rank') return `<div class="sp-pod" aria-label="Vista previa del podio">${avatarF(u, 72)}<span class="nm" style="font-family:var(--display);font-size:1.2rem">${nameHtml(u)}</span><span class="cost">${nf(xp)} XP</span></div>
      <div class="row" style="padding:.4rem .2rem"><span class="rk">1</span>${avatarF(u, 40)}<span class="info"><b>${nameHtml(u)}<span class="lvl">Nv. ${l}</span></b><small class="rk2">${sprite(rKey, 14)}<span>${esc(title)} · ahora mismo</span></small></span><span class="total">${nf(xp)} XP</span></div>`;
    const bg = bgOn ? COS.get(pickT('background')) : null, cls = bg ? bg.css + (bg.url ? ' pb-img' + (bg.meta?.border ? ' pb-own' : '') : '') : '', st = bg?.url ? ` style="--pbimg:url('${esc(bg.url)}');--pbdim:${bg.meta?.dim ?? .15}"` : '';
    return `<div class="card sp-mini ${cls}"${st}><div class="mh">${avatarF(u, 64)}<div><h2>${nameHtml(u)}</h2><p>@${esc(u.username)} · Nv. ${l}</p></div></div><div class="rankrow">${sprite(rKey, 28)}<b>${esc(title)}</b></div><div class="pair"><div><span>XP total</span><b>${nf(xp)}</b></div><div><span>Puesto en XP</span><b>#1</b></div></div></div>`;
  }

  function renderDrawer() {
    const p = $('spPrev'); if (!p) return;
    const prevFocus = document.activeElement;
    const prevKey = prevFocus && p.contains(prevFocus) ? prevFocus.dataset.k : null;
    const sel = ST.sel && COS.get(ST.sel), t = tiers(), listT = triedList(), buys = listT.filter(c => !own(c)), total = buys.reduce((s, c) => s + c.cost, 0);
    p.classList.toggle('sp-paused', ST.pause);
    const triedChips = SLOTS.map(k => { const c = COS.get(ST.try[k]); return `<div class="sp-trychip"><span><small>${TL[k]}</small><b>${c ? esc(c.name) : 'Sin probar'}</b></span>${c ? `<button type="button" data-pv="rm" data-type="${k}" data-k="rm-${k}" aria-label="Quitar prueba de ${TL[k]}">&times;</button>` : ''}</div>`; }).join('');
    const eqRows = SLOTS.map(t2 => {
      const eqKey = t2 === 'badge' ? 'rank' : t2, c = wallet && COS.get(wallet.equipped?.[eqKey]);
      return `<div class="sp-eqrow"><span class="sp-eq-ic">${c ? tile(c, wallet) : ''}</span><span class="sp-eq-copy"><small>${TL[t2]}</small><b>${c ? esc(c.name) : 'Ninguno'}</b></span>${c ? `<button type="button" data-act="unequip" data-type="${t2}" data-k="unequip-${t2}" aria-label="Quitar ${TL[t2]}">&times;</button>` : ''}</div>`;
    }).join('');
    const walletDetail = wallet
      ? `<div class="sp-wallet-detail"><span>Saldo <b>${nf(wallet.balance)} XP</b></span><span>Ganada ${nf(wallet.xp)}</span><span>Gastada ${nf(wallet.xp_spent)}</span><button type="button" class="linkbtn" id="logoutBtn" data-k="logout">Cerrar sesión</button></div>`
      : !sess ? `<p class="sp-hint">Iniciá sesión con Kick para comprar, equipar y probar con tu cuenta.</p>` : `<p class="sp-hint">Tu cuenta todavía no está en el ranking. Escribí en el chat durante un directo.</p>`;
    p.innerHTML = `
      <div class="sp-dw-head"><div><small>Probador</small><b>Tu look</b></div><button type="button" class="sp-dw-close" data-pv="close" data-k="close" aria-label="Cerrar probador">&times;</button></div>
      <div class="sp-dw-body">
        <div class="sp-vt" role="group" aria-label="Vista previa">${[['profile', 'Perfil'], ['chat', 'Chat'], ['rank', 'Ranking']].map(([v, l]) => `<button type="button" class="chip${ST.view === v ? ' on' : ''}" data-view="${v}" data-k="view-${v}" aria-pressed="${ST.view === v}">${l}</button>`).join('')}<button type="button" class="chip" data-pv="pause" data-k="pause" aria-pressed="${ST.pause}">${ST.pause ? 'Reanudar' : 'Pausar anim.'}</button></div>
        <div id="spStage" class="sp-stage">${stageHtml()}</div>
        ${sel ? `<div class="sp-sec sp-sec-sel"><div class="sp-sec-h"><b>Seleccionado</b><span class="sp-rar r${rar(sel, t)}">${RL[rar(sel, t)]}</span></div>
          <div class="sp-sel-info"><b class="in">${esc(sel.name)}</b><small>${esc(sel.description || 'Cosmético para tu perfil.')}</small><div class="sp-meta"><span class="sp-type">${TYPEL[sel.type] || ''}</span>${eqd(sel) ? '<span class="sp-badge sp-badge-eq">Equipado</span>' : own(sel) ? '<span class="sp-badge sp-badge-own">Tuyo</span>' : `<span class="cost">${nf(sel.cost)} XP</span>`}</div></div>
          <div class="sp-actions-row"><button type="button" class="btn ghost${tried(sel.id) ? ' on' : ''}" data-try="${esc(sel.id)}" data-k="try-${esc(sel.id)}" aria-pressed="${tried(sel.id)}">${tried(sel.id) ? 'Dejar de probar' : 'Probar'}</button>${sel.active && wallet ? btn('gift', 'Regalar', sel, 'ghost') : ''}${primary(sel)}</div></div>` : ''}
        <div class="sp-sec sp-sec-eq"><div class="sp-sec-h"><b>Equipados</b><span class="sp-type">${eqCount()} de ${SLOTS.length}</span></div><div class="sp-eqlist">${eqRows}</div>${walletDetail}</div>
        <div class="sp-sec sp-sec-try">
          <div class="sp-sec-h"><b>Probando</b>${listT.length ? `<button type="button" class="linkbtn" data-pv="clear" data-k="clear">Limpiar</button>` : ''}</div>
          <div class="sp-tried">${triedChips}</div>
          ${listT.length ? `<div class="sp-summary"><span>Total a comprar: <b class="cost">${nf(total)} XP</b></span>${wallet ? `<small>${total > wallet.balance ? `Te faltan ${nf(total - wallet.balance)} XP` : `Te quedarían ${nf(wallet.balance - total)} XP`}</small>` : ''}</div>
          <div class="sp-buys">${buys.map(c => `<div class="sp-buyrow"><span><b>${esc(c.name)}</b><small>${nf(c.cost)} XP</small></span>${primary(c)}</div>`).join('') || '<small class="sp-hint">Ya tenés todo lo que estás probando.</small>'}</div>` : '<small class="sp-hint">Elegí un objeto y tocá «Probar» para verlo en tu perfil, el chat y el ranking.</small>'}
        </div>
        <details class="sp-sec sp-sec-adv" ${ST.adv ? 'open' : ''}><summary data-k="adv" tabindex="0">Ajustes de prueba</summary>
          <div class="sp-adv-body">
            <label class="sp-lv"><span>Nivel simulado: <output id="spLvO">${curLv()}</output></span><input id="spLv" type="range" min="0" max="60" value="${curLv()}"></label>
            <div class="sp-who"><label><span class="sr">Probar con otro usuario de Kick</span><input id="spWho" type="search" placeholder="Usuario de Kick…" autocomplete="off"></label>${ST.tryUser ? `<small class="sp-hint">Viendo como @${esc(ST.tryUser.username)} <button type="button" class="chip" data-pv="me" data-k="me">Volver a mí</button></small>` : '<small class="sp-hint">Escribí un usuario y presioná Enter.</small>'}</div>
          </div></details>
      </div>`;
    if (prevKey) p.querySelector(`[data-k="${prevKey}"]`)?.focus();
  }

  const stage = () => { const e = $('spStage'); if (e) e.innerHTML = stageHtml(); };

  function openDrawer(from = 'item', origin = null) {
    const p = $('spPrev'); if (!p) return;
    if (!ST.drawer) ST.drawerReturn = origin || document.activeElement;
    ST.drawer = true; ST.drawerFrom = from;
    p.hidden = false; p.setAttribute('aria-hidden', 'false');
    renderDrawer(); p.classList.add('on');
    $('spScrim').hidden = false; setTimeout(() => $('spScrim').classList.add('on'), 10);
    const m = $('spLookBtn'); if (m) m.setAttribute('aria-expanded', 'true');
    p.querySelector('[data-pv="close"]')?.focus();
  }
  function closeDrawer(silent = false) {
    const p = $('spPrev'); if (!p || !ST.drawer) return;
    ST.drawer = false; p.classList.remove('on'); p.setAttribute('aria-hidden', 'true');
    $('spScrim').classList.remove('on'); setTimeout(() => { if (!ST.drawer) { $('spScrim').hidden = true; p.hidden = true; } }, 220);
    const m = $('spLookBtn'); if (m) m.setAttribute('aria-expanded', 'false');
    const back = ST.drawerReturn;
    if (!silent && back && document.contains(back)) back.focus();
    ST.drawerReturn = null;
  }

  function captureFocus() {
    const a = document.activeElement, key = a?.dataset?.k;
    if (!key) return null;
    const scope = a.closest('#spPrev') ? '#spPrev' : a.closest('#shopGrid') ? '#shopGrid' : a.closest('#shopWallet') ? '#shopWallet' : null;
    return scope ? `${scope} [data-k="${key}"]` : null;
  }
  function restoreFocus(sel) { if (sel) document.querySelector(sel)?.focus(); }

  function render() {
    const focus = captureFocus();
    renderHead(); syncFilters(); renderGrid(); renderDrawer();
    restoreFocus(focus);
  }

  function markTry() {
    document.querySelectorAll('#shopGrid .sp-card').forEach(el => {
      const b = el.querySelector('[data-sel]'), on = b && tried(b.dataset.sel);
      if (b) el.classList.toggle('tried', !!on);
    });
  }
  function toggleTry(id) { const c = COS.get(id); if (!c || !(c.type in ST.try)) return; ST.try[c.type] = ST.try[c.type] === id ? null : id; markTry(); renderDrawer(); }
  function pvAct(a, type) {
    if (a === 'close') return closeDrawer();
    if (a === 'pause') ST.pause = !ST.pause;
    else if (a === 'rm') ST.try[type] = null;
    else if (a === 'clear') clearTry();
    else if (a === 'me') { ST.tryUser = null; ST.lvl = null; }
    markTry(); renderDrawer();
  }
  async function setWho(raw) {
    const name = normUser(raw); if (!name) return;
    const u = await rpc('get_user_stats', {p_username: name});
    if (!u) return msg(`No encontramos a «${raw.trim()}». Probá con el nombre de usuario exacto.`, false);
    ST.tryUser = u; ST.lvl = null; renderDrawer();
  }

  function popBalance(){
    const b = document.querySelector('#shopWallet .sp-money b');
    if (!b) return;
    b.classList.add('sp-pop');
    b.addEventListener('animationend', () => b.classList.remove('sp-pop'), { once: true });
  }

  async function act(a, id, type) {
    if (ST.busy) return;
    if (a === 'login') { goLogin('/tienda'); return; }
    if (a === 'gift') {
      const c = COS.get(id); if (!c || !wallet) return; ST.sel = id;
      if (wallet.balance < c.cost) return msg(MSG.insufficient, false);
      const raw = prompt(`¿A quién le regalás «${c.name}»? Escribí su usuario de Kick.`);
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
    catch (err) { console.error('[tienda]', err); res = {ok: false, reason: 'error'}; }
    ST.busy = false;
    if (!res.ok) console.warn('[tienda] el servidor respondió:', res);
    msg(res.ok ? (a === 'confirm' ? '¡Compra realizada! Ya podés equiparlo.' : a === 'equip' ? 'Objeto equipado.' : 'Objeto quitado.') : (MSG[res.reason] || `No se pudo completar (${res.reason || res.error || res.message || 'error'}).`), !!res.ok);
    try { await loadWallet(); } catch (err) { console.error(err); }
    render(); if (res.ok && a === 'confirm') popBalance();
  }

  function toggleFilters(force) {
    const p = $('spFilters'), b = $('spFilterBtn'); if (!p || !b) return;
    const open = force ?? p.hidden;
    p.hidden = !open; b.setAttribute('aria-expanded', open);
  }

  root.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'), t = e.target.closest('#spTabs .chip'), open = e.target.closest('[data-sel]');
    if (e.target.closest('#logoutBtn')) return logout(true);
    if (e.target.closest('#spLookBtn')) { e.stopPropagation(); const b = e.target.closest('#spLookBtn'); return ST.drawer ? closeDrawer() : openDrawer('look', b); }
    if (e.target.closest('#spFilterBtn')) { e.stopPropagation(); return toggleFilters(); }
    if (e.target.id === 'spClearFilters' || e.target.closest('[data-clear]')) { ST.type = 'all'; ST.q = ''; ST.mine = false; ST.afford = false; const q = $('spQ'); if (q) q.value = ''; toggleFilters(false); syncFilters(); return renderGrid(); }
    if (e.target.closest('#spFilters')) { /* el popover no cierra al usar sus controles */ }
    else if (!e.target.closest('.sp-filters')) toggleFilters(false);
    const tr = e.target.closest('[data-try]'); if (tr) { e.stopPropagation(); return toggleTry(tr.dataset.try); }
    const vw = e.target.closest('[data-view]'); if (vw) { ST.view = vw.dataset.view; return renderDrawer(); }
    const pv = e.target.closest('[data-pv]'); if (pv) return pvAct(pv.dataset.pv, pv.dataset.type);
    if (t) { ST.type = t.dataset.t; syncFilters(); return renderGrid(); }
    if (e.target.id === 'spMine') { ST.mine = !ST.mine; syncFilters(); return renderGrid(); }
    if (e.target.id === 'spAfford') { if (!wallet) return msg('Iniciá sesión con Kick para ver lo que podés comprar.', false); ST.afford = !ST.afford; syncFilters(); return renderGrid(); }
    if (a) { e.stopPropagation(); return act(a.dataset.act, a.dataset.id, a.dataset.type); }
    if (open) { e.stopPropagation(); ST.sel = open.dataset.sel; document.querySelectorAll('#shopGrid .sp-card').forEach(x => x.classList.toggle('sel', x.querySelector('[data-sel]')?.dataset.sel === ST.sel)); return openDrawer('item', open); }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.sp-filters')) toggleFilters(false);
  });
  root.addEventListener('toggle', e => { if (e.target && e.target.classList && e.target.classList.contains('sp-sec-adv')) ST.adv = e.target.open; }, true);
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape' && ST.drawer) { e.stopPropagation(); e.preventDefault(); return closeDrawer(); }
    if (e.key === 'Enter' && e.target.id === 'spWho') { e.preventDefault(); setWho(e.target.value); }
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) && e.target.closest('#spTabs')) {
      const tabs = [...document.querySelectorAll('#spTabs .chip')], i = tabs.indexOf(document.activeElement); if (i < 0) return;
      const j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : tabs.length - 1;
      tabs[j].focus(); tabs[j].click(); e.preventDefault();
    }
  });
  $('spScrim').addEventListener('click', () => closeDrawer());
  root.addEventListener('input', e => {
    if (e.target.id === 'spQ') { ST.q = e.target.value; renderGrid(); }
    if (e.target.id === 'spLv') { ST.lvl = +e.target.value; const o = $('spLvO'); if (o) o.textContent = ST.lvl; stage(); }
  });
  root.addEventListener('change', e => { if (e.target.id === 'spSort') { ST.sort = e.target.value; renderGrid(); } });

  /* ---------- arranque ---------- */
  (async () => {
    render();                                   // esqueleto + barra
    if (window.RankEngine) RankEngine.init(db, () => { try { render(); } catch {} });
    await loadCosmetics();
    if (sess) { try { await ensureSession(); } catch (err) { console.error(err); } }
    render();
  })();
})();
