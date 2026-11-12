/* admin-calendar.js — pestaña «Calendario» del admin: cumpleaños a mano y eventos.
   Cargalo en admin.html justo antes de </main>:  <script src="admin-calendar.js"></script>
   Usa lo que ya define admin.html ($, esc, api, toast) y se inyecta sola en las pestañas. */
(() => {
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const KIND = {directo: 'Directo', evento: 'Evento', especial: 'Especial', feriado: 'Feriado'};
  const nav = document.querySelector('.tabsA'), app = $('app');
  const btn = document.createElement('button');
  btn.type = 'button'; btn.setAttribute('role', 'tab'); btn.dataset.tab = 'cal'; btn.setAttribute('aria-selected', 'false'); btn.textContent = 'Calendario';
  nav.append(btn);

  const sec = document.createElement('div'); sec.id = 'tabCal'; sec.hidden = true;
  sec.innerHTML = `
  <p class="pnote" style="margin-bottom:.6rem">Los cumpleaños que la gente guarda en «Mi perfil» (con la opción pública) aparecen solos en <a href="calendario.html" target="_blank" rel="noopener" style="color:var(--gold)">calendario.html</a>. Acá cargás los que quieras a mano y los eventos. Nunca se guarda el año.</p>
  <div class="cols">
    <form id="cbForm" class="panel">
      <h2 id="cbT">Nuevo cumpleaños</h2><input id="cbId" type="hidden">
      <label>Usuario de Kick (opcional: trae su foto y su nombre)<input id="cbU" maxlength="40" placeholder="mi-usuario" autocomplete="off"></label>
      <label>Nombre a mostrar<input id="cbName" maxlength="40" required></label>
      <div class="row"><label>Día<input id="cbD" type="number" min="1" max="31" required></label>
        <label>Mes<select id="cbM">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></label></div>
      <label>Nota (opcional)<input id="cbNote" maxlength="120" placeholder="Cumple 25"></label>
      <div class="acts"><button type="submit">Guardar</button><button type="button" class="ghost" id="cbNew">Nuevo</button><button type="button" class="del" id="cbDel" hidden>Eliminar</button></div>
    </form>
    <div class="panel"><h2>Cumpleaños cargados a mano</h2><div id="cbList" class="grid"></div></div>
  </div>
  <div class="cols" style="margin-top:1rem">
    <form id="ceForm" class="panel">
      <h2 id="ceT">Nuevo evento</h2><input id="ceId" type="hidden">
      <label>Título<input id="ceTitle" maxlength="80" required></label>
      <div class="row"><label>Tipo<select id="ceKind">${Object.entries(KIND).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
        <label>Hora (opcional)<input id="ceTime" maxlength="20" placeholder="21:00"></label></div>
      <div class="row"><label>Fecha<input id="ceDay" type="date" required></label><label>Hasta (opcional)<input id="ceEnd" type="date"></label></div>
      <label>Descripción (opcional)<input id="ceDesc" maxlength="300"></label>
      <label class="chk"><input id="ceYearly" type="checkbox"> Se repite todos los años</label>
      <label class="chk"><input id="ceActive" type="checkbox" checked> Visible en el calendario</label>
      <div class="acts"><button type="submit">Guardar</button><button type="button" class="ghost" id="ceNew">Nuevo</button><button type="button" class="del" id="ceDel" hidden>Eliminar</button></div>
    </form>
    <div class="panel"><h2>Eventos</h2><div id="ceList" class="grid"></div></div>
  </div>`;
  app.append(sec);

  let BD = [], EV = [];
  const norm = (s) => String(s || '').trim().toLowerCase().replace(/^@/, '').replace(/_/g, '-');
  const fmtDay = (s) => s ? s.split('-').reverse().join('/') : '';

  nav.addEventListener('click', (e) => {                      // los otros botones ya tienen su propio manejador
    const b = e.target.closest('[data-tab]'); if (!b) return;
    const on = b === btn; sec.hidden = !on;
    if (!on) return;
    ['tabObjs', 'tabPaints', 'tabRanks'].forEach(id => $(id).hidden = true);
    nav.querySelectorAll('[data-tab]').forEach(x => { x.classList.toggle('on', x === btn); x.setAttribute('aria-selected', x === btn); });
    load();
  });

  async function load() {
    const r = await api('/cal/list');
    if (!r.ok) return toast(r.reason ? 'Calendario: ' + r.reason : 'No se pudo cargar. ¿Ejecutaste calendario.sql y actualizaste la función?');
    BD = r.birthdays || []; EV = r.events || []; draw();
  }
  function draw() {
    $('cbList').style.gridTemplateColumns = $('ceList').style.gridTemplateColumns = '1fr';
    $('cbList').innerHTML = BD.map(b => `<div class="it ${$('cbId').value == b.id ? 'sel' : ''}"><div class="bar"><b>${esc(b.display_name)}</b><button type="button" data-cb="${b.id}">Editar</button></div>
      <small>${b.day} de ${MESES[b.month - 1]}${b.username ? ' · @' + esc(b.username) : ''}${b.note ? ' · ' + esc(b.note) : ''}</small></div>`).join('') || '<p style="color:var(--tan)">Todavía no cargaste ninguno.</p>';
    $('ceList').innerHTML = EV.map(e => `<div class="it ${e.active ? '' : 'off'} ${$('ceId').value == e.id ? 'sel' : ''}"><div class="bar"><b>${esc(e.title)}</b><button type="button" data-ce="${e.id}">Editar</button></div>
      <small>${KIND[e.kind] || ''} · ${fmtDay(e.day)}${e.end_day ? ' – ' + fmtDay(e.end_day) : ''}${e.yearly ? ' · anual' : ''}${e.active ? '' : ' · oculto'}</small></div>`).join('') || '<p style="color:var(--tan)">Todavía no hay eventos.</p>';
  }

  function fillB(b) {
    $('cbId').value = b?.id || ''; $('cbT').textContent = b ? 'Editar cumpleaños' : 'Nuevo cumpleaños'; $('cbDel').hidden = !b;
    $('cbU').value = b?.username || ''; $('cbName').value = b?.display_name || ''; $('cbD').value = b?.day || ''; $('cbM').value = b?.month || 1; $('cbNote').value = b?.note || ''; draw();
  }
  function fillE(e) {
    $('ceId').value = e?.id || ''; $('ceT').textContent = e ? 'Editar evento' : 'Nuevo evento'; $('ceDel').hidden = !e;
    $('ceTitle').value = e?.title || ''; $('ceKind').value = e?.kind || 'evento'; $('ceTime').value = e?.time_label || ''; $('ceDay').value = e?.day || '';
    $('ceEnd').value = e?.end_day || ''; $('ceDesc').value = e?.description || ''; $('ceYearly').checked = !!e?.yearly; $('ceActive').checked = e ? e.active : true; draw();
  }
  $('cbList').addEventListener('click', (e) => { const b = e.target.closest('[data-cb]'); if (b) fillB(BD.find(x => x.id == b.dataset.cb)); });
  $('ceList').addEventListener('click', (e) => { const b = e.target.closest('[data-ce]'); if (b) fillE(EV.find(x => x.id == b.dataset.ce)); });
  $('cbNew').onclick = () => fillB(null); $('ceNew').onclick = () => fillE(null);

  $('cbForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await api('/cal/birthday/upsert', {json: {id: +$('cbId').value || null, username: norm($('cbU').value) || null, display_name: $('cbName').value, month: +$('cbM').value, day: +$('cbD').value, note: $('cbNote').value}});
    if (!r.ok) return toast(r.reason === 'invalid_date' ? 'Esa fecha no existe (revisá día y mes).' : r.reason || 'Error al guardar');
    toast('Guardado ✔'); await load(); fillB(BD.find(x => x.id === r.item.id) || r.item);
  });
  $('ceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await api('/cal/event/upsert', {json: {id: +$('ceId').value || null, title: $('ceTitle').value, kind: $('ceKind').value, time_label: $('ceTime').value, day: $('ceDay').value, end_day: $('ceEnd').value || null,
      description: $('ceDesc').value, yearly: $('ceYearly').checked, active: $('ceActive').checked}});
    if (!r.ok) return toast(r.reason === 'invalid_range' ? '«Hasta» no puede ser anterior a la fecha de inicio.' : r.reason || 'Error al guardar');
    toast('Guardado ✔'); await load(); fillE(EV.find(x => x.id === r.item.id) || r.item);
  });
  $('cbDel').onclick = async () => { if (!confirm('¿Eliminar este cumpleaños?')) return; const r = await api('/cal/birthday/delete', {json: {id: +$('cbId').value}}); toast(r.ok ? 'Eliminado' : r.reason); if (r.ok) { await load(); fillB(null); } };
  $('ceDel').onclick = async () => { if (!confirm('¿Eliminar este evento? Si solo querés ocultarlo, desmarcá «Visible».')) return; const r = await api('/cal/event/delete', {json: {id: +$('ceId').value}}); toast(r.ok ? 'Eliminado' : r.reason); if (r.ok) { await load(); fillE(null); } };
})();