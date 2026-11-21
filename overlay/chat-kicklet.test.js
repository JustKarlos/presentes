const { test } = require('node:test');
const assert = require('node:assert/strict');
const K = require('./chat-kicklet.js');

const deps = {
  esc: (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
  colorOf: (u, c) => c || '#fff',
  parseParts: (t) => [{ t: 'text', v: t }],
  partsHtml: (parts) => '<em>' + parts[0].v + '</em>',
  register: (id) => 'pt-' + id,
};

test('paintClass usa np/nid y pasa la definición al registro', () => {
  const calls = [];
  const np = { v: 1 };
  const cls = K.paintClass({ nid: 'pinchita', np }, (id, def) => { calls.push([id, def]); return 'pt-pinchita'; });
  assert.equal(cls, 'pt-pinchita');
  assert.deepEqual(calls, [['pinchita', np]]);
});

test('paintClass cae al efecto clásico y luego a vacío', () => {
  assert.equal(K.paintClass({ ne: 'ne-neon' }, () => { throw new Error('no llamar'); }), 'ne-neon');
  assert.equal(K.paintClass(null, () => 'x'), '');
});

test('messageHtml pinta, escapa el nombre y deja los emotes a deps', () => {
  const html = K.messageHtml(
    { name: '<b>Ana</b>', color: '#abc', badges: ['moderator', 'vip'], content: 'hola' },
    { nid: 'x', np: {}, ne: null }, deps);
  assert.match(html, /class="nm ne pt-x"/);
  assert.match(html, /&lt;b&gt;Ana&lt;\/b&gt;/);
  assert.equal((html.match(/class="bi"/g) || []).length, 2);
  assert.match(html, /<em>hola<\/em>/);
});

test('badgeHtml sirve los SVG de Kicklet desde ../assets/badges/', () => {
  const html = K.badgeHtml(['moderator', 'sub_gift_25', 'default_subscriber']);
  assert.match(html, /<img class="bi" src="\.\.\/assets\/badges\/moderator\.svg"/);
  assert.match(html, /<img class="bi" src="\.\.\/assets\/badges\/sub_gift_25\.svg"/);
  assert.match(html, /<img class="bi" src="\.\.\/assets\/badges\/default_subscriber\.svg"/);
  assert.equal((html.match(/onerror=/g) || []).length, 3);
  assert.doesNotMatch(html, /<svg/);
});

test('badgeHtml ignora tipos inválidos y muestra hasta 6', () => {
  const html = K.badgeHtml(['vip', 'moderator', 'a', 'b', 'c', 'd', '../ruta', '', 'x'.repeat(25), 'e']);
  assert.equal((html.match(/class="bi"/g) || []).length, 6);
  assert.doesNotMatch(html, /src="\.\.\/assets\/badges\/\.\./);
});

test('messageHtml usa el color de Kick cuando no hay cosméticos', () => {
  const html = K.messageHtml({ name: 'Ana', color: '#123456', badges: [], content: 'hola' }, null, deps);
  assert.match(html, /style="color:#123456"/);
  assert.doesNotMatch(html, /class="nm ne/);
});

test('createLookup agrupa, cachea y comparte pedidos', async () => {
  const calls = [];
  const rpc = async (names) => { calls.push(names); return names.map((n) => ({ u: n, nid: 'x', np: {} })); };
  const lookup = K.createLookup(rpc, { windowMs: 0, sleep: async () => {}, now: () => 0 });
  const [a, b, a2] = await Promise.all([lookup.get('Ana'), lookup.get('bob'), lookup.get('ANA')]);
  assert.deepEqual(calls, [['ana', 'bob']]);
  assert.equal(a.nid, 'x');
  assert.equal(b.u, 'bob');
  assert.equal(a2, a);
});

test('createLookup drena los lotes restantes sin mensajes nuevos', async () => {
  const calls = [];
  const rpc = async (names) => { calls.push(names.length); return names.map((n) => ({ u: n, nid: 'x', np: {} })); };
  const lookup = K.createLookup(rpc, { windowMs: 0, sleep: async () => {}, now: () => 0 });
  const pedidos = Array.from({ length: 150 }, (_, i) => lookup.get('u' + i));
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('lote sin drenar')), 300));
  const results = await Promise.race([Promise.all(pedidos), timeout]);
  assert.deepEqual(calls, [100, 50]);
  assert.equal(results.length, 150);
  assert.ok(results.every((r) => r && r.nid === 'x'));
});

test('createLookup cachea misses y tolera errores del RPC', async () => {
  const original = console.error;
  console.error = () => {};
  try {
    let n = 0;
    const rpc = async () => { n++; if (n === 1) throw new Error('boom'); return []; };
    const lookup = K.createLookup(rpc, { windowMs: 0, sleep: async () => {}, now: () => 0 });
    assert.equal(await lookup.get('ana'), null);
    assert.equal(await lookup.get('ana'), null);
    assert.equal(n, 1);
  } finally { console.error = original; }
});
