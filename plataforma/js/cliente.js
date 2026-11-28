import * as S from './store.js';
import { $, $$, esc, ic, ini, h12, fechaL, durL, DIAS, MESES, toast, sheet, closeSheet, confetti, tilt, setBrand, vibrar, ics, wa } from './ui.js';

export function render(el, [slug]) {
  const t = S.tenant(slug); if (!t) { el.innerHTML = `<div class="wrap empty"><h2>No encontramos este negocio</h2><p><a class="btn" href="#/">Ir a Glow</a></p></div>`; return; }
  setBrand(t); document.title = t.nombre + ' · Reservas';
  const yoKey = 'glow.yo.' + t.id;
  const yo = () => { try { return JSON.parse(localStorage.getItem(yoKey)) || {}; } catch (e) { return {}; } };
  const st = { paso: 0, items: [], staffId: null, fecha: null, hora: null, asignado: null, cat: null, reag: null };
  const pasos = ['Servicios', 'Profesional', 'Día y hora', 'Confirmar'];

  function abierto() {
    const d = new Date(), m = d.getHours() * 60 + d.getMinutes(); const h = (t.horario[d.getDay()] || []).map(([a, b]) => [S.toMin(a), S.toMin(b)]);
    const ab = h.find(([a, b]) => m >= a && m < b); if (ab) return `<span class="pill ok"><i class="dot"></i> Abierto · cierra ${h12(S.fromMin(ab[1]))}</span>`;
    for (let i = 0; i < 7; i++) { const dd = S.addDays(d, i); const hh = t.horario[dd.getDay()] || []; const nx = hh.find(([a]) => i > 0 || S.toMin(a) > m); if (nx) return `<span class="pill">Cerrado · abre ${i === 0 ? 'hoy' : i === 1 ? 'mañana' : DIAS[dd.getDay()]} ${h12(nx[0])}</span>`; }
    return '';
  }
  const rs = S.reviews(t.id); const prom = rs.length ? (rs.reduce((a, r) => a + r.estrellas, 0) / rs.length).toFixed(1) : null;
  const sel = () => st.items.map(S.service);
  const dur = () => sel().reduce((a, s) => a + s.dur, 0), total = () => sel().reduce((a, s) => a + s.precio, 0);

  function shell(body, dock = '') {
    el.innerHTML = `
    <header class="top"><div class="wrap in-top">
      ${st.paso > 0 && st.paso < 5 ? `<button class="ico" data-a="atras" aria-label="Atrás">${ic('back')}</button>` : `<div class="av r" style="width:38px;height:38px;font-size:13px">${esc(ini(t.nombre))}</div>`}
      <div class="g"><div class="b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.nombre)}</div>${st.paso > 0 && st.paso < 5 ? `<div class="steps" style="margin-top:6px">${pasos.map((_, i) => `<i class="${i < st.paso ? 'on' : ''}"></i>`).join('')}</div>` : `<div class="xs mut">${esc(t.zona)}</div>`}</div>
      <button class="ico" data-a="mis" aria-label="Mis citas">${ic('cal')}</button>
    </div></header>
    <main class="wrap pb">${body}</main>${dock}`;
    tilt(el);
  }

  /* ---------- 0: inicio + servicios ---------- */
  function inicio() {
    st.paso = 0;
    const svs = S.services(t.id); const cats = [...new Set(svs.map(s => s.cat))]; st.cat = st.cat || null;
    const lista = svs.filter(s => !st.cat || s.cat === st.cat);
    const hoy = new Date(); const rapido = svs[0] ? S.slots(t.id, [svs[0].id], null, hoy).slice(0, 4) : [];
    const y = yo(); const c = y.tel ? S.clients(t.id).find(x => x.tel.replace(/\D/g, '').slice(-8) === String(y.tel).replace(/\D/g, '').slice(-8)) : null;
    const prox = c ? S.activas(t.id).filter(b => b.cid === c.id && b.estado === 'confirmada' && b.inicio >= S.iso(new Date())).sort((a, b) => a.inicio.localeCompare(b.inicio))[0] : null;
    shell(`
      <section class="c" style="padding:22px 0 6px">
        <div class="orb tilt in" style="width:170px"><div class="ring"></div><div class="core"></div><div class="glyph" style="font-size:38px">${esc(ini(t.nombre))}</div></div>
        <h1 class="in2" style="font-size:34px;margin-top:4px">${esc(t.lema || 'Reserva en segundos.')}</h1>
        <div class="row in3" style="justify-content:center;margin-top:12px;flex-wrap:wrap">${abierto()}${prom ? `<span class="pill">${ic('star', 13)} ${prom} · ${rs.length} reseñas</span>` : ''}</div>
      </section>
      ${prox ? `<div class="card glass in3" style="margin-top:16px"><div class="row"><div class="ico" style="background:var(--grad);color:var(--ink);border:0">${ic('cal')}</div><div class="g"><div class="xs mut">Tu próxima cita</div><div class="b">${fechaL(S.parse(prox.inicio))} · ${h12(prox.inicio.slice(11))}</div></div><button class="btn ghost sm" data-a="mis">Ver</button></div></div>` : ''}
      ${rapido.length ? `<div class="in3" style="margin-top:18px"><div class="row sp"><h3>Espacios de hoy</h3><span class="xs mut">${esc(svs[0].nombre)}</span></div>
        <div class="scroll-x" style="margin-top:10px">${rapido.map(r => `<button class="chip" data-rapido="${r.hora}|${r.staffId}">${ic('bolt', 14)} ${h12(r.hora)} · ${esc(S.member(r.staffId).nombre)}</button>`).join('')}</div></div>` : ''}
      <div class="in4" style="margin-top:22px"><h2>Servicios</h2>
        <div class="scroll-x" style="margin:12px -18px 14px"><button class="chip ${!st.cat ? 'on' : ''}" data-cat="">Todos</button>${cats.map(k => `<button class="chip ${st.cat === k ? 'on' : ''}" data-cat="${esc(k)}">${esc(k)}</button>`).join('')}</div>
        <div class="col stagger">${lista.map(s => `
          <div class="svc ${st.items.includes(s.id) ? 'on' : ''}" data-svc="${s.id}">
            <div class="g"><div class="b">${esc(s.nombre)}</div><div class="xs mut">${durL(s.dur)} · ${esc(s.cat)}</div></div>
            <div class="b">${s.desde ? 'desde ' : ''}${S.money(s.precio)}</div><div class="chk">${st.items.includes(s.id) ? ic('check', 15) : ''}</div>
          </div>`).join('')}</div>
      </div>
      ${rs.length ? `<div style="margin-top:26px"><h3>Lo que dicen</h3><div class="scroll-x" style="margin-top:10px">${rs.slice(0, 6).map(r => `<div class="card flat" style="min-width:240px"><div style="color:var(--brand2)">${'★'.repeat(r.estrellas)}</div><p class="sm" style="margin:6px 0">${esc(r.texto)}</p><div class="xs mut">${esc(S.client(r.cid)?.nombre?.split(' ')[0] || 'Cliente')}</div></div>`).join('')}</div></div>` : ''}
      <div class="card flat" style="margin-top:22px"><div class="row">${ic('clock')}<div class="g sm">${horarioTxt()}</div></div><hr><div class="sm mut">${esc(t.politica)}</div>${t.tel ? `<a class="btn ghost w sm" style="margin-top:12px" href="${wa(t.tel, 'Hola ' + t.nombre + ', tengo una pregunta.')}" target="_blank">${ic('wa', 16)} Escribir por WhatsApp</a>` : ''}</div>
      <p class="c xs dim" style="margin-top:22px">Reservas con <img src="img/glow-logo.png" alt="Glow" style="height:13px;vertical-align:-2px;opacity:.85"></p>
    `, st.items.length ? dockHtml('Elegir profesional') : `<div class="dock"><div style="max-width:560px;margin:0 auto"><button class="btn w" data-a="scrollsvc">${ic('cal', 18)} Reservar cita</button></div></div>`);
  }
  function horarioTxt() { return [1, 2, 3, 4, 5, 6, 0].map(d => { const h = t.horario[d] || []; return `<div class="row sp"><span class="mut">${DIAS[d]}</span><span>${h.length ? h.map(([a, b]) => h12(a) + ' – ' + h12(b)).join(', ') : 'Cerrado'}</span></div>`; }).join(''); }
  const dockHtml = (txt) => `<div class="dock"><div class="card glass"><div class="g"><div class="b">${S.money(total())} <span class="mut xs">· ${durL(dur())}</span></div><div class="xs mut">${st.items.length} servicio${st.items.length > 1 ? 's' : ''}</div></div><button class="btn" data-a="sig">${txt} ${ic('next', 16)}</button></div></div>`;

  /* ---------- 1: profesional ---------- */
  function profesional() {
    st.paso = 1;
    const pros = S.staff(t.id).filter(m => S.puede(m, st.items));
    const prox = m => { for (let i = 0; i < 14; i++) { const d = S.addDays(new Date(), i); const s = S.slots(t.id, st.items, m, d)[0]; if (s) return (i === 0 ? 'hoy' : i === 1 ? 'mañana' : DIAS[d.getDay()] + ' ' + d.getDate()) + ' ' + h12(s.hora); } return 'sin espacios'; };
    shell(`<h2 class="in" style="margin:18px 0 4px">¿Con quién?</h2><p class="mut sm in">Elige a tu profesional o deja que te demos el primer espacio libre.</p>
      <div class="col stagger" style="margin-top:14px">
        <div class="svc ${st.staffId === null ? 'on' : ''}" data-pro=""><div class="av r" style="--c:var(--grad)">${ic('bolt', 20)}</div><div class="g"><div class="b">Cualquiera</div><div class="xs mut">El más pronto: ${prox(null)}</div></div><div class="chk">${st.staffId === null ? ic('check', 15) : ''}</div></div>
        ${pros.map(m => `<div class="svc tilt ${st.staffId === m.id ? 'on' : ''}" data-pro="${m.id}"><div class="av r pop" style="--c:${m.color}">${esc(ini(m.nombre))}</div><div class="g"><div class="b">${esc(m.nombre)}</div><div class="xs mut">${esc(m.rol)} · próximo: ${prox(m.id)}</div></div><div class="chk">${st.staffId === m.id ? ic('check', 15) : ''}</div></div>`).join('')}
      </div>`, dockHtml('Elegir hora'));
  }

  /* ---------- 2: día y hora ---------- */
  function hora() {
    st.paso = 2; const hoy = new Date();
    const dias = Array.from({ length: 21 }, (_, i) => S.addDays(hoy, i));
    if (!st.fecha) st.fecha = S.ymd(dias.find(d => S.slots(t.id, st.items, st.staffId, d).length) || hoy);
    const sl = S.slots(t.id, st.items, st.staffId, S.parse(st.fecha + 'T00:00'));
    const grupos = [['Mañana', 0, 720], ['Tarde', 720, 1080], ['Noche', 1080, 1440]].map(([n, a, b]) => [n, sl.filter(s => S.toMin(s.hora) >= a && S.toMin(s.hora) < b)]).filter(g => g[1].length);
    shell(`<h2 class="in" style="margin:18px 0 12px">¿Cuándo?</h2>
      <div class="xs mut" style="margin-bottom:6px;text-transform:capitalize">${MESES[S.parse(st.fecha + 'T00:00').getMonth()]} ${S.parse(st.fecha + 'T00:00').getFullYear()}</div>
      <div class="days in2">${dias.map(d => { const k = S.ymd(d); const n = S.slots(t.id, st.items, st.staffId, d).length; return `<div class="day ${k === st.fecha ? 'on' : ''} ${n ? '' : 'off'}" data-dia="${k}"><small>${DIAS[d.getDay()]}</small><b>${d.getDate()}</b>${n ? '<i class="lv"></i>' : ''}</div>`; }).join('')}</div>
      ${grupos.length ? grupos.map(([n, ss]) => `<div class="in3" style="margin-top:16px"><div class="row sp"><h3>${n}</h3><span class="xs mut">${ss.length} libres</span></div><div class="slots stagger" style="margin-top:10px">${ss.map(s => `<div class="slot ${st.hora === s.hora ? 'on' : ''}" data-hora="${s.hora}|${s.staffId}">${h12(s.hora)}</div>`).join('')}</div></div>`).join('')
        : `<div class="card c" style="margin-top:20px"><h3>Este día está lleno</h3><p class="mut sm">Únete a la lista de espera y te avisamos si se libera un espacio.</p><button class="btn ghost" data-a="espera">${ic('bell', 16)} Avisarme si se libera</button></div>`}
    `, st.hora ? `<div class="dock"><div class="card glass"><div class="g"><div class="b">${fechaL(S.parse(st.fecha + 'T00:00'))}</div><div class="xs mut">${h12(st.hora)} · con ${esc(S.member(st.asignado).nombre)}</div></div><button class="btn" data-a="sig">Continuar ${ic('next', 16)}</button></div></div>` : '');
    const on = $('.day.on', el); on && on.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  /* ---------- 3: datos y confirmar ---------- */
  function confirmar() {
    st.paso = 3; const y = yo(); const dep = t.deposito?.activo ? Math.ceil(total() * (t.deposito.pct || 20) / 100) : 0;
    shell(`<h2 class="in" style="margin:18px 0 14px">Confirma tu cita</h2>
      <div class="card glass tilt in2"><div class="row pop"><div class="av r" style="--c:${S.member(st.asignado).color}">${esc(ini(S.member(st.asignado).nombre))}</div><div class="g"><div class="b">${fechaL(S.parse(st.fecha + 'T00:00'))}</div><div class="mut sm">${h12(st.hora)} · ${durL(dur())} · con ${esc(S.member(st.asignado).nombre)}</div></div></div>
        <hr>${sel().map(s => `<div class="row sp sm" style="margin:6px 0"><span>${esc(s.nombre)}</span><span>${S.money(s.precio)}</span></div>`).join('')}
        <div class="row sp" style="margin-top:10px"><span class="b">Total</span><span class="b" style="font-size:20px">${S.money(total())}</span></div><div class="xs dim">+ ITBMS 7 % al pagar en el local</div></div>
      <div class="in3" style="margin-top:16px">
        <div class="field"><label>Tu nombre</label><input id="f-nom" autocomplete="name" value="${esc(y.nombre || '')}" placeholder="Nombre y apellido"></div>
        <div class="field"><label>WhatsApp</label><input id="f-tel" type="tel" inputmode="tel" autocomplete="tel" value="${esc(y.tel || '')}" placeholder="6000-0000"></div>
        <div class="field"><label>Nota (opcional)</label><input id="f-nota" placeholder="Ej.: es mi primera vez"></div>
      </div>
      ${dep ? `<div class="card flat in4"><div class="row"><div class="ico">${ic('lock')}</div><div class="g"><div class="b">Depósito para apartar: ${S.money(dep)}</div><div class="xs mut">Se descuenta del total. ${esc(t.politica)}</div></div></div></div>` : `<p class="xs mut in4">${esc(t.politica)}</p>`}
      <p class="xs dim" style="margin-top:10px">Te enviaremos la confirmación y un recordatorio por WhatsApp. Al confirmar aceptas que ${esc(t.nombre)} te contacte por tu cita.</p>
    `, `<div class="dock"><div style="max-width:560px;margin:0 auto"><button class="btn w" data-a="reservar">${dep ? ic('lock', 17) + ' Pagar depósito y reservar' : ic('check', 18) + ' Confirmar reserva'}</button></div></div>`);
  }
  function reservar() {
    const nombre = $('#f-nom').value.trim(), tel = $('#f-tel').value.trim(), nota = $('#f-nota').value.trim();
    if (nombre.length < 2) return toast('Escribe tu nombre', 'user'); if (tel.replace(/\D/g, '').length < 7) return toast('Revisa tu WhatsApp', 'wa');
    localStorage.setItem(yoKey, JSON.stringify({ nombre, tel }));
    const dep = t.deposito?.activo ? Math.ceil(total() * (t.deposito.pct || 20) / 100) : 0;
    const hacer = (metodo) => {
      try {
        if (st.reag) S.estado(st.reag, 'cancelada', { nota: 'Reagendada por el cliente' });
        const b = S.crearCita(t.id, { items: st.items, staffId: st.asignado, inicio: `${st.fecha}T${st.hora}`, cliente: { nombre, tel }, nota, deposito: dep, metodo, origen: 'app' });
        st.reag = null; listo(b);
      } catch (e) { toast(e.message, 'x'); st.hora = null; hora(); }
    };
    if (!dep) return hacer('');
    sheet(`<div class="c"><div class="ico" style="margin:0 auto;width:60px;height:60px;border-radius:20px;background:var(--grad);color:var(--ink);border:0">${ic('lock', 26)}</div>
      <h2 style="margin:14px 0 6px">Depósito de ${S.money(dep)}</h2><p class="mut sm">Pago seguro. En la versión real se abre Yappy o el pago con tarjeta.</p>
      <div class="col" style="margin-top:16px"><button class="btn w" data-pagar="Yappy" style="background:linear-gradient(135deg,#2F8CFF,#0A5BD3);color:#fff">Pagar con Yappy</button><button class="btn ghost w" data-pagar="Tarjeta">${ic('cash', 18)} Tarjeta de crédito o débito</button></div>
      <p class="xs dim" style="margin-top:12px">Demo: no se cobra nada.</p></div>`);
    $$('[data-pagar]').forEach(b => b.onclick = () => { b.innerHTML = 'Procesando…'; setTimeout(() => { closeSheet(); hacer(b.dataset.pagar); }, 900); });
  }

  /* ---------- 4: listo ---------- */
  function listo(b) {
    st.paso = 5; const m = S.member(b.staffId); const f = S.parse(b.inicio); const c = S.client(b.cid); const meta = t.fidelidad?.meta || 10;
    shell(`<section class="c" style="padding-top:26px">
      <div class="ico in" style="margin:0 auto;width:76px;height:76px;border-radius:26px;background:var(--grad);color:var(--ink);border:0;box-shadow:0 20px 50px -12px var(--brand)">${ic('check', 38)}</div>
      <h1 class="in2" style="font-size:34px;margin-top:16px">¡Listo, ${esc(c.nombre.split(' ')[0])}!</h1><p class="mut in2">Tu cita quedó confirmada.</p></section>
      <div class="card glass tilt in3" style="margin-top:18px;position:relative;overflow:hidden">
        <div class="pop"><div class="row sp"><span class="pill br">${esc(b.codigo)}</span><span class="pill ok">Confirmada</span></div>
        <h2 style="margin:14px 0 2px">${fechaL(f)}</h2><div style="font-size:30px;font-weight:700" class="grad-t">${h12(b.inicio.slice(11))}</div>
        <div class="mut sm" style="margin-top:6px">${b.items.map(i => esc(S.service(i).nombre)).join(' + ')} · con ${esc(m.nombre)}</div>
        <div class="row sp" style="margin-top:12px"><span class="mut sm">${esc(t.nombre)}</span><span class="b">${S.money(b.total)}</span></div></div>
      </div>
      <div class="grid g2 in4" style="margin-top:12px"><button class="btn ghost sm" data-a="ics">${ic('cal', 16)} A mi calendario</button><a class="btn ghost sm" target="_blank" href="${wa('', `Reservé en ${t.nombre} 💈 ${location.href.split('#')[0]}#/s/${t.slug}`)}">${ic('wa', 16)} Compartir</a></div>
      <div class="card flat in4" style="margin-top:14px"><div class="row sp"><h3>${ic('gift', 18)} Tu tarjeta</h3><span class="xs mut">${c.sellos || 0}/${meta}</span></div>
        <div class="stamps" style="margin-top:12px">${Array.from({ length: meta }, (_, i) => `<div class="stamp ${i < (c.sellos || 0) ? 'on' : ''}" style="animation-delay:${i * .05}s">${i < (c.sellos || 0) ? '✦' : i === meta - 1 ? '🎁' : ''}</div>`).join('')}</div>
        <p class="xs mut" style="margin:10px 0 0">Al completar ${meta} visitas: ${esc(t.fidelidad?.premio || 'premio')}.</p></div>
      <button class="btn w in4" style="margin-top:16px" data-a="inicio">Volver al inicio</button>`);
    confetti([t.color2, t.color, '#fff']);
    el.querySelector('[data-a=ics]').onclick = () => ics({ titulo: `${t.nombre}: ${b.items.map(i => S.service(i).nombre).join(' + ')}`, inicio: f, dur: b.dur, lugar: t.zona });
  }

  /* ---------- mis citas ---------- */
  function mis() {
    const y = yo();
    if (!y.tel) return sheet(`<h2>Mis citas</h2><p class="mut sm">Escribe el WhatsApp con el que reservaste.</p><div class="field"><input id="m-tel" type="tel" placeholder="6000-0000" autofocus></div><button class="btn w" id="m-ok">Ver mis citas</button>`) && ($('#m-ok').onclick = () => { const v = $('#m-tel').value; if (v.replace(/\D/g, '').length < 7) return; localStorage.setItem(yoKey, JSON.stringify({ ...y, tel: v })); closeSheet(); mis(); });
    const dig = String(y.tel).replace(/\D/g, '').slice(-8); const c = S.clients(t.id).find(x => x.tel.replace(/\D/g, '').slice(-8) === dig);
    const bs = c ? S.bookings(t.id).filter(b => b.cid === c.id).sort((a, b) => b.inicio.localeCompare(a.inicio)) : [];
    const ahora = S.iso(new Date()); const fut = bs.filter(b => b.inicio >= ahora && b.estado === 'confirmada').reverse(); const pas = bs.filter(b => !(b.inicio >= ahora && b.estado === 'confirmada')).slice(0, 8);
    const rv = S.reviews(t.id);
    sheet(`<div class="row sp"><h2>Mis citas</h2><button class="btn ghost sm" id="m-salir">Cambiar número</button></div>
      ${c ? `<div class="card flat" style="margin-top:12px"><div class="row"><div class="ico" style="background:var(--grad);color:var(--ink);border:0">${ic('gift')}</div><div class="g"><div class="b">${c.sellos || 0} de ${t.fidelidad?.meta || 10} sellos</div><div class="xs mut">${c.premios ? `🎁 Tienes ${c.premios} premio(s) para usar` : 'Sigue sumando para tu premio'}</div></div></div></div>` : ''}
      <h3 style="margin:18px 0 8px">Próximas</h3>
      ${fut.length ? fut.map(b => `<div class="card flat" style="margin-bottom:10px"><div class="b">${fechaL(S.parse(b.inicio))} · ${h12(b.inicio.slice(11))}</div><div class="sm mut">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')} · ${esc(S.member(b.staffId)?.nombre)}</div>
        <div class="row" style="margin-top:10px"><button class="btn ghost sm g" data-reag="${b.id}">Cambiar hora</button><button class="btn danger sm g" data-can="${b.id}">Cancelar</button></div></div>`).join('') : '<p class="mut sm">No tienes citas próximas.</p>'}
      <h3 style="margin:18px 0 8px">Historial</h3>
      ${pas.length ? pas.map(b => `<div class="li"><div class="g"><div class="sm b">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}</div><div class="xs mut">${S.parse(b.inicio).toLocaleDateString('es-PA')} · ${b.estado}</div></div>
        ${b.estado === 'completada' && !rv.find(r => r.bid === b.id) ? `<button class="btn sm" data-res="${b.id}">${ic('star', 14)} Calificar</button>` : `<button class="btn ghost sm" data-rep="${b.id}">Repetir</button>`}</div>`).join('') : '<p class="mut sm">Aún no hay historial.</p>'}`);
    $('#m-salir').onclick = () => { localStorage.removeItem(yoKey); closeSheet(); mis(); };
    $$('[data-can]').forEach(x => x.onclick = () => { if (!confirmar2(x, '¿Seguro? Toca otra vez para cancelar')) return; S.estado(x.dataset.can, 'cancelada', { nota: 'Cancelada por el cliente' }); toast('Cita cancelada'); closeSheet(); mis(); });
    $$('[data-reag]').forEach(x => x.onclick = () => { const b = S.booking(x.dataset.reag); Object.assign(st, { items: b.items, staffId: b.staffId, fecha: null, hora: null, reag: b.id }); closeSheet(); hora(); toast('Elige la nueva hora', 'cal'); });
    $$('[data-rep]').forEach(x => x.onclick = () => { const b = S.booking(x.dataset.rep); Object.assign(st, { items: b.items.filter(S.service), staffId: b.staffId, fecha: null, hora: null }); closeSheet(); hora(); });
    $$('[data-res]').forEach(x => x.onclick = () => resena(x.dataset.res, c));
  }
  function confirmar2(btn, msg) { if (btn.dataset.ok) return true; btn.dataset.ok = 1; btn.textContent = msg; setTimeout(() => { delete btn.dataset.ok; }, 3000); return false; }
  function resena(bid, c) {
    let n = 5; sheet(`<h2>¿Cómo te fue?</h2><div class="row" id="stars" style="justify-content:center;gap:6px;margin:18px 0;font-size:38px;cursor:pointer">${[1, 2, 3, 4, 5].map(i => `<span data-st="${i}" style="color:var(--brand2)">★</span>`).join('')}</div>
      <textarea id="r-txt" rows="3" placeholder="Cuéntanos (opcional)"></textarea><button class="btn w" id="r-ok" style="margin-top:12px">Enviar</button>`);
    $$('[data-st]').forEach(s => s.onclick = () => { n = +s.dataset.st; $$('[data-st]').forEach(x => x.style.opacity = +x.dataset.st <= n ? 1 : .25); vibrar(); });
    $('#r-ok').onclick = () => { S.addReview({ tid: t.id, cid: c.id, bid, estrellas: n, texto: $('#r-txt').value.trim() || '⭐'.repeat(n) });
      closeSheet(); if (n >= 4) sheet(`<div class="c"><h2>¡Gracias! 💛</h2><p class="mut">¿Nos ayudas con tu reseña en Google? A otros les sirve mucho.</p><a class="btn w" target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(t.nombre + ' ' + t.zona)}">${ic('star', 16)} Dejar reseña en Google</a></div>`); else toast('Gracias, lo vamos a mejorar'); };
  }

  /* ---------- eventos ---------- */
  el.onclick = e => {
    const a = e.target.closest('[data-a],[data-svc],[data-cat],[data-pro],[data-dia],[data-hora],[data-rapido]'); if (!a) return; vibrar(8);
    if (a.dataset.svc) { const i = st.items.indexOf(a.dataset.svc); i >= 0 ? st.items.splice(i, 1) : st.items.push(a.dataset.svc); st.hora = null; st.fecha = null; const y = scrollY; inicio(); scrollTo(0, y); return; }
    if (a.dataset.cat !== undefined) { st.cat = a.dataset.cat || null; const y = scrollY; inicio(); scrollTo(0, y); return; }
    if (a.dataset.pro !== undefined) { st.staffId = a.dataset.pro || null; st.fecha = null; st.hora = null; profesional(); return; }
    if (a.dataset.dia) { st.fecha = a.dataset.dia; st.hora = null; const y = scrollY; hora(); scrollTo(0, y); return; }
    if (a.dataset.hora) { const [h, sid] = a.dataset.hora.split('|'); st.hora = h; st.asignado = sid; const y = scrollY; hora(); scrollTo(0, y); return; }
    if (a.dataset.rapido) { const [h, sid] = a.dataset.rapido.split('|'); Object.assign(st, { items: [S.services(t.id)[0].id], staffId: sid, asignado: sid, fecha: S.ymd(new Date()), hora: h }); confirmar(); return; }
    const k = a.dataset.a;
    if (k === 'sig') { if (st.paso === 0) profesional(); else if (st.paso === 1) hora(); else if (st.paso === 2) confirmar(); }
    if (k === 'atras') { if (st.paso === 1) inicio(); else if (st.paso === 2) profesional(); else if (st.paso === 3) hora(); }
    if (k === 'reservar') reservar();
    if (k === 'mis') mis();
    if (k === 'inicio') { Object.assign(st, { items: [], staffId: null, fecha: null, hora: null }); inicio(); }
    if (k === 'scrollsvc') $('.svc', el)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), toast('Elige uno o varios servicios', 'scissors');
    if (k === 'espera') { const y = yo(); sheet(`<h2>Lista de espera</h2><p class="mut sm">Te avisamos por WhatsApp si se libera un espacio el ${fechaL(S.parse(st.fecha + 'T00:00'))}.</p><div class="field"><label>Nombre</label><input id="w-n" value="${esc(y.nombre || '')}"></div><div class="field"><label>WhatsApp</label><input id="w-t" type="tel" value="${esc(y.tel || '')}"></div><button class="btn w" id="w-ok">Avisarme</button>`);
      $('#w-ok').onclick = () => { S.addWait({ tid: t.id, fecha: st.fecha, items: st.items, nombre: $('#w-n').value, tel: $('#w-t').value }); closeSheet(); toast('Listo, te avisamos'); }; }
  };
  const off = S.onChange(() => { if (st.paso === 2 && !document.querySelector('.sheet')) { const y = scrollY; hora(); scrollTo(0, y); } });
  inicio();
  return () => { off(); el.onclick = null; };
}
