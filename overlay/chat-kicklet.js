/* Ayudas del chat estilo Kicklet: insignias, nombres con pintura y caché de cosméticos.
   Se carga como script clásico; bajo Node se exporta para las pruebas. */
(function (root) {
  'use strict';

  const safeCls = (c) => /^[a-z0-9_-]{1,40}$/.test(c || '') ? c : '';

  function paintClass(data, register) {
    if (data && data.nid && data.np && typeof register === 'function') {
      let cls = '';
      try { cls = safeCls(register(data.nid, data.np)); } catch (e) { console.error('paint', e); }
      if (cls) return cls;
    }
    return data ? safeCls(data.ne) : '';
  }

  const BADGE_PATH = '../assets/badges/';

  function badgeHtml(types) {
    return (Array.isArray(types) ? types : []).slice(0, 6).map((t) => {
      if (!/^[a-z0-9_]{1,24}$/.test(t || '')) return '';
      return `<img class="bi" src="${BADGE_PATH}${t}.svg" alt="" onerror="this.style.display='none'">`;
    }).join('');
  }

  function messageHtml(p, data, deps) {
    const fx = paintClass(data, deps.register);
    const name = fx
      ? `<span class="nm ne ${fx}">${deps.esc(p.name)}</span>`
      : `<span class="nm" style="color:${deps.colorOf(p.user || p.name, p.color)}">${deps.esc(p.name)}</span>`;
    return badgeHtml(p.badges) + name + '<span class="sep">:</span> ' +
      deps.partsHtml(deps.parseParts(p.content || ''));
  }

  function createLookup(rpc, opts) {
    const o = opts || {};
    const ttlOk = o.ttlOk == null ? 5 * 60 * 1000 : o.ttlOk;
    const ttlMiss = o.ttlMiss == null ? 60 * 1000 : o.ttlMiss;
    const batch = o.batch == null ? 100 : o.batch;
    const minGap = o.minGap == null ? 1000 : o.minGap;
    const windowMs = o.windowMs == null ? 50 : o.windowMs;
    const now = o.now || Date.now;
    const sleep = o.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
    const cache = new Map();
    const waiting = new Map();
    let queue = [];
    let timer = null;
    let last = 0;
    let chain = Promise.resolve();

    const norm = (s) => String(s || '').toLowerCase();

    function flush() {
      timer = null;
      const part = queue.splice(0, batch).filter((s, i, arr) => arr.indexOf(s) === i);
      if (!part.length) return;
      const done = () => {
        const t = now();
        part.forEach((s) => {
          const res = waiting.get(s) || [];
          waiting.delete(s);
          const d = (cache.get(s) || {}).d || null;
          res.forEach((resolve) => resolve(d));
        });
      };
      chain = chain
        .then(() => { const wait = last + minGap - now(); return wait > 0 ? sleep(wait) : null; })
        .then(() => { last = now(); return rpc(part); })
        .then((rows) => {
          const by = new Map((Array.isArray(rows) ? rows : []).map((r) => [norm(r.u), r]));
          const t = now();
          part.forEach((s) => { const d = by.get(s) || null; cache.set(s, { d, exp: t + (d ? ttlOk : ttlMiss) }); });
        })
        .catch((e) => {
          console.error('get_chat_cosmetics', e);
          const t = now();
          part.forEach((s) => cache.set(s, { d: null, exp: t + ttlMiss }));
        })
        .then(done);
      if (queue.length && !timer) timer = setTimeout(flush, windowMs);
    }

    function get(slug) {
      slug = norm(slug);
      if (!slug) return Promise.resolve(null);
      const c = cache.get(slug);
      if (c && c.exp > now()) return Promise.resolve(c.d);
      if (waiting.has(slug)) return new Promise((resolve) => waiting.get(slug).push(resolve));
      waiting.set(slug, []);
      queue.push(slug);
      if (!timer) timer = setTimeout(flush, windowMs);
      return new Promise((resolve) => waiting.get(slug).push(resolve));
    }

    return { get };
  }

  const api = { safeCls, paintClass, badgeHtml, messageHtml, createLookup };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KICKLET_CHAT = api;
})(typeof window !== 'undefined' ? window : globalThis);
