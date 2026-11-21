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

  const rr = (c) => `<rect x="1" y="1" width="14" height="14" rx="3" fill="${c}"/>`;
  const BADGE_SVG = {
    broadcaster: rr('#e0452c') + '<path fill="#fff" d="M3.5 5.5h6v5h-6zM10.5 7l2.5-1.5v5L10.5 9z"/>',
    moderator:   rr('#3fd01f') + '<path fill="#0f2a08" d="M11.5 2.5l2 2-1 1-1-1-4.2 4.2.8.8-1 1-.8-.8-1.6 1.6-1.4-1.4 1.6-1.6-.8-.8 1-1 .8.8L10.5 3.5z"/>',
    vip:         rr('#b46bff') + '<path fill="#fff" d="M8 3l4 3-4 7-4-7z"/><path fill="#7d3fd0" d="M4 6h8L8 3z"/>',
    verified:    '<circle cx="8" cy="8" r="7" fill="#53fc18"/><path fill="none" stroke="#0f2a08" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4.8 8.3l2.2 2.2 4.3-4.6"/>',
    subscriber:  rr('#ffc21a') + '<path fill="#3a1b08" d="M8 2.8l1.5 3.1 3.4.5-2.5 2.4.6 3.4L8 10.6l-3 1.6.6-3.4L3.1 6.4l3.4-.5z"/>',
    sub_gifter:  rr('#35d0ff') + '<path fill="#06222b" d="M3 6h10v2H3zM4 8h8v5H4z"/><path fill="#fff" d="M7.2 6h1.6v7H7.2z"/>',
    og:          rr('#ff9a1f') + '<text x="8" y="11.2" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="7.5" fill="#3a1b08">OG</text>',
    founder:     rr('#ffd84a') + '<path fill="#3a1b08" d="M3 11V6l2.5 2L8 4.5 10.5 8 13 6v5z"/>',
    staff:       rr('#35d0ff') + '<path fill="#06222b" d="M8 2.5l5 2v3.5c0 3-2.2 4.7-5 5.5-2.8-.8-5-2.5-5-5.5V4.5z"/>',
  };
  const GENERIC_SVG = rr('#8a8a8a') + '<circle cx="8" cy="8" r="2.4" fill="#fff"/>';

  function badgeHtml(types) {
    return (types || []).slice(0, 6).map((t) => {
      if (!/^[a-z0-9_]{1,24}$/.test(t || '')) return '';
      return `<svg class="bi" viewBox="0 0 16 16" aria-hidden="true">${BADGE_SVG[t] || GENERIC_SVG}</svg>`;
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
