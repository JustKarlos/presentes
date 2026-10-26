/* =====================================================================
   kcx-core.js — lógica compartida por la extensión y por el script de OBS
   Detecta los mensajes del chat, pide los cosméticos de cada usuario y
   aplica la pintura del nombre y la insignia de rango.

   Si Kick cambia su HTML, solo hay que ajustar DEFAULT_SELECTORS.
   ===================================================================== */
(function (root) {
  'use strict';

  var DEFAULT_SELECTORS = {
    row:      ['div[data-chat-entry]', '.chat-entry'],                       // cada mensaje del chat
    username: ['.chat-entry-username', '[class*="chat-entry-username"]']      // el nombre dentro del mensaje
  };
  var RANKS = [[35, 'tiempo'], [20, 'caja'], [10, 'mascara'], [5, 'gema'], [0, 'fruta']];   // nivel mínimo -> insignia
  var TTL_OK = 5 * 60 * 1000;        // datos de un usuario: 5 minutos
  var TTL_MISS = 60 * 1000;          // usuario sin datos: 1 minuto
  var RETRY_AFTER_ERROR = 30 * 1000; // si falla la consulta, se reintenta en 30 s
  var MAX_BATCH = 100;
  var NE_RE = /^ne-[a-z0-9_-]{1,30}$/;

  // Kick muestra "Mi_Usuario"; la base guarda "mi-usuario" (minúsculas y guiones)
  function slugOf(text) {
    var s = String(text || '').trim().replace(/^@/, '').replace(/:$/, '').toLowerCase().replace(/_/g, '-');
    return /^[a-z0-9-]{1,40}$/.test(s) ? s : '';
  }
  function rankKey(level) {
    for (var i = 0; i < RANKS.length; i++) if (level >= RANKS[i][0]) return RANKS[i][1];
    return 'fruta';
  }

  /**
   * opts.lookup(slugs) -> Promise<{ [slug]: {lv, rank, ne, fr} | null }>   (rechaza si hay un error de red)
   * opts.badgeSrc(key) -> URL de la imagen de la insignia
   * opts.settings      -> { enabled, paints, badges }
   * opts.selectors     -> reemplaza los selectores por defecto
   * opts.debug         -> mensajes en la consola
   */
  function start(opts) {
    var selectors = { row: DEFAULT_SELECTORS.row, username: DEFAULT_SELECTORS.username };
    if (opts.selectors) { if (opts.selectors.row) selectors.row = opts.selectors.row; if (opts.selectors.username) selectors.username = opts.selectors.username; }
    var rowSel = selectors.row.join(','), userSel = selectors.username.join(',');
    var cfg = { enabled: true, paints: true, badges: true };
    var k; for (k in (opts.settings || {})) cfg[k] = opts.settings[k];
    var debug = !!opts.debug;
    var log = function () { if (debug) console.debug.apply(console, ['[kcx]'].concat([].slice.call(arguments))); };

    var cache = new Map();          // slug -> { d, exp }
    var waiting = new Map();        // slug -> Set<row> esperando datos
    var inflight = new Set();
    var retryAt = new Map();
    var seenRows = new WeakSet(), appliedRows = new WeakSet();
    var counters = { rowsSeen: 0, applied: 0, lookups: 0, errors: 0 };
    var observer = null, flushTimer = null, rafId = 0, queue = new Set();

    function userEl(row) { return row.querySelector(userSel); }

    function clearEl(el) {
      var cls = []; el.classList.forEach(function (c) { if (c === 'kcx-p' || c.indexOf('kcx-ne-') === 0) cls.push(c); });
      cls.forEach(function (c) { el.classList.remove(c); });
      var prev = el.previousElementSibling;
      if (prev && prev.classList && prev.classList.contains('kcx-badge')) prev.remove();
      delete el.dataset.kcx;
    }

    function apply(row, el, d) {
      var ne = cfg.paints && d && NE_RE.test(d.ne || '') ? d.ne : '';
      var lv = cfg.badges && d && typeof d.lv === 'number' ? d.lv : null;
      var key = ne + '|' + (lv === null ? '' : lv);
      if (el.dataset.kcx === key) return;              // ya está aplicado
      clearEl(el);
      el.dataset.kcx = key;
      if (ne) { el.classList.add('kcx-p', 'kcx-' + ne); }
      if (lv !== null && el.parentNode) {
        var img = document.createElement('img');
        img.className = 'kcx-badge';
        img.src = opts.badgeSrc(rankKey(lv));
        img.alt = '';
        img.width = 18; img.height = 18; img.draggable = false;
        img.title = 'Nv. ' + lv + (d.rank ? ' · ' + d.rank : '');
        el.parentNode.insertBefore(img, el);
      }
      if ((ne || lv !== null) && !appliedRows.has(row)) { appliedRows.add(row); counters.applied++; }
    }

    function process(row) {
      if (!cfg.enabled) return;
      var el = userEl(row); if (!el) return;
      var slug = slugOf(el.textContent); if (!slug) return;
      if (!seenRows.has(row)) { seenRows.add(row); counters.rowsSeen++; }
      var hit = cache.get(slug);
      if (hit && hit.exp > Date.now()) { apply(row, el, hit.d); return; }
      var set = waiting.get(slug); if (!set) waiting.set(slug, set = new Set());
      set.add(row);
      scheduleFlush(opts.batchMs || 250);
    }

    function scheduleFlush(ms) { if (!flushTimer) flushTimer = setTimeout(flush, ms); }

    function flush() {
      flushTimer = null;
      var now = Date.now();
      var slugs = [];
      waiting.forEach(function (_, s) { if (slugs.length < MAX_BATCH && !inflight.has(s) && (retryAt.get(s) || 0) <= now) slugs.push(s); });
      if (!slugs.length) return;
      slugs.forEach(function (s) { inflight.add(s); });
      counters.lookups++;
      log('consulta de', slugs.length, 'usuarios');
      Promise.resolve().then(function () { return opts.lookup(slugs); }).then(function (res) { return res; }, function () { return null; }).then(function (res) {
        var t = Date.now(), failed = !res || typeof res !== 'object';
        slugs.forEach(function (s) {
          inflight.delete(s);
          if (failed) { retryAt.set(s, t + RETRY_AFTER_ERROR); return; }
          var d = res[s] || null;
          cache.set(s, { d: d, exp: t + (d ? TTL_OK : TTL_MISS) });
          var set = waiting.get(s); waiting.delete(s);
          if (set) set.forEach(function (row) { var el = userEl(row); if (el && slugOf(el.textContent) === s) apply(row, el, d); });
        });
        if (cache.size > 5000) { var i = 0; cache.forEach(function (_, key) { if (i++ < 1000) cache.delete(key); }); }
        if (failed) { counters.errors++; setTimeout(function () { scheduleFlush(0); }, RETRY_AFTER_ERROR + 50); }
        else if (waiting.size) scheduleFlush(opts.batchMs || 250);
      });
    }

    function collect(node) {
      if (node.nodeType !== 1 || (node.classList && node.classList.contains('kcx-badge'))) return;
      var r = node.closest ? node.closest(rowSel) : null;
      if (r) queue.add(r);
      if (node.querySelectorAll) node.querySelectorAll(rowSel).forEach(function (n) { queue.add(n); });
    }
    function drain() {
      rafId = 0;
      queue.forEach(process); queue.clear();
    }
    function schedule() { if (!rafId) rafId = requestAnimationFrame(drain); }

    function begin() {
      if (observer) return;
      observer = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) for (var j = 0; j < muts[i].addedNodes.length; j++) collect(muts[i].addedNodes[j]);
        if (queue.size) schedule();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      rescan();
    }
    function rescan() { document.querySelectorAll(rowSel).forEach(function (r) { queue.add(r); }); if (queue.size) schedule(); }

    function removeAll() {
      document.querySelectorAll('.kcx-badge').forEach(function (n) { n.remove(); });
      document.querySelectorAll('[data-kcx]').forEach(clearEl);
    }
    function stop() {
      if (observer) { observer.disconnect(); observer = null; }
      clearTimeout(flushTimer); flushTimer = null; queue.clear();
      removeAll();
    }

    function setSettings(next) {
      var wasEnabled = cfg.enabled, key;
      for (key in next) cfg[key] = next[key];
      if ('debug' in next) debug = !!next.debug;
      if (!cfg.enabled) { stop(); return; }
      if (!wasEnabled || !observer) begin();
      else rescan();                                   // cambió paints/badges: se vuelve a aplicar
    }

    function stats() {
      return {
        rowsSeen: counters.rowsSeen, applied: counters.applied, lookups: counters.lookups, errors: counters.errors,
        rowsOnPage: document.querySelectorAll(rowSel).length, usernamesOnPage: document.querySelectorAll(userSel).length,
        cached: cache.size, enabled: cfg.enabled
      };
    }

    if (cfg.enabled) begin();
    return { stop: stop, setSettings: setSettings, rescan: rescan, stats: stats };
  }

  root.KCX = { start: start, slugOf: slugOf, rankKey: rankKey, DEFAULT_SELECTORS: DEFAULT_SELECTORS };
})(typeof self !== 'undefined' ? self : this);
