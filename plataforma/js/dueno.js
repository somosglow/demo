import * as S from './store.js';
import { $, $$, esc, ic, ini, h12, fechaL, durL, DIAS, MESES_L, toast, sheet, closeSheet, tilt, setBrand, vibrar, contar, wa, confetti } from './ui.js';
import qrcode from '../vendor/qrcode.mjs';

const SECC = [['inicio', 'home', 'Inicio'], ['agenda', 'cal', 'Agenda'], ['caja', 'cash', 'Caja'], ['clientes', 'users', 'Clientes'], ['marketing', 'spark', 'Marketing'], ['servicios', 'scissors', 'Servicios'], ['equipo', 'user', 'Equipo'], ['ajustes', 'gear', 'Ajustes']];

export function render(el, [slug, sec = 'inicio']) {
  const t0 = S.tenant(slug); if (!t0) { location.hash = '#/'; return; }
  const tid = t0.id; const T = () => S.tenant(tid);
  setBrand(t0); document.title = t0.nombre + ' · Panel';
  const key = 'glow.dueno.' + tid;
  const st = { dia: S.ymd(new Date()), q: '', seg: 'todos' };

  function gate() {
    const due = S.staff(tid)[0]; let pin = '';
    el.innerHTML = `<main class="wrap c" style="padding-top:60px"><img src="img/glow-logo.png" style="height:30px" alt="Glow"><h1 class="in" style="font-size:30px;margin:26px 0 6px">Panel de ${esc(t0.nombre)}</h1><p class="mut in2">PIN del dueño</p>
      <div class="row" id="pins" style="justify-content:center;gap:14px;margin:18px 0">${[0, 1, 2, 3].map(() => '<i style="width:14px;height:14px;border-radius:50%;border:1.5px solid var(--line2);display:block"></i>').join('')}</div>
      <div class="grid g3 in3" style="max-width:280px;margin:0 auto">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button class="btn ghost" style="min-height:64px;font-size:22px" data-k="${k}">${k}</button>`).join('')}</div>
      <p class="xs dim" style="margin-top:16px">Demo: el PIN es ${due.pin}</p></main>`;
    el.onclick = e => { const k = e.target.closest('[data-k]'); if (!k) return; vibrar(10); pin = k.dataset.k === '⌫' ? pin.slice(0, -1) : (pin + k.dataset.k).slice(0, 4);
      $$('#pins i').forEach((d, i) => d.style.background = i < pin.length ? 'var(--brand)' : '');
      if (pin.length === 4) { if (pin === due.pin) { sessionStorage.setItem(key, 1); el.onclick = null; pintar(); } else { pin = ''; $$('#pins i').forEach(d => d.style.background = ''); toast('PIN incorrecto', 'lock'); } } };
  }

  function layout(body) {
    const t = T();
    el.innerHTML = `
    <aside class="side"><a class="logo" href="#/" style="padding:4px 8px 16px;box-shadow:none"><img src="img/glow-logo.png" style="height:24px" alt="Glow"></a>
      <div class="row" style="padding:0 8px 14px"><div class="av" style="width:34px;height:34px;font-size:12px">${esc(ini(t.nombre))}</div><div class="g"><div class="b sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.nombre)}</div><div class="xs mut">Plan ${esc(t.plan)}</div></div></div>
      ${SECC.map(([k, i, l]) => `<a href="#/s/${t.slug}/panel/${k}" class="${sec === k ? 'on' : ''}">${ic(i)}${l}</a>`).join('')}
      <div class="g"></div><a href="#/s/${t.slug}" target="_blank">${ic('link')}Ver mi app</a><a href="#/s/${t.slug}/equipo">${ic('scissors')}App del equipo</a><a href="#/guia">${ic('book')}Guía</a></aside>
    <div class="main">${body}</div>
    <nav class="tabbar mobnav">${[['inicio', 'home', 'Inicio'], ['agenda', 'cal', 'Agenda'], ['caja', 'cash', 'Caja'], ['clientes', 'users', 'Clientes'], ['mas', 'gear', 'Más']].map(([k, i, l]) => `<button class="${sec === k || (k === 'mas' && ['marketing', 'servicios', 'equipo', 'ajustes'].includes(sec)) ? 'on' : ''}" data-nav="${k}">${ic(i)}${l}</button>`).join('')}</nav>`;
    tilt(el); contar(el);
  }
  const head = (tit, sub = '', der = '') => `<div class="row sp wrapx in" style="margin:6px 0 18px;gap:12px"><div><h1 style="font-size:30px">${tit}</h1>${sub ? `<div class="mut sm" style="margin-top:4px">${sub}</div>` : ''}</div><div class="row">${der}</div></div>`;

  /* ================= INICIO ================= */
  function inicio() {
    const t = T(); const hoy = S.ymd(new Date()), man = S.ymd(S.addDays(new Date(), 1));
    const mh = S.metricas(tid, hoy, man); const mes = S.ymd(new Date()).slice(0, 7) + '-01';
    const mm = S.metricas(tid, mes, man); const sem = S.metricas(tid, S.ymd(S.addDays(new Date(), -6)), man);
    const dias = Array.from({ length: 14 }, (_, i) => S.addDays(new Date(), i - 13)); const ing = dias.map(d => S.sales(tid).filter(v => v.fecha.startsWith(S.ymd(d))).reduce((a, v) => a + v.sub, 0)); const mx = Math.max(1, ...ing);
    const pend = S.activas(tid).filter(b => b.inicio.startsWith(hoy) && b.estado !== 'completada' && b.estado !== 'no-show').sort((a, b) => a.inicio.localeCompare(b.inicio));
    const nuevas = S.bookings(tid).filter(b => b.origen === 'app' && b.creado >= S.iso(S.addDays(new Date(), -2))).sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, 5);
    const topS = cuenta(S.bookings(tid).filter(b => b.inicio >= mes && b.estado === 'completada').flatMap(b => b.items)).slice(0, 5);
    const topM = S.staff(tid).map(m => [m, S.sales(tid).filter(v => v.staffId === m.id && v.fecha >= mes).reduce((a, v) => a + v.sub, 0)]).sort((a, b) => b[1] - a[1]);
    const h = new Date().getHours(); const sal = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    layout(`${head(`${sal} ✦`, fechaL(new Date()) + ' · ' + esc(t.nombre), `<a class="btn ghost sm" href="#/s/${t.slug}" target="_blank">${ic('link', 16)} Mi app</a><button class="btn sm" data-a="compartir">${ic('qr', 16)} Compartir link</button>`)}
      <div class="grid g4 stagger">
        <div class="kpi tilt"><div class="l">Vendido hoy</div><div class="v pop" data-n="${mh.ingresos}" data-pre="$">0</div><div class="xs mut">${mh.completadas} servicios</div></div>
        <div class="kpi tilt"><div class="l">Citas hoy</div><div class="v pop" data-n="${mh.citas - mh.cancel}">0</div><div class="xs mut">${pend.length} por atender</div></div>
        <div class="kpi tilt"><div class="l">Vendido en el mes</div><div class="v pop grad-t" data-n="${mm.ingresos}" data-pre="$">0</div><div class="xs mut">ticket ${S.money(mm.ticket)}</div></div>
        <div class="kpi tilt"><div class="l">No vinieron (mes)</div><div class="v pop" data-n="${mm.noshow}">0</div><div class="xs mut">${mm.citas ? Math.round(mm.noshow / mm.citas * 100) : 0}% de las citas</div></div>
      </div>
      <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);margin-top:12px" id="g-a">
        <div class="card flat in2"><div class="row sp"><h3>Ventas · últimos 14 días</h3><span class="pill">${S.money(ing.reduce((a, b) => a + b, 0))}</span></div>
          <div class="bars">${ing.map((v, i) => `<div class="bw" title="${S.money(v)}"><div class="bar ${i === 13 ? 'hoy' : ''}" style="height:${Math.max(2, v / mx * 100)}%;animation-delay:${i * .04}s"></div><small>${dias[i].getDate()}</small></div>`).join('')}</div></div>
        <div class="card flat in3 c"><h3 style="text-align:left">Ocupación · 7 días</h3><div class="ring-kpi" style="--p:${Math.round(sem.ocupacion * 100)};margin:16px auto 8px"><div><div style="font-size:28px;font-weight:700">${Math.round(sem.ocupacion * 100)}%</div><div class="xs mut">de la agenda</div></div></div>
          <p class="xs mut" style="margin:0">${sem.ocupacion < .6 ? 'Hay espacio: lanza una oferta de días flojos en Marketing.' : 'Agenda sana. Sube precios en tus horas pico.'}</p></div>
      </div>
      <div class="grid g3 rsp" style="margin-top:12px">
        <div class="card flat in3"><div class="row sp"><h3>Por atender hoy</h3><a class="xs mut" href="#/s/${t.slug}/panel/agenda">Agenda →</a></div>${pend.length ? pend.slice(0, 6).map(b => `<div class="li" data-b="${b.id}" style="cursor:pointer"><div style="width:58px" class="b sm">${h12(b.inicio.slice(11))}</div><div class="g"><div class="sm b">${esc(S.client(b.cid)?.nombre)}</div><div class="xs mut">${esc(S.service(b.items[0])?.nombre)} · ${esc(S.member(b.staffId)?.nombre)}</div></div><span class="pill">${b.estado}</span></div>`).join('') : '<div class="empty">Todo atendido ✦</div>'}</div>
        <div class="card flat in4"><h3>Servicios estrella del mes</h3>${topS.map(([sid, n], i) => `<div class="li"><div class="av" style="width:32px;height:32px;font-size:12px">${i + 1}</div><div class="g sm">${esc(S.service(sid)?.nombre)}</div><span class="b sm">${n}</span></div>`).join('')}</div>
        <div class="card flat in4"><h3>Tu equipo este mes</h3>${topM.map(([m, v]) => `<div class="li"><div class="av r" style="--c:${m.color};width:34px;height:34px;font-size:12px">${esc(ini(m.nombre))}</div><div class="g"><div class="sm b">${esc(m.nombre)}</div><div style="height:6px;border-radius:9px;background:var(--line);margin-top:6px;overflow:hidden"><div style="height:100%;width:${topM[0][1] ? v / topM[0][1] * 100 : 0}%;background:${m.color};border-radius:9px;animation:grow 1s both"></div></div></div><span class="b sm">${S.money(v)}</span></div>`).join('')}</div>
      </div>
      <div class="card flat in4" style="margin-top:12px"><div class="row sp"><h3>${ic('bolt', 18)} Reservas nuevas desde tu app</h3><span class="pill"><i class="dot"></i> En vivo</span></div>${nuevas.length ? nuevas.map(b => `<div class="li"><div class="av r" style="width:34px;height:34px;font-size:12px">${esc(ini(S.client(b.cid)?.nombre))}</div><div class="g"><div class="sm"><b>${esc(S.client(b.cid)?.nombre)}</b> reservó ${esc(S.service(b.items[0])?.nombre)}</div><div class="xs mut">${fechaL(S.parse(b.inicio))} · ${h12(b.inicio.slice(11))}</div></div></div>`).join('') : '<p class="mut sm">Cuando tus clientes reserven por tu link, aparecen aquí al instante.</p>'}</div>`);
    if (innerWidth < 760) $('#g-a').style.gridTemplateColumns = '1fr';
  }
  const cuenta = arr => Object.entries(arr.reduce((o, k) => (o[k] = (o[k] || 0) + 1, o), {})).sort((a, b) => b[1] - a[1]);

  /* ================= AGENDA ================= */
  function agenda() {
    const t = T(); const ms = S.staff(tid); const f = S.parse(st.dia + 'T00:00');
    const hs = Object.values(t.horario).flat(); const a0 = Math.min(...hs.map(x => S.toMin(x[0])), 540), a1 = Math.max(...hs.map(x => S.toMin(x[1])), 1140);
    const H = 40 / 30; // px por minuto (40px cada 30 min)
    const bs = S.bookings(tid).filter(b => b.inicio.startsWith(st.dia) && b.estado !== 'cancelada');
    const filas = (a1 - a0) / 30;
    layout(`${head('Agenda', `${fechaL(f)} · ${bs.length} citas`, `<button class="ico" data-dd="-1">${ic('back')}</button><button class="btn ghost sm" data-dd="0">Hoy</button><button class="ico" data-dd="1">${ic('next')}</button><button class="btn sm" data-a="nueva">${ic('plus', 16)} Cita</button>`)}
      <div class="agenda in2" id="ag" style="grid-template-columns:58px repeat(${ms.length},minmax(140px,1fr))">
        <div class="hcol" style="grid-row:1"><div class="hd" style="height:52px"></div>${Array.from({ length: filas }, (_, i) => `<div class="hl">${(a0 + i * 30) % 60 === 0 ? h12(S.fromMin(a0 + i * 30)).replace(':00', '') : ''}</div>`).join('')}</div>
        ${ms.map(m => `<div style="position:relative" data-col="${m.id}"><div class="hd" style="height:52px"><div class="av r" style="--c:${m.color};width:30px;height:30px;font-size:11px">${esc(ini(m.nombre))}</div>${esc(m.nombre)}</div>
          <div style="position:relative" class="colb">${Array.from({ length: filas }, (_, i) => `<div class="cell" data-slot="${m.id}|${S.fromMin(a0 + i * 30)}"></div>`).join('')}
          ${(m.bloqueos || []).filter(x => x.fecha === st.dia).map(x => `<div class="ev" style="top:${(S.toMin(x.desde) - a0) * H}px;height:${(S.toMin(x.hasta) - S.toMin(x.desde)) * H}px;left:4px;right:4px;--c:rgba(255,255,255,.08);color:var(--mut);cursor:default;border-style:dashed">🔒 ${esc(x.motivo || 'Bloqueado')}</div>`).join('')}
          ${bs.filter(b => b.staffId === m.id).map(b => `<div class="ev ${b.estado === 'completada' ? 'done' : ''} ${b.estado === 'no-show' ? 'ns' : ''}" data-b="${b.id}" style="top:${(S.toMin(b.inicio.slice(11)) - a0) * H}px;height:${b.dur * H - 3}px;left:4px;right:4px;--c:linear-gradient(135deg,${m.color},color-mix(in srgb,${m.color} 70%,#fff))"><b>${esc(S.client(b.cid)?.nombre)}</b>${h12(b.inicio.slice(11))} · ${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}${b.origen === 'app' ? ' · 📱' : ''}</div>`).join('')}
          </div></div>`).join('')}
      </div><p class="xs dim" style="margin-top:10px">Toca una cita para ver opciones. Arrástrala para moverla. Toca un espacio vacío para crear una cita.</p>`);
    if (st.dia === S.ymd(new Date())) { const n = new Date(); const m = n.getHours() * 60 + n.getMinutes(); if (m > a0 && m < a1) $$('.colb', el).forEach(c => { const d = document.createElement('div'); d.className = 'now'; d.style.top = (m - a0) * H + 'px'; c.append(d); }); }
    arrastrar(a0, H);
  }
  function arrastrar(a0, H) {
    $$('.ev[data-b]', el).forEach(ev => {
      let y0, x0, top0, mov = false, col0;
      ev.onpointerdown = e => { y0 = e.clientY; x0 = e.clientX; top0 = ev.offsetTop; mov = false; col0 = ev.closest('[data-col]'); ev.setPointerCapture(e.pointerId); };
      ev.onpointermove = e => { if (y0 == null) return; const dy = e.clientY - y0; if (Math.abs(dy) > 6 || Math.abs(e.clientX - x0) > 20) mov = true; if (mov) { ev.classList.add('drag'); ev.style.top = Math.max(0, top0 + Math.round(dy / (15 * H)) * 15 * H) + 'px'; } };
      ev.onpointerup = e => { const was = mov; y0 = null; ev.classList.remove('drag'); if (!was) return cita(ev.dataset.b);
        const b = S.booking(ev.dataset.b); const nueva = a0 + Math.round(ev.offsetTop / H / 15) * 15;
        const destCol = document.elementsFromPoint(e.clientX, e.clientY).map(n => n.closest && n.closest('[data-col]')).find(Boolean) || col0; const sid = destCol.dataset.col;
        const ini0 = `${st.dia}T${S.fromMin(nueva)}`;
        if (S.libre(tid, sid, ini0, b.dur, b.id)) { S.saveBooking({ id: b.id, inicio: ini0, staffId: sid }); toast(`Movida a ${h12(S.fromMin(nueva))} · ${S.member(sid).nombre}`, 'cal'); }
        else { agenda(); toast('Ese espacio está ocupado o fuera de horario', 'x'); }
      };
    });
  }
  function cita(id) {
    const b = S.booking(id); const c = S.client(b.cid); const m = S.member(b.staffId); const t = T();
    sheet(`<div class="row"><div class="av r lg" style="--c:${m.color}">${esc(ini(c.nombre))}</div><div class="g"><h2>${esc(c.nombre)}</h2><div class="mut sm">${esc(c.tel)}</div></div><span class="pill">${b.estado}</span></div>
      <div class="card flat" style="margin-top:14px"><div class="b">${fechaL(S.parse(b.inicio))} · ${h12(b.inicio.slice(11))}</div><div class="mut sm">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')} · ${durL(b.dur)} · con ${esc(m.nombre)}</div><div class="row sp" style="margin-top:8px"><span class="xs mut">Código ${esc(b.codigo)} · vino de ${esc(b.origen)}</span><span class="b">${S.money(b.total)}</span></div>${b.pago?.pagado ? `<div class="xs" style="color:var(--ok);margin-top:4px">Pagado: ${S.money(b.pago.pagado)} (${esc(b.pago.metodo)})</div>` : ''}${b.nota ? `<div class="sm" style="margin-top:6px">📝 ${esc(b.nota)}</div>` : ''}</div>
      <div class="grid g2" style="margin-top:12px">
        ${b.estado !== 'completada' ? `<button class="btn" data-x="cobrar">${ic('cash', 17)} Cobrar</button><button class="btn ok" data-x="llegó">${ic('check', 17)} Llegó</button>` : ''}
        <a class="btn ghost" target="_blank" href="${wa(c.tel, `Hola ${c.nombre.split(' ')[0]} 👋 Te recordamos tu cita en ${t.nombre} el ${fechaL(S.parse(b.inicio))} a las ${h12(b.inicio.slice(11))}. ¿Nos confirmas? ✦`)}">${ic('wa', 17)} Recordar</a>
        ${b.estado !== 'completada' ? `<button class="btn danger" data-x="no-show">No vino</button><button class="btn danger" data-x="cancelada">${ic('x', 16)} Cancelar</button>` : ''}
        <button class="btn ghost" data-x="ficha">${ic('user', 16)} Ficha</button></div>`);
    $$('[data-x]').forEach(x => x.onclick = () => { const k = x.dataset.x; if (k === 'cobrar') return cobrar(id); if (k === 'ficha') return ficha(c.id); S.estado(id, k); closeSheet(); toast(k === 'cancelada' ? 'Cita cancelada' : k === 'no-show' ? 'Marcada: no vino' : 'Llegada registrada'); });
  }
  function nueva(pre = {}) {
    const t = T();
    sheet(`<h2>Nueva cita</h2><div class="field"><label>Cliente</label><input id="n-n" list="dl-c" placeholder="Nombre" autofocus><datalist id="dl-c">${S.clients(tid).map(c => `<option value="${esc(c.nombre)}">`).join('')}</datalist></div>
      <div class="field"><label>WhatsApp</label><input id="n-t" type="tel" placeholder="6000-0000"></div>
      <div class="field"><label>Servicio</label><select id="n-s">${S.services(tid).map(s => `<option value="${s.id}">${esc(s.nombre)} · ${durL(s.dur)} · ${S.money(s.precio)}</option>`).join('')}</select></div>
      <div class="grid g2"><div class="field"><label>Profesional</label><select id="n-m">${S.staff(tid).map(m => `<option value="${m.id}" ${pre.m === m.id ? 'selected' : ''}>${esc(m.nombre)}</option>`).join('')}</select></div><div class="field"><label>Hora</label><input id="n-h" type="time" step="900" value="${pre.h || '10:00'}"></div></div>
      <div class="field"><label>Día</label><input id="n-d" type="date" value="${st.dia}"></div><button class="btn w" id="n-ok">${ic('check', 18)} Guardar cita</button>`);
    $('#n-n').oninput = e => { const c = S.clients(tid).find(x => x.nombre === e.target.value); if (c) $('#n-t').value = c.tel; };
    $('#n-ok').onclick = () => { try { const nom = $('#n-n').value.trim(); if (!nom) return toast('Falta el nombre', 'user');
      S.crearCita(tid, { items: [$('#n-s').value], staffId: $('#n-m').value, inicio: `${$('#n-d').value}T${$('#n-h').value}`, cliente: { nombre: nom, tel: $('#n-t').value }, origen: 'recepción' }); closeSheet(); toast('Cita creada'); } catch (e) { toast(e.message, 'x'); } };
  }

  /* ================= CAJA ================= */
  function caja() {
    const hoy = S.ymd(new Date()); const vs = S.sales(tid).filter(v => v.fecha.startsWith(hoy));
    const por = S.bookings(tid).filter(b => b.inicio.startsWith(hoy) && ['confirmada', 'llegó', 'en curso'].includes(b.estado)).sort((a, b) => a.inicio.localeCompare(b.inicio));
    const met = ['Yappy', 'Tarjeta', 'Efectivo'].map(k => [k, vs.filter(v => v.metodo === k).reduce((a, v) => a + v.total, 0)]);
    const tot = vs.reduce((a, v) => a + v.total, 0), sub = vs.reduce((a, v) => a + v.sub, 0), it = vs.reduce((a, v) => a + v.itbms, 0), pr = vs.reduce((a, v) => a + (v.propina || 0), 0);
    layout(`${head('Caja', 'Cobros de hoy con ITBMS 7%', `<button class="btn sm" data-a="cierre">${ic('check', 16)} Cierre del día</button>`)}
      <div class="grid g4 stagger"><div class="kpi"><div class="l">Total cobrado</div><div class="v grad-t" data-n="${tot}" data-pre="$" data-dec="2">0</div></div>${met.map(([k, v]) => `<div class="kpi"><div class="l">${k}</div><div class="v" data-n="${v}" data-pre="$" data-dec="2">0</div></div>`).join('')}</div>
      <div class="grid g2 rsp" style="margin-top:12px"><div class="card flat in2"><h3>Por cobrar</h3>${por.length ? por.map(b => `<div class="li"><div style="width:58px" class="b sm">${h12(b.inicio.slice(11))}</div><div class="g"><div class="sm b">${esc(S.client(b.cid)?.nombre)}</div><div class="xs mut">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}</div></div><button class="btn sm" data-cob="${b.id}">${S.money(b.total * 1.07 - (b.pago?.pagado || 0))}</button></div>`).join('') : '<div class="empty">Nada pendiente</div>'}</div>
      <div class="card flat in3"><h3>Cobrado hoy</h3>${vs.length ? vs.slice().reverse().map(v => { const b = S.booking(v.bid); return `<div class="li"><div class="g"><div class="sm b">${esc(S.client(b?.cid)?.nombre || 'Cliente')}</div><div class="xs mut">${v.fecha.slice(11)} · ${esc(v.metodo)} · ${esc(S.member(v.staffId)?.nombre || '')}</div></div><span class="b sm">${S.money(v.total)}</span></div>`; }).join('') : '<div class="empty">Aún no hay cobros hoy</div>'}
        <hr><div class="row sp sm"><span class="mut">Ventas sin ITBMS</span><span>${S.money(sub)}</span></div><div class="row sp sm"><span class="mut">ITBMS 7%</span><span>${S.money(it)}</span></div><div class="row sp sm"><span class="mut">Propinas</span><span>${S.money(pr)}</span></div></div></div>`);
  }
  function cobrar(id) {
    const b = S.booking(id); let met = 'Yappy';
    const calc = () => { const d = +$('#c-d').value || 0, p = +$('#c-p').value || 0; const sub = Math.max(0, b.total - d); const it = sub * S.ITBMS; $('#c-it').textContent = S.money(it); $('#c-tot').textContent = S.money(sub + it + p - (b.pago?.pagado || 0)); };
    sheet(`<h2>Cobrar · ${esc(S.client(b.cid)?.nombre)}</h2><div class="mut sm">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')} · ${esc(S.member(b.staffId)?.nombre)}</div>
      <div class="card flat" style="margin-top:12px"><div class="row sp sm"><span>Servicios</span><span>${S.money(b.total)}</span></div><div class="grid g2" style="margin-top:10px"><div class="field"><label>Descuento</label><input id="c-d" type="number" inputmode="decimal" value="0"></div><div class="field"><label>Propina</label><input id="c-p" type="number" inputmode="decimal" value="0"></div></div>
      <div class="row sp sm"><span>ITBMS 7%</span><span id="c-it"></span></div>${b.pago?.pagado ? `<div class="row sp sm"><span>Depósito</span><span>-${S.money(b.pago.pagado)}</span></div>` : ''}<hr><div class="row sp"><span class="b">A cobrar</span><span class="b" style="font-size:26px" id="c-tot"></span></div></div>
      <div class="row" style="margin:14px 0">${['Yappy', 'Tarjeta', 'Efectivo'].map(k => `<button class="chip g ${k === met ? 'on' : ''}" style="justify-content:center" data-met="${k}">${k}</button>`).join('')}</div><button class="btn w" id="c-ok">${ic('check', 18)} Cobrado</button>
      <p class="xs dim c" style="margin-top:8px">La factura electrónica se emite con tu facturador DGI (paso con la versión real).</p>`);
    calc(); $('#c-d').oninput = calc; $('#c-p').oninput = calc;
    $$('[data-met]').forEach(x => x.onclick = () => { met = x.dataset.met; $$('[data-met]').forEach(y => y.classList.toggle('on', y === x)); });
    $('#c-ok').onclick = () => { S.cobrar(id, { metodo: met, propina: +$('#c-p').value || 0, descuento: +$('#c-d').value || 0 }); closeSheet(); toast('Cobrado ✦ sello sumado al cliente'); confetti([T().color2, T().color, '#fff']); };
  }

  /* ================= CLIENTES ================= */
  function clientes() {
    const hoy = new Date(); const lim = S.iso(S.addDays(hoy, -45)); const mesC = String(hoy.getMonth() + 1).padStart(2, '0');
    const data = S.clients(tid).map(c => { const bs = S.bookings(tid).filter(b => b.cid === c.id && b.estado === 'completada'); const ult = bs.map(b => b.inicio).sort().pop(); return { c, n: bs.length, gasto: bs.reduce((a, b) => a + b.total, 0), ult }; });
    const segs = { todos: () => true, vip: x => x.n >= 12, inactivos: x => x.ult && x.ult < lim, cumple: x => (x.c.cumple || '').slice(5, 7) === mesC, nuevos: x => x.n <= 1 };
    const lista = data.filter(segs[st.seg]).filter(x => !st.q || (x.c.nombre + x.c.tel).toLowerCase().includes(st.q.toLowerCase())).sort((a, b) => b.gasto - a.gasto);
    layout(`${head('Clientes', `${data.length} clientes · ${data.filter(segs.inactivos).length} no vuelven hace +45 días`)}
      <div class="row in" style="margin-bottom:12px"><div class="g" style="position:relative"><input id="q" placeholder="Buscar por nombre o teléfono" value="${esc(st.q)}" style="padding-left:42px"><span style="position:absolute;left:14px;top:13px;color:var(--mut)">${ic('search', 18)}</span></div></div>
      <div class="scroll-x in2" style="margin:0 0 14px">${[['todos', 'Todos'], ['vip', '⭐ VIP'], ['inactivos', '💤 No vuelven'], ['cumple', '🎂 Cumplen este mes'], ['nuevos', '🆕 Nuevos']].map(([k, l]) => `<button class="chip ${st.seg === k ? 'on' : ''}" data-seg="${k}">${l} · ${data.filter(segs[k]).length}</button>`).join('')}</div>
      <div class="card flat pad0 in3"><table class="t"><thead><tr><th>Cliente</th><th>Visitas</th><th>Gastó</th><th class="hide-m">Última</th><th></th></tr></thead><tbody>
      ${lista.map(x => `<tr data-c="${x.c.id}" style="cursor:pointer"><td><div class="row"><div class="av r" style="width:34px;height:34px;font-size:12px">${esc(ini(x.c.nombre))}</div><div><div class="b">${esc(x.c.nombre)}</div><div class="xs mut">${esc(x.c.tel)}</div></div></div></td><td>${x.n}</td><td>${S.money(x.gasto)}</td><td class="mut hide-m">${x.ult ? Math.round((hoy - S.parse(x.ult)) / 864e5) + ' días' : '—'}</td><td><a class="ico" target="_blank" href="${wa(x.c.tel, `Hola ${x.c.nombre.split(' ')[0]} 👋`)}" onclick="event.stopPropagation()">${ic('wa', 18)}</a></td></tr>`).join('')}
      </tbody></table>${lista.length ? '' : '<div class="empty">Sin resultados</div>'}</div>`);
    const q = $('#q'); q.oninput = () => { st.q = q.value; const p = q.selectionStart; clientes(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); };
  }
  function ficha(cid) {
    const c = S.client(cid); const t = T(); const bs = S.bookings(tid).filter(b => b.cid === cid).sort((a, b) => b.inicio.localeCompare(a.inicio));
    sheet(`<div class="row"><div class="av lg r">${esc(ini(c.nombre))}</div><div class="g"><h2>${esc(c.nombre)}</h2><div class="mut sm">${esc(c.tel)} · cliente desde ${S.parse(c.creado).toLocaleDateString('es-PA')}</div></div></div>
      <div class="grid g3" style="margin-top:14px"><div class="kpi"><div class="l">Visitas</div><div class="v">${bs.filter(b => b.estado === 'completada').length}</div></div><div class="kpi"><div class="l">Gastó</div><div class="v">${S.money(bs.filter(b => b.estado === 'completada').reduce((a, b) => a + b.total, 0))}</div></div><div class="kpi"><div class="l">Sellos</div><div class="v">${c.sellos || 0}/${t.fidelidad?.meta || 10}</div></div></div>
      <div class="field" style="margin-top:12px"><label>Notas (solo las ve tu equipo)</label><textarea id="f-n" rows="2" placeholder="Preferencias, alergias a productos, estilo…">${esc(c.notas || '')}</textarea></div>
      <div class="field"><label>Cumpleaños</label><input id="f-c" type="date" value="${esc(c.cumple || '')}"></div>
      <div class="row"><button class="btn g" id="f-ok">Guardar</button><a class="btn ghost" target="_blank" href="${wa(c.tel, `Hola ${c.nombre.split(' ')[0]} 👋`)}">${ic('wa', 17)}</a></div>
      <h3 style="margin:18px 0 6px">Historial</h3>${bs.slice(0, 12).map(b => `<div class="li"><div class="g"><div class="sm b">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}</div><div class="xs mut">${S.parse(b.inicio).toLocaleDateString('es-PA')} · ${esc(S.member(b.staffId)?.nombre)}</div></div><span class="pill ${b.estado === 'completada' ? 'ok' : b.estado === 'no-show' ? 'bad' : ''}">${b.estado}</span></div>`).join('')}`);
    $('#f-ok').onclick = () => { S.saveClient({ id: cid, notas: $('#f-n').value, cumple: $('#f-c').value }); closeSheet(); toast('Ficha guardada'); };
  }

  /* ================= MARKETING ================= */
  function marketing() {
    const t = T(); const hoy = new Date(); const lim = S.iso(S.addDays(hoy, -45)); const mesC = String(hoy.getMonth() + 1).padStart(2, '0'); const link = location.href.split('#')[0] + '#/s/' + t.slug;
    const ult = c => S.bookings(tid).filter(b => b.cid === c.id && b.estado === 'completada').map(b => b.inicio).sort().pop();
    const inact = S.clients(tid).filter(c => { const u = ult(c); return u && u < lim; });
    const cumple = S.clients(tid).filter(c => (c.cumple || '').slice(5, 7) === mesC);
    const ocup = Array.from({ length: 7 }, (_, i) => { const d = S.addDays(hoy, i + 1); const m = S.metricas(tid, S.ymd(d), S.ymd(S.addDays(d, 1))); return [d, m.ocupacion]; }).filter(([d]) => (t.horario[d.getDay()] || []).length).sort((a, b) => a[1] - b[1]);
    const flojo = ocup[0];
    const res = S.bookings(tid).filter(b => b.estado === 'completada' && b.inicio >= S.iso(S.addDays(hoy, -3))).map(b => S.client(b.cid)).filter((c, i, a) => c && a.indexOf(c) === i);
    const camp = [
      ['💤', 'Recupera a los que no vuelven', `${inact.length} clientes no vienen hace más de 45 días.`, inact, c => `Hola ${c.nombre.split(' ')[0]} 👋 ¡Te extrañamos en ${t.nombre}! Esta semana tienes 10% de descuento en tu próximo servicio. Reserva aquí 👉 ${link}`],
      ['🎂', 'Cumpleañeros del mes', `${cumple.length} clientes cumplen años este mes.`, cumple, c => `¡Feliz cumpleaños, ${c.nombre.split(' ')[0]}! 🎉 En ${t.nombre} te regalamos un detalle en tu próxima visita este mes. Reserva 👉 ${link}`],
      ['📉', `Llena tu día flojo${flojo ? ': ' + DIAS[flojo[0].getDay()] + ' ' + flojo[0].getDate() : ''}`, flojo ? `Ese día va al ${Math.round(flojo[1] * 100)}% de ocupación.` : 'Tu semana está llena.', S.clients(tid).slice(0, 15), c => `Hola ${c.nombre.split(' ')[0]} ✦ Tenemos espacios libres el ${flojo ? fechaL(flojo[0]) : 'esta semana'} con 15% de descuento. Aparta el tuyo 👉 ${link}`],
      ['⭐', 'Pide reseñas en Google', `${res.length} clientes atendidos en los últimos 3 días.`, res, c => `Hola ${c.nombre.split(' ')[0]}, gracias por venir a ${t.nombre} 💛 ¿Nos regalas 1 minuto para dejar tu reseña en Google? Nos ayuda muchísimo 🙏`],
    ];
    layout(`${head('Marketing', 'Campañas listas para enviar por WhatsApp, una por una (sin spam).')}
      <div class="grid g2 rsp stagger">${camp.map(([e, ti, d, l], i) => `<div class="card tilt flat"><div class="pop"><div style="font-size:30px">${e}</div><h3 style="margin:8px 0 4px">${ti}</h3><p class="mut sm" style="margin:0 0 14px">${d}</p><button class="btn sm" data-camp="${i}" ${l.length ? '' : 'disabled'}>${ic('wa', 16)} Preparar ${l.length} mensajes</button></div></div>`).join('')}</div>
      <div class="card flat in3" style="margin-top:12px"><h3>${ic('bell', 18)} Lista de espera</h3>${S.waitlist(tid).length ? S.waitlist(tid).slice(-8).reverse().map(w => `<div class="li"><div class="g"><div class="sm b">${esc(w.nombre)}</div><div class="xs mut">Quiere ${fechaL(S.parse(w.fecha + 'T00:00'))} · ${w.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}</div></div><a class="btn ghost sm" target="_blank" href="${wa(w.tel, `Hola ${w.nombre}, se liberó un espacio en ${t.nombre} 🎉 ¿Lo apartamos? 👉 ${link}`)}">${ic('wa', 15)} Avisar</a></div>`).join('') : '<p class="mut sm">Cuando un día esté lleno, tus clientes pueden anotarse aquí.</p>'}</div>
      <div class="card flat in4" style="margin-top:12px"><h3>Pon tu link en todas partes</h3><p class="mut sm">Bio de Instagram y TikTok, botón de WhatsApp Business, perfil de Google y el QR en tu local.</p><div class="row wrapx"><button class="btn ghost sm" data-a="copiar">${ic('copy', 15)} Copiar link</button><button class="btn ghost sm" data-a="compartir">${ic('qr', 15)} QR para imprimir</button></div></div>`);
    $$('[data-camp]').forEach(b => b.onclick = () => { const [, ti, , l, msg] = camp[+b.dataset.camp]; let i = 0;
      const paso = () => { if (i >= l.length) { closeSheet(); toast('Campaña completada ✦'); return; } const c = l[i];
        sheet(`<div class="row sp"><h2>${ti}</h2><span class="pill">${i + 1} / ${l.length}</span></div><div class="row" style="margin:14px 0"><div class="av r">${esc(ini(c.nombre))}</div><div class="g"><div class="b">${esc(c.nombre)}</div><div class="xs mut">${esc(c.tel)}</div></div></div>
          <textarea id="m-t" rows="5">${esc(msg(c))}</textarea><div class="row" style="margin-top:12px"><button class="btn ghost" id="m-s">Saltar</button><a class="btn g" id="m-e" target="_blank" href="#">${ic('wa', 17)} Abrir WhatsApp y enviar</a></div><p class="xs dim c" style="margin-top:8px">Se abre WhatsApp con el mensaje listo; tú lo envías. Así cuidas tu número.</p>`);
        $('#m-e').onclick = () => { $('#m-e').href = wa(c.tel, $('#m-t').value); i++; setTimeout(paso, 600); }; $('#m-s').onclick = () => { i++; paso(); }; };
      paso(); });
  }

  /* ================= SERVICIOS ================= */
  function servicios() {
    const svs = S.services(tid); const cats = [...new Set(svs.map(s => s.cat))];
    layout(`${head('Servicios', `${svs.length} servicios`, `<button class="btn sm" data-a="svc">${ic('plus', 16)} Nuevo</button>`)}
      ${cats.map(k => `<h3 class="in" style="margin:16px 0 8px">${esc(k)}</h3><div class="col stagger">${svs.filter(s => s.cat === k).map(s => `<div class="svc" data-s="${s.id}"><div class="g"><div class="b">${esc(s.nombre)}</div><div class="xs mut">${durL(s.dur)}</div></div><div class="b">${s.desde ? 'desde ' : ''}${S.money(s.precio)}</div>${ic('edit', 18)}</div>`).join('')}</div>`).join('')}`);
  }
  function editSvc(id) {
    const s = id ? S.service(id) : { id: S.uid('s'), tid, cat: S.services(tid)[0]?.cat || 'General', nombre: '', dur: 30, precio: 10, desde: false };
    sheet(`<h2>${id ? 'Editar' : 'Nuevo'} servicio</h2><div class="field"><label>Nombre</label><input id="s-n" value="${esc(s.nombre)}" autofocus></div><div class="field"><label>Categoría</label><input id="s-c" value="${esc(s.cat)}" list="dl-cat"><datalist id="dl-cat">${[...new Set(S.services(tid).map(x => x.cat))].map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
      <div class="grid g2"><div class="field"><label>Duración (min)</label><input id="s-d" type="number" step="5" value="${s.dur}"></div><div class="field"><label>Precio ($, sin ITBMS)</label><input id="s-p" type="number" step="0.5" value="${s.precio}"></div></div>
      <div class="row sp" style="margin-bottom:14px"><span class="sm">Mostrar como "desde" (precio variable)</span><div class="switch ${s.desde ? 'on' : ''}" id="s-x"></div></div>
      <div class="row">${id ? `<button class="btn danger" id="s-del">${ic('trash', 16)}</button>` : ''}<button class="btn g" id="s-ok">Guardar</button></div>`);
    $('#s-x').onclick = e => e.currentTarget.classList.toggle('on');
    $('#s-ok').onclick = () => { if (!$('#s-n').value.trim()) return toast('Falta el nombre', 'x'); S.saveService({ ...s, nombre: $('#s-n').value.trim(), cat: $('#s-c').value.trim() || 'General', dur: +$('#s-d').value || 30, precio: +$('#s-p').value || 0, desde: $('#s-x').classList.contains('on') }); closeSheet(); toast('Servicio guardado'); };
    if (id) $('#s-del').onclick = () => { S.saveService({ id, borrado: true }); closeSheet(); toast('Servicio eliminado'); };
  }

  /* ================= EQUIPO ================= */
  function equipo() {
    const mes = S.ymd(new Date()).slice(0, 7);
    layout(`${head('Equipo', 'Horarios, comisiones y acceso con PIN', `<button class="btn sm" data-a="mem">${ic('plus', 16)} Agregar</button>`)}
      <div class="grid g3 rsp stagger">${S.staff(tid).map(m => { const v = S.sales(tid).filter(x => x.staffId === m.id && x.fecha.startsWith(mes)).reduce((a, x) => a + x.sub, 0); return `<div class="card tilt" data-m="${m.id}" style="cursor:pointer"><div class="row pop"><div class="av lg r" style="--c:${m.color}">${esc(ini(m.nombre))}</div><div class="g"><h3>${esc(m.nombre)}</h3><div class="xs mut">${esc(m.rol)}</div></div></div>
        <div class="grid g2" style="margin-top:14px"><div><div class="xs mut">Vendió este mes</div><div class="b">${S.money(v)}</div></div><div><div class="xs mut">Comisión ${m.comision}%</div><div class="b">${S.money(v * m.comision / 100)}</div></div></div></div>`; }).join('')}</div>
      <p class="xs dim" style="margin-top:12px">Cada persona entra a la app del equipo con su PIN: <a href="#/s/${T().slug}/equipo">${location.host}${location.pathname}#/s/${T().slug}/equipo</a></p>`);
  }
  function editMem(id) {
    const m = id ? S.member(id) : { id: S.uid('m'), tid, nombre: '', rol: 'Profesional', color: ['#7C5CFF', '#2EC5FF', '#3DDC97', '#FF5C8A'][Math.floor(Math.random() * 4)], pin: String(1000 + Math.floor(Math.random() * 8999)), servicios: null, comision: 40, bloqueos: [], libres: [] };
    sheet(`<h2>${id ? 'Editar' : 'Nuevo'} integrante</h2><div class="grid g2"><div class="field"><label>Nombre</label><input id="m-n" value="${esc(m.nombre)}"></div><div class="field"><label>Cargo</label><input id="m-r" value="${esc(m.rol)}"></div></div>
      <div class="grid g3"><div class="field"><label>PIN</label><input id="m-p" inputmode="numeric" maxlength="4" value="${esc(m.pin)}"></div><div class="field"><label>Comisión %</label><input id="m-c" type="number" value="${m.comision}"></div><div class="field"><label>Color</label><input id="m-k" type="color" value="${m.color}" style="height:50px;padding:6px"></div></div>
      <label>Servicios que hace</label><div class="row wrapx" style="margin-bottom:14px">${S.services(tid).map(s => `<button class="chip ${!m.servicios || m.servicios.includes(s.id) ? 'on' : ''}" data-ms="${s.id}">${esc(s.nombre)}</button>`).join('')}</div>
      <div class="field"><label>Día libre (no recibe citas)</label><input id="m-l" type="date"></div>
      <div class="row">${id ? `<button class="btn danger" id="m-del">${ic('trash', 16)}</button>` : ''}<button class="btn g" id="m-ok">Guardar</button></div>`);
    $$('[data-ms]').forEach(x => x.onclick = () => x.classList.toggle('on'));
    $('#m-ok').onclick = () => { const sv = $$('[data-ms]').filter(x => x.classList.contains('on')).map(x => x.dataset.ms); const libres = [...(m.libres || [])]; if ($('#m-l').value) libres.push($('#m-l').value);
      if (!$('#m-n').value.trim()) return toast('Falta el nombre', 'x');
      S.saveStaff({ ...m, nombre: $('#m-n').value.trim(), rol: $('#m-r').value, pin: $('#m-p').value.replace(/\D/g, '').slice(0, 4).padEnd(4, '0'), comision: +$('#m-c').value || 0, color: $('#m-k').value, servicios: sv.length === S.services(tid).length ? null : sv, libres }); closeSheet(); toast('Guardado'); };
    if (id) $('#m-del').onclick = () => { if (S.staff(tid).length < 2) return toast('Debe quedar al menos 1 persona', 'x'); S.saveStaff({ id, borrado: true }); closeSheet(); toast('Eliminado'); };
  }

  /* ================= AJUSTES ================= */
  function ajustes() {
    const t = T();
    layout(`${head('Ajustes', 'Tu marca, horario y reglas. Los cambios se ven al instante en tu app.')}
      <div class="grid g2 rsp">
      <div class="card flat in"><h3>Marca</h3><div class="field" style="margin-top:12px"><label>Nombre del negocio</label><input id="a-n" value="${esc(t.nombre)}"></div><div class="field"><label>Frase principal</label><input id="a-l" value="${esc(t.lema || '')}"></div>
        <div class="grid g2"><div class="field"><label>Color principal</label><input id="a-c" type="color" value="${t.color}" style="height:50px;padding:6px"></div><div class="field"><label>Color secundario</label><input id="a-c2" type="color" value="${t.color2}" style="height:50px;padding:6px"></div></div>
        <div class="field"><label>Zona</label><input id="a-z" value="${esc(t.zona)}"></div><div class="field"><label>WhatsApp del negocio</label><input id="a-t" value="${esc(t.tel || '')}" placeholder="6000-0000"></div></div>
      <div class="card flat in2"><h3>Horario</h3><div style="margin-top:10px">${[1, 2, 3, 4, 5, 6, 0].map(d => { const h = t.horario[d] || []; return `<div class="row" style="margin-bottom:8px"><div class="switch ${h.length ? 'on' : ''}" data-hd="${d}"></div><span style="width:40px" class="sm">${DIAS[d]}</span><input type="time" data-ha="${d}" value="${h[0]?.[0] || '09:00'}" ${h.length ? '' : 'disabled'} style="padding:9px"><input type="time" data-hb="${d}" value="${h[0]?.[1] || '18:00'}" ${h.length ? '' : 'disabled'} style="padding:9px"></div>`; }).join('')}</div></div>
      <div class="card flat in3"><h3>Reglas de reserva</h3><div class="row sp" style="margin:12px 0"><div><div class="sm b">Pedir depósito</div><div class="xs mut">Reduce los plantones</div></div><div class="switch ${t.deposito?.activo ? 'on' : ''}" id="a-dep"></div></div>
        <div class="field"><label>Depósito (% del total)</label><input id="a-dp" type="number" value="${t.deposito?.pct || 20}"></div><div class="field"><label>Política de cancelación</label><textarea id="a-p" rows="2">${esc(t.politica)}</textarea></div></div>
      <div class="card flat in4"><h3>Fidelidad</h3><div class="grid g2" style="margin-top:12px"><div class="field"><label>Sellos para premio</label><input id="a-fm" type="number" value="${t.fidelidad?.meta || 10}"></div><div class="field"><label>Premio</label><input id="a-fp" value="${esc(t.fidelidad?.premio || '')}"></div></div>
        <h3 style="margin-top:6px">Tu link</h3><div class="row" style="margin-top:8px"><input readonly value="${location.href.split('#')[0]}#/s/${t.slug}"><button class="ico" data-a="copiar">${ic('copy')}</button></div></div>
      </div><div class="row" style="margin-top:16px;justify-content:flex-end"><a class="btn ghost" href="#/s/${t.slug}" target="_blank">${ic('link', 16)} Ver cómo queda</a><button class="btn" data-a="guardar">${ic('check', 18)} Guardar cambios</button></div>`);
    $$('[data-hd]').forEach(s => s.onclick = () => { s.classList.toggle('on'); const d = s.dataset.hd; $$(`[data-ha="${d}"],[data-hb="${d}"]`).forEach(i => i.disabled = !s.classList.contains('on')); });
    $('#a-dep').onclick = e => e.currentTarget.classList.toggle('on');
    ['#a-c', '#a-c2'].forEach(k => $(k).oninput = () => setBrand({ color: $('#a-c').value, color2: $('#a-c2').value }));
  }
  function guardarAjustes() {
    const t = T(); const horario = {}; [0, 1, 2, 3, 4, 5, 6].forEach(d => { horario[d] = $(`[data-hd="${d}"]`).classList.contains('on') ? [[$(`[data-ha="${d}"]`).value, $(`[data-hb="${d}"]`).value]] : []; });
    S.saveTenant({ id: t.id, nombre: $('#a-n').value.trim() || t.nombre, lema: $('#a-l').value, color: $('#a-c').value, color2: $('#a-c2').value, zona: $('#a-z').value, tel: $('#a-t').value, horario,
      deposito: { activo: $('#a-dep').classList.contains('on'), pct: +$('#a-dp').value || 20 }, politica: $('#a-p').value, fidelidad: { meta: Math.max(3, +$('#a-fm').value || 10), premio: $('#a-fp').value } });
    toast('Ajustes guardados ✦'); confetti([$('#a-c2').value, $('#a-c').value, '#fff']);
  }

  function compartir() {
    const t = T(); const link = location.href.split('#')[0] + '#/s/' + t.slug; const q = qrcode(0, 'M'); q.addData(link); q.make();
    sheet(`<div class="c"><h2>Tu app de reservas</h2><p class="mut sm">Ponlo en tu bio, tu WhatsApp y en el mostrador.</p>
      <div class="qr" style="margin:14px 0">${q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }).replace('<svg ', '<svg style="width:220px;height:220px" ')}</div>
      <div class="b">${esc(t.nombre)}</div><div class="xs mut" style="margin-bottom:14px">Escanea y reserva en segundos</div>
      <div class="row"><input readonly value="${link}"><button class="ico" data-a="copiar">${ic('copy')}</button></div>
      <div class="grid g2" style="margin-top:12px"><a class="btn ghost" target="_blank" href="${wa('', `Reserva tu cita en ${t.nombre} aquí 👉 ${link}`)}">${ic('wa', 17)} Enviar</a><button class="btn" onclick="window.print()">Imprimir</button></div></div>`);
    $('.sheet [data-a=copiar]').onclick = copiar;
  }
  function copiar() { const link = location.href.split('#')[0] + '#/s/' + T().slug; navigator.clipboard?.writeText(link).then(() => toast('Link copiado'), () => toast(link, 'link')); }
  function mas() {
    sheet(`<h2>Más</h2><div class="grid g2" style="margin-top:14px">${SECC.slice(4).map(([k, i, l]) => `<a class="card flat c" href="#/s/${T().slug}/panel/${k}" style="text-decoration:none"><div class="ico" style="margin:0 auto 8px">${ic(i)}</div>${l}</a>`).join('')}
      <a class="card flat c" href="#/s/${T().slug}" target="_blank" style="text-decoration:none"><div class="ico" style="margin:0 auto 8px">${ic('link')}</div>Ver mi app</a><a class="card flat c" href="#/s/${T().slug}/equipo" style="text-decoration:none"><div class="ico" style="margin:0 auto 8px">${ic('scissors')}</div>App del equipo</a>
      <a class="card flat c" href="#/guia" style="text-decoration:none"><div class="ico" style="margin:0 auto 8px">${ic('book')}</div>Guía de uso</a><button class="card flat c" data-a="salir" style="cursor:pointer"><div class="ico" style="margin:0 auto 8px">${ic('logout')}</div>Salir</button></div>`);
    $('.sheet [data-a=salir]').onclick = () => { sessionStorage.removeItem(key); closeSheet(); location.hash = '#/'; };
    $$('.sheet a').forEach(a => a.addEventListener('click', closeSheet));
  }

  const vistas = { inicio, agenda, caja, clientes, marketing, servicios, equipo, ajustes };
  function pintar() { (vistas[sec] || inicio)(); el.onclick = onClick; }
  function onClick(e) {
    const x = e.target.closest('[data-a],[data-nav],[data-dd],[data-b],[data-slot],[data-cob],[data-c],[data-seg],[data-s],[data-m]'); if (!x) return;
    if (x.closest('.ev[data-b]')) return; // la agenda maneja sus propios toques
    vibrar(8);
    if (x.dataset.nav) { if (x.dataset.nav === 'mas') return mas(); location.hash = `#/s/${T().slug}/panel/${x.dataset.nav}`; return; }
    if (x.dataset.dd !== undefined) { st.dia = x.dataset.dd === '0' ? S.ymd(new Date()) : S.ymd(S.addDays(S.parse(st.dia + 'T00:00'), +x.dataset.dd)); return agenda(); }
    if (x.dataset.b) return cita(x.dataset.b);
    if (x.dataset.slot) { const [m, h] = x.dataset.slot.split('|'); return nueva({ m, h }); }
    if (x.dataset.cob) return cobrar(x.dataset.cob);
    if (x.dataset.c) return ficha(x.dataset.c);
    if (x.dataset.seg) { st.seg = x.dataset.seg; return clientes(); }
    if (x.dataset.s) return editSvc(x.dataset.s);
    if (x.dataset.m) return editMem(x.dataset.m);
    const a = x.dataset.a;
    if (a === 'compartir') compartir(); if (a === 'copiar') copiar(); if (a === 'nueva') nueva(); if (a === 'svc') editSvc(); if (a === 'mem') editMem(); if (a === 'guardar') guardarAjustes();
    if (a === 'cierre') { const hoy = S.ymd(new Date()); const vs = S.sales(tid).filter(v => v.fecha.startsWith(hoy)); const tot = vs.reduce((a, v) => a + v.total, 0);
      sheet(`<div class="c"><h2>Cierre del día</h2><p class="mut sm">${fechaL(new Date())}</p><div style="font-size:44px;font-weight:800;margin:12px 0" class="grad-t">${S.money(tot)}</div>
        ${['Yappy', 'Tarjeta', 'Efectivo'].map(k => `<div class="row sp sm" style="margin:6px 0"><span>${k}</span><span>${S.money(vs.filter(v => v.metodo === k).reduce((a, v) => a + v.total, 0))}</span></div>`).join('')}<hr>
        <div class="row sp sm"><span>ITBMS a declarar</span><span>${S.money(vs.reduce((a, v) => a + v.itbms, 0))}</span></div><div class="row sp sm"><span>Propinas del equipo</span><span>${S.money(vs.reduce((a, v) => a + (v.propina || 0), 0))}</span></div>
        <button class="btn w" style="margin-top:16px" onclick="window.print()">Imprimir resumen</button></div>`); }
  }
  const off = S.onChange(() => {
    if (!sessionStorage.getItem(key)) return;
    if (document.querySelector('.sheet') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || $('.ev.drag')) return;
    const y = scrollY; pintar(); scrollTo(0, y);
    const n = S.bookings(tid).filter(b => b.origen === 'app').sort((a, b) => b.creado.localeCompare(a.creado))[0];
    if (n && n.id !== window.__ultimaGlow && n.creado >= S.iso(new Date(Date.now() - 60000))) { window.__ultimaGlow = n.id; toast(`📱 Nueva reserva: ${S.client(n.cid)?.nombre} · ${h12(n.inicio.slice(11))}`, 'bell'); }
  });
  sessionStorage.getItem(key) ? pintar() : gate();
  return () => { off(); el.onclick = null; };
}
