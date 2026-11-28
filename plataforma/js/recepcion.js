import * as S from './store.js';
import { $, $$, esc, ic, ini, h12, fechaL, durL, toast, sheet, closeSheet, setBrand, vibrar, confetti, wa, avatar, contar } from './ui.js';

/* Recepción: la pantalla del mostrador. Quién llega, quién está en silla, la fila sin cita, citas rápidas, cobros y cupones. */
const METODOS = ['Yappy', 'Tarjeta', 'Efectivo', 'Transferencia'];
const ACT = ['confirmada', 'llegó', 'en curso'];

export function render(el, [slug]) {
  const t0 = S.tenant(slug); if (!t0) { location.hash = '#/'; return; }
  const tid = t0.id; const T = () => S.tenant(tid); setBrand(t0); document.title = t0.nombre + ' · Recepción';
  const key = 'glow.rec.' + tid; let filtro = null; let off = null, it = null;

  function login() {
    let pin = '';
    el.innerHTML = `<main class="wrap" style="padding-top:56px"><div class="c in"><div class="av lg r" style="margin:0 auto">${ic('bell', 28)}</div><h1 style="font-size:30px;margin-top:14px">Recepción</h1><p class="mut">${esc(T().nombre)} · PIN de recepción</p></div>
      <div class="row" id="pins" style="justify-content:center;gap:14px;margin:22px 0">${[0, 1, 2, 3].map(() => '<i style="width:14px;height:14px;border-radius:50%;border:1.5px solid var(--line2);display:block"></i>').join('')}</div>
      <div class="grid g3" style="max-width:280px;margin:0 auto">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button class="btn ghost" style="min-height:64px;font-size:22px" data-k="${k}">${k}</button>`).join('')}</div>
      <p class="xs dim c" style="margin-top:16px">Demo: el PIN de recepción es ${T().pinRecepcion || '0000'} (el del dueño también sirve)</p></main>`;
    el.onclick = e => { const k = e.target.closest('[data-k]'); if (!k) return; vibrar(10); pin = k.dataset.k === '⌫' ? pin.slice(0, -1) : (pin + k.dataset.k).slice(0, 4);
      $$('#pins i').forEach((d, i) => d.style.background = i < pin.length ? 'var(--brand)' : '');
      if (pin.length === 4) { const ok = pin === (T().pinRecepcion || '0000') || pin === S.staff(tid)[0]?.pin; if (ok) { sessionStorage.setItem(key, '1'); arrancar(); } else { $('#pins').animate([{ transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'none' }], { duration: 300 }); pin = ''; $$('#pins i').forEach(d => d.style.background = ''); toast('PIN incorrecto', 'lock'); } } };
  }

  function arrancar() { pinta(); off = S.onChange(pinta); it = setInterval(pinta, 30000); }

  const cli = b => S.client(b.cid) || {};
  const svcs = b => b.items.map(i => S.service(i)?.nombre).filter(Boolean).join(' + ');
  function estadoPro(m, hoyB, ahoraMin) {
    const en = hoyB.find(b => b.staffId === m.id && (b.estado === 'en curso' || (b.estado === 'llegó' && S.toMin(b.inicio.slice(11)) <= ahoraMin)));
    const q = S.queue(tid).find(x => x.estado === 'atendiendo' && x.staffId === m.id && x.creado.startsWith(S.ymd(new Date())));
    const prox = hoyB.filter(b => b.staffId === m.id && b.estado === 'confirmada' && S.toMin(b.inicio.slice(11)) >= ahoraMin - 10).sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
    if (m.estadoFila === 'almorzando') return { k: 'warn', t: 'Almorzando', d: prox ? 'Próximo ' + h12(prox.inicio.slice(11)) : '' };
    if (m.estadoFila === 'fuera') return { k: 'bad', t: 'Fuera', d: '' };
    if (en) { const fin = S.toMin(en.inicio.slice(11)) + en.dur; return { k: 'br', t: 'Atendiendo', d: `${esc(cli(en).nombre?.split(' ')[0] || '')} · termina ${h12(S.fromMin(fin))}`, pct: Math.min(100, Math.max(5, (ahoraMin - S.toMin(en.inicio.slice(11))) / en.dur * 100)) }; }
    if (q) return { k: 'br', t: 'Atendiendo', d: `Fila #${q.numero} · ${esc(q.nombre.split(' ')[0])}`, pct: 40 };
    if (prox) { const falta = S.toMin(prox.inicio.slice(11)) - ahoraMin; return { k: falta <= 15 ? 'warn' : 'ok', t: falta <= 15 ? 'Por empezar' : 'Libre', d: `Próximo ${h12(prox.inicio.slice(11))}${falta > 15 ? ' · libre ' + (falta >= 60 ? Math.floor(falta / 60) + ' h ' : '') + (falta % 60) + ' min' : ''}` }; }
    return { k: 'ok', t: 'Libre', d: 'Sin más citas hoy' };
  }

  function pinta() {
    if (!sessionStorage.getItem(key)) return login();
    const t = T(); const ahora = new Date(); const hoy = S.ymd(ahora); const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
    const hoyB = S.bookings(tid).filter(b => b.inicio.startsWith(hoy) && b.estado !== 'cancelada').sort((a, b) => a.inicio.localeCompare(b.inicio));
    const fila = S.esperaFila(tid); const ms = S.staff(tid);
    const cobrado = S.sales(tid).filter(v => v.fecha.startsWith(hoy)).reduce((a, v) => a + v.cobrado, 0);
    const llegaron = hoyB.filter(b => ['llegó', 'en curso', 'completada'].includes(b.estado)).length;
    const tarde = b => b.estado === 'confirmada' && ahoraMin - S.toMin(b.inicio.slice(11)) > 10;
    const grupos = {
      todas: hoyB, ahora: hoyB.filter(b => ['llegó', 'en curso'].includes(b.estado) || tarde(b)),
      proximas: hoyB.filter(b => b.estado === 'confirmada' && !tarde(b)), listas: hoyB.filter(b => ['completada', 'no-show'].includes(b.estado)),
    };
    if (!filtro) filtro = grupos.ahora.length ? 'ahora' : 'proximas';
    const lista = grupos[filtro];
    const pill = b => tarde(b) ? '<span class="pill bad">Tarde</span>' : b.estado === 'llegó' ? '<span class="pill ok">Llegó</span>' : b.estado === 'en curso' ? '<span class="pill br">En silla</span>' : b.estado === 'completada' ? '<span class="pill">Pagada</span>' : b.estado === 'no-show' ? '<span class="pill bad">No vino</span>' : '<span class="pill">Confirmada</span>';
    const acciones = b => b.estado === 'confirmada' ? `<button class="btn ok sm" data-ck="${b.id}">${ic('check', 15)} Llegó</button><button class="btn ghost sm" data-ns="${b.id}">No vino</button><a class="ico" title="Escribirle" target="_blank" href="${wa(cli(b).tel, `Hola ${(cli(b).nombre || '').split(' ')[0]}, te esperamos en ${t.nombre} a las ${h12(b.inicio.slice(11))} ✨`)}">${ic('wa', 17)}</a>`
      : b.estado === 'llegó' ? `<button class="btn sm" data-silla="${b.id}">${ic('scissors', 15)} A la silla</button><button class="btn ghost sm" data-cob="${b.id}">Cobrar</button>`
      : b.estado === 'en curso' ? `<button class="btn sm" data-cob="${b.id}">${ic('cash', 15)} Cobrar</button>` : '';
    const fil = (k, l) => `<button class="${filtro === k ? 'on' : ''}" data-f="${k}">${l} <span class="xs mut">${grupos[k].length}</span></button>`;
    const reloj = h12(S.hm(ahora));
    el.innerHTML = `<div class="rec">
      <header class="rec-top"><div class="row" style="gap:12px">${t.logo ? `<div class="av" style="background:#fff url(${t.logo}) center/contain no-repeat;border:1px solid var(--line)"></div>` : `<div class="av">${esc(ini(t.nombre))}</div>`}<div><div class="b">${esc(t.nombre)}</div><div class="xs mut">Recepción · ${fechaL(ahora)}</div></div></div>
        <div class="rec-reloj disp">${reloj}</div>
        <div class="row wrapx rec-acc"><button class="btn sm" data-a="nueva">${ic('plus', 16)} Cita</button><button class="btn ghost sm" data-a="walk">${ic('users', 16)} Sin cita</button><button class="btn ghost sm" data-a="canjear">${ic('qr', 16)} Cupón</button><button class="btn ghost sm" data-a="venta">${ic('cash', 16)} Venta</button><a class="ico" href="#/s/${t.slug}/tv" target="_blank" title="Pantalla TV">${ic('play', 17)}</a><button class="ico" data-a="salir" title="Salir">${ic('logout', 17)}</button></div></header>
      <div class="grid g4 rec-kpi stagger"><div class="kpi"><div class="l">Citas hoy</div><div class="v">${hoyB.length}</div></div><div class="kpi"><div class="l">Ya llegaron</div><div class="v">${llegaron}</div></div><div class="kpi"><div class="l">En fila</div><div class="v">${fila.length}</div></div><div class="kpi"><div class="l">Cobrado hoy</div><div class="v grad-t">${S.money(cobrado)}</div></div></div>
      <div class="rec-grid">
        <section class="card rec-col"><div class="row sp wrapx"><h2>Llegadas</h2><div class="seg">${fil('ahora', 'Ahora')}${fil('proximas', 'Próximas')}${fil('listas', 'Listas')}${fil('todas', 'Todas')}</div></div>
          <div class="col" style="margin-top:12px;gap:8px">${lista.length ? lista.map(b => { const m = S.member(b.staffId); const c = cli(b); const visitas = S.bookings(tid).filter(x => x.cid === b.cid && x.estado === 'completada').length;
            return `<div class="rec-row ${tarde(b) ? 'tarde' : ''} ${b.estado}"><div class="rec-h"><b>${h12(b.inicio.slice(11))}</b><span class="xs mut">${durL(b.dur)}</span></div>
              <div class="g"><div class="row" style="gap:8px"><span class="b">${esc(c.nombre || '')}</span>${visitas === 0 ? '<span class="pill br" style="font-size:10px">Nuevo</span>' : visitas >= 8 ? '<span class="pill" style="font-size:10px">⭐ Fiel</span>' : ''}${c.membresia ? `<span class="pill" style="font-size:10px">${esc(c.membresia)}</span>` : ''}</div><div class="xs mut">${esc(svcs(b))} · ${avatar(m, 'r', 'width:18px;height:18px;font-size:8px;display:inline-grid;vertical-align:-4px')} ${esc(m?.nombre || '')}${b.pago?.pagado ? ' · depósito ' + S.money(b.pago.pagado) : ''}</div>${c.notas ? `<div class="xs" style="margin-top:2px">📝 ${esc(c.notas)}</div>` : ''}</div>
              <div class="rec-st">${pill(b)}</div><div class="row rec-btns">${acciones(b)}</div></div>`; }).join('') : `<div class="empty">${filtro === 'ahora' ? 'Nadie esperando ahora mismo' : 'Nada por aquí'}</div>`}</div></section>
        <div class="col" style="gap:14px">
          <section class="card"><h2>Equipo ahora</h2><div class="col" style="margin-top:10px;gap:8px">${ms.map(m => { const e = estadoPro(m, hoyB, ahoraMin); return `<div class="rec-pro">${avatar(m, 'r')}<div class="g"><div class="row sp"><b>${esc(m.nombre)}</b><span class="pill ${e.k}">${e.t}</span></div><div class="xs mut">${e.d}</div>${e.pct ? `<div class="bar-c" style="margin-top:6px;height:5px"><i style="width:${e.pct}%"></i></div>` : ''}</div></div>`; }).join('')}</div></section>
          <section class="card"><div class="row sp"><h2>Fila sin cita</h2><button class="btn ghost sm" data-a="walk">${ic('plus', 15)} Agregar</button></div>
            <div class="col" style="margin-top:10px;gap:8px">${fila.length ? fila.map(q => `<div class="rec-pro"><div class="av" style="font-size:14px">#${q.numero}</div><div class="g"><div class="b sm">${esc(q.nombre)}</div><div class="xs mut">${esc(S.service(q.servicio)?.nombre || '')} · ~${q.min} min</div></div><select data-asig="${q.id}" style="width:auto;padding:8px 10px;font-size:13px"><option value="">Pasar con…</option>${ms.map(m => `<option value="${m.id}">${esc(m.nombre)}</option>`).join('')}</select></div>`).join('') : '<div class="empty" style="padding:20px">No hay fila</div>'}</div>
            ${S.queue(tid).filter(q => q.estado === 'atendiendo' && q.creado.startsWith(hoy)).map(q => `<div class="rec-pro" style="margin-top:8px;background:var(--soft)"><div class="av" style="font-size:14px">#${q.numero}</div><div class="g"><div class="b sm">${esc(q.nombre)}</div><div class="xs mut">con ${esc(S.member(q.staffId)?.nombre || '')}</div></div><button class="btn sm" data-qok="${q.id}">Terminar y cobrar</button></div>`).join('')}</section>
          <section class="card"><h2>Huecos libres hoy</h2><p class="xs mut" style="margin:4px 0 10px">Para quien llega o llama. Toca uno para agendar.</p><div class="row wrapx" style="gap:6px">${huecos(ahora).map(s => `<button class="chip" data-hueco="${s.hora}|${s.staffId}">${h12(s.hora)} · ${esc(S.member(s.staffId)?.nombre || '')}</button>`).join('') || '<span class="sm mut">Agenda llena por hoy</span>'}</div></section>
        </div></div></div>`;
    el.onclick = click;
    $$('[data-asig]', el).forEach(s => s.onchange = () => { if (!s.value) return; const q = S.queue(tid).find(x => x.id === s.dataset.asig); S.guardar('queue', { id: q.id, estado: 'atendiendo', staffId: s.value }); S.msg(tid, { tipo: 'Turno', texto: `${q.nombre}, ¡es tu turno! Pasa con ${S.member(s.value).nombre}.` }); toast(`#${q.numero} pasa con ${S.member(s.value).nombre}`, 'users'); });
  }

  function huecos(ahora) {
    const s0 = S.services(tid)[0]; if (!s0) return []; const m0 = ahora.getHours() * 60 + ahora.getMinutes();
    const seen = new Set(); return S.slots(tid, [s0.id], null, ahora, 15).filter(s => S.toMin(s.hora) >= m0 && S.toMin(s.hora) % 30 === 0).filter(s => { const k = s.hora; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 10);
  }

  function nueva(pre = {}) {
    const sv = S.services(tid); const ms = S.staff(tid); const hoy = S.ymd(new Date());
    sheet(`<h2>Nueva cita</h2><p class="mut sm">Para quien llama o llega al mostrador.</p>
      <div class="grid g2"><div class="field"><label>Nombre</label><input id="n-n" autofocus placeholder="Nombre y apellido"></div><div class="field"><label>WhatsApp</label><input id="n-t" type="tel" placeholder="6000-0000"></div></div>
      <div class="field"><label>Servicio</label><select id="n-s">${sv.map(s => `<option value="${s.id}">${esc(s.nombre)} · ${S.money(s.precio)} · ${durL(s.dur)}</option>`).join('')}</select></div>
      <div class="grid g2"><div class="field"><label>Profesional</label><select id="n-m"><option value="">El primero libre</option>${ms.map(m => `<option value="${m.id}" ${pre.m === m.id ? 'selected' : ''}>${esc(m.nombre)}</option>`).join('')}</select></div><div class="field"><label>Día</label><input id="n-d" type="date" value="${hoy}"></div></div>
      <label>Hora</label><div class="row wrapx" id="n-h" style="gap:6px;margin-bottom:14px"></div>
      <button class="btn w" id="n-ok">${ic('check', 17)} Agendar y avisar por WhatsApp</button>`);
    let hora = pre.h || null, sid = pre.m || null;
    const horas = () => { const d = S.parse($('#n-d').value + 'T00:00'); const ss = S.slots(tid, [$('#n-s').value], $('#n-m').value || null, d, 15); const now = new Date(); const lim = $('#n-d').value === hoy ? now.getHours() * 60 + now.getMinutes() : 0; const uniq = []; const vis = new Set(); ss.filter(s => S.toMin(s.hora) >= lim).forEach(s => { if (!vis.has(s.hora)) { vis.add(s.hora); uniq.push(s); } });
      $('#n-h').innerHTML = uniq.slice(0, 24).map(s => `<button class="chip ${s.hora === hora ? 'on' : ''}" data-h="${s.hora}|${s.staffId}">${h12(s.hora)}</button>`).join('') || '<span class="sm mut">Sin espacios ese día</span>';
      $$('#n-h [data-h]').forEach(b => b.onclick = () => { [hora, sid] = b.dataset.h.split('|'); $$('#n-h .chip').forEach(x => x.classList.toggle('on', x === b)); }); };
    ['#n-s', '#n-m', '#n-d'].forEach(k => $(k).onchange = () => { hora = null; horas(); }); horas();
    $('#n-ok').onclick = () => { const nombre = $('#n-n').value.trim(), tel = $('#n-t').value.trim(); if (nombre.length < 2) return toast('Falta el nombre', 'user'); if (!hora) return toast('Elige una hora', 'clock');
      try { S.crearCita(tid, { items: [$('#n-s').value], staffId: $('#n-m').value || sid, inicio: `${$('#n-d').value}T${hora}`, cliente: { nombre, tel: tel ? '+507 ' + tel : '' }, origen: 'recepción' }); closeSheet(); confetti(); toast('Cita agendada ✦', 'cal'); } catch (e) { toast(e.message, 'x'); horas(); } };
  }

  function walk() {
    sheet(`<h2>Cliente sin cita</h2><p class="mut sm">Le damos su número y lo ves en la pantalla TV.</p><div class="field"><label>Nombre</label><input id="w-n" autofocus></div><div class="field"><label>WhatsApp (opcional)</label><input id="w-t" type="tel" placeholder="Le avisamos cuando le toque"></div><div class="field"><label>Servicio</label><select id="w-s">${S.services(tid).map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join('')}</select></div><button class="btn w" id="w-ok">Darle turno</button>`);
    $('#w-ok').onclick = () => { const n = $('#w-n').value.trim(); if (!n) return toast('Falta el nombre', 'user'); const q = S.unirseFila(tid, { nombre: n, tel: $('#w-t').value, servicio: $('#w-s').value }); closeSheet(); sheet(`<div class="c"><div class="xs mut">Turno de ${esc(n)}</div><div class="grad-t disp" style="font-size:90px;font-weight:800;line-height:1.1">#${q.numero}</div><p class="mut">Espera aprox. ${S.esperaFila(tid).find(x => x.id === q.id)?.min || 15} min</p><button class="btn w" data-x="1">Listo</button></div>`); $('.sheet [data-x]').onclick = closeSheet; };
  }

  function cobrar(bid) {
    const b = S.booking(bid); const c = cli(b); const sub = b.total; const dep = b.pago?.pagado || 0; let met = 'Yappy', prop = 0;
    const pinta2 = () => { const itb = +(sub * .07).toFixed(2), tot = +(sub + itb + prop).toFixed(2); $('#cb-tot').innerHTML = `${S.money(Math.max(0, tot - dep))}`; $('#cb-det').innerHTML = `Servicio ${S.money(sub)} · ITBMS ${S.money(itb)}${prop ? ' · propina ' + S.money(prop) : ''}${dep ? ' · menos depósito ' + S.money(dep) : ''}`; };
    sheet(`<div class="row"><div class="g"><div class="xs mut">Cobrar a</div><h2>${esc(c.nombre || '')}</h2><div class="sm mut">${esc(svcs(b))} · con ${esc(S.member(b.staffId)?.nombre || '')}</div></div></div>
      <div class="card glass c" style="margin:14px 0"><div class="xs mut">Total a cobrar</div><div class="disp" style="font-size:44px;font-weight:800" id="cb-tot"></div><div class="xs mut" id="cb-det"></div></div>
      <label>Método</label><div class="grid g4" style="margin-bottom:12px">${METODOS.map(k => `<button class="chip ${k === met ? 'on' : ''}" data-met="${k}" style="justify-content:center">${k}</button>`).join('')}</div>
      <label>Propina</label><div class="grid g4" style="margin-bottom:14px">${[0, 2, 3, 5].map(p => `<button class="chip ${p === prop ? 'on' : ''}" data-pr="${p}" style="justify-content:center">${p ? S.money(p) : 'Sin'}</button>`).join('')}</div>
      <button class="btn w" id="cb-ok">${ic('check', 18)} Cobrar</button>`);
    pinta2();
    $$('.sheet [data-met]').forEach(x => x.onclick = () => { met = x.dataset.met; $$('.sheet [data-met]').forEach(y => y.classList.toggle('on', y === x)); });
    $$('.sheet [data-pr]').forEach(x => x.onclick = () => { prop = +x.dataset.pr; $$('.sheet [data-pr]').forEach(y => y.classList.toggle('on', y === x)); pinta2(); });
    $('#cb-ok').onclick = () => { const r = S.cobrar(bid, { metodo: met, propina: prop }); closeSheet(); confetti([T().color, T().color2, '#fff']); toast(`Cobrado ${S.money(r.pendiente)} ✦`, 'cash'); };
  }

  function canjear() {
    sheet(`<h2>Canjear cupón</h2><p class="mut sm">Código de promo (PROMO-…) o tarjeta de regalo.</p><div class="field"><input id="cj-c" autofocus placeholder="PROMO-XXXXX" style="text-transform:uppercase;font-size:20px;letter-spacing:.06em"></div><button class="btn w" id="cj-ok">Canjear</button>`);
    $('#cj-ok').onclick = () => { const code = $('#cj-c').value.trim().toUpperCase(); const g = S.giftcards(tid).find(x => x.codigo.toUpperCase() === code);
      if (g) { closeSheet(); return toast(`Tarjeta de regalo con saldo ${S.money(g.saldo)}. Úsala al cobrar.`, 'gift'); }
      try { const v = S.canjearVoucher(tid, code); closeSheet(); confetti(); toast(`Canjeado: ${S.promo(v.pid)?.titulo} · ${S.client(v.cid)?.nombre}`, 'check'); } catch (e) { toast(e.message, 'x'); } };
  }

  function click(e) {
    const x = e.target.closest('[data-a],[data-f],[data-ck],[data-ns],[data-silla],[data-cob],[data-hueco],[data-qok]'); if (!x) return; vibrar(8); const d = x.dataset;
    if (d.f) { filtro = d.f; return pinta(); }
    if (d.ck) { S.estado(d.ck, 'llegó'); const b = S.booking(d.ck); S.msg(tid, { cid: b.cid, bid: b.id, tipo: 'Llegada', canal: 'Panel', texto: `${cli(b).nombre} llegó. Avisado a ${S.member(b.staffId)?.nombre}.` }); return toast(`Avisado a ${S.member(b.staffId)?.nombre}: llegó ${(cli(b).nombre || '').split(' ')[0]}`, 'bell'); }
    if (d.ns) { if (!x.dataset.ok) { x.dataset.ok = 1; x.textContent = '¿Seguro?'; return setTimeout(() => { delete x.dataset.ok; }, 3000); } S.estado(d.ns, 'no-show'); return toast('Marcada como no vino', 'x'); }
    if (d.silla) { S.estado(d.silla, 'en curso'); return toast('En silla', 'scissors'); }
    if (d.cob) return cobrar(d.cob);
    if (d.hueco) { const [h, m] = d.hueco.split('|'); return nueva({ h, m }); }
    if (d.qok) { const q = S.queue(tid).find(z => z.id === d.qok); S.guardar('queue', { id: q.id, estado: 'listo' }); const c = S.upsertClient(tid, { nombre: q.nombre, tel: q.tel || '' }); const ahora = new Date(); const sv = S.service(q.servicio);
      const b = S.saveBooking({ id: S.uid('b'), tid, cid: c.id, items: [q.servicio], staffId: q.staffId, inicio: S.iso(new Date(ahora - (sv?.dur || 30) * 60000)), dur: sv?.dur || 30, total: S.precio(q.servicio, q.staffId), bruto: S.precio(q.servicio, q.staffId), descuento: 0, estado: 'en curso', origen: 'sin cita', nota: 'Fila #' + q.numero, extras: [], creado: S.iso(ahora) }); return cobrar(b.id); }
    const a = d.a;
    if (a === 'nueva') nueva(); if (a === 'walk') walk(); if (a === 'canjear') canjear();
    if (a === 'venta') { toast('Ventas sin cita y productos: en Caja del panel', 'cash'); location.hash = `#/s/${T().slug}/panel/caja`; }
    if (a === 'salir') { sessionStorage.removeItem(key); off && off(); clearInterval(it); off = null; login(); }
  }

  if (sessionStorage.getItem(key)) arrancar(); else login();
  return () => { off && off(); clearInterval(it); };
}
