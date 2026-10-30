/* =====================================================================
   rank-engine.js — rangos e insignias a partir de datos (tabla rank_defs)
   Lo usan index.html, shop-plus.js, admin.html y la extensión.

   API principal:
     RankEngine.init(db, onChange)  carga caché (1 h) y consulta get_rank_defs; llama onChange() si algo cambió
     RankEngine.set(rows)           aplica una lista de rank_defs (valida cada una); devuelve true si cambió
     RankEngine.of(level)           definición del rango para ese nivel
     RankEngine.nextOf(level)       siguiente rango (o null)
     RankEngine.keyOf(level)        clave de la insignia (compatible con sprite(key,size) de index.html)
     RankEngine.sprite(key, size)   HTML de la insignia (<svg> o <img>)
     RankEngine.srcOf(key, builtinUrl)  URL/data-URI para <img> (extensión)
     RankEngine.fallbackKey(level)  insignia incluida más cercana ('fruta', 'gema', ...)
     RankEngine.svg(sprite, size)   SVG de un sprite {pal, rows} (editor del admin)
     RankEngine.validSprite(s)      sprite normalizado o null
     RankEngine.sig()               firma para detectar cambios
   Los 5 rangos originales quedan como respaldo si la llamada falla.
   ===================================================================== */
(function (root) {
  'use strict';

  var PAL = { o: '#2a1608', g: '#3fd01f', G: '#2f8f17', O: '#ff9a1f', h: '#ffd27a', C: '#35d0ff', c: '#9be9ff', W: '#d9a05b', k: '#150a03', m: '#c0392b', r: '#e0452c', y: '#ffc21a', B: '#a8693a', L: '#f3e7c4' };
  var SPRITES = {
    fruta: ['....gg....', '...gGg.o..', '..oooooo..', '.oOOOOOOo.', 'oOOhOOOOOo', 'oOhOOOOOOo', 'oOOOOOOOOo', '.oOOOOOOo.', '..oOOOOo..', '...oooo...'],
    gema: ['..........', '..oooooo..', '.oCcccCCo.', 'oCchhcCCCo', 'oCcCCCCCCo', 'oCCCCCCCCo', '.oCCCCCCo.', '..oCCCCo..', '...oCCo...', '....oo....'],
    mascara: ['..r.yy.r..', '.rryyyyrr.', '..oWWWWo..', '.oWWWWWWo.', '.oWkWWkWo.', '.oWWWWWWo.', '.oWWmmWWo.', '..oWmmWo..', '...oWWo...', '....oo....'],
    caja: ['oooooooooo', 'oBBBBBBBBo', 'oBoBBBBoBo', 'oBBoBBoBBo', 'oBBBooBBBo', 'oBBBooBBBo', 'oBBoBBoBBo', 'oBoBBBBoBo', 'oBBBBBBBBo', 'oooooooooo'],
    tiempo: ['..........', '..oooooo..', '.oLLLLLLo.', 'oLLLLkLLLo', 'oLLLLkLLLo', 'oLLLLkkkLo', 'oLLLLLLLLo', '.oLLLLLLo.', '..oooooo..', '..........']
  };
  var BUILTIN = ['fruta', 'gema', 'mascara', 'caja', 'tiempo'];
  var FALLBACK = [[0, 'Fruta Wumpa', 'fruta'], [5, 'Cazador de Gemas', 'gema'], [10, 'Guardián Aku Aku', 'mascara'], [20, 'Rompe Cajas', 'caja'], [35, 'Maestro del Tiempo', 'tiempo']];
  var COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  var IMG = /^https:\/\/[a-z0-9.-]+\/[^\s"'<>()\\]+\.(?:png|svg|webp)$/i;
  var CACHE_KEY = 'rankDefs', TTL = 60 * 60 * 1000;

  var defs = [], byKey = {}, byId = {}, cache = {}, signature = '', listeners = [];

  function validSprite(s) {
    if (!s || typeof s !== 'object' || !s.pal || typeof s.pal !== 'object' || !Array.isArray(s.rows) || s.rows.length !== 10) return null;
    var pal = {}, k, i, j;
    for (k in s.pal) { if (k.length !== 1 || k === '.' || !COLOR.test(String(s.pal[k]))) return null; pal[k] = String(s.pal[k]); }
    var rows = [];
    for (i = 0; i < 10; i++) {
      var r = s.rows[i];
      if (typeof r !== 'string' || r.length !== 10) return null;
      for (j = 0; j < 10; j++) if (r[j] !== '.' && !pal[r[j]]) return null;
      rows.push(r);
    }
    return { pal: pal, rows: rows };
  }

  function svg(sp, size) {
    var out = '', y, x, c;
    for (y = 0; y < 10; y++) for (x = 0; x < 10; x++) { c = sp.rows[y][x]; if (c !== '.') out += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + sp.pal[c] + '"/>'; }
    return '<svg class="spr" width="' + size + '" height="' + size + '" viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true">' + out + '</svg>';
  }
  function builtinSprite(key) { return { pal: PAL, rows: SPRITES[key] || SPRITES.fruta }; }

  function norm(r) {
    if (!r || typeof r !== 'object') return null;
    var min = Number(r.min_level); if (!isFinite(min) || min < 0) return null;
    var title = String(r.title || '').trim().slice(0, 40); if (!title) return null;
    var d = { id: r.id == null ? null : r.id, min_level: Math.floor(min), title: title, builtin: BUILTIN.indexOf(r.builtin) >= 0 ? r.builtin : null,
      sprite: validSprite(r.sprite), image_url: typeof r.image_url === 'string' && IMG.test(r.image_url) ? r.image_url : null,
      accent: typeof r.accent === 'string' && COLOR.test(r.accent) ? r.accent : null };
    if (!d.builtin && !d.sprite && !d.image_url) d.builtin = 'fruta';
    d.key = !d.sprite && !d.image_url ? d.builtin : 'r' + (d.id == null ? d.min_level : d.id);
    return d;
  }

  function set(rows) {
    var list = [], seen = {}, i;
    (Array.isArray(rows) ? rows : []).forEach(function (r) { var d = norm(r); if (d && !seen[d.min_level]) { seen[d.min_level] = 1; list.push(d); } });
    if (!seen[0]) list.push(norm({ min_level: 0, title: 'Fruta Wumpa', builtin: 'fruta' }));
    list.sort(function (a, b) { return a.min_level - b.min_level; });
    var sig = list.map(function (d) { return [d.min_level, d.title, d.key, d.image_url || '', d.sprite ? JSON.stringify(d.sprite) : ''].join('~'); }).join('|');
    if (sig === signature) return false;
    defs = list; signature = sig; byKey = {}; byId = {}; cache = {};
    for (i = 0; i < defs.length; i++) { byKey[defs[i].key] = defs[i]; if (defs[i].id != null) byId[defs[i].id] = defs[i]; }
    BUILTIN.forEach(function (k) { if (!byKey[k]) byKey[k] = norm({ min_level: 0, title: k, builtin: k }); });
    return true;
  }
  set(FALLBACK.map(function (f) { return { min_level: f[0], title: f[1], builtin: f[2] }; }));

  function of(level) { level = Number(level) || 0; var d = defs[0], i; for (i = 0; i < defs.length; i++) if (defs[i].min_level <= level) d = defs[i]; return d; }
  // Rango que se MUESTRA: el elegido por la persona si ya lo desbloqueó (min_level <= nivel) y sigue activo; si no, el que corresponde a su nivel.
  function shownFor(level, rankId) { var d = rankId != null ? byId[rankId] : null; return d && d.min_level <= (Number(level) || 0) ? d : of(level); }
  function nextOf(level) { level = Number(level) || 0; for (var i = 0; i < defs.length; i++) if (defs[i].min_level > level) return defs[i]; return null; }
  function sprite(key, size) {
    var ck = key + '|' + size; if (cache[ck]) return cache[ck];
    var d = byKey[key] || byKey.fruta, html;
    if (d.image_url) html = '<img class="spr" src="' + d.image_url + '" width="' + size + '" height="' + size + '" alt="" style="object-fit:contain">';
    else html = svg(d.sprite || builtinSprite(d.builtin), size);
    return (cache[ck] = html);
  }
  function srcOf(key, builtinUrl) {
    var d = byKey[key] || byKey.fruta;
    if (d.image_url) return d.image_url;
    if (!d.sprite && builtinUrl) return builtinUrl;
    var s = svg(d.sprite || builtinSprite(d.builtin), 20).replace('<svg class="spr"', '<svg xmlns="http://www.w3.org/2000/svg"');
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
  }

  function readCache() { try { var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); return c && Array.isArray(c.d) ? c : null; } catch (e) { return null; } }
  function init(db, onChange) {
    if (onChange) listeners.push(onChange);
    var c = readCache();
    if (c) set(c.d);                                  // la caché solo sirve para pintar rápido: SIEMPRE se consulta la base (es una consulta liviana)
    if (!db) return Promise.resolve(false);
    return Promise.resolve(db.rpc('get_rank_defs')).then(function (res) {
      if (!res || res.error || !Array.isArray(res.data)) return false;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: res.data })); } catch (e) {}
      var ch = set(res.data); if (ch) listeners.forEach(function (f) { try { f(); } catch (e) {} });
      return ch;
    }, function () { return false; });
  }
  // Tras la carga rápida desde caché, avisa si cambió algo respecto a lo que ya se dibujó
  var api = { init: init, set: set, of: of, nextOf: nextOf, keyOf: function (l) { return of(l).key; }, byKey: function (k) { return byKey[k]; }, sprite: sprite, srcOf: srcOf,
    fallbackKey: function (l, rid) { return shownFor(l, rid).builtin || 'fruta'; },
    shownFor: shownFor, byId: function (id) { return byId[id]; }, keyOfUser: function (u) { return shownFor(u && u.level, u && u.rank_id).key; },
    unlocked: function (level) { level = Number(level) || 0; return defs.filter(function (d) { return d.min_level <= level; }); }, svg: svg, validSprite: validSprite, builtinSprite: builtinSprite, sig: function () { return signature; },
    all: function () { return defs.slice(); }, BUILTIN: BUILTIN, PAL: PAL, clearCache: function () { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RankEngine = api;
})(typeof self !== 'undefined' ? self : this);
