import * as S from './store.js';
import { $, $$, esc, ic, ini, h12, fechaL, durL, DIAS, toast, sheet, closeSheet, tilt, setBrand, vibrar, contar, wa, avatar, estrellas } from './ui.js';

export function render(el, [slug]) {
  const t = S.tenant(slug); if (!t) { location.hash = '#/'; return; }
  setBrand(t); document.title = t.nombre + ' · Equipo';
  const key = 'glow.eq.' + t.id; let yo = sessionStorage.getItem(key); let dia = 0; let vista = 'hoy';

  function login(sel = null) {
    const ms = S.staff(t.id); let pin = '';
    el.innerHTML = `<main class="wrap" style="padding-top:40px">
      <div class="c in"><div class="av lg r" style="margin:0 auto;--c:var(--grad)">${ic('scissors', 28)}</div><h1 style="font-size:30px;margin-top:14px">Equipo de ${esc(t.nombre)}</h1><p class="mut">${sel ? 'Escribe tu PIN' : '¿Quién eres?'}</p></div>
      ${sel ? `<div class="c in2" style="margin-top:20px"><div class="av lg r" style="margin:0 auto;--c:${S.member(sel).color}">${esc(ini(S.member(sel).nombre))}</div><h3 style="margin:10px 0">${esc(S.member(sel).nombre)}</h3>
        <div class="row" id="pins" style="justify-content:center;gap:14px;margin:18px 0">${[0, 1, 2, 3].map(() => '<i style="width:14px;height:14px;border-radius:50%;border:1.5px solid var(--line2);display:block"></i>').join('')}</div>
        <div class="grid g3" style="max-width:280px;margin:0 auto">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button class="btn ghost" style="min-height:64px;font-size:22px" data-k="${k}">${k}</button>`).join('')}</div>
        <p class="xs dim" style="margin-top:16px">Demo: el PIN de ${esc(S.member(sel).nombre)} es ${S.member(sel).pin}</p><button class="btn ghost sm" data-back>Cambiar de persona</button></div>`
      : `<div class="grid g2 stagger" style="margin-top:24px">${ms.map(m => `<button class="card tilt c" style="cursor:pointer" data-m="${m.id}">${avatar(m, 'lg r pop', 'margin:0 auto')}<div class="b" style="margin-top:10px">${esc(m.nombre)}</div><div class="xs mut">${esc(m.rol)}</div></button>`).join('')}</div>`}
      <p class="c" style="margin-top:24px"><a class="mut sm" href="#/s/${t.slug}/panel">Soy el dueño → panel</a></p></main>`;
    tilt(el);
    el.onclick = e => {
      const m = e.target.closest('[data-m]'); if (m) return login(m.dataset.m);
      if (e.target.closest('[data-back]')) return login();
      const k = e.target.closest('[data-k]'); if (!k) return; vibrar(10);
      pin = k.dataset.k === '⌫' ? pin.slice(0, -1) : (pin + k.dataset.k).slice(0, 4);
      $$('#pins i').forEach((d, i) => d.style.background = i < pin.length ? 'var(--brand)' : '');
      if (pin.length === 4) { if (pin === S.member(sel).pin) { yo = sel; sessionStorage.setItem(key, yo); vibrar(30); app(); } else { $('#pins').animate([{ transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'none' }], { duration: 300 }); pin = ''; $$('#pins i').forEach(d => d.style.background = ''); toast('PIN incorrecto', 'lock'); } }
    };
  }

  function app() {
    const m = S.member(yo); if (!m) return login();
    const f = S.addDays(new Date(), dia); const d = S.ymd(f);
    const mias = S.bookings(t.id).filter(b => b.staffId === m.id && b.inicio.startsWith(d) && b.estado !== 'cancelada').sort((a, b) => a.inicio.localeCompare(b.inicio));
    const ahora = S.iso(new Date());
    const sig = mias.find(b => ['confirmada', 'llegó', 'en curso'].includes(b.estado) && (b.inicio.slice(0, 16) >= ahora.slice(0, 16) || b.estado !== 'confirmada'));
    const mes = S.ymd(new Date()).slice(0, 7);
    const vs = S.sales(t.id).filter(v => v.staffId === m.id && v.fecha.startsWith(mes)); const prod = vs.reduce((a, v) => a + v.sub, 0), prop = vs.reduce((a, v) => a + (v.propina || 0), 0);
    const tab = (k, i, l) => `<button class="${vista === k ? 'on' : ''}" data-v="${k}">${ic(i)}${l}</button>`;
    let body = '';
    if (vista === 'hoy') {
      const mins = sig ? Math.round((S.parse(sig.inicio) - new Date()) / 60000) : null;
      body = `<div class="row sp in" style="margin:18px 0 6px"><div><div class="mut sm">Hola, ${esc(m.nombre)} 👋</div><h2>${dia === 0 ? 'Tu día de hoy' : fechaL(f)}</h2></div>
        <div class="row"><button class="ico" data-d="-1">${ic('back')}</button><button class="ico" data-d="1">${ic('next')}</button></div></div>
        ${sig && dia === 0 ? `<div class="card glass tilt in2" style="margin-top:10px"><div class="pop"><div class="row sp"><span class="pill br">${sig.estado === 'en curso' ? 'En curso' : mins > 0 ? `En ${mins >= 60 ? Math.floor(mins / 60) + ' h ' : ''}${mins % 60} min` : 'Ahora'}</span><span class="b">${h12(sig.inicio.slice(11))}</span></div>
          <h2 style="margin:12px 0 2px">${esc(S.client(sig.cid)?.nombre)}</h2><div class="mut sm">${sig.items.map(i => esc(S.service(i)?.nombre)).join(' + ')} · ${durL(sig.dur)}</div>
          ${S.client(sig.cid)?.notas ? `<div class="sm" style="margin-top:8px">📝 ${esc(S.client(sig.cid).notas)}</div>` : ''}
          <div class="row" style="margin-top:14px">${acciones(sig)}</div></div></div>` : ''}
        <div class="row sp" style="margin:22px 0 8px"><h3>${mias.length} cita${mias.length === 1 ? '' : 's'}</h3><button class="btn ghost sm" data-a="bloq">${ic('lock', 15)} Bloquear tiempo</button></div>
        <div class="col stagger">${mias.length ? mias.map(b => `<div class="card flat" style="padding:14px;border-left:3px solid ${b.estado === 'completada' ? 'var(--ok)' : b.estado === 'no-show' ? 'var(--bad)' : 'var(--brand)'}">
          <div class="row"><div style="width:64px"><div class="b">${h12(b.inicio.slice(11))}</div><div class="xs mut">${durL(b.dur)}</div></div><div class="g"><div class="b">${esc(S.client(b.cid)?.nombre)}</div><div class="xs mut">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}</div></div>${pill(b.estado)}</div>
          ${['confirmada', 'llegó', 'en curso'].includes(b.estado) ? `<div class="row" style="margin-top:10px">${acciones(b)}</div>` : ''}</div>`).join('') : `<div class="empty">${ic('sun', 36)}<p>Día libre de citas.</p></div>`}</div>
        ${(m.bloqueos || []).filter(x => x.fecha === d).map(x => `<div class="card flat sm" style="margin-top:8px">🔒 ${h12(x.desde)} – ${h12(x.hasta)} · ${esc(x.motivo || 'Bloqueado')} <button class="btn ghost sm" data-unb="${x.desde}">Quitar</button></div>`).join('')}`;
    } else if (vista === 'num') {
      const comp = vs.length; body = `<h2 class="in" style="margin:18px 0 14px">Tus números de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][new Date().getMonth()]}</h2>
        <div class="grid g2 stagger"><div class="kpi"><div class="l">Servicios hechos</div><div class="v" data-n="${comp}">0</div></div><div class="kpi"><div class="l">Vendiste</div><div class="v" data-n="${prod}" data-pre="$">0</div></div>
        <div class="kpi"><div class="l">Tu comisión (${m.comision}%)</div><div class="v grad-t" data-n="${prod * m.comision / 100}" data-pre="$" data-dec="2">0</div></div><div class="kpi"><div class="l">Propinas</div><div class="v" data-n="${prop}" data-pre="$">0</div></div></div>
        ${(() => { const rs = S.reviews(t.id).filter(r => r.staffId === m.id); return rs.length ? `<div class="card flat" style="margin-top:14px"><div class="row sp"><h3>Tus reseñas</h3><span>${estrellas(rs.reduce((a, r) => a + r.estrellas, 0) / rs.length, 14)} <b>${(rs.reduce((a, r) => a + r.estrellas, 0) / rs.length).toFixed(1)}</b></span></div>${rs.slice(-4).reverse().map(r => `<div class="li"><div class="g"><div class="sm">${esc(r.texto)}</div><div class="xs mut">${esc(S.client(r.cid)?.nombre?.split(' ')[0] || '')}</div></div></div>`).join('')}</div>` : ''; })()}
        <div class="card flat" style="margin-top:14px"><h3>Tus clientes fieles</h3>${top(m).map(([c, n]) => `<div class="li"><div class="av r" style="--c:${m.color}">${esc(ini(c.nombre))}</div><div class="g"><div class="b sm">${esc(c.nombre)}</div><div class="xs mut">${n} visitas</div></div><a class="ico" target="_blank" href="${wa(c.tel, `Hola ${c.nombre.split(' ')[0]}, soy ${m.nombre} de ${t.nombre}. ¿Te agendo tu próxima cita? 👉 ${location.href.split('#')[0]}#/s/${t.slug}`)}">${ic('wa', 18)}</a></div>`).join('')}</div>`;
    } else if (vista === 'sem') {
      const dias = Array.from({ length: 14 }, (_, i) => S.addDays(new Date(), i));
      body = `<h2 class="in" style="margin:18px 0 14px">Tus próximos 14 días</h2>${dias.map(dd => { const k = S.ymd(dd); const bs = S.bookings(t.id).filter(b => b.staffId === m.id && b.inicio.startsWith(k) && b.estado !== 'cancelada'); const libre = (m.libres || []).includes(k) || !S.horarioDe(t.id, m.id, dd).length;
        return `<div class="card flat" style="margin-bottom:8px;padding:12px 14px"><div class="row sp"><div class="b">${fechaL(dd)}</div>${libre ? '<span class="pill">Libre</span>' : `<span class="pill ${bs.length ? 'br' : ''}">${bs.length} citas</span>`}</div>${bs.length ? `<div class="xs mut" style="margin-top:4px">${bs.sort((a, b) => a.inicio.localeCompare(b.inicio)).map(b => h12(b.inicio.slice(11)) + ' ' + esc(S.client(b.cid)?.nombre.split(' ')[0])).join(' · ')}</div>` : ''}${!libre ? `<button class="btn ghost sm" style="margin-top:8px" data-libre="${k}">Pedir día libre</button>` : ''}</div>`; }).join('')}`;
    } else if (vista === 'nueva') {
      body = `<h2 class="in" style="margin:18px 0 14px">Cliente sin cita</h2><p class="mut sm">Registra a quien llegó sin reservar, para que cuente en caja y en sus sellos.</p>
        <div class="field"><label>Servicio</label><select id="n-s">${S.services(t.id).map(s => `<option value="${s.id}">${esc(s.nombre)} · ${S.money(s.precio)}</option>`).join('')}</select></div>
        <div class="field"><label>Nombre</label><input id="n-n" placeholder="Nombre del cliente"></div><div class="field"><label>WhatsApp (opcional)</label><input id="n-t" type="tel" placeholder="6000-0000"></div>
        <button class="btn w" data-a="walkin">${ic('plus', 18)} Empezar ahora</button>`;
    }
    el.innerHTML = `<header class="top"><div class="wrap in-top">${avatar(m, 'r', 'width:38px;height:38px;font-size:13px')}<div class="g"><div class="b">${esc(m.nombre)}</div><div class="xs mut">${esc(t.nombre)}</div></div><select data-est style="width:auto;padding:8px 10px;font-size:13px">${['disponible', 'ocupado', 'almorzando', 'fuera'].map(x => `<option ${m.estadoFila === x ? 'selected' : ''}>${x}</option>`).join('')}</select><button class="ico" data-a="salir" title="Salir">${ic('logout')}</button></div></header>
      <main class="wrap pb">${body}</main>
      <nav class="tabbar">${tab('hoy', 'sun', 'Mi día')}${tab('sem', 'cal', '14 días')}${tab('nueva', 'plus', 'Sin cita')}${tab('num', 'chart', 'Números')}</nav>`;
    tilt(el); contar(el);
    $('[data-est]', el).onchange = e => { S.saveStaff({ id: m.id, estadoFila: e.target.value }); toast('Estado: ' + e.target.value); };
    el.onclick = onClick;
  }
  const pill = e => `<span class="pill ${e === 'completada' ? 'ok' : e === 'no-show' ? 'bad' : e === 'en curso' ? 'br' : ''}">${e}</span>`;
  const acciones = b => b.estado === 'confirmada' ? `<button class="btn ok sm g" data-e="llegó|${b.id}">${ic('check', 15)} Llegó</button><button class="btn danger sm" data-e="no-show|${b.id}">No vino</button>`
    : b.estado === 'llegó' ? `<button class="btn sm g" data-e="en curso|${b.id}">${ic('play', 14)} Empezar</button>` : b.estado === 'en curso' ? `<button class="btn sm g" data-e="terminar|${b.id}">${ic('check', 15)} Terminar y cobrar</button>` : '';
  function top(m) { const n = {}; S.bookings(t.id).filter(b => b.staffId === m.id && b.estado === 'completada').forEach(b => n[b.cid] = (n[b.cid] || 0) + 1); return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, k]) => [S.client(c), k]).filter(x => x[0]); }
  function onClick(e) {
    const x = e.target.closest('[data-v],[data-d],[data-e],[data-a],[data-unb],[data-libre]'); if (!x) return; vibrar(8);
    if (x.dataset.libre) { const m = S.member(yo); S.saveStaff({ id: m.id, libres: [...(m.libres || []), x.dataset.libre] }); S.msg(S.tenant(slug).id, { tipo: 'Día libre', canal: 'Panel', texto: `${m.nombre} tomó libre el ${x.dataset.libre}.` }); toast('Día libre marcado: ya no se puede reservar contigo ese día'); return; }
    if (x.dataset.v) { vista = x.dataset.v; return app(); }
    if (x.dataset.d) { dia += +x.dataset.d; return app(); }
    if (x.dataset.unb) { const m = S.member(yo); S.saveStaff({ id: m.id, bloqueos: (m.bloqueos || []).filter(b => !(b.fecha === S.ymd(S.addDays(new Date(), dia)) && b.desde === x.dataset.unb)) }); return; }
    if (x.dataset.e) { const [est, id] = x.dataset.e.split('|');
      if (est === 'terminar') return cobrarSheet(id);
      S.estado(id, est); toast(est === 'no-show' ? 'Marcado como no vino' : est === 'llegó' ? 'Llegada registrada' : 'Servicio en curso'); return; }
    const a = x.dataset.a;
    if (a === 'salir') { sessionStorage.removeItem(key); yo = null; return login(); }
    if (a === 'bloq') { sheet(`<h2>Bloquear tiempo</h2><p class="mut sm">Almuerzo, diligencia o descanso. Nadie podrá reservar en ese rango.</p><div class="grid g2"><div class="field"><label>Desde</label><input id="b-d" type="time" value="13:00"></div><div class="field"><label>Hasta</label><input id="b-h" type="time" value="14:00"></div></div><div class="field"><label>Motivo</label><input id="b-m" value="Almuerzo"></div><button class="btn w" id="b-ok">Bloquear</button>`);
      $('#b-ok').onclick = () => { const m = S.member(yo); S.saveStaff({ id: m.id, bloqueos: [...(m.bloqueos || []), { fecha: S.ymd(S.addDays(new Date(), dia)), desde: $('#b-d').value, hasta: $('#b-h').value, motivo: $('#b-m').value }] }); closeSheet(); toast('Tiempo bloqueado', 'lock'); }; }
    if (a === 'walkin') { const n = $('#n-n').value.trim(); if (!n) return toast('Escribe el nombre', 'user');
      const ahora = new Date(); ahora.setMinutes(Math.floor(ahora.getMinutes() / 5) * 5); const s = $('#n-s').value; const c = S.upsertClient(t.id, { nombre: n, tel: $('#n-t').value });
      const b = S.saveBooking({ id: S.uid('b'), tid: t.id, cid: c.id, items: [s], staffId: yo, inicio: S.iso(ahora), dur: S.service(s).dur, total: S.service(s).precio, estado: 'en curso', origen: 'sin cita', nota: '', pago: { deposito: 0, pagado: 0, metodo: '' }, creado: S.iso(ahora), codigo: 'SC-' + Math.floor(Math.random() * 9999) });
      vista = 'hoy'; dia = 0; toast('Servicio iniciado'); app(); }
  }
  function cobrarSheet(id) {
    const b = S.booking(id); let met = 'Yappy';
    const pintar = () => { const prop = +($('#c-p')?.value || 0); const sub = b.total, it = sub * S.ITBMS, tot = sub + it + prop - (b.pago?.pagado || 0);
      $('#c-tot').textContent = S.money(tot); $('#c-it').textContent = S.money(it); };
    sheet(`<h2>Cobrar</h2><div class="mut sm">${esc(S.client(b.cid)?.nombre)} · ${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}</div>
      <div class="card flat" style="margin-top:14px"><div class="row sp sm"><span>Servicios</span><span>${S.money(b.total)}</span></div><div class="row sp sm"><span>ITBMS 7%</span><span id="c-it"></span></div>${b.pago?.pagado ? `<div class="row sp sm"><span>Depósito pagado</span><span>-${S.money(b.pago.pagado)}</span></div>` : ''}
      <div class="field" style="margin-top:10px"><label>Propina</label><input id="c-p" type="number" inputmode="decimal" value="0"></div><div class="row sp"><span class="b">A cobrar</span><span class="b" style="font-size:24px" id="c-tot"></span></div></div>
      <div class="row" style="margin:14px 0">${['Yappy', 'Tarjeta', 'Efectivo'].map(k => `<button class="chip ${k === met ? 'on' : ''} g" style="justify-content:center" data-met="${k}">${k}</button>`).join('')}</div>
      <button class="btn w" id="c-ok">${ic('check', 18)} Cobrado</button>`);
    pintar(); $('#c-p').oninput = pintar;
    $$('[data-met]').forEach(x => x.onclick = () => { met = x.dataset.met; $$('[data-met]').forEach(y => y.classList.toggle('on', y === x)); });
    $('#c-ok').onclick = () => { S.cobrar(id, { metodo: met, propina: +$('#c-p').value || 0 }); closeSheet(); toast('¡Cobrado! Sello sumado ✦'); };
  }
  const off = S.onChange(() => { if (yo && !document.querySelector('.sheet') && document.activeElement?.tagName !== 'INPUT') app(); });
  yo && S.member(yo) ? app() : login();
  return () => { off(); el.onclick = null; };
}
