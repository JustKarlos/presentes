/* Espejo del chat en vivo: pinturas de 7TV, nombres del sitio y suscripción Realtime.
   Script clásico; bajo Node se exporta para las pruebas. */
(function (root) {
  'use strict';

  function hexColor(int) {
    return '#' + (Number(int) >>> 0 & 0xffffff).toString(16).padStart(6, '0');
  }

  // 7TV manda pinturas como gradientes: capas de imagen o de color, más sombras.
  function paintFrom7tv(style) {
    const paint = style && style.paint;
    if (!paint) return null;
    const layers = [];
    (Array.isArray(paint.gradients) ? paint.gradients : []).slice(0, 4).forEach((g) => {
      if (!g) return;
      if (typeof g.image_url === 'string' && /^https:\/\/cdn\.7tv\.app\/paint\//.test(g.image_url)) {
        layers.push({ type: 'url', url: g.image_url, size: [200, 100], repeat: true });
      } else if (Array.isArray(g.stops) && g.stops.length >= 2) {
        layers.push({
          type: g.function === 'RADIAL' ? 'radial' : 'linear',
          angle: Number(g.angle) || 180,
          stops: g.stops.map((s) => [hexColor(s.color), (Number(s.at) || 0) * 100]),
        });
      }
    });
    if (!layers.length) return null;
    const shadows = (Array.isArray(paint.shadows) ? paint.shadows : []).slice(0, 3)
      .filter(Boolean)
      .map((s) => ({ x: s.x_offset, y: s.y_offset, blur: s.radius, color: hexColor(s.color) }));
    return { layers, shadows };
  }

  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  const safeCls = (c) => /^[a-z0-9_-]{1,40}$/.test(c || '') ? c : '';

  function renderMessage(p, site, paint7tv, deps) {
    const msg = p || {};
    let cls = '';
    if (site && site.nid && site.np) {
      try { cls = safeCls(deps.register(site.nid, site.np)) || ''; } catch (e) { console.error('paint del sitio', e); }
    }
    // Los efectos clásicos (ne) no traen meta.paint: van antes que 7TV, igual que en Kicklet.
    if (!cls && site && site.ne) cls = safeCls(site.ne);
    if (!cls && paint7tv) {
      try { cls = safeCls(deps.register('7tv-' + slug(msg.kick_user_id || msg.user), paint7tv)) || ''; } catch (e) { console.error('paint de 7TV', e); }
    }
    const name = deps.esc(msg.name || '');
    const nm = cls
      ? '<span class="nm ne ' + cls + '">' + name + '</span>'
      : '<span class="nm" style="color:' + deps.colorOf(msg.user || msg.name, msg.color) + '">' + name + '</span>';
    return deps.badgeHtml(msg.badges) + nm + '<span class="sep">: </span>' +
      deps.partsHtml(msg.content || '');
  }

  function depsPorDefecto() {
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
    const hue = (s) => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
    const colorOf = (name, c) => /^#[0-9a-f]{3,8}$/i.test(c || '') ? c : 'hsl(' + hue(name) + ' 75% 68%)';
    const badgeHtml = (types) => (Array.isArray(types) ? types : []).slice(0, 6).map((t) => {
      if (!/^[a-z0-9_]{1,24}$/.test(t || '')) return '';
      return '<img class="bi" src="assets/badges/' + t + '.svg" alt="" onerror="this.style.display=\'none\'">';
    }).join('');
    const partsHtml = (text) => {
      const str = String(text ?? ''), out = [], re = /\[emote:(\d+):([^\]]*)\]/g;
      let last = 0, m;
      while ((m = re.exec(str))) {
        out.push(esc(str.slice(last, m.index)));
        out.push('<img class="emote" src="https://files.kick.com/emotes/' + m[1] + '/fullsize" alt="' + esc(m[2]) + '">');
        last = re.lastIndex;
      }
      out.push(esc(str.slice(last)));
      return out.join('');
    };
    const register = (id, def) => (typeof window !== 'undefined' && window.PaintEngine)
      ? window.PaintEngine.register(id, def) : '';
    return { esc, colorOf, badgeHtml, partsHtml, register };
  }

  // Caché en memoria: reutiliza valores frescos, deduce pedidos iguales y cachea fallos.
  function createCache(opts) {
    const o = opts || {};
    const ttl = o.ttl == null ? 600000 : o.ttl;
    const ttlMiss = o.ttlMiss == null ? 60000 : o.ttlMiss;
    const now = o.now || Date.now;
    const store = new Map(), pending = new Map();
    return {
      get(key, loader) {
        const k = String(key);
        const c = store.get(k);
        if (c && c.exp > now()) return Promise.resolve(c.v);
        if (pending.has(k)) return pending.get(k);
        const p = Promise.resolve().then(loader)
          .then((v) => {
            store.set(k, { v, exp: now() + (v == null ? ttlMiss : ttl) });
            return v;
          })
          .catch((e) => {
            console.error('cache', e);
            store.set(k, { v: null, exp: now() + ttlMiss });
            return null;
          })
          .finally(() => pending.delete(k));
        pending.set(k, p);
        return p;
      },
    };
  }

  const GQL_7TV = 'query($id:String!){userByConnection(platform:KICK,id:$id){style{paint{' +
    'gradients{image_url,function,angle,repeat,canvas_size,stops{at,color}}}' +
    'shadows{x_offset,y_offset,radius,color}}}}}';

  function makeFetch7tv(post) {
    return async (kickUserId) => {
      if (!kickUserId) return null;
      try {
        const j = await post(GQL_7TV, { id: String(kickUserId) });
        const style = j && j.data && j.data.userByConnection && j.data.userByConnection.style;
        return paintFrom7tv(style);
      } catch (e) {
        console.error('7TV', e);
        return null;
      }
    };
  }

  function attachChatMirror(opts) {
    const o = opts || {};
    const db = o.db, el = o.el;
    const max = o.max == null ? 40 : o.max;
    const deps = o.deps || depsPorDefecto();
    const fetch7tv = o.fetch7tv || makeFetch7tv((query, variables) =>
      fetch('https://7tv.io/v3/gql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      }).then((r) => r.json()));
    const load7tv = o.load7tv || (() => Promise.resolve());
    const siteCache = createCache({ ttl: 5 * 60 * 1000 });
    const tvCache = createCache({ ttl: 10 * 60 * 1000 });
    const createEl = (tag) => (typeof document !== 'undefined' && document.createElement)
      ? document.createElement(tag)
      : { innerHTML: '' };

    function onChat(m) {
      const p = m && m.payload;
      if (!p || !el) return;
      const li = createEl('li');
      li.innerHTML = deps.esc(p.name || '') + ': ' + deps.esc(p.content || '');
      el.appendChild(li);
      const user = String(p.user || p.name || '').toLowerCase();
      Promise.all([
        siteCache.get(user, () => {
          if (!db || !db.rpc) return Promise.resolve(null); // modo demo sin Supabase
          return db.rpc('get_chat_cosmetics', { p_usernames: [user] })
            .then((r) => {
              const rows = r && r.data;
              return Array.isArray(rows) ? rows[0] || null : null;
            });
        }),
        tvCache.get(String(p.kick_user_id || ''), () => fetch7tv(p.kick_user_id)),
        load7tv(p.broadcaster_id),
      ]).then(([site, paint]) => {
        if (li.parentNode !== el) return; // ya fue recortado; HTMLCollection no tiene includes()
        li.innerHTML = renderMessage(p, site, paint, deps);
      }).catch((e) => console.error('chat en vivo', e));
      while (el.children && el.children.length > max) el.removeChild(el.children[0]);
    }

    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('sim') === '1') {
      [
        { name: 'Karlitoxss', user: 'karlitoxss', color: '#75fd46', badges: ['moderator'], content: '¡hola!', kick_user_id: null },
        { name: 'SinPaint', user: 'sinpaint', color: '#ff9a1f', badges: [], content: 'mensaje sin pintura', kick_user_id: null },
        { name: '<&>Wiki', user: 'twiki', color: '#53fc18', badges: ['vip'], content: 'probando escapes', kick_user_id: null },
      ].forEach((m) => onChat({ payload: m }));
      return null;
    }
    if (!db || !db.channel) return null;
    // Canal privado: sin esta opción Supabase no aplica las policies de realtime.messages.
    return db.channel('chat-public', { config: { private: true } })
      .on('broadcast', { event: 'chat' }, onChat).subscribe();
  }

  const api = { hexColor, paintFrom7tv, renderMessage, depsPorDefecto, createCache, makeFetch7tv, attachChatMirror };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChatMirror = api;
})(typeof window !== 'undefined' ? window : globalThis);
