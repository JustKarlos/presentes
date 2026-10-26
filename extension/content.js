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
    var api = KCX.start({
      settings: { enabled: s.enabled, paints: s.paints, badges: s.badges },
      debug: s.debug,
      badgeSrc: function (key) { return chrome.runtime.getURL('badges/' + key + '.svg'); },
      lookup: function (slugs) {
        return ask({ type: 'lookup', slugs: slugs }).then(function (r) {
          if (!r || !r.ok) throw new Error((r && r.error) || 'sin respuesta');
          return r.data;
        });
      }
    });

    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== 'sync') return;
      var next = {};
      ['enabled', 'paints', 'badges', 'debug'].forEach(function (k) { if (changes[k]) next[k] = changes[k].newValue; });
      if (Object.keys(next).length) api.setSettings(next);
    });

    // el popup pide estas cifras para mostrar el diagnóstico
    chrome.runtime.onMessage.addListener(function (msg, sender, send) {
      if (msg && msg.type === 'kcx-stats') { send(api.stats()); }
    });
  });
})();
