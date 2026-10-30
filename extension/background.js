/* =====================================================================
   background.js — service worker (Manifest V3)
   - Consulta a Supabase los cosméticos de los usuarios que aparecen en el chat.
   - Caché de 5 minutos (memoria + chrome.storage.local, porque el service worker se duerme).
   - Agrupa usuarios en lotes de hasta 100 y espacia las consultas (máx. 1 por segundo).
   ===================================================================== */
if (typeof importScripts === 'function') importScripts('settings.js');

var TTL_OK = 5 * 60 * 1000;      // usuario con datos
var TTL_MISS = 60 * 1000;        // usuario sin datos (puede registrarse en cualquier momento)
var MAX_BATCH = 100;
var MIN_GAP = 1000;              // separación mínima entre consultas
var MAX_ENTRIES = 2000;
var TIMEOUT = 8000;

var mem = new Map();             // slug -> { d, exp }
var paints = new Map();          // id del efecto -> { np, exp } (una copia por efecto, no por usuario)
var loaded = null;
var lastFetchAt = 0;
var chain = Promise.resolve();   // las consultas se hacen de a una

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function getSettings() {
  return chrome.storage.sync.get(Object.keys(KCX_DEFAULTS)).then(function (s) { return Object.assign({}, KCX_DEFAULTS, s); });
}

function loadCache() {
  if (!loaded) loaded = chrome.storage.local.get(['kcx_cache', 'kcx_paints']).then(function (o) {
    var c = o.kcx_cache || {}, now = Date.now();
    Object.keys(c).forEach(function (k) { if (c[k] && c[k].exp > now) mem.set(k, c[k]); });
    var pc = o.kcx_paints || {};
    Object.keys(pc).forEach(function (k) { if (pc[k] && pc[k].exp > now) paints.set(k, pc[k]); });
  });
  return loaded;
}
function prune() {
  var now = Date.now();
  mem.forEach(function (v, k) { if (v.exp <= now) mem.delete(k); });
  paints.forEach(function (v, k) { if (v.exp <= now) paints.delete(k); });
  if (paints.size > 200) { var ex = paints.size - 200; paints.forEach(function (_, k) { if (ex-- > 0) paints.delete(k); }); }
  if (mem.size > MAX_ENTRIES) {
    var extra = mem.size - MAX_ENTRIES;
    mem.forEach(function (_, k) { if (extra-- > 0) mem.delete(k); });
  }
}
function persist() { return chrome.storage.local.set({ kcx_cache: Object.fromEntries(mem), kcx_paints: Object.fromEntries(paints) }); }
function withPaint(d) { var p = d && d.nid && paints.get(d.nid); return p ? Object.assign({}, d, { np: p.np }) : d; }

function rpc(path, body) {
  return getSettings().then(function (s) {
    var ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, TIMEOUT);
    return fetch(s.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + path, {
      method: 'POST',
      headers: { apikey: s.anonKey, Authorization: 'Bearer ' + s.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: ctl.signal
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  });
}

// Pide a la base los cosméticos de una lista de usuarios (en lotes) y rellena la caché
function fetchBatches(slugs) {
  var run = chain.then(function () {
    var out = {}, parts = [];
    for (var i = 0; i < slugs.length; i += MAX_BATCH) parts.push(slugs.slice(i, i + MAX_BATCH));
    return parts.reduce(function (p, part) {
      return p.then(function () {
        var wait = lastFetchAt + MIN_GAP - Date.now();
        return wait > 0 ? sleep(wait) : null;
      }).then(function () {
        lastFetchAt = Date.now();
        return rpc('get_chat_cosmetics', { p_usernames: part });
      }).then(function (rows) {
        var by = new Map((Array.isArray(rows) ? rows : []).map(function (r) { return [r.u, r]; })), t = Date.now();
        part.forEach(function (s) {
          var r = by.get(s), d = r ? { lv: r.lv, rank: r.rank, ne: r.ne || null, fr: r.fr || null, nid: r.nid || null, rid: r.rid == null ? null : r.rid } : null;
          if (r && r.nid && r.np) paints.set(r.nid, { np: r.np, exp: t + TTL_OK * 12 });
          mem.set(s, { d: d, exp: t + (d ? TTL_OK : TTL_MISS) });
          out[s] = d;
        });
      });
    }, Promise.resolve()).then(function () { prune(); return persist(); }).then(function () { return out; });
  });
  chain = run.catch(function () {});     // un error no bloquea la cola
  return run;
}

function lookup(slugs) {
  return loadCache().then(function () {
    var out = {}, need = [], now = Date.now();
    slugs.slice(0, 500).forEach(function (s) {
      var c = mem.get(s);
      if (c && c.exp > now) out[s] = withPaint(c.d); else need.push(s);
    });
    if (!need.length) return { ok: true, data: out, fromCache: true };
    return fetchBatches(need).then(function (got) { Object.keys(got).forEach(function (k) { got[k] = withPaint(got[k]); }); return { ok: true, data: Object.assign(out, got) }; });
  });
}

var RANK_TTL = 5 * 60 * 1000;
function getRanks() {
  return chrome.storage.local.get('kcx_ranks').then(function (o) {
    var c = o.kcx_ranks;
    if (c && c.exp > Date.now()) return c.d;
    return rpc('get_rank_defs', {}).then(function (rows) {
      var d = Array.isArray(rows) ? rows : [];
      return chrome.storage.local.set({ kcx_ranks: { d: d, exp: Date.now() + RANK_TTL } }).then(function () { return d; });
    }).catch(function (e) { if (c) return c.d; throw e; });   // sin red: se usa la última copia
  });
}

function ping() {
  var t0 = Date.now();
  return rpc('server_time', {}).then(function () { return { ok: true, ms: Date.now() - t0 }; });
}

chrome.runtime.onMessage.addListener(function (msg, sender, send) {
  var job;
  if (msg && msg.type === 'lookup' && Array.isArray(msg.slugs)) job = lookup(msg.slugs.filter(function (s) { return typeof s === 'string' && /^[a-z0-9-]{1,40}$/.test(s); }));
  else if (msg && msg.type === 'ping') job = ping();
  else if (msg && msg.type === 'ranks') job = getRanks().then(function (d) { return { ok: true, data: d }; });
  else if (msg && msg.type === 'clearCache') { mem.clear(); paints.clear(); job = chrome.storage.local.remove(['kcx_cache', 'kcx_paints', 'kcx_ranks']).then(function () { return { ok: true }; }); }
  else return false;
  job.then(send, function (e) { send({ ok: false, error: String((e && e.message) || e) }); });
  return true;                                     // respuesta asíncrona
});

// Al instalar: valores por defecto sin pisar lo que ya exista
chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(Object.keys(KCX_DEFAULTS)).then(function (cur) {
    var fill = {};
    Object.keys(KCX_DEFAULTS).forEach(function (k) { if (cur[k] === undefined) fill[k] = KCX_DEFAULTS[k]; });
    if (Object.keys(fill).length) chrome.storage.sync.set(fill);
  });
});
