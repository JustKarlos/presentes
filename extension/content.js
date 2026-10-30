/* content.js — se ejecuta dentro de kick.com y conecta el núcleo con el service worker */
(function () {
  'use strict';
  if (window.__kcxLoaded) return; window.__kcxLoaded = true;

  function ask(msg) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.runtime.sendMessage(msg, function (res) {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(res);
        });
      } catch (e) { reject(e); }                      // la extensión se recargó: esta página ya no puede hablar con ella
    });
  }

  chrome.storage.sync.get(KCX_DEFAULTS, function (s) {
    // CSS de las pinturas: <style> y, si la página lo bloquea (CSP), hoja adoptada
    var sheetEl = null, cssSheet = null;
    function sink(prefix, text) {
      if (!sheetEl) { sheetEl = document.createElement('style'); sheetEl.id = prefix + '-css'; (document.head || document.documentElement).appendChild(sheetEl); }
      sheetEl.textContent = text;
      var blocked = !sheetEl.sheet || (text && !sheetEl.sheet.cssRules.length);
      if (blocked && typeof CSSStyleSheet === 'function' && 'adoptedStyleSheets' in document) {
        try { if (!cssSheet) { cssSheet = new CSSStyleSheet(); document.adoptedStyleSheets = document.adoptedStyleSheets.concat([cssSheet]); } cssSheet.replaceSync(text); } catch (e) {}
      }
    }
    try { PaintEngine.config({ imageHosts: [new URL(s.supabaseUrl).hostname] }); } catch (e) {}
    PaintEngine.setOptions({ prefix: 'kcx-pt', animations: s.animations, shadows: s.shadows, sink: sink });

    var api = KCX.start({
      settings: { enabled: s.enabled, paints: s.paints, badges: s.badges, skipPainted: s.skipPainted },
      debug: s.debug,
      paintClass: function (id, np) { return PaintEngine.register(id, np); },
      rankKey: function (lv, d) { return RankEngine.keyOfUser({ level: lv, rank_id: d && d.rid }); },   // d.rid = rango que eligió la persona
      rankSig: function () { return RankEngine.sig(); },
      badgeSrc: function (key) { return RankEngine.srcOf(key, chrome.runtime.getURL('badges/' + key + '.svg')); },
      badgeFallback: function (lv, d) { return chrome.runtime.getURL('badges/' + RankEngine.fallbackKey(lv, d && d.rid) + '.svg'); },
      lookup: function (slugs) {
        return ask({ type: 'lookup', slugs: slugs }).then(function (r) {
          if (!r || !r.ok) throw new Error((r && r.error) || 'sin respuesta');
          return r.data;
        });
      }
    });

    ask({ type: 'ranks' }).then(function (r) { if (r && r.ok && RankEngine.set(r.data)) api.rescan(); }).catch(function () {});   // rangos editables (caché de 1 h)

    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== 'sync') return;
      var next = {};
      ['enabled', 'paints', 'badges', 'debug', 'skipPainted'].forEach(function (k) { if (changes[k]) next[k] = changes[k].newValue; });
      if (changes.animations || changes.shadows) {
        var o = {}; if (changes.animations) o.animations = changes.animations.newValue; if (changes.shadows) o.shadows = changes.shadows.newValue;
        PaintEngine.setOptions(o);
      }
      if (Object.keys(next).length) api.setSettings(next);
    });

    // el popup pide estas cifras para mostrar el diagnóstico
    chrome.runtime.onMessage.addListener(function (msg, sender, send) {
      if (msg && msg.type === 'kcx-stats') { send(api.stats()); }
    });
  });
})();
