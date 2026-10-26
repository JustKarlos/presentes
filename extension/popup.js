/* popup.js — estado de la conexión, interruptores, acceso a la tienda y ajustes avanzados */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var ask = function (msg) { return new Promise(function (res) { chrome.runtime.sendMessage(msg, function (r) { res(chrome.runtime.lastError ? { ok: false, error: chrome.runtime.lastError.message } : r); }); }); };

  function render(s) {
    $('enabled').checked = s.enabled; $('paints').checked = s.paints; $('badges').checked = s.badges;
    $('paints').disabled = $('badges').disabled = !s.enabled;
    $('shop').href = s.siteUrl.replace(/\/?$/, '/') + '#tienda';
    $('supabaseUrl').value = s.supabaseUrl; $('anonKey').value = s.anonKey; $('siteUrl').value = s.siteUrl; $('debug').checked = s.debug;
  }

  function checkConnection() {
    var box = $('status'), txt = $('statusText');
    box.className = 'status'; txt.textContent = 'Comprobando conexión…';
    ask({ type: 'ping' }).then(function (r) {
      if (r && r.ok) { box.className = 'status ok'; txt.textContent = 'Conectado a la base del ranking (' + r.ms + ' ms)'; }
      else { box.className = 'status bad'; txt.textContent = 'Sin conexión con la base del ranking'; }
    });
  }

  function diagnose() {
    var out = $('diagText');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs && tabs[0];
      if (!tab || !/^https:\/\/kick\.com\//.test(tab.url || '')) { out.textContent = 'Abre un chat de Kick para ver cuántos mensajes se detectan.'; return; }
      chrome.tabs.sendMessage(tab.id, { type: 'kcx-stats' }, function (st) {
        if (chrome.runtime.lastError || !st) { out.innerHTML = '<span class="warn">Recarga la pestaña de Kick para activar la extensión.</span>'; return; }
        if (!st.enabled) { out.textContent = 'Desactivado.'; return; }
        if (!st.rowsOnPage) { out.innerHTML = '<span class="warn">No se detecta el chat. Si ya está abierto, Kick pudo cambiar su estructura (ver README).</span>'; return; }
        out.textContent = st.rowsOnPage + ' mensajes en pantalla · ' + st.applied + ' con insignia o pintura · ' + st.cached + ' usuarios en caché' + (st.errors ? ' · ' + st.errors + ' errores de red' : '');
      });
    });
  }

  chrome.storage.sync.get(KCX_DEFAULTS, function (s) {
    render(s);
    ['enabled', 'paints', 'badges'].forEach(function (k) {
      $(k).addEventListener('change', function () {
        var o = {}; o[k] = $(k).checked; chrome.storage.sync.set(o);
        if (k === 'enabled') $('paints').disabled = $('badges').disabled = !$(k).checked;
        setTimeout(diagnose, 400);
      });
    });
  });
  checkConnection(); diagnose();

  $('adv').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('advMsg'); msg.className = 'msg'; msg.textContent = '';
    var next = { supabaseUrl: $('supabaseUrl').value.trim(), anonKey: $('anonKey').value.trim(), siteUrl: $('siteUrl').value.trim(), debug: $('debug').checked }, origin;
    try {
      origin = new URL(next.supabaseUrl).origin;
      if (new URL(next.supabaseUrl).protocol !== 'https:' || new URL(next.siteUrl).protocol !== 'https:') throw new Error('https');
    } catch (err) { msg.className = 'msg err'; msg.textContent = 'Las direcciones deben empezar por https://'; return; }
    chrome.permissions.contains({ origins: [origin + '/*'] }, function (has) {
      var save = function () {
        chrome.storage.sync.set(next, function () { ask({ type: 'clearCache' }).then(function () { msg.textContent = 'Guardado.'; render(Object.assign({}, KCX_DEFAULTS, next, { enabled: $('enabled').checked, paints: $('paints').checked, badges: $('badges').checked })); checkConnection(); }); });
      };
      if (has) save();
      else chrome.permissions.request({ origins: [origin + '/*'] }, function (ok) { if (ok) save(); else { msg.className = 'msg err'; msg.textContent = 'Hace falta permiso para conectar con esa dirección.'; } });
    });
  });
  $('clear').addEventListener('click', function () { ask({ type: 'clearCache' }).then(function () { $('advMsg').className = 'msg'; $('advMsg').textContent = 'Caché borrada.'; }); });
})();
