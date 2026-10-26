#!/usr/bin/env python3
"""Genera overlay/kcx-obs.js (un solo archivo, sin extensión) a partir de kcx-core.js, paints.css,
los sprites de rango (tools/sprites.json) y los datos de settings.js. Ejecutar después de cambiar cualquiera de ellos:
    python3 extension/tools/build_obs.py
"""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parents[2]
ext = root / "extension"
core = (ext / "kcx-core.js").read_text()
css = (ext / "paints.css").read_text()
sprites = json.loads((ext / "tools" / "sprites.json").read_text())   # paleta y sprites de rango (copiados de index.html)
settings = (ext / "settings.js").read_text()
url = re.search(r'supabaseUrl:\s*"([^"]+)"', settings).group(1)
key = re.search(r'anonKey:\s*"([^"]+)"', settings).group(1)

glue = """
(function () {
  'use strict';
  if (window.__kcxObs) return; window.__kcxObs = true;
  var CFG = window.KCX_CONFIG || {}, OC = window.OVERLAY_CONFIG || {};
  var URL_ = (CFG.supabaseUrl || (OC.SUPABASE_URL && OC.SUPABASE_URL.indexOf('TU-PROYECTO') < 0 ? OC.SUPABASE_URL : '') || %(url)s).replace(/\\/$/, '');
  var KEY_ = CFG.anonKey || (OC.SUPABASE_ANON_KEY && OC.SUPABASE_ANON_KEY.indexOf('TU-ANON') < 0 ? OC.SUPABASE_ANON_KEY : '') || %(key)s;
  var PAL = %(pal)s, SPRITES = %(spr)s;

  if (CFG.injectCss !== false) {                       // las pinturas y la insignia llevan su propio CSS
    var st = document.createElement('style'); st.textContent = %(css)s;
    (document.head || document.documentElement).appendChild(st);
  }

  var svgCache = {};
  function badgeSrc(key) {                              // la insignia sale del mismo sprite pixel-art de la web
    if (svgCache[key]) return svgCache[key];
    var r = '';
    SPRITES[key].forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c !== '.') r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + PAL[c] + '"/>'; }); });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 10 10" shape-rendering="crispEdges">' + r + '</svg>';
    return (svgCache[key] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg));
  }

  var chain = Promise.resolve(), last = 0;
  function lookup(slugs) {                              // una consulta por segundo como máximo
    var run = chain.then(function () {
      var w = last + 1000 - Date.now();
      return w > 0 ? new Promise(function (r) { setTimeout(r, w); }) : null;
    }).then(function () {
      last = Date.now();
      return fetch(URL_ + '/rest/v1/rpc/get_chat_cosmetics', {
        method: 'POST',
        headers: { apikey: KEY_, Authorization: 'Bearer ' + KEY_, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_usernames: slugs })
      });
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (rows) {
        var out = {}; slugs.forEach(function (s) { out[s] = null; });
        (rows || []).forEach(function (x) { out[x.u] = { lv: x.lv, rank: x.rank, ne: x.ne || null, fr: x.fr || null }; });
        return out;
      });
    chain = run.catch(function () {});
    return run;
  }

  function go() {
    window.KCX_API = KCX.start({
      lookup: lookup, badgeSrc: badgeSrc, selectors: CFG.selectors, debug: !!CFG.debug,
      settings: { enabled: CFG.enabled !== false, paints: CFG.paints !== false, badges: CFG.badges !== false }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
""" % dict(url=json.dumps(url), key=json.dumps(key), pal=json.dumps(sprites["PAL"]), spr=json.dumps(sprites["SPRITES"]), css=json.dumps(css))

header = """/* =====================================================================
   kcx-obs.js — pinturas de nombre e insignias de rango SIN extensión
   Archivo generado por extension/tools/build_obs.py: no lo edites a mano.

   Uso:
   1) En una página tuya (por ejemplo overlay/chat.html), antes de este archivo:
        <script>window.KCX_CONFIG = { selectors: { row: ['.msg'], username: ['.nm'] } };</script>
        <script src="kcx-obs.js"></script>
   2) En kick.com (consola del navegador o Tampermonkey): pega este archivo tal cual;
      usa los selectores de Kick por defecto.
   Opciones de KCX_CONFIG: supabaseUrl, anonKey, selectors, paints, badges, enabled, injectCss, debug.
   Nota: el navegador de OBS no permite inyectar JavaScript en páginas ajenas (solo CSS).
   ===================================================================== */
"""
(root / "overlay" / "kcx-obs.js").write_text(header + core + "\n" + glue)
print("overlay/kcx-obs.js generado:", len((root / "overlay" / "kcx-obs.js").read_text()) // 1024, "KB")
