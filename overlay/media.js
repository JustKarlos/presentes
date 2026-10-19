/* Motor de colas de video / música: lee media_queue, reproduce de a uno y avisa a la función.
   Con &debug=1 en la URL del widget se ve arriba a la izquierda lo que informa el reproductor. */
(function(){
  let ytP;
  function loadYT(){
    if(ytP) return ytP;
    ytP = new Promise(res => {
      if(window.YT && YT.Player) return res();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if(prev) prev(); res(); };
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.append(s);
    });
    return ytP;
  }
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  let dbg = null;                                        // panel de depuración (solo con &debug=1)
  function log(...a){
    if(OV.P.get('debug') !== '1') return;
    console.log('[media]', ...a);
    if(!dbg){
      dbg = document.createElement('pre');
      dbg.style.cssText = 'position:fixed;left:6px;top:6px;margin:0;padding:4px 8px;max-width:70vw;background:rgba(0,0,0,.75);color:#7dff4a;font:12px/1.35 monospace;white-space:pre-wrap;text-shadow:none;pointer-events:none;z-index:99';
      document.body.append(dbg);
    }
    const line = a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ');
    dbg.textContent = (dbg.textContent + '\n' + line).trim().split('\n').slice(-10).join('\n');
  }

  // o: { kind, volume, tiktokSecs, onStart(item)->idDelContenedor, onStop(item)->Promise, onTick(cur,dur), onQueue(queue,cur) }
  OV.runQueue = function(o){
    const { db, FN, KEY } = OV;
    if(!KEY) OV.warn('Falta ?key=TU_CLAVE en la URL');
    let queue = [], cur = null, player = null, tt = null, tmo = [], tick = null, ending = false, played = false;
    const seen = new Set();                              // ids ya reproducidos en esta sesión: evita el bucle aunque falle el aviso a la función

    // Si la función no contesta en 4 s seguimos igual, para que la cola no quede colgada esperándola
    const ack = (id, status) => Promise.race([
      fetch(FN + '/overlay/media', {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-overlay-key': KEY }, body: JSON.stringify({ id, status }),
      }).then(r => log('aviso', id, status, r.status)).catch(e => log('aviso falló', id, status, e.message)),
      sleep(4000),
    ]);
    const clear = () => { tmo.forEach(clearTimeout); tmo = []; clearInterval(tick); tick = null; window.removeEventListener('message', onMsg); };

    /* ---- TikTok: su player solo entiende mute / unMute (no hay control de volumen) y hay que esperar a que esté listo ---- */
    const say = (type, value) => {
      try { tt.frame.contentWindow.postMessage(value === undefined ? { type, 'x-tiktok-player': true } : { type, value, 'x-tiktok-player': true }, '*'); } catch {}
    };
    const unmute = () => { if(tt && tt.muted && tt.tries < 20){ tt.tries++; say('unMute'); } };
    function onMsg(e){                                   // el reproductor de TikTok avisa por postMessage
      const d = e.data;
      if(!tt || !d || !d['x-tiktok-player']) return;
      if(d.type !== 'onCurrentTime') log('tiktok', d.type, d.value);
      const v = d.value;
      switch(d.type){
        case 'onPlayerReady': unmute(); break;           // recién ahora acepta órdenes
        case 'onMute': tt.muted = !!v; break;            // mientras siga en mute, el temporizador sigue insistiendo
        case 'onStateChange':
          if(v === 0 || v === 'ended') finish('done');
          else if(v === 1) unmute();                     // ya está reproduciendo: momento de activar el sonido
          break;
        case 'onPlayerError':                            // 3002 = el navegador bloqueó el autoplay con sonido: arrancamos mudo
          if(v && v.errorCode === 3002 && !tt.fallback){ tt.fallback = true; say('mute'); say('play'); }
          break;
        case 'onCurrentTime':
          if(v && v.duration > 0){
            if(!tt.duration){                            // ya sabemos cuánto dura: el tope pasa a ser duración + 3 s
              tt.duration = v.duration;
              clearTimeout(tt.cap);
              tt.cap = setTimeout(() => finish('done'), (v.duration + 3) * 1000);
              tmo.push(tt.cap);
            }
            if(v.currentTime >= v.duration - 0.3) finish('done');
          }
          break;
      }
    }

    async function load(){
      const { data } = await db.from('media_queue').select('*').eq('kind', o.kind).in('status', ['queued', 'playing']).order('id');
      queue = (data || []).filter(r => !seen.has(r.id));
      check();
      if(o.onQueue) o.onQueue(queue, cur);               // después de check(): ya sabemos cuál suena
    }
    function check(){
      if(ending) return;
      if(cur && !queue.some(r => r.id === cur.id)) return finish(null);     // lo saltaron desde el chat
      if(!cur && queue.length) start(queue[0]);
    }
    async function start(item){
      cur = item; played = false; ack(item.id, 'playing');
      const slot = o.onStart(item);
      if(item.provider === 'youtube'){
        await loadYT();
        if(cur !== item) return;
        let lastT = 0, lastD = 0;
        player = new YT.Player(slot, {
          videoId: item.video_id, width: '100%', height: '100%',
          playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3 },
          events: {
            onReady: (e) => { e.target.setVolume(o.volume); e.target.playVideo(); },
            onStateChange: (e) => { log('yt estado', e.data); if(e.data === 1) played = true; if(e.data === 0) finish('done'); },
            onError: (e) => { log('yt error', e.data); finish('error'); },
          },
        });
        // Los Shorts se repiten solos y el player no siempre manda "terminó" (estado 0), así que además miramos el reloj:
        // si llega al final, o el tiempo vuelve hacia atrás (ya reinició), lo damos por terminado.
        tick = setInterval(() => {
          let t, d;
          try { t = player.getCurrentTime(); d = player.getDuration(); } catch { return; }
          try { if(o.onTick) o.onTick(t, d); } catch {}
          const steady = Math.abs(d - lastD) < 0.05;     // en un directo la duración va creciendo: ahí no aplica
          if(played && d > 1 && steady && (t >= d - 0.4 || (lastT > d - 3 && t < lastT - 1))){ log('yt terminó por reloj', t, d); return finish('done'); }
          lastT = t; lastD = d;
        }, 250);
        tmo.push(setTimeout(() => { if(!played) finish('error'); }, 20000));       // no arrancó: pasa al siguiente
      } else {
        document.getElementById(slot).innerHTML =
          `<iframe id="ttf" src="https://www.tiktok.com/player/v1/${encodeURIComponent(item.video_id)}?autoplay=1&volume_control=1&music_info=0&description=0&rel=0&loop=0" allow="autoplay; fullscreen" style="width:100%;height:100%;border:0"></iframe>`;
        tt = { frame: document.getElementById('ttf'), muted: true, tries: 0, duration: 0, fallback: false, cap: null };
        window.addEventListener('message', onMsg);
        tick = setInterval(unmute, 800);                 // además de reaccionar a sus avisos, insiste hasta que confirme que ya no está en mute
        tt.cap = setTimeout(() => finish('done'), (o.tiktokSecs || 90) * 1000);    // respaldo hasta que informe la duración
        tmo.push(tt.cap);
      }
    }
    async function finish(status){
      if(ending || !cur) return;
      ending = true;
      const item = cur;
      seen.add(item.id);                                 // este video no se vuelve a reproducir en esta sesión
      clear();
      // Cortamos imagen y sonido YA: si no, un Short en loop vuelve a arrancar mientras esperamos a la base de datos
      try { if(player) player.pauseVideo(); } catch {}
      if(tt){ say('pause'); tt = null; }
      if(status) await ack(item.id, status);             // esperamos a que la base de datos lo marque antes de releer la cola
      try { if(player) player.destroy(); } catch {}
      player = null;
      if(o.onStop) await o.onStop(item);
      cur = null; ending = false;
      setTimeout(load, 800);
    }

    db.channel('mq-' + o.kind)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_queue', filter: `kind=eq.${o.kind}` }, () => load())
      .subscribe();
    setInterval(load, 20000);
    load();
  };
})();
