/* =====================================================================
   paint-engine.js — motor de pinturas de nombre (sin dependencias)
   Convierte una definición de datos (cosmetics.meta.paint) en CSS seguro.

   API:
     PaintEngine.validate(def)              -> definición saneada o null
     PaintEngine.css(id, def, prefix?)      -> CSS de la clase .<prefix>-<id> (prefix = 'pt' por defecto)
     PaintEngine.register(id, def, prefix?) -> inyecta el CSS (una vez) y devuelve el nombre de clase, o ''
     PaintEngine.apply(el, id, def, opts?)  -> register + pone la clase en el elemento
     PaintEngine.setOptions({animations, shadows, prefix})  interruptores globales
     PaintEngine.config({imageHosts:[...]}) hosts permitidos para capas "url"
     PaintEngine.presets                    pinturas listas (aurora, lava y las cinco clásicas)

   Seguridad: lista blanca estricta. Colores por regex, números acotados, URLs solo
   https del almacenamiento de Supabase. Nada llega al DOM sin pasar por validate().
   Las capas se listan de abajo hacia arriba: la última capa queda encima.
   ===================================================================== */
(function (root) {
  'use strict';

  var MAX_LAYERS = 4, MAX_SHADOWS = 3, MAX_STOPS = 12;
  var TYPES = ['linear', 'radial', 'url', 'solid'];
  var MODES = ['none', 'scroll-x', 'scroll-y', 'pulse', 'hue', 'shimmer'];
  var ID_RE = /^[a-z0-9_-]{1,40}$/;
  var HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  var RGB = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d{1,3}|1\.0)\s*)?\)$/i;
  var HSL = /^hsla?\(\s*\d{1,3}(?:\.\d{1,2})?\s*,\s*\d{1,3}(?:\.\d{1,2})?%\s*,\s*\d{1,3}(?:\.\d{1,2})?%\s*(?:,\s*(?:0|1|0?\.\d{1,3}|1\.0)\s*)?\)$/i;

  var hosts = ['nlgkpoomhgehuabrkwhp.supabase.co'];
  var opts = { animations: true, shadows: true, prefix: 'pt' };
  var rules = {};                                   // prefix -> { key: {sig, css} }

  /* ---------- validación ---------- */
  function color(c) { return typeof c === 'string' && c.length <= 60 && (HEX.test(c) || RGB.test(c) || HSL.test(c)) ? c.trim() : null; }
  function num(v, min, max, def) { v = Number(v); if (!isFinite(v)) return def; return v < min ? min : v > max ? max : v; }
  function round(v, d) { var k = Math.pow(10, d || 3); return Math.round(v * k) / k; }
  function safeUrl(u) {
    if (typeof u !== 'string' || u.length > 500) return null;
    var p; try { p = new URL(u); } catch (e) { return null; }
    if (p.protocol !== 'https:' || hosts.indexOf(p.hostname) < 0 || p.pathname.indexOf('/storage/v1/object/public/') !== 0) return null;
    return p.href.replace(/["'()\\\s<>]/g, function (c) { return encodeURIComponent(c); });
  }

  function vLayer(l) {
    if (!l || typeof l !== 'object' || TYPES.indexOf(l.type) < 0) return null;
    var o = { type: l.type, repeat: !!l.repeat, anim: { mode: 'none', duration: 4, steps: 0 } };
    var sz = Array.isArray(l.size) ? l.size : [100, 100];
    o.size = [round(num(sz[0], 10, 400, 100), 2), round(num(sz[1], 10, 400, 100), 2)];

    if (l.type === 'solid') {
      var c0 = color(l.color !== undefined ? l.color : l.stops && l.stops[0] && l.stops[0][0]);
      if (!c0) return null;
      o.stops = [[c0, 0], [c0, 100]];
    } else if (l.type === 'url') {
      o.url = safeUrl(l.url); if (!o.url) return null;
    } else {
      if (!Array.isArray(l.stops) || l.stops.length < 2 || l.stops.length > MAX_STOPS) return null;
      o.stops = [];
      for (var i = 0; i < l.stops.length; i++) {
        var s = l.stops[i], c = Array.isArray(s) ? color(s[0]) : null;
        if (!c) return null;
        o.stops.push([c, round(num(s[1], 0, 100, 0), 2)]);
      }
      if (l.type === 'linear') o.angle = round(num(l.angle, 0, 360, 180), 1);
      else o.shape = l.shape === 'circle' ? 'circle' : 'ellipse';
    }
    if (l.anim !== undefined) {
      if (!l.anim || typeof l.anim !== 'object' || MODES.indexOf(l.anim.mode) < 0) return null;
      o.anim = { mode: l.anim.mode, duration: round(num(l.anim.duration, 0.3, 30, 4), 2), steps: Math.round(num(l.anim.steps, 0, 24, 0)) };
    }
    return o;
  }

  function validate(def) {
    if (!def || typeof def !== 'object' || Array.isArray(def)) return null;
    if (!Array.isArray(def.layers) || !def.layers.length || def.layers.length > MAX_LAYERS) return null;
    var out = { v: 1, layers: [], shadows: [] }, i;
    for (i = 0; i < def.layers.length; i++) { var L = vLayer(def.layers[i]); if (!L) return null; out.layers.push(L); }
    if (def.shadows !== undefined) {
      if (!Array.isArray(def.shadows) || def.shadows.length > MAX_SHADOWS) return null;
      for (i = 0; i < def.shadows.length; i++) {
        var sh = def.shadows[i], c = sh && typeof sh === 'object' ? color(sh.color) : null;
        if (!c) return null;
        out.shadows.push({ x: round(num(sh.x, -8, 8, 0), 1), y: round(num(sh.y, -8, 8, 0), 1), blur: round(num(sh.blur, 0, 12, 0), 1), color: c });
      }
    }
    if (def.weight !== undefined) out.weight = Math.round(num(def.weight, 100, 900, 700) / 100) * 100;
    if (def.stroke !== undefined) {
      var sc = def.stroke && typeof def.stroke === 'object' ? color(def.stroke.color) : null;
      if (!sc) return null;
      out.stroke = { width: round(num(def.stroke.width, 0, 3, 1), 1), color: sc };
    }
    if (def.uppercase) out.uppercase = true;
    return out;
  }

  /* ---------- generación de CSS ---------- */
  function prop(name, syntax, init) { return '@property ' + name + '{syntax:"' + syntax + '";inherits:false;initial-value:' + init + '}'; }
  // Para que el bucle cierre sin salto se desplaza exactamente un periodo (un "tile"):
  // con tamaño s (fracción de la caja) y posición p%, el desplazamiento es (1-s)*p; queremos -s => p = s/(s-1).
  function safeScale(pct) { var s = pct / 100; if (Math.abs(s - 1) < 0.05) s = 1.25; return s; }

  function css(id, def, prefix) {
    prefix = prefix || 'pt';
    if (!ID_RE.test(id || '')) return '';
    var d = validate(def); if (!d) return '';
    var cls = '.' + prefix + '-' + id, base = '--' + prefix + '-' + id + '-', kf = [], props = [], anims = [];
    var images = [], sizes = [], poss = [], reps = [], hue = null, pulse = null;

    d.layers.forEach(function (L, i) {
      var name = base + i, w = L.size[0], h = L.size[1], px = '0%', py = '0%', repeat = L.repeat, a = L.anim, to, s;
      var timing = a.steps > 0 ? 'steps(' + a.steps + ',end)' : 'linear', dur = a.duration + 's';
      if (a.mode === 'scroll-x' || a.mode === 'shimmer') {
        s = safeScale(w); w = round(s * 100, 2); to = round(s / (s - 1) * 100, 3) + '%';
        props.push(prop(name, '<percentage>', '0%')); px = 'var(' + name + ')'; repeat = true;
        kf.push('@keyframes ' + prefix + '-' + id + '-k' + i + (a.mode === 'shimmer' ? '{0%{' + name + ':0%}60%,100%{' + name + ':' + to + '}}' : '{to{' + name + ':' + to + '}}'));
        anims.push(prefix + '-' + id + '-k' + i + ' ' + dur + ' ' + timing + ' infinite');
      } else if (a.mode === 'scroll-y') {
        s = safeScale(h); h = round(s * 100, 2); to = round(s / (s - 1) * 100, 3) + '%';
        props.push(prop(name, '<percentage>', '0%')); py = 'var(' + name + ')'; repeat = true;
        kf.push('@keyframes ' + prefix + '-' + id + '-k' + i + '{to{' + name + ':' + to + '}}');
        anims.push(prefix + '-' + id + '-k' + i + ' ' + dur + ' ' + timing + ' infinite');
      } else if (a.mode === 'hue' && !hue) { hue = { dur: dur, timing: timing };
      } else if (a.mode === 'pulse' && !pulse) { pulse = { dur: dur, timing: timing }; }

      var stops = (L.stops || []).map(function (s2) { return s2[0] + ' ' + s2[1] + '%'; }).join(',');
      var img = L.type === 'url' ? 'url("' + L.url + '")'
        : L.type === 'radial' ? 'radial-gradient(' + L.shape + ',' + stops + ')'
        : 'linear-gradient(' + (L.type === 'solid' ? 180 : L.angle) + 'deg,' + stops + ')';
      images.push(img); sizes.push(w + '% ' + h + '%'); poss.push(px + ' ' + py); reps.push(repeat ? 'repeat' : 'no-repeat');
    });
    if (hue) { props.push(prop(base + 'h', '<angle>', '0deg')); kf.push('@keyframes ' + prefix + '-' + id + '-kh{to{' + base + 'h:360deg}}'); anims.push(prefix + '-' + id + '-kh ' + hue.dur + ' ' + hue.timing + ' infinite'); }
    if (pulse) { props.push(prop(base + 'b', '<number>', '1')); kf.push('@keyframes ' + prefix + '-' + id + '-kb{0%,100%{' + base + 'b:1}50%{' + base + 'b:1.4}}'); anims.push(prefix + '-' + id + '-kb ' + pulse.dur + ' ' + pulse.timing + ' infinite'); }

    var fx = [];
    if (hue) fx.push('hue-rotate(var(' + base + 'h))');
    if (pulse) fx.push('brightness(var(' + base + 'b))');
    var shadow = d.shadows.map(function (s) { return 'drop-shadow(' + s.x + 'px ' + s.y + 'px ' + s.blur + 'px ' + s.color + ')'; });
    var rev = function (a) { return a.slice().reverse().join(','); };          // la última capa va arriba: en CSS es la primera

    var out = props.join('') + kf.join('');
    out += cls + '{color:transparent;-webkit-text-fill-color:transparent;-webkit-background-clip:text;background-clip:text;text-shadow:none;' +
      'background-image:' + rev(images) + ';background-size:' + rev(sizes) + ';background-position:' + rev(poss) + ';background-repeat:' + rev(reps) + ';' +
      (fx.length || shadow.length ? 'filter:' + fx.concat(shadow).join(' ') + ';' : '') +
      (anims.length ? 'animation:' + anims.join(',') + ';' : '') +
      (d.weight ? 'font-weight:' + d.weight + ';' : '') + (d.uppercase ? 'text-transform:uppercase;' : '') +
      (d.stroke ? '-webkit-text-stroke:' + d.stroke.width + 'px ' + d.stroke.color + ';' : '') + '}';
    if (shadow.length) out += ':root.' + prefix + '-noshadow ' + cls + '{filter:' + (fx.join(' ') || 'none') + '}';
    out += ':root.' + prefix + '-noanim ' + cls + '{animation:none}';
    out += '@media (prefers-reduced-motion:reduce){' + cls + '{animation:none}}';
    return out;
  }

  /* ---------- inyección ---------- */
  function flush(prefix) {
    if (opts.sink) {                                 // destino propio (extensión: evita bloqueos de CSP)
      var r0 = rules[prefix] || {};
      try { opts.sink(prefix, Object.keys(r0).map(function (k) { return r0[k].css; }).join('\n')); } catch (e) {}
      return;
    }
    if (typeof document === 'undefined') return;
    var el = document.getElementById(prefix + '-css');
    if (!el) { el = document.createElement('style'); el.id = prefix + '-css'; (document.head || document.documentElement).appendChild(el); }
    var r = rules[prefix] || {};
    el.textContent = Object.keys(r).map(function (k) { return r[k].css; }).join('\n');
  }
  function register(id, def, prefix) {
    prefix = prefix || opts.prefix;
    var d = validate(def); if (!d || !ID_RE.test(id || '')) return '';
    var sig = JSON.stringify(d), r = rules[prefix] || (rules[prefix] = {});
    if (!r[id] || r[id].sig !== sig) { r[id] = { sig: sig, css: css(id, d, prefix) }; flush(prefix); }
    return prefix + '-' + id;
  }
  function apply(el, id, def, o) {
    var prefix = (o && o.prefix) || opts.prefix, cls = register(id, def, prefix);
    if (!cls || !el) return false;
    var old = []; el.classList.forEach(function (c) { if (c.indexOf(prefix + '-') === 0 && c !== cls) old.push(c); });
    old.forEach(function (c) { el.classList.remove(c); });
    el.classList.add(cls);
    return true;
  }
  function setOptions(o) {
    o = o || {};
    if (o.prefix) opts.prefix = o.prefix;
    if ('animations' in o) opts.animations = !!o.animations;
    if ('shadows' in o) opts.shadows = !!o.shadows;
    if ('sink' in o) opts.sink = typeof o.sink === 'function' ? o.sink : null;
    if (typeof document !== 'undefined') {
      var c = document.documentElement.classList;
      c.toggle(opts.prefix + '-noanim', !opts.animations);
      c.toggle(opts.prefix + '-noshadow', !opts.shadows);
    }
  }
  function config(o) { if (o && Array.isArray(o.imageHosts)) hosts = o.imageHosts.filter(function (h) { return typeof h === 'string' && /^[a-z0-9.-]+$/i.test(h); }); }

  /* ---------- presets (colores y nombres propios) ---------- */
  function hard(cols, pos) { var o = []; cols.forEach(function (c, i) { o.push([c, pos[i]], [c, pos[i + 1]]); }); return o; }
  var presets = {
    aurora: { label: 'Aurora', def: { v: 1, layers: [{ type: 'linear', angle: 90, repeat: true, size: [200, 100], stops: [['#35d0ff', 0], ['#3fd01f', 25], ['#b46bff', 50], ['#ff4dd8', 75], ['#35d0ff', 100]], anim: { mode: 'scroll-x', duration: 6, steps: 0 } }], shadows: [{ x: 1, y: 1, blur: 0, color: '#150a03' }, { x: 0, y: 0, blur: 6, color: '#35d0ff66' }], weight: 800 } },
    lava: { label: 'Lava', def: { v: 1, layers: [{ type: 'linear', angle: 135, repeat: true, size: [40, 100], stops: [['#3a0a05', 0], ['#c02a0c', 30], ['#ff9a1f', 55], ['#ffe27a', 70], ['#c02a0c', 100]], anim: { mode: 'scroll-x', duration: 2.4, steps: 0 } }, { type: 'linear', angle: 180, stops: [['#ffffff55', 0], ['#00000000', 45], ['#00000066', 100]] }], shadows: [{ x: 1, y: 1, blur: 0, color: '#3a0a05' }, { x: 0, y: 0, blur: 7, color: '#ff6a1aaa' }], weight: 800 } },
    neon: { label: 'Neón (clásico)', def: { v: 1, layers: [{ type: 'solid', color: '#f2ffee', anim: { mode: 'pulse', duration: 4, steps: 12 } }], shadows: [{ x: 0, y: 0, blur: 4, color: '#53fc18' }, { x: 0, y: 0, blur: 9, color: '#2fb80f' }, { x: 1, y: 1, blur: 0, color: '#0a2a05' }], weight: 700 } },
    hielo: { label: 'Hielo (clásico)', def: { v: 1, layers: [{ type: 'linear', angle: 180, stops: hard(['#ffffff', '#c4f3ff', '#63d9ff', '#2a9fd6'], [0, 26, 52, 78, 100]) }, { type: 'linear', angle: 105, size: [260, 100], stops: [['#ffffff00', 0], ['#ffffff00', 42], ['#fffffff2', 46], ['#fffffff2', 54], ['#ffffff00', 58], ['#ffffff00', 100]], anim: { mode: 'shimmer', duration: 3.2, steps: 14 } }], shadows: [{ x: 1, y: 1, blur: 0, color: '#0b3550' }, { x: 0, y: 0, blur: 4, color: '#63d9ffbf' }], weight: 700 } },
    oro: { label: 'Oro (clásico)', def: { v: 1, layers: [{ type: 'linear', angle: 180, stops: hard(['#fff6c2', '#ffd84a', '#ffb81c', '#c98a0b'], [0, 24, 50, 74, 100]) }, { type: 'linear', angle: 105, size: [260, 100], stops: [['#ffffff00', 0], ['#ffffff00', 42], ['#ffffffe6', 46], ['#ffffffe6', 54], ['#ffffff00', 58], ['#ffffff00', 100]], anim: { mode: 'shimmer', duration: 3.6, steps: 14 } }], shadows: [{ x: 1, y: 1, blur: 0, color: '#7a4a05' }, { x: 2, y: 2, blur: 0, color: '#3a1b08' }], weight: 700 } },
    fuego: { label: 'Fuego (clásico)', def: { v: 1, layers: [{ type: 'linear', angle: 0, repeat: true, size: [100, 50], stops: hard(['#c02a0c', '#ee4a1a', '#ff9a1f', '#ffe27a', '#ff9a1f', '#c02a0c'], [0, 20, 42, 62, 78, 90, 100]), anim: { mode: 'scroll-y', duration: 0.9, steps: 6 } }], shadows: [{ x: 1, y: 1, blur: 0, color: '#3a0a05' }, { x: 0, y: 0, blur: 5, color: '#ff6a1ab3' }], weight: 700 } },
    arcoiris: { label: 'Arcoíris (clásico)', def: { v: 1, layers: [{ type: 'linear', angle: 90, repeat: true, size: [50, 100], stops: hard(['#ff4d4d', '#ff9a1f', '#ffd84a', '#3fd01f', '#35d0ff', '#b46bff'], [0, 16.66, 33.33, 50, 66.66, 83.33, 100]), anim: { mode: 'scroll-x', duration: 1.2, steps: 6 } }, { type: 'linear', angle: 180, stops: hard(['#ffffff61', '#00000000', '#00000047'], [0, 28, 72, 100]) }], shadows: [{ x: 1, y: 1, blur: 0, color: '#150a03' }, { x: -1, y: -1, blur: 0, color: '#150a03' }], weight: 700 } }
  };

  var api = { validate: validate, css: css, register: register, apply: apply, setOptions: setOptions, config: config, presets: presets, ID_RE: ID_RE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PaintEngine = api;
})(typeof self !== 'undefined' ? self : this);
