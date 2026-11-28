import * as S from './store.js';
import { $, $$, esc, ic, ini, h12, fechaL, durL, DIAS, MESES, MESES_L, toast, sheet, closeSheet, tilt, setBrand, vibrar, contar, wa, confetti, leerImagen, estrellas, avatar , pickerEstilos, ESTILOS , tarjetaFid } from './ui.js';
import qrcode from '../vendor/qrcode.mjs';

const BASICO = ['inicio', 'agenda', 'caja', 'clientes', 'catalogo', 'ajustes'];
const SECC = [['inicio', 'home', 'Inicio'], ['agenda', 'cal', 'Agenda'], ['fila', 'users', 'Fila sin cita'], ['caja', 'cash', 'Caja'], ['clientes', 'heart', 'Clientes'], ['catalogo', 'scissors', 'Servicios y productos'], ['promos', 'gift', 'Ofertas y regalos'], ['marketing', 'spark', 'Marketing'], ['mensajes', 'bell', 'Mensajes'], ['reportes', 'chart', 'Reportes'], ['equipo', 'user', 'Equipo'], ['ajustes', 'gear', 'Ajustes']];
const METODOS = ['Yappy', 'Tarjeta', 'Efectivo', 'Transferencia'];

export function render(el, [slug, sec = 'inicio']) {
  const t0 = S.tenant(slug); if (!t0) { location.hash = '#/'; return; }
  const tid = t0.id; const T = () => S.tenant(tid);
  setBrand(t0); document.title = t0.nombre + ' · Panel';
  const key = 'glow.dueno.' + tid;
  const st = { dia: S.ymd(new Date()), q: '', seg: 'todos', tab: 'servicios', ptab: 'vendibles', per: 'mes', suc: 'todas' };
  S.procesarAvisos(tid);

  function gate() {
    const due = S.staff(tid)[0]; let pin = '';
    el.innerHTML = `<main class="wrap c" style="padding-top:60px"><img src="img/glow-logo-dark.png" style="height:30px" alt="Glow"><h1 class="in" style="font-size:30px;margin:26px 0 6px">Panel de ${esc(t0.nombre)}</h1><p class="mut in2">PIN del dueño</p>
      <div class="row" id="pins" style="justify-content:center;gap:14px;margin:18px 0">${[0, 1, 2, 3].map(() => '<i style="width:14px;height:14px;border-radius:50%;border:1.5px solid var(--line2);display:block"></i>').join('')}</div>
      <div class="grid g3 in3" style="max-width:280px;margin:0 auto">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button class="btn ghost" style="min-height:64px;font-size:22px" data-k="${k}">${k}</button>`).join('')}</div>
      <p class="xs dim" style="margin-top:16px">Demo: el PIN es ${due.pin}</p></main>`;
    el.onclick = e => { const k = e.target.closest('[data-k]'); if (!k) return; vibrar(10); pin = k.dataset.k === '⌫' ? pin.slice(0, -1) : (pin + k.dataset.k).slice(0, 4);
      $$('#pins i').forEach((d, i) => d.style.background = i < pin.length ? 'var(--brand)' : '');
      if (pin.length === 4) { if (pin === due.pin) { sessionStorage.setItem(key, 1); pintar(); } else { pin = ''; $$('#pins i').forEach(d => d.style.background = ''); toast('PIN incorrecto', 'lock'); } } };
  }

  function layout(body) {
    const t = T(); const fila = S.esperaFila(tid).length; const nuevos = S.outbox(tid).filter(m => m.canal === 'Panel' && !m.visto).length;
    el.innerHTML = `
    <aside class="side"><a class="logo" href="#/" style="padding:4px 8px 14px"><img src="img/glow-logo-dark.png" style="height:24px" alt="Glow"></a>
      <div class="row" style="padding:0 8px 12px">${t.logo ? `<div class="av" style="width:36px;height:36px;background:#fff url(${t.logo}) center/contain no-repeat;border:1px solid var(--line)"></div>` : `<div class="av" style="width:36px;height:36px;font-size:12px">${esc(ini(t.nombre))}</div>`}<div class="g"><div class="b sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.nombre)}</div><div class="xs mut">Plan ${esc(t.plan)}</div></div></div>
      ${SECC.filter(([k]) => !t.modoInicio || BASICO.includes(k) || k === sec).map(([k, i, l]) => `<a href="#/s/${t.slug}/panel/${k}" class="${sec === k ? 'on' : ''}">${ic(i)}<span class="g">${l}</span>${k === 'fila' && fila ? `<span class="pill br">${fila}</span>` : ''}${k === 'mensajes' && nuevos ? `<span class="pill br">${nuevos}</span>` : ''}</a>`).join('')}
      ${t.modoInicio ? `<a href="#" data-a="modo" style="color:var(--brand);font-weight:600">${ic('plus')}Ver todo el sistema</a>` : ''}<div class="g" style="min-height:10px"></div><a href="#/s/${t.slug}" target="_blank">${ic('link')}Ver mi app</a><a href="#/s/${t.slug}/recepcion">${ic('bell')}Recepción</a><a href="#/s/${t.slug}/tv" target="_blank">${ic('play')}Pantalla TV</a><a href="#/s/${t.slug}/accesos">${ic('qr')}Accesos y QR</a><a href="#/s/${t.slug}/equipo">${ic('scissors')}App del equipo</a><a href="#/guia">${ic('book')}Guía</a></aside>
    <div class="main">${body}</div>
    <nav class="tabbar mobnav">${[['inicio', 'home', 'Inicio'], ['agenda', 'cal', 'Agenda'], ['caja', 'cash', 'Caja'], ['clientes', 'heart', 'Clientes'], ['mas', 'gear', 'Más']].map(([k, i, l]) => `<button class="${sec === k || (k === 'mas' && !['inicio', 'agenda', 'caja', 'clientes'].includes(sec)) ? 'on' : ''}" data-nav="${k}">${ic(i)}${l}</button>`).join('')}</nav>`;
    tilt(el); contar(el);
  }
  const head = (tit, sub = '', der = '') => `<div class="row sp wrapx in" style="margin:6px 0 18px;gap:12px"><div><h1 style="font-size:30px">${tit}</h1>${sub ? `<div class="mut sm" style="margin-top:4px">${sub}</div>` : ''}</div><div class="row wrapx">${der}</div></div>`;
  const tabs = (lista, act, attr) => `<div class="seg in" style="margin-bottom:16px;flex-wrap:wrap">${lista.map(([k, l]) => `<button class="${act === k ? 'on' : ''}" data-${attr}="${k}">${l}</button>`).join('')}</div>`;
  const cuenta = arr => Object.entries(arr.reduce((o, k) => (o[k] = (o[k] || 0) + 1, o), {})).sort((a, b) => b[1] - a[1]);
  const csv = (nombre, filas) => { const txt = filas.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/csv' })); a.download = nombre + '.csv'; a.click(); toast('Archivo descargado', 'copy'); };

  /* ================= INICIO ================= */
  /* primeros pasos: guía al dueño nuevo hasta tener su negocio listo */
  function pasos(t) {
    const P = [
      ['Sube tu logo y portada', !!(t.logo || t.portada), 'ajustes'],
      ['Revisa tus servicios y precios', S.services(tid).some(x => x.editado) || !t.modoInicio, 'catalogo'],
      ['Agrega a tu equipo con su foto', S.staff(tid).some(m => m.foto), 'equipo'],
      ['Comparte tu link en Instagram y WhatsApp', !!t.compartido, 'compartir'],
      ['Recibe tu primera reserva', S.bookings(tid).some(b => b.origen === 'app'), ''],
    ];
    const hechos = P.filter(x => x[1]).length; if (hechos === P.length && !t.modoInicio) return '';
    return `<div class="card glass in" style="margin-bottom:14px"><div class="row sp wrapx"><div><div class="xs mut">Primeros pasos · ${hechos} de ${P.length}</div><h3 style="margin-top:2px">${hechos === P.length ? '¡Tu negocio está listo! 🎉' : 'Deja tu negocio listo en 10 minutos'}</h3></div>${t.modoInicio ? `<button class="btn ghost sm" data-a="modo">Ver todo el sistema</button>` : ''}</div>
      <div class="bar-c"><i style="width:${hechos / P.length * 100}%"></i></div>
      <div class="grid g3 rsp" style="margin-top:12px;gap:8px">${P.map(([l, ok, k]) => `<${k ? `a href="${k === 'compartir' ? '#' : `#/s/${t.slug}/panel/${k}`}" ${k === 'compartir' ? 'data-a="compartir"' : ''}` : 'div'} class="row sm" style="gap:8px;text-decoration:none;padding:8px 10px;border-radius:12px;background:var(--surf);border:1px solid var(--line);${ok ? 'opacity:.6' : ''}"><span class="av r" style="width:24px;height:24px;font-size:11px;${ok ? '--c:var(--ok);color:#fff' : '--c:var(--card2)'}">${ok ? ic('check', 13) : ''}</span><span class="g" style="${ok ? 'text-decoration:line-through' : 'font-weight:600'}">${l}</span></${k ? 'a' : 'div'}>`).join('')}</div></div>`;
  }
  /* tu mes contra el mes pasado: ventas acumuladas día a día, proyección y comparación */
  function mesVsMes() {
    const hoy = new Date(); const d = hoy.getDate(); const y = hoy.getFullYear(), mo = hoy.getMonth();
    const ini = new Date(y, mo, 1), iniP = new Date(y, mo - 1, 1), diasMes = new Date(y, mo + 1, 0).getDate(), diasP = new Date(y, mo, 0).getDate();
    const porDia = (base, n) => { const a = Array(n).fill(0); S.sales(tid).forEach(v => { const f = S.parse(v.fecha); if (f.getFullYear() === base.getFullYear() && f.getMonth() === base.getMonth()) a[f.getDate() - 1] += v.sub; }); return a; };
    const acum = a => a.reduce((o, x, i) => (o.push((o[i - 1] || 0) + x), o), []);
    const A = acum(porDia(ini, diasMes)).slice(0, d), B = acum(porDia(iniP, diasP));
    const ya = A[d - 1] || 0, antes = B[Math.min(d, diasP) - 1] || 0, totP = B[diasP - 1] || 0;
    const pct = antes ? Math.round((ya - antes) / antes * 100) : 0; const proy = d ? ya / d * diasMes : 0;
    const mP = S.metricas(tid, S.ymd(iniP), S.ymd(new Date(y, mo - 1, Math.min(d, diasP) + 1))), mA = S.metricas(tid, S.ymd(ini), S.ymd(S.addDays(hoy, 1)));
    const nuevos = base => S.clients(tid).filter(c => { const f = S.parse(c.creado); return f >= base && f < new Date(base.getFullYear(), base.getMonth(), d + 1); }).length;
    const nA = nuevos(ini), nP = nuevos(iniP);
    const W = 640, H = 210, pl = 6, pr = 6, pt = 14, pb = 26, mx = Math.max(1, proy, totP) * 1.08; const X = i => pl + i / 30 * (W - pl - pr), Y = v => pt + (1 - v / mx) * (H - pt - pb);
    const linea = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    const pathA = linea(A), area = pathA + `L${X(A.length - 1).toFixed(1)},${Y(0)}L${X(0)},${Y(0)}Z`;
    const proyL = `M${X(d - 1).toFixed(1)},${Y(ya).toFixed(1)}L${X(diasMes - 1).toFixed(1)},${Y(proy).toFixed(1)}`;
    const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const cmp = (a, b, fmt = x => x) => { const p = b ? Math.round((a - b) / b * 100) : 0; return `<span class="cmp ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}%</span><div class="xs mut">vs ${fmt(b)} el mes pasado</div>`; };
    return `<div class="card flat in2 mvm" style="margin-top:12px"><div class="row sp wrapx" style="align-items:flex-start"><div><div class="xs mut">Tu mes vs el mes pasado · al día ${d}</div><h3 style="font-size:22px;margin-top:2px">${S.money(ya)} en ${MES[mo]} <span class="cmp ${pct >= 0 ? 'up' : 'down'}" style="font-size:14px">${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}%</span></h3><div class="sm mut">A esta fecha de ${MES[(mo + 11) % 12]} llevabas ${S.money(antes)}. ${pct >= 0 ? '¡Vas mejor! 🔥' : 'Aún puedes alcanzarlo: lanza una promo o escríbele a tus inactivos.'}</div></div>
      <div class="row" style="gap:14px"><span class="xs row" style="gap:6px"><i class="lg-a"></i>${MES[mo]}</span><span class="xs row" style="gap:6px"><i class="lg-b"></i>${MES[(mo + 11) % 12]}</span><span class="xs row" style="gap:6px"><i class="lg-c"></i>proyección</span></div></div>
      <svg viewBox="0 0 ${W} ${H}" class="mvm-svg" preserveAspectRatio="none"><defs><linearGradient id="mvA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--brand)" stop-opacity=".35"/><stop offset="1" stop-color="var(--brand)" stop-opacity="0"/></linearGradient><linearGradient id="mvL" x1="0" x2="1"><stop offset="0" stop-color="var(--brand2)"/><stop offset="1" stop-color="var(--brand)"/></linearGradient></defs>
        ${[.25, .5, .75, 1].map(k => `<line x1="${pl}" x2="${W - pr}" y1="${Y(mx / 1.08 * k)}" y2="${Y(mx / 1.08 * k)}" class="gl"/><text x="${W - pr}" y="${Y(mx / 1.08 * k) - 4}" text-anchor="end" class="gt">${S.money(Math.round(mx / 1.08 * k))}</text>`).join('')}
        <path d="${linea(B)}" class="lb"/><path d="${proyL}" class="lc"/><path d="${area}" fill="url(#mvA)" class="la-area"/><path d="${pathA}" class="la" pathLength="1"/>
        <circle cx="${X(d - 1)}" cy="${Y(ya)}" r="6" class="dot-hoy"/><circle cx="${X(d - 1)}" cy="${Y(ya)}" r="6" class="dot-pulse"/>
        ${[1, 8, 15, 22, 29].map(n => `<text x="${X(n - 1)}" y="${H - 6}" class="gt" text-anchor="middle">${n}</text>`).join('')}</svg>
      <div class="grid g4 mvm-k"><div><div class="xs mut">Proyección del mes</div><div class="b" style="font-size:18px">${S.money(Math.round(proy))}</div><div class="xs mut">${MES[(mo + 11) % 12]} cerró en ${S.money(totP)}</div></div>
        <div><div class="xs mut">Citas atendidas</div><div class="b" style="font-size:18px">${mA.completadas}</div>${cmp(mA.completadas, mP.completadas)}</div>
        <div><div class="xs mut">Clientes nuevos</div><div class="b" style="font-size:18px">${nA}</div>${cmp(nA, nP)}</div>
        <div><div class="xs mut">Ticket promedio</div><div class="b" style="font-size:18px">${S.money(mA.completadas ? ya / mA.completadas : 0)}</div>${cmp(mA.completadas ? ya / mA.completadas : 0, mP.completadas ? antes / mP.completadas : 0, S.money)}</div></div></div>`;
  }
  function inicio() {
    const t = T(); const hoy = S.ymd(new Date()), man = S.ymd(S.addDays(new Date(), 1));
    const mh = S.metricas(tid, hoy, man); const mes = hoy.slice(0, 7) + '-01';
    const mm = S.metricas(tid, mes, man); const sem = S.metricas(tid, S.ymd(S.addDays(new Date(), -6)), man);
    const dias = Array.from({ length: 14 }, (_, i) => S.addDays(new Date(), i - 13)); const ing = dias.map(d => S.sales(tid).filter(v => v.fecha.startsWith(S.ymd(d))).reduce((a, v) => a + v.sub, 0)); const mx = Math.max(1, ...ing);
    const pend = S.activas(tid).filter(b => b.inicio.startsWith(hoy) && !['completada', 'no-show'].includes(b.estado)).sort((a, b) => a.inicio.localeCompare(b.inicio));
    const llegaron = pend.filter(b => b.estado === 'llegó');
    const nuevas = S.bookings(tid).filter(b => b.origen === 'app').sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, 5);
    const topS = cuenta(S.bookings(tid).filter(b => b.inicio >= mes && b.estado === 'completada').flatMap(b => b.items)).slice(0, 5);
    const topM = S.staff(tid).map(m => [m, S.sales(tid).filter(v => v.staffId === m.id && v.fecha >= mes).reduce((a, v) => a + v.sub, 0)]).sort((a, b) => b[1] - a[1]);
    const gastos = S.expenses(tid).filter(x => x.fecha >= mes).reduce((a, x) => a + x.monto, 0);
    const bajo = S.products(tid).filter(p => p.stock <= (p.minimo || 0));
    const rt = S.reviews(tid); const prom = rt.length ? rt.reduce((a, r) => a + r.estrellas, 0) / rt.length : 0;
    const h = new Date().getHours(); const sal = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    const alertas = [
      llegaron.length && [`🟢 ${llegaron.length} cliente${llegaron.length > 1 ? 's' : ''} ya llegó`, llegaron.map(b => S.client(b.cid)?.nombre.split(' ')[0]).join(', '), 'agenda'],
      S.esperaFila(tid).length && [`👥 ${S.esperaFila(tid).length} en la fila sin cita`, 'Asígnales un profesional', 'fila'],
      bajo.length && [`📦 ${bajo.length} producto${bajo.length > 1 ? 's' : ''} por agotarse`, bajo.map(p => p.nombre).join(', '), 'catalogo'],
      S.waitlist(tid).length && [`🔔 ${S.waitlist(tid).length} en lista de espera`, 'Avísales si se libera un espacio', 'marketing'],
    ].filter(Boolean);
    layout(`${head(`${sal} ✦`, fechaL(new Date()) + ' · ' + esc(t.nombre), `<a class="btn ghost sm" href="#/s/${t.slug}" target="_blank">${ic('link', 16)} Mi app</a><button class="btn sm" data-a="compartir">${ic('qr', 16)} Compartir link</button>`)}
      ${pasos(t)}
      ${alertas.length ? `<div class="scroll-x in" style="margin:0 -18px 12px;padding-bottom:4px">${alertas.map(([a, b, s]) => `<a class="card flat" href="#/s/${t.slug}/panel/${s}" style="min-width:240px;text-decoration:none;border-left:3px solid var(--brand)"><div class="b sm">${a}</div><div class="xs mut">${esc(b)}</div></a>`).join('')}</div>` : ''}
      <div class="grid g4 stagger">
        <div class="kpi tilt"><div class="l">Vendido hoy</div><div class="v pop" data-n="${mh.ingresos}" data-pre="$">0</div><div class="xs mut">${mh.completadas} servicios</div></div>
        <div class="kpi tilt"><div class="l">Citas hoy</div><div class="v pop" data-n="${mh.citas - mh.cancel}">0</div><div class="xs mut">${pend.length} por atender</div></div>
        <div class="kpi tilt"><div class="l">Vendido en el mes</div><div class="v pop grad-t" data-n="${mm.ingresos}" data-pre="$">0</div><div class="xs mut">Ganancia aprox. ${S.money(mm.ingresos - gastos)}</div></div>
        <div class="kpi tilt"><div class="l">Reputación</div><div class="v pop">${prom.toFixed(1)}</div><div class="xs">${estrellas(prom, 13)} <span class="mut">${rt.length}</span></div></div>
      </div>
      ${mesVsMes()}
      <div class="grid rsp" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);margin-top:12px">
        <div class="card flat in2"><div class="row sp"><h3>Ventas · últimos 14 días</h3><span class="pill">${S.money(ing.reduce((a, b) => a + b, 0))}</span></div>
          <div class="bars">${ing.map((v, i) => `<div class="bw" title="${S.money(v)}"><div class="bar ${i === 13 ? 'hoy' : ''}" style="height:${Math.max(2, v / mx * 100)}%;animation-delay:${i * .04}s"></div><small>${dias[i].getDate()}</small></div>`).join('')}</div></div>
        <div class="card flat in3 c"><h3 style="text-align:left">Ocupación · 7 días</h3><div class="ring-kpi" style="--p:${Math.round(sem.ocupacion * 100)};margin:16px auto 8px"><div><div style="font-size:28px;font-weight:700">${Math.round(sem.ocupacion * 100)}%</div><div class="xs mut">de la agenda</div></div></div>
          <p class="xs mut" style="margin:0">${sem.ocupacion < .6 ? 'Hay espacio: lanza una oferta en Marketing → Día flojo.' : 'Agenda sana. Sube precios en tus horas pico.'}</p></div>
      </div>
      <div class="grid g3 rsp" style="margin-top:12px">
        <div class="card flat in3"><div class="row sp"><h3>Por atender hoy</h3><a class="xs mut" href="#/s/${t.slug}/panel/agenda">Agenda →</a></div>${pend.length ? pend.slice(0, 6).map(b => `<div class="li" data-b="${b.id}" style="cursor:pointer"><div style="width:58px" class="b sm">${h12(b.inicio.slice(11))}</div><div class="g"><div class="sm b">${esc(S.client(b.cid)?.nombre)}</div><div class="xs mut">${esc(S.service(b.items[0])?.nombre)} · ${esc(S.member(b.staffId)?.nombre)}</div></div><span class="pill ${b.estado === 'llegó' ? 'ok' : ''}">${b.estado}</span></div>`).join('') : '<div class="empty">Todo atendido ✦</div>'}</div>
        <div class="card flat in4"><h3>Servicios estrella del mes</h3>${topS.map(([sid, n], i) => `<div class="li"><div class="av" style="width:32px;height:32px;font-size:12px">${i + 1}</div><div class="g sm">${esc(S.service(sid)?.nombre)}</div><span class="b sm">${n}</span></div>`).join('')}</div>
        <div class="card flat in4"><h3>Tu equipo este mes</h3>${topM.map(([m, v]) => `<div class="li">${avatar(m, 'r', 'width:34px;height:34px;font-size:12px')}<div class="g"><div class="sm b">${esc(m.nombre)}</div><div style="height:6px;border-radius:9px;background:var(--card2);margin-top:6px;overflow:hidden"><div style="height:100%;width:${topM[0][1] ? v / topM[0][1] * 100 : 0}%;background:${m.color};border-radius:9px;animation:grow 1s both"></div></div></div><span class="b sm">${S.money(v)}</span></div>`).join('')}</div>
      </div>
      <div class="card flat in4" style="margin-top:12px"><div class="row sp"><h3>${ic('bolt', 18)} Reservas desde tu app</h3><span class="pill"><i class="dot"></i> En vivo</span></div>${nuevas.length ? nuevas.map(b => `<div class="li" data-b="${b.id}" style="cursor:pointer"><div class="av r" style="width:34px;height:34px;font-size:12px">${esc(ini(S.client(b.cid)?.nombre))}</div><div class="g"><div class="sm"><b>${esc(S.client(b.cid)?.nombre)}</b> reservó ${esc(S.service(b.items[0])?.nombre)}</div><div class="xs mut">${fechaL(S.parse(b.inicio))} · ${h12(b.inicio.slice(11))}</div></div></div>`).join('') : '<p class="mut sm">Cuando tus clientes reserven por tu link, aparecen aquí al instante.</p>'}</div>`);
  }

  /* ================= AGENDA ================= */
  function agenda() {
    const t = T(); const sucs = t.sucursales || []; const ms = S.staff(tid).filter(m => st.suc === 'todas' || (m.sucursal || 'principal') === st.suc); const f = S.parse(st.dia + 'T00:00');
    const hs = Object.values(t.horario).flat(); const a0 = Math.min(...hs.map(x => S.toMin(x[0])), 540), a1 = Math.max(...hs.map(x => S.toMin(x[1])), 1140);
    const H = 64 / 30; const bs = S.bookings(tid).filter(b => b.inicio.startsWith(st.dia) && b.estado !== 'cancelada'); const filas = (a1 - a0) / 30;
    const cierre = (t.cierres || []).find(c => c.fecha === st.dia);
    layout(`${head('Agenda', `${fechaL(f)} · ${bs.length} citas${cierre ? ' · 🔒 ' + esc(cierre.motivo) : ''}`, `${sucs.length > 1 ? `<select data-sucsel style="width:auto;padding:9px 12px"><option value="todas">Todas las sucursales</option>${sucs.map(s => `<option value="${s.id}" ${st.suc === s.id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select>` : ''}<button class="ico" data-dd="-1">${ic('back')}</button><input type="date" value="${st.dia}" data-fecha style="width:auto;padding:9px 12px"><button class="ico" data-dd="1">${ic('next')}</button><button class="btn ghost sm" data-dd="0">Hoy</button><button class="btn sm" data-a="nueva">${ic('plus', 16)} Cita</button>`)}
      <div class="agenda in2" id="ag" style="grid-template-columns:58px repeat(${ms.length},minmax(150px,1fr))">
        <div class="hcol"><div class="hd" style="height:56px"></div>${Array.from({ length: filas }, (_, i) => `<div class="hl">${(a0 + i * 30) % 60 === 0 ? h12(S.fromMin(a0 + i * 30)).replace(':00', '') : ''}</div>`).join('')}</div>
        ${ms.map(m => `<div style="position:relative" data-col="${m.id}"><div class="hd" style="height:56px">${avatar(m, 'r', 'width:30px;height:30px;font-size:11px')}<div><div>${esc(m.nombre)}</div><div class="xs mut" style="font-weight:400">${bs.filter(b => b.staffId === m.id).length} citas</div></div></div>
          <div style="position:relative" class="colb">${Array.from({ length: filas }, (_, i) => `<div class="cell" data-slot="${m.id}|${S.fromMin(a0 + i * 30)}"></div>`).join('')}
          ${(m.bloqueos || []).filter(x => x.fecha === st.dia).map(x => `<div class="ev" style="top:${(S.toMin(x.desde) - a0) * H}px;height:${(S.toMin(x.hasta) - S.toMin(x.desde)) * H}px;left:4px;right:4px;--c:repeating-linear-gradient(45deg,#F1F0EC,#F1F0EC 6px,#fff 6px,#fff 12px);color:var(--mut);cursor:default;border:1px dashed var(--line2)">🔒 ${esc(x.motivo || 'Bloqueado')}</div>`).join('')}
          ${bs.filter(b => b.staffId === m.id).map(b => `<div class="ev ${b.estado === 'completada' ? 'done' : ''} ${b.estado === 'no-show' ? 'ns' : ''}" data-b="${b.id}" style="top:${(S.toMin(b.inicio.slice(11)) - a0) * H}px;height:${b.dur * H - 3}px;left:4px;right:4px;--c:linear-gradient(135deg,color-mix(in srgb,${m.color} 22%,#fff),color-mix(in srgb,${m.color} 12%,#fff));border-left:4px solid ${m.color}"><b>${b.estado === 'llegó' ? '🟢 ' : ''}${esc(S.client(b.cid)?.nombre)}</b>${h12(b.inicio.slice(11))} · ${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}${b.origen === 'app' ? ' · 📱' : ''}</div>`).join('')}
          </div></div>`).join('')}
      </div><p class="xs dim" style="margin-top:10px">Toca una cita para cobrar o cambiarla. Arrástrala para moverla de hora o de profesional. Toca un espacio vacío para crear una cita.</p>`);
    if (st.dia === S.ymd(new Date())) { const n = new Date(); const mm = n.getHours() * 60 + n.getMinutes(); if (mm > a0 && mm < a1) $$('.colb', el).forEach(c => { const d = document.createElement('div'); d.className = 'now'; d.style.top = (mm - a0) * H + 'px'; c.append(d); }); }
    arrastrar(a0, H);
    $('[data-fecha]', el).onchange = e => { st.dia = e.target.value; agenda(); };
    const ss = $('[data-sucsel]', el); if (ss) ss.onchange = e => { st.suc = e.target.value; agenda(); };
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
        if (S.libre(tid, sid, ini0, b.dur, b.id)) { S.saveBooking({ id: b.id, inicio: ini0, staffId: sid }); S.msg(tid, { cid: b.cid, bid: b.id, tipo: 'Cambio de hora', texto: `Hola ${S.client(b.cid)?.nombre.split(' ')[0]}, movimos tu cita a las ${S.fromMin(nueva)} con ${S.member(sid).nombre}. ¿Te queda bien?` }); toast(`Movida a ${h12(S.fromMin(nueva))} · ${S.member(sid).nombre} (cliente avisado)`, 'cal'); }
        else { agenda(); toast('Ese espacio está ocupado o fuera de horario', 'x'); }
      };
    });
  }
  function cita(id) {
    const b = S.booking(id); const c = S.client(b.cid); const m = S.member(b.staffId); const t = T();
    const paq = S.cpackages(tid).filter(k => k.cid === c.id && k.restantes > 0);
    sheet(`<div class="row">${avatar(c, 'lg r')}<div class="g"><h2>${esc(c.nombre)}</h2><div class="mut sm">${esc(c.tel)}${c.membresia ? ' · 💎 ' + esc(c.membresia) : ''}</div></div><span class="pill ${b.estado === 'llegó' ? 'ok' : ''}">${b.estado}</span></div>
      <div class="card flat" style="margin-top:14px"><div class="b">${fechaL(S.parse(b.inicio))} · ${h12(b.inicio.slice(11))}</div><div class="mut sm">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}${(b.extras || []).length ? ' + ' + S.extrasDe(tid).filter(e => b.extras.includes(e.id)).map(e => esc(e.nombre)).join(', ') : ''} · ${durL(b.dur)} · con ${esc(m.nombre)}</div>
        <div class="row sp" style="margin-top:8px"><span class="xs mut">Código ${esc(b.codigo)} · vino de ${esc(b.origen)}${b.cupon ? ' · cupón ' + esc(b.cupon) : ''}</span><span class="b">${S.money(b.total)}</span></div>${b.pago?.pagado ? `<div class="xs" style="color:var(--ok);margin-top:4px">Pagado: ${S.money(b.pago.pagado)} (${esc(b.pago.metodo)})</div>` : ''}${b.nota ? `<div class="sm" style="margin-top:6px">📝 ${esc(b.nota)}</div>` : ''}${c.notas ? `<div class="sm" style="margin-top:6px">📌 ${esc(c.notas)}</div>` : ''}${paq.length ? `<div class="xs" style="margin-top:6px">🎟️ Tiene paquete: ${esc(paq[0].nombre)} (${paq[0].restantes} restantes)</div>` : ''}</div>
      <div class="grid g2" style="margin-top:12px">
        ${b.estado !== 'completada' ? `<button class="btn" data-x="cobrar">${ic('cash', 17)} Cobrar</button>${b.estado === 'confirmada' ? `<button class="btn ok" data-x="llegó">${ic('check', 17)} Llegó</button>` : `<button class="btn ok" data-x="en curso">${ic('play', 15)} En curso</button>`}` : ''}
        <a class="btn ghost" target="_blank" href="${wa(c.tel, `Hola ${c.nombre.split(' ')[0]} 👋 Te recordamos tu cita en ${t.nombre} el ${fechaL(S.parse(b.inicio))} a las ${h12(b.inicio.slice(11))}. ¿Nos confirmas? ✦`)}">${ic('wa', 17)} Recordar</a>
        <button class="btn ghost" data-x="ficha">${ic('user', 16)} Ficha</button>
        ${b.estado !== 'completada' ? `<button class="btn danger" data-x="no-show">No vino</button><button class="btn danger" data-x="cancelada">${ic('x', 16)} Cancelar</button>` : ''}</div>`);
    $$('[data-x]').forEach(x => x.onclick = () => { const k = x.dataset.x; if (k === 'cobrar') return cobrar(id); if (k === 'ficha') return ficha(c.id); S.estado(id, k);
      if (k === 'cancelada') S.msg(tid, { cid: c.id, bid: id, tipo: 'Cancelación', texto: `Hola ${c.nombre.split(' ')[0]}, tu cita del ${fechaL(S.parse(b.inicio))} quedó cancelada. ¿Te buscamos otra hora? 👉 ${location.href.split('#')[0]}#/s/${t.slug}` });
      closeSheet(); toast({ cancelada: 'Cita cancelada (cliente avisado)', 'no-show': 'Marcada: no vino', 'llegó': 'Llegada registrada', 'en curso': 'En curso' }[k]); });
  }
  function nueva(pre = {}) {
    sheet(`<h2>Nueva cita</h2><div class="field"><label>Cliente</label><input id="n-n" list="dl-c" placeholder="Nombre" autofocus><datalist id="dl-c">${S.clients(tid).slice(0, 400).map(c => `<option value="${esc(c.nombre)}">`).join('')}</datalist></div>
      <div class="field"><label>WhatsApp</label><input id="n-t" type="tel" placeholder="6000-0000"></div>
      <div class="field"><label>Servicio</label><select id="n-s">${S.services(tid).map(s => `<option value="${s.id}">${esc(s.nombre)} · ${durL(s.dur)} · ${S.money(s.precio)}</option>`).join('')}</select></div>
      <div class="grid g2"><div class="field"><label>Profesional</label><select id="n-m">${S.staff(tid).map(m => `<option value="${m.id}" ${pre.m === m.id ? 'selected' : ''}>${esc(m.nombre)}</option>`).join('')}</select></div><div class="field"><label>Hora</label><input id="n-h" type="time" step="900" value="${pre.h || '10:00'}"></div></div>
      <div class="grid g2"><div class="field"><label>Día</label><input id="n-d" type="date" value="${st.dia}"></div><div class="field"><label>Repetir</label><select id="n-r"><option value="0">No repetir</option><option value="14">Cada 2 semanas</option><option value="21">Cada 3 semanas</option><option value="28">Cada 4 semanas</option></select></div></div>
      <button class="btn w" id="n-ok">${ic('check', 18)} Guardar y avisar al cliente</button>`);
    $('#n-n').oninput = e => { const c = S.clients(tid).find(x => x.nombre === e.target.value); if (c) $('#n-t').value = c.tel; };
    $('#n-ok').onclick = () => { try { const nom = $('#n-n').value.trim(); if (!nom) return toast('Falta el nombre', 'user');
      const cada = +$('#n-r').value; let ok = 0, nok = 0;
      for (let k = 0; k < (cada ? 6 : 1); k++) { const f = S.ymd(S.addDays(S.parse($('#n-d').value + 'T00:00'), k * cada)); try { S.crearCita(tid, { items: [$('#n-s').value], staffId: $('#n-m').value, inicio: `${f}T${$('#n-h').value}`, cliente: { nombre: nom, tel: $('#n-t').value }, origen: 'recepción', nota: cada ? 'Cita fija' : '' }); ok++; } catch (e) { if (!k) throw e; nok++; } }
      closeSheet(); toast(cada ? `${ok} citas fijas creadas${nok ? ` (${nok} chocaban y se omitieron)` : ''}` : 'Cita creada y confirmación enviada'); } catch (e) { toast(e.message, 'x'); } };
  }

  /* ================= FILA ================= */
  function fila() {
    const t = T(); const hoy = S.ymd(new Date()); const w = S.esperaFila(tid); const at = S.queue(tid).filter(q => q.estado === 'atendiendo' && q.creado.startsWith(hoy)); const listos = S.queue(tid).filter(q => q.estado === 'listo' && q.creado.startsWith(hoy)).length;
    layout(`${head('Fila sin cita', 'Clientes que llegan sin reservar. Cada uno ve su turno en vivo en el celular.', `<a class="btn ghost sm" href="#/s/${t.slug}/tv" target="_blank">${ic('play', 15)} Pantalla TV</a><button class="btn sm" data-a="qadd">${ic('plus', 16)} Agregar a la fila</button>`)}
      <div class="grid g3 stagger"><div class="kpi"><div class="l">Esperando</div><div class="v" data-n="${w.length}">0</div></div><div class="kpi"><div class="l">Atendiendo</div><div class="v" data-n="${at.length}">0</div></div><div class="kpi"><div class="l">Atendidos hoy</div><div class="v" data-n="${listos}">0</div></div></div>
      <div class="grid g2 rsp" style="margin-top:12px"><div class="card flat in2"><h3>En espera</h3>${w.length ? w.map(q => `<div class="li"><div class="av" style="width:44px;height:44px">#${q.numero}</div><div class="g"><div class="b sm">${esc(q.nombre)}</div><div class="xs mut">${esc(S.service(q.servicio)?.nombre || '')} · espera ~${q.min} min</div></div><select data-asig="${q.id}" style="width:auto;padding:8px"><option value="">Asignar…</option>${S.staff(tid).map(m => `<option value="${m.id}">${esc(m.nombre)}</option>`).join('')}</select></div>`).join('') : '<div class="empty">Nadie esperando ✦</div>'}</div>
      <div class="card flat in3"><h3>Atendiendo ahora</h3>${at.length ? at.map(q => `<div class="li"><div class="av" style="width:44px;height:44px">#${q.numero}</div><div class="g"><div class="b sm">${esc(q.nombre)}</div><div class="xs mut">con ${esc(S.member(q.staffId)?.nombre)}</div></div><button class="btn sm" data-qok="${q.id}">Terminar y cobrar</button></div>`).join('') : '<div class="empty">—</div>'}
        <hr><h3>Estado del equipo</h3>${S.staff(tid).map(m => `<div class="li">${avatar(m, 'r', 'width:34px;height:34px;font-size:12px')}<div class="g sm b">${esc(m.nombre)}</div><select data-mest="${m.id}" style="width:auto;padding:8px">${['disponible', 'ocupado', 'almorzando', 'fuera'].map(x => `<option ${m.estadoFila === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`).join('')}</div></div>`);
    $$('[data-asig]', el).forEach(s => s.onchange = () => { if (!s.value) return; const q = S.queue(tid).find(x => x.id === s.dataset.asig); S.guardar('queue', { id: q.id, estado: 'atendiendo', staffId: s.value }); S.msg(tid, { tipo: 'Turno', texto: `${q.nombre}, ¡es tu turno! Pasa con ${S.member(s.value).nombre}.` }); toast('Cliente avisado: es su turno'); });
    $$('[data-mest]', el).forEach(s => s.onchange = () => S.saveStaff({ id: s.dataset.mest, estadoFila: s.value }));
  }

  /* ================= CAJA ================= */
  function caja() {
    const hoy = S.ymd(new Date()); const vs = S.sales(tid).filter(v => v.fecha.startsWith(hoy));
    const por = S.bookings(tid).filter(b => b.inicio.startsWith(hoy) && ['confirmada', 'llegó', 'en curso'].includes(b.estado)).sort((a, b) => a.inicio.localeCompare(b.inicio));
    const met = METODOS.map(k => [k, vs.filter(v => v.metodo === k).reduce((a, v) => a + v.cobrado, 0)]);
    const tot = vs.reduce((a, v) => a + v.cobrado, 0), sub = vs.reduce((a, v) => a + v.sub, 0), it = vs.reduce((a, v) => a + v.itbms, 0), pr = vs.reduce((a, v) => a + (v.propina || 0), 0);
    const gas = S.expenses(tid).filter(x => x.fecha === hoy);
    layout(`${head('Caja', 'Cobros de hoy con ITBMS 7%', `<button class="btn ghost sm" data-a="canjear">${ic('qr', 16)} Canjear cupón</button><button class="btn ghost sm" data-a="venta">${ic('plus', 16)} Venta sin cita</button><button class="btn ghost sm" data-a="gasto">${ic('cash', 16)} Gasto</button><button class="btn sm" data-a="cierre">${ic('check', 16)} Cierre del día</button>`)}
      <div class="grid g4 stagger"><div class="kpi"><div class="l">Cobrado hoy</div><div class="v grad-t" data-n="${tot}" data-pre="$" data-dec="2">0</div></div>${met.slice(0, 3).map(([k, v]) => `<div class="kpi"><div class="l">${k}</div><div class="v" data-n="${v}" data-pre="$" data-dec="2">0</div></div>`).join('')}</div>
      <div class="grid g2 rsp" style="margin-top:12px"><div class="card flat in2"><h3>Por cobrar</h3>${por.length ? por.map(b => `<div class="li"><div style="width:58px" class="b sm">${h12(b.inicio.slice(11))}</div><div class="g"><div class="sm b">${esc(S.client(b.cid)?.nombre)}</div><div class="xs mut">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')} · ${esc(S.member(b.staffId)?.nombre)}</div></div><button class="btn sm" data-cob="${b.id}">${S.money(b.total * 1.07 - (b.pago?.pagado || 0))}</button></div>`).join('') : '<div class="empty">Nada pendiente</div>'}</div>
      <div class="card flat in3"><h3>Movimientos de hoy</h3>${vs.length ? vs.slice().reverse().map(v => `<div class="li"><div class="g"><div class="sm b">${esc(v.concepto || S.client(v.cid)?.nombre || 'Venta')}</div><div class="xs mut">${v.fecha.slice(11)} · ${esc(v.metodo)}${v.staffId ? ' · ' + esc(S.member(v.staffId)?.nombre || '') : ''}${v.productos?.length ? ' · ' + v.productos.map(p => p.qty + '× ' + esc(p.nombre)).join(', ') : ''}${v.gift ? ' · regalo ' + S.money(v.gift) : ''}${v.paquete ? ' · paquete' : ''}</div></div><span class="b sm">${S.money(v.cobrado)}</span></div>`).join('') : '<div class="empty">Aún no hay cobros hoy</div>'}
        ${gas.map(g => `<div class="li"><div class="g sm">💸 ${esc(g.concepto)}</div><span class="sm" style="color:var(--bad)">-${S.money(g.monto)}</span></div>`).join('')}
        <hr><div class="stat-line"><span class="mut">Ventas sin ITBMS</span><span>${S.money(sub)}</span></div><div class="stat-line"><span class="mut">ITBMS 7%</span><span>${S.money(it)}</span></div><div class="stat-line"><span class="mut">Propinas</span><span>${S.money(pr)}</span></div><div class="stat-line"><span class="mut">Transferencias</span><span>${S.money(met[3][1])}</span></div></div></div>`);
  }
  function cobrar(id, cid = null) {
    const b = id ? S.booking(id) : null; const c = b ? S.client(b.cid) : cid ? S.client(cid) : null; let met = 'Yappy'; const prods = {};
    const paq = c ? S.cpackages(tid).filter(k => k.cid === c.id && k.restantes > 0 && b && b.items.includes(k.servicio)) : [];
    const calc = () => { const d = +$('#c-d').value || 0, p = +$('#c-p').value || 0; const usaPaq = $('#c-pq')?.checked; const serv = b ? (usaPaq ? 0 : b.total) : 0;
      const vp = Object.entries(prods).reduce((a, [pid, q]) => a + S.product(pid).precio * q, 0); const sub = Math.max(0, serv + vp - d); const it = sub * S.ITBMS;
      $('#c-it').textContent = S.money(it); $('#c-pr').textContent = S.money(vp); $('#c-tot').textContent = S.money(sub + it + p - (b?.pago?.pagado || 0)); };
    sheet(`<h2>${b ? 'Cobrar · ' + esc(c?.nombre) : 'Venta sin cita'}</h2>${b ? `<div class="mut sm">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')} · ${esc(S.member(b.staffId)?.nombre)}</div>` : ''}
      ${!b ? `<div class="field" style="margin-top:12px"><label>Cliente (opcional)</label><input id="c-cli" list="dl-c2" placeholder="Nombre"><datalist id="dl-c2">${S.clients(tid).slice(0, 400).map(x => `<option value="${esc(x.nombre)}">`).join('')}</datalist></div>` : ''}
      <div class="card flat" style="margin-top:12px">${b ? `<div class="stat-line"><span>Servicios</span><span>${S.money(b.total)}</span></div>` : ''}
        ${paq.length ? `<label class="row" style="margin:8px 0;color:var(--txt)"><input type="checkbox" id="c-pq" style="width:auto"> Usar paquete (${paq[0].restantes} restantes)</label>` : ''}
        <label style="margin-top:10px">Productos</label><div class="row wrapx">${S.products(tid).filter(p => p.stock > 0).map(p => `<button class="chip" data-pr="${p.id}">${esc(p.nombre)} · ${S.money(p.precio)} <b data-q="${p.id}"></b></button>`).join('')}</div>
        <div class="stat-line" style="margin-top:8px"><span>Productos</span><span id="c-pr">$0</span></div>
        <div class="grid g3" style="margin-top:10px"><div class="field"><label>Descuento</label><input id="c-d" type="number" inputmode="decimal" value="0"></div><div class="field"><label>Propina</label><input id="c-p" type="number" inputmode="decimal" value="0"></div><div class="field"><label>Tarjeta regalo</label><input id="c-g" placeholder="Código"></div></div>
        <div class="stat-line"><span>ITBMS 7%</span><span id="c-it"></span></div>${b?.pago?.pagado ? `<div class="stat-line"><span>Depósito pagado</span><span>-${S.money(b.pago.pagado)}</span></div>` : ''}<div class="row sp" style="margin-top:8px"><span class="b">A cobrar</span><span class="b" style="font-size:26px" id="c-tot"></span></div></div>
      <div class="row wrapx" style="margin:14px 0">${METODOS.map(k => `<button class="chip g ${k === met ? 'on' : ''}" style="justify-content:center" data-met="${k}">${k}</button>`).join('')}</div><button class="btn w" id="c-ok">${ic('check', 18)} Cobrado</button>
      <p class="xs dim c" style="margin-top:8px">La factura electrónica se emite con el facturador DGI del negocio (se conecta en la versión real).</p>`);
    calc(); ['#c-d', '#c-p'].forEach(k => $(k).oninput = calc); $('#c-pq') && ($('#c-pq').onchange = calc);
    $$('[data-pr]').forEach(x => x.onclick = () => { const p = x.dataset.pr; prods[p] = ((prods[p] || 0) + 1) % (Math.min(5, S.product(p).stock) + 1); if (!prods[p]) delete prods[p]; x.classList.toggle('on', !!prods[p]); $(`[data-q="${p}"]`).textContent = prods[p] ? '×' + prods[p] : ''; calc(); });
    $$('[data-met]').forEach(x => x.onclick = () => { met = x.dataset.met; $$('[data-met]').forEach(y => y.classList.toggle('on', y === x)); });
    $('#c-ok').onclick = () => { const productos = Object.entries(prods).map(([pid, qty]) => ({ pid, qty })); if (!b && !productos.length) return toast('Agrega al menos un producto', 'x');
      let cid2 = null; if (!b && $('#c-cli').value.trim()) cid2 = S.clients(tid).find(x => x.nombre === $('#c-cli').value.trim())?.id || null;
      const r = S.cobrar(id, { metodo: met, propina: +$('#c-p').value || 0, descuento: +$('#c-d').value || 0, productos, gift: $('#c-g').value.trim(), paquete: $('#c-pq')?.checked ? paq[0].id : '', tid, cid: cid2 });
      closeSheet(); toast(`Cobrado ${S.money(r.pendiente)}${r.pagoGift ? ' (+' + S.money(r.pagoGift) + ' regalo)' : ''} ✦`); confetti([T().color2, T().color, '#0F1420']); };
  }

  /* ================= CLIENTES ================= */
  function clientes() {
    const hoy = new Date(); const lim = S.iso(S.addDays(hoy, -45)); const mesC = String(hoy.getMonth() + 1).padStart(2, '0');
    const data = S.clients(tid).map(c => { const bs = S.bookings(tid).filter(b => b.cid === c.id && b.estado === 'completada'); const ult = bs.map(b => b.inicio).sort().pop(); return { c, n: bs.length, gasto: bs.reduce((a, b) => a + b.total, 0), ult, ns: S.bookings(tid).filter(b => b.cid === c.id && b.estado === 'no-show').length }; });
    const segs = { todos: () => true, vip: x => x.n >= 12, inactivos: x => x.ult && x.ult < lim, cumple: x => (x.c.cumple || '').slice(5, 7) === mesC, nuevos: x => x.n <= 1, miembros: x => !!x.c.membresia, plantones: x => x.ns >= 2 };
    const lista = data.filter(segs[st.seg]).filter(x => !st.q || (x.c.nombre + x.c.tel + (x.c.etiquetas || '')).toLowerCase().includes(st.q.toLowerCase())).sort((a, b) => b.gasto - a.gasto);
    layout(`${head('Clientes', `${data.length} clientes · ${data.filter(segs.inactivos).length} no vuelven hace +45 días`, `<button class="btn ghost sm" data-a="importar">${ic('plus', 15)} Importar lista</button><button class="btn ghost sm" data-a="exportar">${ic('copy', 15)} Exportar</button><button class="btn sm" data-a="ncli">${ic('plus', 16)} Nuevo cliente</button>`)}
      <div class="row in" style="margin-bottom:12px"><div class="g" style="position:relative"><input id="q" placeholder="Buscar por nombre, teléfono o etiqueta" value="${esc(st.q)}" style="padding-left:42px"><span style="position:absolute;left:14px;top:13px;color:var(--mut)">${ic('search', 18)}</span></div></div>
      <div class="scroll-x in2" style="margin:0 0 14px">${[['todos', 'Todos'], ['vip', '⭐ VIP'], ['miembros', '💎 Miembros'], ['inactivos', '💤 No vuelven'], ['cumple', '🎂 Cumplen este mes'], ['nuevos', '🆕 Nuevos'], ['plantones', '⚠️ Plantones']].map(([k, l]) => `<button class="chip ${st.seg === k ? 'on' : ''}" data-seg="${k}">${l} · ${data.filter(segs[k]).length}</button>`).join('')}</div>
      <div class="card flat pad0 in3"><table class="t"><thead><tr><th>Cliente</th><th>Visitas</th><th>Gastó</th><th class="hide-m">Última</th><th></th></tr></thead><tbody>
      ${lista.slice(0, 150).map(x => `<tr data-c="${x.c.id}" style="cursor:pointer"><td><div class="row">${avatar(x.c, 'r', 'width:34px;height:34px;font-size:12px')}<div><div class="b">${esc(x.c.nombre)}${x.c.membresia ? ' 💎' : ''}</div><div class="xs mut">${esc(x.c.tel)}${x.c.etiquetas ? ' · ' + esc(x.c.etiquetas) : ''}</div></div></div></td><td>${x.n}</td><td>${S.money(x.gasto)}</td><td class="mut hide-m">${x.ult ? Math.round((hoy - S.parse(x.ult)) / 864e5) + ' días' : '—'}</td><td><a class="ico" target="_blank" href="${wa(x.c.tel, `Hola ${x.c.nombre.split(' ')[0]} 👋`)}" onclick="event.stopPropagation()">${ic('wa', 18)}</a></td></tr>`).join('')}
      </tbody></table>${lista.length ? (lista.length > 150 ? `<p class="xs mut c">Mostrando 150 de ${lista.length}. Usa la búsqueda.</p>` : '') : '<div class="empty">Sin resultados</div>'}</div>`);
    const q = $('#q'); q.oninput = () => { st.q = q.value; const p = q.selectionStart; clientes(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); };
  }
  function editCliente(id = null) {
    const c = id ? S.client(id) : { nombre: '', tel: '', email: '', cumple: '', notas: '', etiquetas: '' };
    sheet(`<h2>${id ? 'Editar' : 'Nuevo'} cliente</h2><div class="field"><label>Nombre</label><input id="e-n" value="${esc(c.nombre)}" autofocus></div><div class="grid g2"><div class="field"><label>WhatsApp</label><input id="e-t" type="tel" value="${esc(c.tel)}"></div><div class="field"><label>Correo</label><input id="e-e" type="email" value="${esc(c.email || '')}"></div></div>
      <div class="grid g2"><div class="field"><label>Cumpleaños</label><input id="e-c" type="date" value="${esc(c.cumple || '')}"></div><div class="field"><label>Etiquetas</label><input id="e-g" value="${esc(c.etiquetas || '')}" placeholder="VIP, alérgica al tinte…"></div></div>
      <div class="field"><label>Notas</label><textarea id="e-o" rows="2">${esc(c.notas || '')}</textarea></div><button class="btn w" id="e-ok">Guardar</button>`);
    $('#e-ok').onclick = () => { const n = $('#e-n').value.trim(); if (!n) return toast('Falta el nombre', 'user');
      const d = { nombre: n, tel: $('#e-t').value.trim(), email: $('#e-e').value.trim(), cumple: $('#e-c').value, etiquetas: $('#e-g').value.trim(), notas: $('#e-o').value };
      if (id) S.saveClient({ id, ...d }); else S.guardar('clients', { tid, ...d, creado: S.iso(new Date()), sellos: 0, premios: 0 }); closeSheet(); toast('Cliente guardado'); };
  }
  function importar() {
    sheet(`<h2>Importar clientes</h2><p class="mut sm">Pega tu lista (de Excel, Google Sheets o de tu libreta): una persona por línea, <b>nombre, teléfono</b> y opcional cumpleaños. También puedes subir un archivo .csv.</p>
      <textarea id="i-t" rows="7" placeholder="María Pérez, 6123-4567&#10;José Ríos, 6987-6543, 1990-05-12"></textarea><input type="file" id="i-f" accept=".csv,.txt" style="margin-top:10px"><button class="btn w" id="i-ok" style="margin-top:12px">Importar</button>`);
    $('#i-f').onchange = async e => { const f = e.target.files[0]; if (f) $('#i-t').value = await f.text(); };
    $('#i-ok').onclick = () => { const lineas = $('#i-t').value.split(/\r?\n/).map(l => l.split(/[,;\t]/).map(x => x.trim().replace(/^"|"$/g, ''))).filter(l => l[0] && !/^nombre$/i.test(l[0]));
      let n = 0, rep = 0; const ya = new Set(S.clients(tid).map(c => c.tel.replace(/\D/g, '').slice(-8)));
      lineas.forEach(([nombre, tel = '', cumple = '']) => { const d = tel.replace(/\D/g, '').slice(-8); if (d && ya.has(d)) { rep++; return; } ya.add(d); S.guardar('clients', { tid, nombre, tel, email: '', cumple: /^\d{4}-\d{2}-\d{2}$/.test(cumple) ? cumple : '', notas: '', etiquetas: 'importado', creado: S.iso(new Date()), sellos: 0, premios: 0 }); n++; });
      closeSheet(); toast(`${n} clientes importados${rep ? ` · ${rep} repetidos omitidos` : ''}`); };
  }
  function ficha(cid) {
    const c = S.client(cid); const t = T(); const bs = S.bookings(tid).filter(b => b.cid === cid).sort((a, b) => b.inicio.localeCompare(a.inicio));
    const comp = bs.filter(b => b.estado === 'completada'); const fav = cuenta(comp.flatMap(b => b.items))[0]; const favM = cuenta(comp.map(b => b.staffId))[0];
    const paq = S.cpackages(tid).filter(k => k.cid === cid);
    sheet(`<div class="row">${avatar(c, 'lg r')}<div class="g"><h2>${esc(c.nombre)}${c.membresia ? ' 💎' : ''}</h2><div class="mut sm">${esc(c.tel)} · cliente desde ${S.parse(c.creado).toLocaleDateString('es-PA')}</div></div><button class="ico" data-ec>${ic('edit')}</button></div>
      <div class="grid g3" style="margin-top:14px"><div class="kpi"><div class="l">Visitas</div><div class="v">${comp.length}</div></div><div class="kpi"><div class="l">Gastó</div><div class="v">${S.money(comp.reduce((a, b) => a + b.total, 0))}</div></div><div class="kpi"><div class="l">Sellos</div><div class="v">${c.sellos || 0}/${t.fidelidad?.meta || 10}</div></div></div>
      <div class="card flat" style="margin-top:12px">${fav ? `<div class="stat-line"><span class="mut">Servicio favorito</span><span>${esc(S.service(fav[0])?.nombre)}</span></div>` : ''}${favM ? `<div class="stat-line"><span class="mut">Su profesional</span><span>${esc(S.member(favM[0])?.nombre)}</span></div>` : ''}<div class="stat-line"><span class="mut">Plantones</span><span>${bs.filter(b => b.estado === 'no-show').length}</span></div>${c.membresia ? `<div class="stat-line"><span class="mut">Membresía</span><span>${esc(c.membresia)}</span></div>` : ''}${paq.map(k => `<div class="stat-line"><span class="mut">🎟️ ${esc(k.nombre)}</span><span>${k.restantes}/${k.total}</span></div>`).join('')}${c.etiquetas ? `<div class="stat-line"><span class="mut">Etiquetas</span><span>${esc(c.etiquetas)}</span></div>` : ''}${c.notas ? `<div class="sm" style="margin-top:8px">📌 ${esc(c.notas)}</div>` : ''}</div>
      <div class="grid g3" style="margin-top:12px"><a class="btn ghost sm" target="_blank" href="${wa(c.tel, `Hola ${c.nombre.split(' ')[0]} 👋`)}">${ic('wa', 16)} Escribir</a><button class="btn ghost sm" data-vp>${ic('gift', 15)} Vender paquete</button><button class="btn sm" data-nc>${ic('cal', 15)} Agendar</button></div>
      <h3 style="margin:18px 0 6px">Fotos antes / después</h3><div class="grid g4" id="f-fotos">${(c.fotos || []).map(f => `<div style="aspect-ratio:1;border-radius:12px;background:url(${f}) center/cover"></div>`).join('')}<label style="aspect-ratio:1;border-radius:12px;border:1.5px dashed var(--line2);display:grid;place-items:center;cursor:pointer;margin:0">${ic('plus')}<input type="file" accept="image/*" id="f-ff" hidden></label></div><p class="xs dim">Solo las ve tu equipo. Pide permiso al cliente antes de tomarlas.</p>
      <h3 style="margin:18px 0 6px">Historial</h3>${bs.slice(0, 15).map(b => `<div class="li"><div class="g"><div class="sm b">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}</div><div class="xs mut">${S.parse(b.inicio).toLocaleDateString('es-PA')} · ${esc(S.member(b.staffId)?.nombre)} · ${S.money(b.total)}</div></div><span class="pill ${b.estado === 'completada' ? 'ok' : b.estado === 'no-show' ? 'bad' : ''}">${b.estado}</span></div>`).join('') || '<p class="mut sm">Sin visitas todavía.</p>'}`);
    $('[data-ec]').onclick = () => editCliente(cid);
    $('#f-ff').onchange = async e => { try { const f = await leerImagen(e.target.files[0], 700, .72); S.saveClient({ id: cid, fotos: [...(S.client(cid).fotos || []), f].slice(-8) }); ficha(cid); toast('Foto guardada'); } catch (er) { toast('No se pudo guardar la foto', 'x'); } };
    $('[data-nc]').onclick = () => { nueva(); $('#n-n').value = c.nombre; $('#n-t').value = c.tel; };
    $('[data-vp]').onclick = () => { const ks = S.packages(tid).filter(k => k.activo); if (!ks.length) return toast('Crea un paquete en Servicios y productos', 'gift');
      sheet(`<h2>Vender paquete a ${esc(c.nombre.split(' ')[0])}</h2>${ks.map(k => `<button class="card flat w" style="text-align:left;margin-bottom:8px;cursor:pointer;width:100%" data-k="${k.id}"><div class="b">${esc(k.nombre)}</div><div class="xs mut">${k.sesiones} visitas · ${S.money(k.precio)} + ITBMS</div></button>`).join('')}`);
      $$('.sheet [data-k]').forEach(x => x.onclick = () => { S.venderPaquete(tid, { pkgId: x.dataset.k, cid, metodo: 'Yappy' }); closeSheet(); toast('Paquete vendido ✦'); confetti(); }); };
  }

  /* ================= SERVICIOS Y PRODUCTOS ================= */
  function catalogo() {
    const t = T(); let body = '';
    if (st.tab === 'servicios') { const svs = S.services(tid); const cats = [...new Set(svs.map(s => s.cat))];
      body = `<p class="mut sm" style="margin-top:-6px">Tus servicios, tus precios. Puedes poner un precio distinto para cada profesional.</p>${cats.map(k => `<h3 class="in" style="margin:16px 0 8px">${esc(k)}</h3><div class="col stagger">${svs.filter(s => s.cat === k).map(s => { const ps = Object.entries(s.precios || {}).filter(([, v]) => v !== '' && v != null); return `<div class="svc" data-s="${s.id}"><div class="g"><div class="b">${esc(s.nombre)}</div><div class="xs mut">${durL(s.dur)}${ps.length ? ' · ' + ps.map(([m, v]) => esc(S.member(m)?.nombre || '') + ' ' + S.money(+v)).join(', ') : ''}${s.oculto ? ' · oculto' : ''}</div></div><div class="b">${s.desde ? 'desde ' : ''}${S.money(s.precio)}</div>${ic('edit', 18)}</div>`; }).join('')}</div>`).join('')}
        <h3 style="margin:22px 0 8px">Extras (se agregan al reservar)</h3><div class="row wrapx">${S.extrasDe(tid).map(e => `<button class="chip" data-xe="${e.id}">${esc(e.nombre)} · ${S.money(e.precio)} · ${e.dur} min</button>`).join('')}<button class="chip" data-xe="">+ Nuevo extra</button></div>`; }
    if (st.tab === 'productos') { const ps = S.products(tid);
      body = `<div class="card flat pad0"><table class="t"><thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th class="hide-m">Vendidos</th><th class="hide-m">Margen</th></tr></thead><tbody>${ps.map(p => `<tr data-p="${p.id}" style="cursor:pointer"><td class="b">${p.emoji || '🧴'} ${esc(p.nombre)}</td><td>${S.money(p.precio)}</td><td><span class="pill ${p.stock <= (p.minimo || 0) ? 'bad' : 'ok'}">${p.stock}</span></td><td class="hide-m">${p.vendidos || 0}</td><td class="hide-m">${p.costo ? Math.round((1 - p.costo / p.precio) * 100) + '%' : '—'}</td></tr>`).join('')}</tbody></table></div><p class="xs dim">Cuando el stock llega al mínimo, te avisamos en Inicio.</p>`; }
    if (st.tab === 'paquetes') { const ks = S.packages(tid); const mem = t.membresias || [];
      body = `<h3 style="margin-bottom:8px">Paquetes (prepago)</h3><div class="grid g2 rsp">${ks.map(k => `<div class="card flat" data-k="${k.id}" style="cursor:pointer"><div class="row sp"><div class="b">🎟️ ${esc(k.nombre)}</div><span class="pill ${k.activo ? 'ok' : ''}">${k.activo ? 'activo' : 'pausado'}</span></div><div class="xs mut" style="margin-top:4px">${k.sesiones} visitas de ${esc(S.service(k.servicio)?.nombre || '')} · válido ${k.dias} días</div><div class="b" style="margin-top:6px">${S.money(k.precio)}</div><div class="xs mut">${S.cpackages(tid).filter(x => x.pkgId === k.id).length} vendidos</div></div>`).join('')}<button class="card flat c" data-k="" style="cursor:pointer;border-style:dashed">${ic('plus')} Nuevo paquete</button></div>
        <h3 style="margin:22px 0 8px">Membresías (pago mensual)</h3><div class="grid g2 rsp">${mem.map(m => `<div class="card flat" data-mb="${m.id}" style="cursor:pointer"><div class="row sp"><div class="b">💎 ${esc(m.nombre)}</div><span class="pill ${m.activa ? 'ok' : ''}">${m.activa ? 'activa' : 'pausada'}</span></div><div class="sm mut" style="margin-top:4px">${esc(m.incluye)}</div><div class="b" style="margin-top:6px">${S.money(m.precio)}/mes</div><div class="xs mut">${S.clients(tid).filter(c => c.membresia === m.nombre).length} miembros</div></div>`).join('')}<button class="card flat c" data-mb="" style="cursor:pointer;border-style:dashed">${ic('plus')} Nueva membresía</button></div>`; }
    layout(`${head('Servicios y productos', '', st.tab === 'servicios' ? `<button class="btn sm" data-a="svc">${ic('plus', 16)} Servicio</button>` : st.tab === 'productos' ? `<button class="btn sm" data-a="prod">${ic('plus', 16)} Producto</button>` : '')}${tabs([['servicios', 'Servicios'], ['productos', 'Productos'], ['paquetes', 'Paquetes y membresías']], st.tab, 'tab')}${body}`);
  }
  function editSvc(id) {
    const s = id ? S.service(id) : { id: S.uid('s'), tid, cat: S.services(tid)[0]?.cat || 'General', nombre: '', dur: 30, precio: 10, desde: false, precios: {}, desc: '' };
    sheet(`<h2>${id ? 'Editar' : 'Nuevo'} servicio</h2><div class="field"><label>Nombre</label><input id="s-n" value="${esc(s.nombre)}"></div><div class="field"><label>Descripción (opcional)</label><input id="s-ds" value="${esc(s.desc || '')}" placeholder="Qué incluye"></div><div class="field"><label>Categoría</label><input id="s-c" value="${esc(s.cat)}" list="dl-cat"><datalist id="dl-cat">${[...new Set(S.services(tid).map(x => x.cat))].map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
      <div class="grid g2"><div class="field"><label>Duración (min)</label><input id="s-d" type="number" step="5" value="${s.dur}"></div><div class="field"><label>Precio base ($, sin ITBMS)</label><input id="s-p" type="number" step="0.5" value="${s.precio}"></div></div>
      <label>Precio por profesional (vacío = precio base)</label><div class="grid g2" style="margin-bottom:10px">${S.staff(tid).map(m => `<div class="row">${avatar(m, 'r', 'width:30px;height:30px;font-size:11px')}<input data-pm="${m.id}" type="number" step="0.5" placeholder="${S.money(s.precio)}" value="${s.precios?.[m.id] ?? ''}"></div>`).join('')}</div>
      <div class="row sp" style="margin-bottom:10px"><span class="sm">Mostrar como "desde" (precio variable)</span><div class="switch ${s.desde ? 'on' : ''}" id="s-x"></div></div>
      <div class="row sp" style="margin-bottom:14px"><span class="sm">Ocultar en la app (solo recepción)</span><div class="switch ${s.oculto ? 'on' : ''}" id="s-o"></div></div>
      <div class="row">${id ? `<button class="btn danger" id="s-del">${ic('trash', 16)}</button>` : ''}<button class="btn g" id="s-ok">Guardar</button></div>`);
    ['#s-x', '#s-o'].forEach(k => $(k).onclick = e => e.currentTarget.classList.toggle('on'));
    $('#s-ok').onclick = () => { if (!$('#s-n').value.trim()) return toast('Falta el nombre', 'x'); const precios = {}; $$('[data-pm]').forEach(i => { if (i.value !== '') precios[i.dataset.pm] = +i.value; });
      S.saveService({ ...s, nombre: $('#s-n').value.trim(), desc: $('#s-ds').value.trim(), cat: $('#s-c').value.trim() || 'General', dur: +$('#s-d').value || 30, precio: +$('#s-p').value || 0, desde: $('#s-x').classList.contains('on'), oculto: $('#s-o').classList.contains('on'), precios }); closeSheet(); toast('Servicio guardado'); };
    if (id) $('#s-del').onclick = () => { S.saveService({ id, borrado: true }); closeSheet(); toast('Servicio eliminado'); };
  }
  function editExtra(id) {
    const t = T(); const e = id ? t.extras.find(x => x.id === id) : { id: S.uid('e'), nombre: '', precio: 3, dur: 5 };
    sheet(`<h2>${id ? 'Editar' : 'Nuevo'} extra</h2><div class="field"><label>Nombre</label><input id="x-n" value="${esc(e.nombre)}"></div><div class="grid g2"><div class="field"><label>Precio</label><input id="x-p" type="number" value="${e.precio}"></div><div class="field"><label>Minutos extra</label><input id="x-d" type="number" value="${e.dur}"></div></div><div class="row">${id ? `<button class="btn danger" id="x-del">${ic('trash', 16)}</button>` : ''}<button class="btn g" id="x-ok">Guardar</button></div>`);
    $('#x-ok').onclick = () => { const n = { ...e, nombre: $('#x-n').value.trim(), precio: +$('#x-p').value || 0, dur: +$('#x-d').value || 0 }; if (!n.nombre) return; S.saveTenant({ id: tid, extras: id ? t.extras.map(x => x.id === id ? n : x) : [...(t.extras || []), n] }); closeSheet(); toast('Extra guardado'); };
    if (id) $('#x-del').onclick = () => { S.saveTenant({ id: tid, extras: t.extras.filter(x => x.id !== id) }); closeSheet(); };
  }
  function editProd(id) {
    const p = id ? S.product(id) : { id: S.uid('p'), tid, nombre: '', precio: 10, costo: 5, stock: 10, minimo: 3, emoji: '🧴', vendidos: 0 };
    sheet(`<h2>${id ? 'Editar' : 'Nuevo'} producto</h2><div class="grid" style="grid-template-columns:70px 1fr;gap:10px"><div class="field"><label>Ícono</label><input id="p-e" value="${esc(p.emoji || '🧴')}" style="text-align:center;font-size:20px"></div><div class="field"><label>Nombre</label><input id="p-n" value="${esc(p.nombre)}"></div></div>
      <div class="grid g2"><div class="field"><label>Precio de venta</label><input id="p-p" type="number" step="0.5" value="${p.precio}"></div><div class="field"><label>Costo</label><input id="p-c" type="number" step="0.5" value="${p.costo || 0}"></div></div>
      <div class="grid g2"><div class="field"><label>Stock</label><input id="p-s" type="number" value="${p.stock}"></div><div class="field"><label>Avisarme al llegar a</label><input id="p-m" type="number" value="${p.minimo || 0}"></div></div>
      <div class="row">${id ? `<button class="btn danger" id="p-del">${ic('trash', 16)}</button>` : ''}<button class="btn g" id="p-ok">Guardar</button></div>`);
    $('#p-ok').onclick = () => { if (!$('#p-n').value.trim()) return; S.guardar('products', { ...p, emoji: $('#p-e').value || '🧴', nombre: $('#p-n').value.trim(), precio: +$('#p-p').value || 0, costo: +$('#p-c').value || 0, stock: +$('#p-s').value || 0, minimo: +$('#p-m').value || 0 }); closeSheet(); toast('Producto guardado'); };
    if (id) $('#p-del').onclick = () => { S.guardar('products', { id, borrado: true }); closeSheet(); };
  }
  function editPaq(id) {
    const k = id ? S.packages(tid).find(x => x.id === id) : { id: S.uid('k'), tid, nombre: '', servicio: S.services(tid)[0]?.id, sesiones: 5, precio: 50, dias: 120, activo: true };
    sheet(`<h2>${id ? 'Editar' : 'Nuevo'} paquete</h2><div class="field"><label>Nombre</label><input id="k-n" value="${esc(k.nombre)}" placeholder="Ej.: 5 cortes"></div><div class="field"><label>Servicio</label><select id="k-s">${S.services(tid).map(s => `<option value="${s.id}" ${s.id === k.servicio ? 'selected' : ''}>${esc(s.nombre)} · ${S.money(s.precio)}</option>`).join('')}</select></div>
      <div class="grid g3"><div class="field"><label>Visitas</label><input id="k-v" type="number" value="${k.sesiones}"></div><div class="field"><label>Precio</label><input id="k-p" type="number" value="${k.precio}"></div><div class="field"><label>Válido (días)</label><input id="k-d" type="number" value="${k.dias}"></div></div>
      <div class="row sp" style="margin-bottom:14px"><span class="sm">Activo (se ofrece en la app)</span><div class="switch ${k.activo ? 'on' : ''}" id="k-a"></div></div><button class="btn w" id="k-ok">Guardar</button>`);
    $('#k-a').onclick = e => e.currentTarget.classList.toggle('on');
    $('#k-ok').onclick = () => { S.guardar('packages', { ...k, nombre: $('#k-n').value.trim() || 'Paquete', servicio: $('#k-s').value, sesiones: +$('#k-v').value || 1, precio: +$('#k-p').value || 0, dias: +$('#k-d').value || 90, activo: $('#k-a').classList.contains('on') }); closeSheet(); toast('Paquete guardado'); };
  }
  function editMem(id) {
    const t = T(); const m = id ? t.membresias.find(x => x.id === id) : { id: S.uid('b'), nombre: '', precio: 30, incluye: '', activa: true };
    sheet(`<h2>${id ? 'Editar' : 'Nueva'} membresía</h2><div class="field"><label>Nombre</label><input id="mb-n" value="${esc(m.nombre)}" placeholder="Ej.: Club Corte"></div><div class="field"><label>Precio mensual</label><input id="mb-p" type="number" value="${m.precio}"></div><div class="field"><label>Qué incluye</label><textarea id="mb-i" rows="2">${esc(m.incluye)}</textarea></div>
      <div class="row sp" style="margin-bottom:14px"><span class="sm">Activa</span><div class="switch ${m.activa ? 'on' : ''}" id="mb-a"></div></div><button class="btn w" id="mb-ok">Guardar</button>`);
    $('#mb-a').onclick = e => e.currentTarget.classList.toggle('on');
    $('#mb-ok').onclick = () => { const n = { ...m, nombre: $('#mb-n').value.trim() || 'Membresía', precio: +$('#mb-p').value || 0, incluye: $('#mb-i').value.trim(), activa: $('#mb-a').classList.contains('on') }; S.saveTenant({ id: tid, membresias: id ? t.membresias.map(x => x.id === id ? n : x) : [...(t.membresias || []), n] }); closeSheet(); toast('Membresía guardada'); };
  }

  /* ================= OFERTAS Y REGALOS ================= */
  function promos() {
    const t = T(); let body = '';
    if (st.ptab === 'vendibles') { const ps = S.promos(tid), vs = S.vouchers(tid); const ing = vs.reduce((a, v) => a + v.precio, 0), pend = vs.filter(v => v.estado === 'activo').length;
      body = `${anuncio()}<div class="grid g4 stagger" style="margin-top:12px"><div class="kpi"><div class="l">Cupones vendidos</div><div class="v" data-n="${vs.length + ps.reduce((a, p) => a + Math.max(0, (p.vendidos || 0) - vs.filter(v => v.pid === p.id).length), 0)}">0</div></div><div class="kpi"><div class="l">Cobrado por promos</div><div class="v grad-t" data-n="${ps.reduce((a, p) => a + (p.vendidos || 0) * p.precio, 0)}" data-pre="$">0</div></div><div class="kpi"><div class="l">Por canjear</div><div class="v">${pend}</div></div><div class="kpi"><div class="l">Promos activas</div><div class="v">${ps.filter(S.promoDisponible).length}</div></div></div>
        <p class="mut sm" style="margin:14px 0 10px">El cliente compra la promo en tu app, recibe un cupón con código y QR, y lo canjea al llegar. Cuando se acaban los cupos, se cierra sola.</p>
        <div class="grid g3 rsp">${ps.map(p => { const q = p.cupos - (p.vendidos || 0); return `<div class="promo" data-pv="${p.id}" style="max-width:none;min-width:0"><div class="row sp"><span class="pill ${S.promoDisponible(p) ? 'ok' : ''}">${S.promoDisponible(p) ? 'Activa' : q <= 0 ? 'Agotada' : 'Pausada'}</span><span class="xs mut">${p.vence ? 'hasta ' + p.vence.slice(8) + '/' + p.vence.slice(5, 7) : ''}</span></div><div class="b" style="margin-top:8px">${esc(p.titulo)}</div><div class="row" style="gap:8px;align-items:baseline;margin-top:4px"><b style="font-size:22px">${S.money(p.precio)}</b><s class="xs dim">${S.money(p.normal)}</s></div><div class="bar-c"><i style="width:${Math.min(100, (p.vendidos || 0) / p.cupos * 100)}%"></i></div><div class="row sp xs" style="margin-top:6px"><span>${p.vendidos || 0} de ${p.cupos} vendidas</span><b>${S.money((p.vendidos || 0) * p.precio)}</b></div></div>`; }).join('')}<button class="card flat c" data-pv="" style="cursor:pointer;border-style:dashed;min-height:150px">${ic('plus', 26)}<div class="b" style="margin-top:6px">Nueva promo</div><div class="xs mut">Precio, cupos y fecha</div></button></div>
        ${vs.length ? `<h3 style="margin:20px 0 10px">Últimos cupones</h3><div class="card flat pad0"><table class="t"><thead><tr><th>Código</th><th>Cliente</th><th>Promo</th><th>Estado</th></tr></thead><tbody>${vs.slice(-12).reverse().map(v => `<tr><td class="b">${v.codigo}</td><td>${esc(S.client(v.cid)?.nombre || '')}</td><td class="sm">${esc(S.promo(v.pid)?.titulo || '')}</td><td><span class="pill ${v.estado === 'activo' ? 'br' : 'ok'}">${v.estado === 'activo' ? 'Por canjear' : 'Canjeado'}</span></td></tr>`).join('')}</tbody></table></div>` : ''}`; }
    if (st.ptab === 'ofertas') body = `<p class="mut sm" style="margin-top:-6px">Se muestran arriba en tu app y se aplican solas al reservar.</p><div class="grid g2 rsp">${S.offers(tid).map(o => `<div class="offer" data-of="${o.id}" style="cursor:pointer;min-width:0"><span class="tag">${o.tipo === 'pct' ? '-' + o.valor + '%' : '-' + S.money(o.valor)}</span><div class="b" style="padding-right:60px">${esc(o.titulo)}</div><p class="sm mut" style="margin:6px 0">${esc(o.desc)}</p><div class="row sp"><span class="xs mut">${o.vence ? 'Vence ' + o.vence : 'Sin vencimiento'}</span><span class="pill ${o.activa && (!o.vence || o.vence >= S.ymd(new Date())) ? 'ok' : ''}">${o.activa && (!o.vence || o.vence >= S.ymd(new Date())) ? 'activa' : 'inactiva'}</span></div></div>`).join('')}<button class="card flat c" data-of="" style="cursor:pointer;border-style:dashed">${ic('plus')} Nueva oferta</button></div>`;
    if (st.ptab === 'cupones') body = `<div class="card flat pad0"><table class="t"><thead><tr><th>Código</th><th>Descuento</th><th>Usos</th><th class="hide-m">Vence</th></tr></thead><tbody>${S.coupons(tid).map(c => `<tr data-cu="${c.id}" style="cursor:pointer"><td class="b">${esc(c.codigo)}<div class="xs mut">${esc(c.nota || '')}</div></td><td>${c.tipo === 'pct' ? c.valor + '%' : S.money(c.valor)}</td><td>${c.usos || 0}${c.max ? '/' + c.max : ''}</td><td class="hide-m mut">${c.vence || '—'}</td></tr>`).join('')}</tbody></table></div>
      <div class="card flat" style="margin-top:12px"><div class="row sp"><div><div class="b">💌 Programa de referidos</div><div class="xs mut">Cada cliente tiene su código: su amigo recibe ${t.referidos?.pct || 10}% y él un sello.</div></div><div class="switch ${t.referidos?.activo ? 'on' : ''}" data-a="refsw"></div></div></div>`;
    if (st.ptab === 'regalos') { const gs = S.giftcards(tid); body = `<div class="grid g3 stagger"><div class="kpi"><div class="l">Vendidas</div><div class="v">${gs.length}</div></div><div class="kpi"><div class="l">Valor vendido</div><div class="v">${S.money(gs.reduce((a, g) => a + g.monto, 0))}</div></div><div class="kpi"><div class="l">Saldo pendiente</div><div class="v">${S.money(gs.reduce((a, g) => a + g.saldo, 0))}</div></div></div>
      <div class="card flat pad0" style="margin-top:12px"><table class="t"><thead><tr><th>Código</th><th>Para</th><th>Saldo</th><th class="hide-m">De</th></tr></thead><tbody>${gs.slice().reverse().map(g => `<tr><td class="b">${esc(g.codigo)}</td><td>${esc(g.para)}</td><td>${S.money(g.saldo)} <span class="xs mut">/ ${S.money(g.monto)}</span></td><td class="hide-m mut">${esc(g.de || '')}</td></tr>`).join('')}</tbody></table></div>`; }
    layout(`${head('Ofertas y regalos', '', st.ptab === 'vendibles' ? `<button class="btn ghost sm" data-a="canjear">${ic('qr', 16)} Canjear cupón</button><button class="btn sm" data-pv="">${ic('plus', 16)} Promo</button>` : st.ptab === 'cupones' ? `<button class="btn sm" data-cu="">${ic('plus', 16)} Cupón</button>` : st.ptab === 'regalos' ? `<button class="btn sm" data-a="vregalo">${ic('gift', 16)} Vender tarjeta</button>` : '')}${tabs([['vendibles', 'Promos con cupos'], ['ofertas', 'Ofertas'], ['cupones', 'Cupones y referidos'], ['regalos', 'Tarjetas de regalo']], st.ptab, 'ptab')}${body}`);
  }
  function anuncio() {
    const t = T(), on = S.destacado(t);
    return `<div class="card glass"><div class="row wrapx"><div class="ico" style="background:var(--grad);color:var(--ink);border:0;width:48px;height:48px">${ic('bolt', 22)}</div><div class="g" style="min-width:200px"><div class="b">${on ? 'Tu negocio está destacado en Glow' : 'Sal de primero en Glow'}</div><div class="xs mut">${on ? 'Apareces arriba en "Cerca de ti" con la etiqueta Destacado hasta el ' + t.destacado.hasta.slice(8) + '/' + t.destacado.hasta.slice(5, 7) + '.' : 'Los clientes cerca de ti te ven antes que a los demás, con tus promos y estrellas.'}</div></div><button class="btn ${on ? 'ghost' : ''} sm" data-a="destacar">${on ? 'Extender' : 'Anunciarme'}</button></div></div>`;
  }
  const PLU = { barberia: 'barberías', unas: 'negocios de uñas', salon: 'salones', spa: 'spas', estetica: 'estéticas' };
  function destacar() {
    const t = T(); const P = [['Semana', 7, 15], ['Quincena', 15, 25], ['Mes', 30, 45]]; let sel = 0;
    const otros = S.destacadosDe(t.tipo).filter(x => x.id !== t.id);
    if (otros.length >= S.CUPOS_DEST && !S.destacado(t)) { const libre = otros.map(x => x.destacado.hasta).sort()[0]; return sheet(`<div class="c"><div style="font-size:40px">⏳</div><h2>Cupos llenos esta semana</h2><p class="mut">Solo hay ${S.CUPOS_DEST} lugares destacados por semana para ${PLU[t.tipo] || 'tu tipo de negocio'}, para que los clientes no vean solo anuncios. El próximo cupo se libera el ${libre.slice(8)}/${libre.slice(5, 7)}.</p><button class="btn w" data-x="1">Entendido</button></div>`), $('.sheet [data-x]').onclick = closeSheet; }
    sheet(`<h2>Anúnciate en Glow</h2><p class="mut sm">Sales de primero cuando un cliente busca negocios cerca. Siempre con la etiqueta <b>Destacado</b>, para que la gente confíe.</p><div class="pill br" style="margin-top:8px">Quedan ${Math.max(0, S.CUPOS_DEST - otros.length - (S.destacado(t) ? 1 : 0))} de ${S.CUPOS_DEST} cupos esta semana para ${PLU[t.tipo] || 'tu tipo de negocio'}</div>
      <div class="col" style="margin:14px 0">${P.map(([n, d, pr], i) => `<button class="svc ${i === 0 ? 'on' : ''}" data-pl="${i}"><div class="g"><div class="b">${n}</div><div class="xs mut">${d} días arriba en tu zona</div></div><b>${S.money(pr)}</b><div class="chk">${i === 0 ? ic('check', 15) : ''}</div></button>`).join('')}</div>
      <div class="card flat sm"><b>Qué incluye:</b> primer lugar en "Cerca de ti", tarjeta grande con tu portada, tus promos con cupos visibles y reporte de cuántos te vieron y reservaron.</div>
      <button class="btn w" id="ds-ok" style="margin-top:14px">Activar</button><p class="xs dim c">Demo: el pago es simulado.</p>`);
    $$('.sheet [data-pl]').forEach(x => x.onclick = () => { sel = +x.dataset.pl; $$('.sheet [data-pl]').forEach(y => { y.classList.toggle('on', y === x); y.querySelector('.chk').innerHTML = y === x ? ic('check', 15) : ''; }); });
    $('#ds-ok').onclick = () => { const base = S.destacado(t) ? S.parse(t.destacado.hasta + 'T12:00') : new Date(); S.guardar('tenants', { id: tid, destacado: { hasta: S.ymd(S.addDays(base, P[sel][1])), plan: P[sel][0] } }); closeSheet(); confetti(); toast('¡Listo! Ya sales de primero', 'bolt'); pintar(); };
  }
  function editPromo(id) {
    const sv = S.services(tid); const p = id ? S.promo(id) : { id: S.uid('p'), tid, titulo: '', desc: '', servicios: [sv[0]?.id], normal: sv[0]?.precio || 0, precio: Math.round((sv[0]?.precio || 0) * .75), cupos: 30, vendidos: 0, vence: S.ymd(S.addDays(new Date(), 15)), validez: 60, activa: true, creado: S.iso(new Date()) };
    sheet(`<h2>${id ? 'Editar' : 'Nueva'} promo con cupos</h2><p class="mut sm">Se vende en tu app. Cada compra genera un cupón con código.</p>
      <div class="field"><label>Servicio</label><select id="pv-s">${sv.map(x => `<option value="${x.id}" ${p.servicios[0] === x.id ? 'selected' : ''}>${esc(x.nombre)} · ${S.money(x.precio)}</option>`).join('')}</select></div>
      <div class="field"><label>Nombre de la promo</label><input id="pv-t" value="${esc(p.titulo)}" placeholder="Ej.: Corte + barba de lanzamiento"></div>
      <div class="field"><label>Descripción</label><input id="pv-d" value="${esc(p.desc)}" placeholder="Qué incluye y condiciones"></div>
      <div class="grid g3"><div class="field"><label>Precio normal</label><input id="pv-n" type="number" value="${p.normal}"></div><div class="field"><label>Precio promo</label><input id="pv-p" type="number" value="${p.precio}"></div><div class="field"><label>Cupos</label><input id="pv-c" type="number" value="${p.cupos}"></div></div>
      <div class="grid g2"><div class="field"><label>Se vende hasta</label><input id="pv-v" type="date" value="${p.vence}"></div><div class="field"><label>Días para usarlo</label><input id="pv-u" type="number" value="${p.validez}"></div></div>
      <div class="row sp" style="margin-bottom:14px"><span class="sm">Activa</span><div class="switch ${p.activa ? 'on' : ''}" id="pv-a"></div></div>
      <div class="row">${id ? `<button class="btn danger" id="pv-del">${ic('trash', 16)}</button>` : ''}<button class="btn g" id="pv-ok">Guardar</button></div>`);
    $('#pv-a').onclick = e => e.currentTarget.classList.toggle('on');
    $('#pv-s').onchange = () => { const x = S.service($('#pv-s').value); $('#pv-n').value = x.precio; $('#pv-p').value = Math.round(x.precio * .75); if (!$('#pv-t').value) $('#pv-t').value = x.nombre; };
    $('#pv-ok').onclick = () => { const sid = $('#pv-s').value, n = +$('#pv-n').value, pr = +$('#pv-p').value, c = Math.max(1, +$('#pv-c').value || 1);
      if (!(pr > 0) || pr >= n) return toast('El precio promo debe ser menor al normal', 'x'); if (c < (p.vendidos || 0)) return toast('Ya vendiste ' + p.vendidos + ', los cupos no pueden ser menos', 'x');
      S.guardar('promos', { ...p, servicios: [sid], titulo: $('#pv-t').value.trim() || S.service(sid).nombre, desc: $('#pv-d').value.trim(), normal: n, precio: pr, cupos: c, vence: $('#pv-v').value, validez: +$('#pv-u').value || 60, activa: $('#pv-a').classList.contains('on') }); closeSheet(); toast('Promo guardada', 'gift'); };
    if (id) $('#pv-del').onclick = () => { S.guardar('promos', { id, borrado: true }); closeSheet(); };
  }
  function canjear() {
    sheet(`<h2>Canjear cupón</h2><p class="mut sm">Escribe el código que muestra el cliente (PROMO-…).</p><div class="field"><input id="cj-c" autofocus placeholder="PROMO-XXXXX" style="text-transform:uppercase;font-size:20px;letter-spacing:.06em"></div><button class="btn w" id="cj-ok">Canjear</button>`);
    $('#cj-ok').onclick = () => { try { const v = S.canjearVoucher(tid, $('#cj-c').value); closeSheet(); confetti(); toast(`Canjeado: ${S.promo(v.pid)?.titulo} · ${S.client(v.cid)?.nombre}`, 'check'); } catch (e) { toast(e.message, 'x'); } };
  }
  function editOferta(id) {
    const o = id ? S.offers(tid).find(x => x.id === id) : { id: S.uid('f'), tid, titulo: '', desc: '', tipo: 'pct', valor: 15, servicios: [], vence: S.ymd(S.addDays(new Date(), 14)), activa: true };
    sheet(`<h2>${id ? 'Editar' : 'Nueva'} oferta</h2><div class="field"><label>Título</label><input id="o-t" value="${esc(o.titulo)}" placeholder="Ej.: Martes de barba"></div><div class="field"><label>Descripción</label><input id="o-d" value="${esc(o.desc)}"></div>
      <div class="grid g3"><div class="field"><label>Tipo</label><select id="o-k"><option value="pct" ${o.tipo === 'pct' ? 'selected' : ''}>%</option><option value="monto" ${o.tipo === 'monto' ? 'selected' : ''}>$</option></select></div><div class="field"><label>Valor</label><input id="o-v" type="number" value="${o.valor}"></div><div class="field"><label>Vence</label><input id="o-f" type="date" value="${o.vence || ''}"></div></div>
      <label>Servicios</label><div class="row wrapx" style="margin-bottom:12px">${S.services(tid).map(s => `<button class="chip ${o.servicios?.includes(s.id) ? 'on' : ''}" data-os="${s.id}">${esc(s.nombre)}</button>`).join('')}</div>
      <div class="row sp" style="margin-bottom:14px"><span class="sm">Activa</span><div class="switch ${o.activa ? 'on' : ''}" id="o-a"></div></div><div class="row">${id ? `<button class="btn danger" id="o-del">${ic('trash', 16)}</button>` : ''}<button class="btn g" id="o-ok">Guardar</button></div>`);
    $$('[data-os]').forEach(x => x.onclick = () => x.classList.toggle('on')); $('#o-a').onclick = e => e.currentTarget.classList.toggle('on');
    $('#o-ok').onclick = () => { if (!$('#o-t').value.trim()) return toast('Falta el título', 'x'); S.guardar('offers', { ...o, titulo: $('#o-t').value.trim(), desc: $('#o-d').value.trim(), tipo: $('#o-k').value, valor: +$('#o-v').value || 0, vence: $('#o-f').value, servicios: $$('[data-os]').filter(x => x.classList.contains('on')).map(x => x.dataset.os), activa: $('#o-a').classList.contains('on') }); closeSheet(); toast('Oferta guardada: ya se ve en tu app'); };
    if (id) $('#o-del').onclick = () => { S.guardar('offers', { id, borrado: true }); closeSheet(); };
  }
  function editCupon(id) {
    const c = id ? S.coupons(tid).find(x => x.id === id) : { id: S.uid('u'), tid, codigo: '', tipo: 'pct', valor: 10, activo: true, usos: 0, max: 0, vence: '', nota: '' };
    sheet(`<h2>${id ? 'Editar' : 'Nuevo'} cupón</h2><div class="field"><label>Código</label><input id="u-c" value="${esc(c.codigo)}" style="text-transform:uppercase" placeholder="VERANO15"></div>
      <div class="grid g3"><div class="field"><label>Tipo</label><select id="u-k"><option value="pct" ${c.tipo === 'pct' ? 'selected' : ''}>%</option><option value="monto" ${c.tipo === 'monto' ? 'selected' : ''}>$</option></select></div><div class="field"><label>Valor</label><input id="u-v" type="number" value="${c.valor}"></div><div class="field"><label>Máx. usos</label><input id="u-m" type="number" value="${c.max || 0}"></div></div>
      <div class="grid g2"><div class="field"><label>Vence</label><input id="u-f" type="date" value="${c.vence || ''}"></div><div class="field"><label>Nota</label><input id="u-n" value="${esc(c.nota || '')}"></div></div>
      <div class="row sp" style="margin-bottom:14px"><span class="sm">Activo</span><div class="switch ${c.activo ? 'on' : ''}" id="u-a"></div></div><div class="row">${id ? `<button class="btn danger" id="u-del">${ic('trash', 16)}</button>` : ''}<button class="btn g" id="u-ok">Guardar</button></div>`);
    $('#u-a').onclick = e => e.currentTarget.classList.toggle('on');
    $('#u-ok').onclick = () => { const code = $('#u-c').value.trim().toUpperCase().replace(/\s+/g, ''); if (!code) return; S.guardar('coupons', { ...c, codigo: code, tipo: $('#u-k').value, valor: +$('#u-v').value || 0, max: +$('#u-m').value || 0, vence: $('#u-f').value, nota: $('#u-n').value, activo: $('#u-a').classList.contains('on') }); closeSheet(); toast('Cupón guardado'); };
    if (id) $('#u-del').onclick = () => { S.guardar('coupons', { id, borrado: true }); closeSheet(); };
  }

  /* ================= MARKETING ================= */
  function marketing() {
    const t = T(); const hoy = new Date(); const lim = S.iso(S.addDays(hoy, -45)); const mesC = String(hoy.getMonth() + 1).padStart(2, '0'); const link = location.href.split('#')[0] + '#/s/' + t.slug;
    const ultMap = {}; S.bookings(tid).forEach(b => { if (b.estado === 'completada' && (!ultMap[b.cid] || b.inicio > ultMap[b.cid])) ultMap[b.cid] = b.inicio; });
    const futuro = new Set(S.bookings(tid).filter(b => b.estado === 'confirmada' && b.inicio >= S.iso(hoy)).map(b => b.cid));
    const inact = S.clients(tid).filter(c => ultMap[c.id] && ultMap[c.id] < lim);
    const ciclo = t.avisos?.tetoca || 21; const toca = S.clients(tid).filter(c => { const u = ultMap[c.id]; if (!u || futuro.has(c.id)) return false; const d = (hoy - S.parse(u)) / 864e5; return d >= ciclo && d < ciclo + 14; });
    const cumple = S.clients(tid).filter(c => (c.cumple || '').slice(5, 7) === mesC);
    const ocup = Array.from({ length: 7 }, (_, i) => { const d = S.addDays(hoy, i + 1); const m = S.metricas(tid, S.ymd(d), S.ymd(S.addDays(d, 1))); return [d, m.ocupacion]; }).filter(([d]) => (t.horario[d.getDay()] || []).length).sort((a, b) => a[1] - b[1]);
    const flojo = ocup[0];
    const res = S.bookings(tid).filter(b => b.estado === 'completada' && b.inicio >= S.iso(S.addDays(hoy, -3))).map(b => S.client(b.cid)).filter((c, i, a) => c && a.indexOf(c) === i);
    const camp = [
      ['✂️', '«Te toca tu corte»', `${toca.length} clientes ya pasaron ${ciclo} días desde su última visita y no tienen cita.`, toca, c => `Hola ${c.nombre.split(' ')[0]} ✂️ ¡Ya te toca! Aparta tu hora en ${t.nombre} en 10 segundos 👉 ${link}`],
      ['💤', 'Recupera a los que no vuelven', `${inact.length} clientes no vienen hace más de 45 días.`, inact, c => `Hola ${c.nombre.split(' ')[0]} 👋 ¡Te extrañamos en ${t.nombre}! Esta semana tienes 10% con el código VUELVE10. Reserva aquí 👉 ${link}`],
      ['🎂', 'Cumpleañeros del mes', `${cumple.length} clientes cumplen años este mes.`, cumple, c => `¡Feliz cumpleaños, ${c.nombre.split(' ')[0]}! 🎉 En ${t.nombre} te regalamos un detalle en tu próxima visita este mes. Reserva 👉 ${link}`],
      ['📉', `Llena tu día flojo${flojo ? ': ' + DIAS[flojo[0].getDay()] + ' ' + flojo[0].getDate() : ''}`, flojo ? `Ese día va al ${Math.round(flojo[1] * 100)}% de ocupación.` : 'Tu semana está llena.', S.clients(tid).filter(c => ultMap[c.id]).slice(0, 25), c => `Hola ${c.nombre.split(' ')[0]} ✦ Tenemos espacios el ${flojo ? fechaL(flojo[0]) : 'esta semana'} con 15% de descuento. Aparta el tuyo 👉 ${link}`],
      ['⭐', 'Pide reseñas en Google', `${res.length} clientes atendidos en los últimos 3 días.`, res, c => `Hola ${c.nombre.split(' ')[0]}, gracias por venir a ${t.nombre} 💛 ¿Nos regalas 1 minuto para dejar tu reseña en Google? Nos ayuda muchísimo 🙏`],
    ];
    layout(`${head('Marketing', 'Campañas listas para enviar por WhatsApp, una por una, para cuidar tu número.')}${anuncio()}<div style="height:12px"></div>
      <div class="grid g2 rsp stagger">${camp.map(([e, ti, d, l], i) => `<div class="card tilt flat"><div class="pop"><div style="font-size:30px">${e}</div><h3 style="margin:8px 0 4px">${ti}</h3><p class="mut sm" style="margin:0 0 14px">${d}</p><button class="btn sm" data-camp="${i}" ${l.length ? '' : 'disabled'}>${ic('wa', 16)} Preparar ${l.length} mensajes</button></div></div>`).join('')}
        <div class="card flat"><div style="font-size:30px">🖨️</div><h3 style="margin:8px 0 4px">QR y link para tu local</h3><p class="mut sm" style="margin:0 0 14px">Para el mostrador, el espejo, la bio de Instagram y tu WhatsApp Business.</p><div class="row wrapx"><button class="btn ghost sm" data-a="copiar">${ic('copy', 15)} Copiar link</button><button class="btn sm" data-a="compartir">${ic('qr', 15)} Ver QR</button></div></div></div>
      <div class="card flat in3" style="margin-top:12px"><h3>${ic('bell', 18)} Lista de espera</h3>${S.waitlist(tid).length ? S.waitlist(tid).slice(-8).reverse().map(w => `<div class="li"><div class="g"><div class="sm b">${esc(w.nombre)}</div><div class="xs mut">Quiere ${fechaL(S.parse(w.fecha + 'T00:00'))} · ${w.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}</div></div><a class="btn ghost sm" target="_blank" href="${wa(w.tel, `Hola ${w.nombre}, se liberó un espacio en ${t.nombre} 🎉 ¿Lo apartamos? 👉 ${link}`)}">${ic('wa', 15)} Avisar</a></div>`).join('') : '<p class="mut sm">Cuando un día esté lleno, tus clientes pueden anotarse aquí.</p>'}</div>`);
    $$('[data-camp]').forEach(b => b.onclick = () => { const [, ti, , l, msg] = camp[+b.dataset.camp]; let i = 0;
      const paso = () => { if (i >= l.length) { closeSheet(); toast('Campaña completada ✦'); return; } const c = l[i];
        sheet(`<div class="row sp"><h2>${ti}</h2><span class="pill">${i + 1} / ${l.length}</span></div><div class="row" style="margin:14px 0">${avatar(c, 'r')}<div class="g"><div class="b">${esc(c.nombre)}</div><div class="xs mut">${esc(c.tel)}</div></div></div>
          <textarea id="m-t" rows="5">${esc(msg(c))}</textarea><div class="row" style="margin-top:12px"><button class="btn ghost" id="m-s">Saltar</button><a class="btn g" id="m-e" target="_blank" href="${wa(c.tel, msg(c))}">${ic('wa', 17)} Abrir WhatsApp y enviar</a></div><p class="xs dim c" style="margin-top:8px">Se abre WhatsApp con el mensaje listo; tú lo envías.</p>`);
        $('#m-t').oninput = () => $('#m-e').href = wa(c.tel, $('#m-t').value);
        $('#m-e').onclick = () => { S.msg(tid, { cid: c.id, tipo: 'Campaña: ' + ti, texto: $('#m-t').value, canal: 'WhatsApp (manual)' }); i++; setTimeout(paso, 600); }; $('#m-s').onclick = () => { i++; paso(); }; };
      paso(); });
  }

  /* ================= MENSAJES ================= */
  function mensajes() {
    const t = T(); const a = t.avisos || {}; const ms = S.outbox(tid).slice().reverse().slice(0, 60);
    S.outbox(tid).filter(m => m.canal === 'Panel' && !m.visto).forEach(m => S.guardar('outbox', { id: m.id, visto: true }));
    layout(`${head('Mensajes automáticos', 'Lo que Glow les envía a tus clientes por ti. En la versión real salen por WhatsApp oficial del negocio.')}
      <div class="grid g2 rsp"><div class="card flat in"><h3>Qué se envía</h3>
        ${[['conf', 'Confirmación al reservar', true], ['h24', 'Recordatorio 24 horas antes (con botones Confirmo / Cambiar)', a.h24 !== false], ['gracias', 'Gracias + pedir reseña al terminar', a.gracias !== false]].map(([k, l, on]) => `<div class="row sp" style="margin:12px 0"><span class="sm">${l}</span><div class="switch ${on ? 'on' : ''}" data-av="${k}"></div></div>`).join('')}
        <div class="row sp" style="margin:12px 0"><span class="sm">Segundo recordatorio</span><select data-ant style="width:auto;padding:8px">${[30, 60, 120, 180].map(m => `<option value="${m}" ${(a.antes || 120) === m ? 'selected' : ''}>${m < 60 ? m + ' min' : m / 60 + ' h'} antes</option>`).join('')}</select></div>
        <div class="row sp" style="margin:12px 0"><span class="sm">«Te toca tu corte» después de</span><select data-tt style="width:auto;padding:8px">${[14, 21, 28, 35, 45].map(m => `<option value="${m}" ${(a.tetoca || 21) === m ? 'selected' : ''}>${m} días</option>`).join('')}</select></div></div>
      <div class="card flat in2"><div class="row sp"><h3>Enviados</h3><span class="pill">${S.outbox(tid).length}</span></div><div style="max-height:60vh;overflow:auto">${ms.map(m => `<div class="li" style="align-items:flex-start"><div class="ico" style="width:34px;height:34px">${ic(m.canal === 'Panel' ? 'bell' : 'wa', 16)}</div><div class="g"><div class="row sp"><span class="xs b">${esc(m.tipo)}</span><span class="xs dim">${m.fecha.slice(5, 16).replace('T', ' ')}</span></div><div class="xs mut">${m.cid ? esc(S.client(m.cid)?.nombre || '') + ': ' : ''}${esc(m.texto)}</div></div></div>`).join('') || '<div class="empty">Aún no hay mensajes</div>'}</div></div></div>`);
    $$('[data-av]', el).forEach(s => s.onclick = () => { s.classList.toggle('on'); if (s.dataset.av !== 'conf') S.saveTenant({ id: tid, avisos: { ...T().avisos, [s.dataset.av]: s.classList.contains('on') } }); });
    $('[data-ant]', el).onchange = e => S.saveTenant({ id: tid, avisos: { ...T().avisos, antes: +e.target.value } });
    $('[data-tt]', el).onchange = e => S.saveTenant({ id: tid, avisos: { ...T().avisos, tetoca: +e.target.value } });
  }

  /* ================= REPORTES ================= */
  function reportes() {
    const hoy = new Date(); const per = { semana: [S.addDays(hoy, -6), 'Últimos 7 días'], mes: [new Date(hoy.getFullYear(), hoy.getMonth(), 1), 'Este mes'], pasado: [new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1), 'Mes pasado'], tres: [S.addDays(hoy, -89), 'Últimos 90 días'] }[st.per];
    const desde = S.ymd(per[0]); const hasta = st.per === 'pasado' ? S.ymd(new Date(hoy.getFullYear(), hoy.getMonth(), 1)) : S.ymd(S.addDays(hoy, 1));
    const vs = S.sales(tid).filter(v => v.fecha >= desde && v.fecha < hasta); const bs = S.bookings(tid).filter(b => b.inicio >= desde && b.inicio < hasta);
    const m = S.metricas(tid, desde, hasta); const gas = S.expenses(tid).filter(x => x.fecha >= desde && x.fecha < hasta);
    const ing = vs.reduce((a, v) => a + v.sub, 0), g = gas.reduce((a, x) => a + x.monto, 0), com = S.staff(tid).reduce((a, mm) => a + vs.filter(v => v.staffId === mm.id).reduce((x, v) => x + (v.servicios ?? v.sub), 0) * mm.comision / 100, 0);
    const porM = S.staff(tid).map(mm => { const v = vs.filter(x => x.staffId === mm.id); const b = bs.filter(x => x.staffId === mm.id); const r = S.reviews(tid).filter(x => x.staffId === mm.id); return [mm, v.reduce((a, x) => a + x.sub, 0), b.filter(x => x.estado === 'completada').length, v.reduce((a, x) => a + (x.propina || 0), 0), r.length ? r.reduce((a, x) => a + x.estrellas, 0) / r.length : 0]; });
    const porS = cuenta(bs.filter(b => b.estado === 'completada').flatMap(b => b.items)).slice(0, 8);
    const canales = cuenta(bs.map(b => b.origen)); const metodos = METODOS.map(k => [k, vs.filter(v => v.metodo === k).reduce((a, v) => a + v.cobrado, 0)]); const totM = Math.max(1, metodos.reduce((a, x) => a + x[1], 0));
    const nuevos = S.clients(tid).filter(c => c.creado >= desde && c.creado < hasta).length;
    layout(`${head('Reportes', per[1], `<button class="btn ghost sm" data-a="xls">${ic('copy', 15)} Exportar ventas</button>`)}${tabs([['semana', '7 días'], ['mes', 'Este mes'], ['pasado', 'Mes pasado'], ['tres', '90 días']], st.per, 'per')}
      <div class="grid g4 stagger"><div class="kpi"><div class="l">Ventas (sin ITBMS)</div><div class="v grad-t" data-n="${ing}" data-pre="$">0</div></div><div class="kpi"><div class="l">Gastos</div><div class="v" data-n="${g}" data-pre="$">0</div></div><div class="kpi"><div class="l">Comisiones equipo</div><div class="v" data-n="${com}" data-pre="$">0</div></div><div class="kpi"><div class="l">Ganancia estimada</div><div class="v" data-n="${ing - g - com}" data-pre="$">0</div></div>
        <div class="kpi"><div class="l">Citas atendidas</div><div class="v" data-n="${m.completadas}">0</div></div><div class="kpi"><div class="l">Ticket promedio</div><div class="v" data-n="${m.ticket}" data-pre="$" data-dec="2">0</div></div><div class="kpi"><div class="l">No vinieron</div><div class="v" data-n="${m.noshow}">0</div><div class="xs mut">${m.citas ? Math.round(m.noshow / m.citas * 100) : 0}%</div></div><div class="kpi"><div class="l">Clientes nuevos</div><div class="v" data-n="${nuevos}">0</div></div></div>
      <div class="card flat pad0 in2" style="margin-top:12px"><table class="t"><thead><tr><th>Profesional</th><th>Vendió</th><th>Servicios</th><th class="hide-m">Propinas</th><th class="hide-m">Comisión</th><th class="hide-m">★</th></tr></thead><tbody>${porM.map(([mm, v, n, p, r]) => `<tr><td><div class="row">${avatar(mm, 'r', 'width:30px;height:30px;font-size:11px')}<b>${esc(mm.nombre)}</b></div></td><td>${S.money(v)}</td><td>${n}</td><td class="hide-m">${S.money(p)}</td><td class="hide-m">${S.money(v * mm.comision / 100)}</td><td class="hide-m">${r ? r.toFixed(1) : '—'}</td></tr>`).join('')}</tbody></table></div>
      <div class="grid g3 rsp" style="margin-top:12px"><div class="card flat in3"><h3>Servicios más vendidos</h3>${porS.map(([sid, n]) => `<div class="stat-line"><span>${esc(S.service(sid)?.nombre)}</span><b>${n}</b></div>`).join('')}</div>
        <div class="card flat in3"><h3>¿De dónde vienen tus citas?</h3>${canales.map(([k, n]) => `<div class="stat-line"><span>${{ app: '📱 Tu app', instagram: '📸 Instagram', whatsapp: '💬 WhatsApp', google: '🔎 Google', 'recepción': '🧾 Recepción', 'sin cita': '🚶 Sin cita' }[k] || esc(k)}</span><b>${n}</b></div>`).join('')}</div>
        <div class="card flat in4"><h3>Cómo te pagan</h3>${metodos.map(([k, v]) => `<div style="margin:8px 0"><div class="row sp sm"><span>${k}</span><b>${S.money(v)}</b></div><div style="height:6px;border-radius:9px;background:var(--card2);margin-top:4px"><div style="height:100%;width:${v / totM * 100}%;background:var(--grad);border-radius:9px"></div></div></div>`).join('')}</div></div>
      <div class="card flat in4" style="margin-top:12px"><div class="row sp"><h3>Gastos</h3><button class="btn ghost sm" data-a="gasto">${ic('plus', 15)} Gasto</button></div>${gas.length ? gas.slice().reverse().map(x => `<div class="stat-line"><span>${esc(x.concepto)} <span class="xs mut">· ${esc(x.cat)} · ${x.fecha}</span></span><b>${S.money(x.monto)}</b></div>`).join('') : '<p class="mut sm">Sin gastos en este periodo.</p>'}</div>`);
  }

  /* ================= EQUIPO ================= */
  function equipo() {
    const mes = S.ymd(new Date()).slice(0, 7); const t = T();
    layout(`${head('Equipo', 'Fotos, horarios, comisiones, sucursal y acceso con PIN', `<button class="btn sm" data-a="mem">${ic('plus', 16)} Agregar</button>`)}
      <div class="grid g3 rsp stagger">${S.staff(tid).map(m => { const v = S.sales(tid).filter(x => x.staffId === m.id && x.fecha.startsWith(mes)).reduce((a, x) => a + x.sub, 0); const r = S.reviews(tid).filter(x => x.staffId === m.id); return `<div class="card tilt" data-m="${m.id}" style="cursor:pointer"><div class="row pop">${avatar(m, 'lg r')}<div class="g"><h3>${esc(m.nombre)}</h3><div class="xs mut">${esc(m.rol)}${(t.sucursales || []).length > 1 ? ' · ' + esc((t.sucursales.find(s => s.id === (m.sucursal || 'principal')) || {}).nombre || '') : ''}</div>${r.length ? `<div class="xs">${estrellas(r.reduce((a, x) => a + x.estrellas, 0) / r.length, 12)}</div>` : ''}</div></div>
        <div class="grid g2" style="margin-top:14px"><div><div class="xs mut">Vendió este mes</div><div class="b">${S.money(v)}</div></div><div><div class="xs mut">Comisión ${m.comision}%</div><div class="b">${S.money(v * m.comision / 100)}</div></div></div></div>`; }).join('')}</div>
      <p class="xs dim" style="margin-top:12px">Cada persona entra a la app del equipo con su PIN: <a href="#/s/${t.slug}/equipo">${location.host}${location.pathname}#/s/${t.slug}/equipo</a></p>`);
  }
  function editMem2(id) {
    const t = T(); const m = id ? S.member(id) : { id: S.uid('m'), tid, nombre: '', rol: 'Profesional', color: ['#7C5CFF', '#2EC5FF', '#3DDC97', '#FF5C8A'][Math.floor(Math.random() * 4)], pin: String(1000 + Math.floor(Math.random() * 8999)), servicios: null, comision: 40, bloqueos: [], libres: [], sucursal: 'principal', bio: '', galeria: [] };
    let foto = m.foto || '', gal = [...(m.galeria || [])];
    const pintaG = () => { $('#m-gal').innerHTML = gal.map((g, i) => `<div style="position:relative;aspect-ratio:1;border-radius:12px;background:url(${g}) center/cover"><button class="ico" data-rg="${i}" style="position:absolute;top:4px;right:4px;width:26px;height:26px">${ic('x', 14)}</button></div>`).join('') + `<label style="aspect-ratio:1;border-radius:12px;border:1.5px dashed var(--line2);display:grid;place-items:center;cursor:pointer;margin:0">${ic('plus')}<input type="file" accept="image/*" id="m-gf" hidden multiple></label>`;
      $$('[data-rg]').forEach(b => b.onclick = () => { gal.splice(+b.dataset.rg, 1); pintaG(); }); $('#m-gf').onchange = async e => { for (const f of [...e.target.files].slice(0, 6 - gal.length)) gal.push(await leerImagen(f, 700, .72)); pintaG(); }; };
    sheet(`<h2>${id ? 'Editar' : 'Nuevo'} integrante</h2><div class="row" style="margin:10px 0 14px"><label style="cursor:pointer;margin:0"><div id="m-ft">${avatar({ ...m, foto }, 'lg r', 'width:76px;height:76px')}</div><input type="file" accept="image/*" id="m-f" hidden></label><div class="xs mut">Toca la foto para cambiarla</div></div>
      <div class="grid g2"><div class="field"><label>Nombre</label><input id="m-n" value="${esc(m.nombre)}"></div><div class="field"><label>Cargo</label><input id="m-r" value="${esc(m.rol)}"></div></div>
      <div class="field"><label>Presentación (se ve en la app)</label><input id="m-b" value="${esc(m.bio || '')}" placeholder="Especialista en…"></div>
      <div class="grid g3"><div class="field"><label>PIN</label><input id="m-p" inputmode="numeric" maxlength="4" value="${esc(m.pin)}"></div><div class="field"><label>Comisión %</label><input id="m-c" type="number" value="${m.comision}"></div><div class="field"><label>Color</label><input id="m-k" type="color" value="${m.color}" style="height:50px;padding:6px"></div></div>
      ${(t.sucursales || []).length > 1 ? `<div class="field"><label>Sucursal</label><select id="m-su">${t.sucursales.map(s => `<option value="${s.id}" ${(m.sucursal || 'principal') === s.id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></div>` : ''}
      <label>Servicios que hace</label><div class="row wrapx" style="margin-bottom:12px">${S.services(tid).map(s => `<button class="chip ${!m.servicios || m.servicios.includes(s.id) ? 'on' : ''}" data-ms="${s.id}">${esc(s.nombre)}</button>`).join('')}</div>
      <label>Sus trabajos (galería)</label><div class="grid g4" id="m-gal" style="margin-bottom:12px"></div>
      <div class="field"><label>Día libre (no recibe citas)</label><input id="m-l" type="date"></div>${(m.libres || []).length ? `<div class="xs mut" style="margin:-6px 0 12px">Libres: ${m.libres.join(', ')}</div>` : ''}
      <div class="row">${id ? `<button class="btn danger" id="m-del">${ic('trash', 16)}</button>` : ''}<button class="btn g" id="m-ok">Guardar</button></div>`);
    pintaG();
    $('#m-f').onchange = async e => { foto = await leerImagen(e.target.files[0], 500, .8); $('#m-ft').innerHTML = avatar({ foto }, 'lg r', 'width:76px;height:76px'); };
    $$('[data-ms]').forEach(x => x.onclick = () => x.classList.toggle('on'));
    $('#m-ok').onclick = () => { const sv = $$('[data-ms]').filter(x => x.classList.contains('on')).map(x => x.dataset.ms); const libres = [...(m.libres || [])]; if ($('#m-l').value) libres.push($('#m-l').value);
      if (!$('#m-n').value.trim()) return toast('Falta el nombre', 'x');
      try { S.saveStaff({ ...m, foto, galeria: gal, nombre: $('#m-n').value.trim(), rol: $('#m-r').value, bio: $('#m-b').value.trim(), pin: $('#m-p').value.replace(/\D/g, '').slice(0, 4).padEnd(4, '0'), comision: +$('#m-c').value || 0, color: $('#m-k').value, sucursal: $('#m-su')?.value || m.sucursal || 'principal', servicios: sv.length === S.services(tid).length ? null : sv, libres }); closeSheet(); toast('Guardado'); } catch (e) { toast('Las fotos son muy pesadas: usa menos', 'x'); } };
    if (id) $('#m-del').onclick = () => { if (S.staff(tid).length < 2) return toast('Debe quedar al menos 1 persona', 'x'); S.saveStaff({ id, borrado: true }); closeSheet(); toast('Eliminado'); };
  }

  /* ================= AJUSTES ================= */
  function ajustes() {
    const t = T();
    layout(`${head('Ajustes', 'Tu marca, fotos, horario, sucursales y reglas. Todo se ve al instante en tu app.', `<a class="btn ghost sm" href="#/s/${t.slug}" target="_blank">${ic('link', 16)} Ver cómo queda</a><button class="btn sm" data-a="guardar">${ic('check', 18)} Guardar</button>`)}
      <div class="card flat in" style="margin-bottom:12px"><div class="row sp wrapx"><div><h3>Estilo de tu app</h3><p class="xs mut" style="margin:2px 0 10px">Así la ven tus clientes y la pantalla TV. Tu panel no cambia.</p></div><a class="btn ghost sm" href="#/s/${t.slug}" target="_blank">Ver en vivo</a></div><div class="estilos est5">${pickerEstilos(t.estilo || 'claro', t.nombre).replace('<div class="estilos">', '').replace(/<\/div>$/, '')}</div></div>
      <div class="grid g2 rsp">
      <div class="card flat in"><h3>Fotos</h3>
        <label style="margin-top:12px">Portada</label><label style="display:block;margin:0;cursor:pointer"><div id="a-por" style="height:140px;border-radius:18px;border:1.5px dashed var(--line2);display:grid;place-items:center;${t.portada ? `background:url(${t.portada}) center/cover` : 'background:var(--soft)'}">${t.portada ? '' : `<span class="mut sm">${ic('plus')} Subir foto de portada</span>`}</div><input type="file" accept="image/*" id="a-pf" hidden></label>
        <div class="row" style="margin-top:12px"><label style="margin:0;cursor:pointer"><div id="a-logo" style="width:76px;height:76px;border-radius:20px;border:1.5px dashed var(--line2);display:grid;place-items:center;${t.logo ? `background:#fff url(${t.logo}) center/contain no-repeat` : ''}">${t.logo ? '' : ic('plus')}</div><input type="file" accept="image/*" id="a-lf" hidden></label><div class="g"><div class="b sm">Logo</div><div class="xs mut">Cuadrado, fondo blanco o transparente</div></div>${t.portada || t.logo ? `<button class="btn ghost sm" data-a="quitarfotos">Quitar</button>` : ''}</div>
        <label style="margin-top:14px">Galería del local (hasta 8)</label><div class="grid g4" id="a-gal"></div></div>
      <div class="card flat in"><h3>Marca</h3><div class="field" style="margin-top:12px"><label>Nombre del negocio</label><input id="a-n" value="${esc(t.nombre)}"></div><div class="field"><label>Frase principal</label><input id="a-l" value="${esc(t.lema || '')}"></div>
        <div class="grid g2"><div class="field"><label>Color principal</label><input id="a-c" type="color" value="${t.color}" style="height:50px;padding:6px"></div><div class="field"><label>Color secundario</label><input id="a-c2" type="color" value="${t.color2}" style="height:50px;padding:6px"></div></div>
        <div class="field"><label>WhatsApp del negocio</label><input id="a-t" value="${esc(t.tel || '')}" placeholder="6000-0000"></div>
        <h3 style="margin-top:6px">Tu link</h3><div class="row" style="margin-top:8px"><input readonly value="${location.href.split('#')[0]}#/s/${t.slug}"><button class="ico" data-a="copiar">${ic('copy')}</button></div></div>
      <div class="card flat in2"><h3>Horario</h3><div style="margin-top:10px">${[1, 2, 3, 4, 5, 6, 0].map(d => { const h = t.horario[d] || []; return `<div class="row" style="margin-bottom:8px"><div class="switch ${h.length ? 'on' : ''}" data-hd="${d}"></div><span style="width:40px" class="sm">${DIAS[d]}</span><input type="time" data-ha="${d}" value="${h[0]?.[0] || '09:00'}" ${h.length ? '' : 'disabled'} style="padding:9px"><input type="time" data-hb="${d}" value="${h[0]?.[1] || '18:00'}" ${h.length ? '' : 'disabled'} style="padding:9px"></div>`; }).join('')}</div>
        <h3 style="margin-top:14px">Feriados y cierres</h3><div id="a-cz" style="margin-top:8px">${(t.cierres || []).map((c, i) => `<div class="stat-line"><span>${c.fecha} · ${esc(c.motivo)}</span><button class="ico" data-rcz="${i}" style="width:28px;height:28px">${ic('x', 14)}</button></div>`).join('')}</div><div class="row" style="margin-top:8px"><input type="date" id="a-czf"><input id="a-czm" placeholder="Motivo"><button class="btn ghost sm" data-a="addcz">${ic('plus', 15)}</button></div></div>
      <div class="card flat in2"><h3>Sucursales</h3><div style="margin-top:8px">${(t.sucursales || []).map((s, i) => `<div class="row" style="margin-bottom:8px"><input data-sn="${i}" value="${esc(s.nombre)}" placeholder="Nombre"><input data-sd="${i}" value="${esc(s.dir || '')}" placeholder="Dirección"></div>`).join('')}</div><button class="btn ghost sm" data-a="addsuc">${ic('plus', 15)} Agregar sucursal</button>
        <h3 style="margin-top:16px">Reglas de reserva</h3><div class="row sp" style="margin:12px 0"><div><div class="sm b">Pedir depósito</div><div class="xs mut">Reduce los plantones</div></div><div class="switch ${t.deposito?.activo ? 'on' : ''}" id="a-dep"></div></div>
        <div class="field"><label>Depósito (% del total)</label><input id="a-dp" type="number" value="${t.deposito?.pct || 20}"></div><div class="field"><label>Política de cancelación</label><textarea id="a-p" rows="2">${esc(t.politica)}</textarea></div>
        <div class="row sp" style="margin:12px 0"><div class="sm b">Fila sin cita en la app</div><div class="switch ${t.fila ? 'on' : ''}" id="a-fila"></div></div></div>
      <div class="card flat in3"><h3>Fidelidad</h3><div class="grid g2" style="margin-top:12px"><div class="field"><label>Sellos para premio</label><input id="a-fm" type="number" value="${t.fidelidad?.meta || 10}"></div><div class="field"><label>Premio</label><input id="a-fp" value="${esc(t.fidelidad?.premio || '')}"></div></div>
        <div class="grid g3"><div class="field"><label>Sellos de regalo (1.ª vez)</label><select id="a-fr">${[0, 1, 2, 3].map(n => `<option value="${n}" ${(t.fidelidad?.regalo ?? 2) === n ? 'selected' : ''}>${n ? n + ' de regalo' : 'Sin regalo'}</option>`).join('')}</select></div>
          <div class="field"><label>Cada sello es</label><select id="a-fs">${[['logo', 'Mi logo'], ['iniciales', 'Mis iniciales'], ['icono', 'Ícono'], ['estrella', 'Estrella']].map(([k, l]) => `<option value="${k}" ${(t.fidelidad?.sello || 'logo') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field"><label>Fondo</label><select id="a-ff">${[['marca', 'Mis colores'], ['oscuro', 'Oscuro'], ['claro', 'Claro'], ['portada', 'Mi portada']].map(([k, l]) => `<option value="${k}" ${(t.fidelidad?.fondo || 'marca') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
        <div id="a-fprev" style="max-width:380px;margin:4px auto 12px">${tarjetaFid(t, { nombre: 'Cliente de ejemplo', n: 4, regalo: 2 })}</div>
        <div class="grid g2"><div class="field"><label>Referidos: % para el amigo</label><input id="a-rp" type="number" value="${t.referidos?.pct || 10}"></div></div></div>
      <div class="card flat in3"><h3>Seguridad</h3><p class="mut sm">Cambia el PIN del dueño en Equipo → ${esc(S.staff(tid)[0]?.nombre)}. En la versión real se entra con correo, contraseña y Face ID.</p><button class="btn ghost sm" data-a="salir">${ic('logout', 15)} Salir del panel</button></div>
      </div>`);
    let gal = [...(t.galeria || [])];
    const pintaG = () => { $('#a-gal').innerHTML = gal.map((g, i) => `<div style="position:relative;aspect-ratio:1;border-radius:12px;background:url(${g}) center/cover"><button class="ico" data-rg="${i}" style="position:absolute;top:4px;right:4px;width:26px;height:26px">${ic('x', 14)}</button></div>`).join('') + (gal.length < 8 ? `<label style="aspect-ratio:1;border-radius:12px;border:1.5px dashed var(--line2);display:grid;place-items:center;cursor:pointer;margin:0">${ic('plus')}<input type="file" accept="image/*" id="a-gf" hidden multiple></label>` : '');
      $$('[data-rg]').forEach(b => b.onclick = () => { gal.splice(+b.dataset.rg, 1); guardarFoto({ galeria: gal }); pintaG(); });
      const gf = $('#a-gf'); if (gf) gf.onchange = async e => { for (const f of [...e.target.files].slice(0, 8 - gal.length)) gal.push(await leerImagen(f, 900, .72)); guardarFoto({ galeria: gal }); pintaG(); }; };
    pintaG();
    $('#a-pf').onchange = async e => { const d = await leerImagen(e.target.files[0], 1400, .75); guardarFoto({ portada: d }); ajustes(); };
    $('#a-lf').onchange = async e => { const d = await leerImagen(e.target.files[0], 400, .85); guardarFoto({ logo: d }); ajustes(); };
    $$('[data-hd]').forEach(s => s.onclick = () => { s.classList.toggle('on'); const d = s.dataset.hd; $$(`[data-ha="${d}"],[data-hb="${d}"]`).forEach(i => i.disabled = !s.classList.contains('on')); });
    ['#a-dep', '#a-fila'].forEach(k => $(k).onclick = e => e.currentTarget.classList.toggle('on'));
    ['#a-fm', '#a-fp', '#a-fr', '#a-fs', '#a-ff'].forEach(k => { const el2 = $(k); if (el2) el2.oninput = el2.onchange = () => { const tt = T(); $('#a-fprev').innerHTML = tarjetaFid({ ...tt, fidelidad: { meta: Math.max(3, +$('#a-fm').value || 10), premio: $('#a-fp').value, regalo: +$('#a-fr').value, sello: $('#a-fs').value, fondo: $('#a-ff').value } }, { nombre: 'Cliente de ejemplo', n: 4, regalo: +$('#a-fr').value }); }; });
    ['#a-c', '#a-c2'].forEach(k => $(k).oninput = () => setBrand({ color: $('#a-c').value, color2: $('#a-c2').value }));
    $$('[data-rcz]').forEach(b => b.onclick = () => { S.saveTenant({ id: tid, cierres: T().cierres.filter((_, i) => i !== +b.dataset.rcz) }); ajustes(); });
  }
  function guardarFoto(o) { try { S.saveTenant({ id: tid, ...o }); toast('Foto guardada ✦'); } catch (e) { toast('La foto es muy pesada para la demo', 'x'); } }
  function guardarAjustes() {
    const t = T(); const horario = {}; [0, 1, 2, 3, 4, 5, 6].forEach(d => { horario[d] = $(`[data-hd="${d}"]`).classList.contains('on') ? [[$(`[data-ha="${d}"]`).value, $(`[data-hb="${d}"]`).value]] : []; });
    const sucursales = (t.sucursales || []).map((s, i) => ({ ...s, nombre: $(`[data-sn="${i}"]`)?.value || s.nombre, dir: $(`[data-sd="${i}"]`)?.value || s.dir }));
    S.saveTenant({ id: t.id, nombre: $('#a-n').value.trim() || t.nombre, lema: $('#a-l').value, color: $('#a-c').value, color2: $('#a-c2').value, tel: $('#a-t').value, horario, sucursales,
      deposito: { activo: $('#a-dep').classList.contains('on'), pct: +$('#a-dp').value || 20 }, politica: $('#a-p').value, fila: $('#a-fila').classList.contains('on'),
      fidelidad: { ...(t.fidelidad || {}), meta: Math.max(3, +$('#a-fm').value || 10), premio: $('#a-fp').value, regalo: +$('#a-fr').value, sello: $('#a-fs').value, fondo: $('#a-ff').value }, referidos: { ...(t.referidos || {}), pct: +$('#a-rp').value || 10 } });
    toast('Ajustes guardados ✦'); confetti([$('#a-c2').value, $('#a-c').value, '#0F1420']);
  }

  function compartir() {
    const t = T(); const link = location.href.split('#')[0] + '#/s/' + t.slug; const q = qrcode(0, 'M'); q.addData(link); q.make();
    sheet(`<div class="c"><h2>Tu app de reservas</h2><p class="mut sm">Ponlo en tu bio, tu WhatsApp y en el mostrador.</p>
      <div class="qr" style="margin:14px 0;border:1px solid var(--line)">${q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }).replace('<svg ', '<svg style="width:220px;height:220px" ')}</div>
      <div class="b">${esc(t.nombre)}</div><div class="xs mut" style="margin-bottom:14px">Escanea y reserva en segundos</div>
      <div class="row"><input readonly value="${link}"><button class="ico" data-a="copiar">${ic('copy')}</button></div>
      <div class="grid g2" style="margin-top:12px"><a class="btn ghost" target="_blank" href="${wa('', `Reserva tu cita en ${t.nombre} aquí 👉 ${link}`)}">${ic('wa', 17)} Enviar</a><button class="btn" onclick="window.print()">Imprimir</button></div></div>`);
    $('.sheet [data-a=copiar]').onclick = copiar;
  }
  function copiar() { const link = location.href.split('#')[0] + '#/s/' + T().slug; navigator.clipboard?.writeText(link).then(() => toast('Link copiado'), () => toast(link, 'link')); }
  function mas() {
    const t = T();
    sheet(`<h2>Más</h2><div class="grid g3" style="margin-top:14px">${SECC.filter(([k]) => !['inicio', 'agenda', 'caja', 'clientes'].includes(k) && (!T().modoInicio || BASICO.includes(k))).map(([k, i, l]) => `<a class="card flat c" href="#/s/${t.slug}/panel/${k}" style="text-decoration:none;padding:14px 8px"><div class="ico" style="margin:0 auto 8px">${ic(i)}</div><div class="xs b">${l}</div></a>`).join('')}
      <a class="card flat c" href="#/s/${t.slug}" target="_blank" style="text-decoration:none;padding:14px 8px"><div class="ico" style="margin:0 auto 8px">${ic('link')}</div><div class="xs b">Ver mi app</div></a><a class="card flat c" href="#/s/${t.slug}/recepcion" style="text-decoration:none;padding:14px 8px"><div class="ico" style="margin:0 auto 8px">${ic('bell')}</div><div class="xs b">Recepción</div></a><a class="card flat c" href="#/s/${t.slug}/accesos" style="text-decoration:none;padding:14px 8px"><div class="ico" style="margin:0 auto 8px">${ic('qr')}</div><div class="xs b">Accesos y QR</div></a><a class="card flat c" href="#/s/${t.slug}/tv" target="_blank" style="text-decoration:none;padding:14px 8px"><div class="ico" style="margin:0 auto 8px">${ic('play')}</div><div class="xs b">Pantalla TV</div></a><a class="card flat c" href="#/s/${t.slug}/equipo" style="text-decoration:none;padding:14px 8px"><div class="ico" style="margin:0 auto 8px">${ic('scissors')}</div><div class="xs b">App del equipo</div></a>
      <a class="card flat c" href="#/guia" style="text-decoration:none;padding:14px 8px"><div class="ico" style="margin:0 auto 8px">${ic('book')}</div><div class="xs b">Guía</div></a><button class="card flat c" data-a="salir" style="cursor:pointer;padding:14px 8px"><div class="ico" style="margin:0 auto 8px">${ic('logout')}</div><div class="xs b">Salir</div></button></div>`);
    $('.sheet [data-a=salir]').onclick = () => { sessionStorage.removeItem(key); closeSheet(); location.hash = '#/'; };
    $$('.sheet a').forEach(a => a.addEventListener('click', closeSheet));
  }
  function gasto() {
    sheet(`<h2>Registrar gasto</h2><div class="field"><label>Concepto</label><input id="x-c" placeholder="Ej.: productos, luz, alquiler" autofocus></div><div class="grid g2"><div class="field"><label>Monto</label><input id="x-m" type="number" step="0.01"></div><div class="field"><label>Categoría</label><select id="x-k">${['Insumos', 'Fijo', 'Marketing', 'Equipo', 'Otros'].map(k => `<option>${k}</option>`).join('')}</select></div></div><div class="field"><label>Fecha</label><input id="x-f" type="date" value="${S.ymd(new Date())}"></div><button class="btn w" id="x-ok">Guardar</button>`);
    $('#x-ok').onclick = () => { const m = +$('#x-m').value; if (!$('#x-c').value.trim() || !m) return toast('Completa concepto y monto', 'x'); S.guardar('expenses', { tid, concepto: $('#x-c').value.trim(), monto: m, cat: $('#x-k').value, fecha: $('#x-f').value }); closeSheet(); toast('Gasto registrado'); };
  }

  const vistas = { inicio, agenda, fila, caja, clientes, catalogo, promos, marketing, mensajes, reportes, equipo, ajustes };
  function pintar() { (vistas[sec] || inicio)(); el.onclick = onClick; }
  function onClick(e) {
    const x = e.target.closest('[data-est],[data-a],[data-nav],[data-dd],[data-b],[data-slot],[data-cob],[data-c],[data-seg],[data-s],[data-m],[data-tab],[data-ptab],[data-per],[data-xe],[data-p],[data-k],[data-mb],[data-of],[data-cu],[data-qok],[data-pv]'); if (!x) return;
    if (x.closest('.ev[data-b]')) return;
    if (x.dataset.est) { S.guardar('tenants', { id: tid, estilo: x.dataset.est }); toast('Estilo: ' + ESTILOS[x.dataset.est].n + ' ✦', 'spark'); return ajustes(); }
    vibrar(8); const d = x.dataset;
    if (d.nav) { if (d.nav === 'mas') return mas(); location.hash = `#/s/${T().slug}/panel/${d.nav}`; return; }
    if (d.dd !== undefined) { st.dia = d.dd === '0' ? S.ymd(new Date()) : S.ymd(S.addDays(S.parse(st.dia + 'T00:00'), +d.dd)); return agenda(); }
    if (d.tab) { st.tab = d.tab; return catalogo(); } if (d.ptab) { st.ptab = d.ptab; return promos(); } if (d.per) { st.per = d.per; return reportes(); }
    if (d.b) return cita(d.b);
    if (d.slot) { const [m, h] = d.slot.split('|'); return nueva({ m, h }); }
    if (d.cob) return cobrar(d.cob);
    if (d.c) return ficha(d.c);
    if (d.seg) { st.seg = d.seg; return clientes(); }
    if (d.s) return editSvc(d.s); if (d.xe !== undefined) return editExtra(d.xe || null); if (d.p) return editProd(d.p);
    if (d.k !== undefined && sec === 'catalogo') return editPaq(d.k || null); if (d.mb !== undefined) return editMem(d.mb || null);
    if (d.pv !== undefined) return editPromo(d.pv || null);
    if (d.of !== undefined) return editOferta(d.of || null); if (d.cu !== undefined) return editCupon(d.cu || null);
    if (d.m) return editMem2(d.m);
    if (d.qok) { const q = S.queue(tid).find(z => z.id === d.qok); S.guardar('queue', { id: q.id, estado: 'listo' }); const c = S.upsertClient(tid, { nombre: q.nombre, tel: q.tel || '' }); const ahora = new Date();
      const b = S.saveBooking({ id: S.uid('b'), tid, cid: c.id, items: [q.servicio], staffId: q.staffId, inicio: S.iso(ahora), dur: S.service(q.servicio)?.dur || 30, total: S.precio(q.servicio, q.staffId), estado: 'en curso', origen: 'sin cita', nota: 'Fila #' + q.numero, pago: { deposito: 0, pagado: 0, metodo: '' }, creado: S.iso(ahora), codigo: 'F-' + q.numero, avisos: {} }); return cobrar(b.id); }
    const a = d.a;
    if (a === 'compartir') { e.preventDefault(); S.guardar('tenants', { id: tid, compartido: true }); compartir(); } if (a === 'copiar') copiar(); if (a === 'nueva') nueva(); if (a === 'svc') editSvc(); if (a === 'prod') editProd(); if (a === 'mem') editMem2(); if (a === 'guardar') guardarAjustes();
    if (a === 'modo') { e.preventDefault(); S.guardar('tenants', { id: tid, modoInicio: !T().modoInicio }); toast(T().modoInicio ? 'Modo inicio: solo lo esencial' : 'Ahora ves todo el sistema', 'spark'); return pintar(); }
    if (a === 'canjear') canjear(); if (a === 'destacar') destacar();
    if (a === 'ncli') editCliente(); if (a === 'importar') importar(); if (a === 'venta') cobrar(null); if (a === 'gasto') gasto();
    if (a === 'exportar') csv('clientes-' + T().slug, [['Nombre', 'WhatsApp', 'Correo', 'Cumpleaños', 'Sellos', 'Membresía', 'Etiquetas', 'Notas'], ...S.clients(tid).map(c => [c.nombre, c.tel, c.email, c.cumple, c.sellos, c.membresia || '', c.etiquetas || '', c.notas || ''])]);
    if (a === 'xls') csv('ventas-' + T().slug, [['Fecha', 'Cliente', 'Profesional', 'Concepto', 'Subtotal', 'ITBMS', 'Propina', 'Total', 'Método'], ...S.sales(tid).map(v => [v.fecha.replace('T', ' '), S.client(v.cid)?.nombre || '', S.member(v.staffId)?.nombre || '', v.concepto || (S.booking(v.bid)?.items || []).map(i => S.service(i)?.nombre).join(' + '), v.sub, v.itbms, v.propina || 0, v.total, v.metodo])]);
    if (a === 'qadd') { sheet(`<h2>Agregar a la fila</h2><div class="field"><label>Nombre</label><input id="qa-n" autofocus></div><div class="field"><label>Servicio</label><select id="qa-s">${S.services(tid).map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join('')}</select></div><button class="btn w" id="qa-ok">Agregar</button>`); $('#qa-ok').onclick = () => { if (!$('#qa-n').value.trim()) return; S.unirseFila(tid, { nombre: $('#qa-n').value.trim(), tel: '', servicio: $('#qa-s').value }); closeSheet(); toast('Agregado a la fila'); }; }
    if (a === 'vregalo') { sheet(`<h2>Vender tarjeta de regalo</h2><div class="grid g2"><div class="field"><label>Monto</label><input id="vg-m" type="number" value="25"></div><div class="field"><label>Método</label><select id="vg-k">${METODOS.map(k => `<option>${k}</option>`).join('')}</select></div></div><div class="field"><label>Para</label><input id="vg-p"></div><div class="field"><label>De</label><input id="vg-d"></div><button class="btn w" id="vg-ok">Vender</button>`);
      $('#vg-ok').onclick = () => { const g = S.venderRegalo(tid, { monto: +$('#vg-m').value || 0, para: $('#vg-p').value, de: $('#vg-d').value, metodo: $('#vg-k').value }); closeSheet(); toast('Tarjeta ' + g.codigo + ' creada'); }; }
    if (a === 'refsw') { x.classList.toggle('on'); S.saveTenant({ id: tid, referidos: { ...T().referidos, activo: x.classList.contains('on') } }); }
    if (a === 'quitarfotos') { S.saveTenant({ id: tid, portada: '', logo: '' }); ajustes(); }
    if (a === 'addcz') { const f = $('#a-czf').value; if (!f) return toast('Elige la fecha', 'cal'); S.saveTenant({ id: tid, cierres: [...(T().cierres || []), { fecha: f, motivo: $('#a-czm').value || 'Cerrado' }] }); ajustes(); }
    if (a === 'addsuc') { S.saveTenant({ id: tid, sucursales: [...(T().sucursales || []), { id: S.uid('su'), nombre: 'Nueva sucursal', dir: '' }] }); ajustes(); }
    if (a === 'salir') { sessionStorage.removeItem(key); location.hash = '#/'; }
    if (a === 'cierre') { const hoy = S.ymd(new Date()); const vs = S.sales(tid).filter(v => v.fecha.startsWith(hoy)); const tot = vs.reduce((a2, v) => a2 + v.cobrado, 0); const gas = S.expenses(tid).filter(z => z.fecha === hoy).reduce((a2, z) => a2 + z.monto, 0);
      sheet(`<div class="c"><h2>Cierre del día</h2><p class="mut sm">${fechaL(new Date())}</p><div style="font-size:44px;font-weight:800;margin:12px 0" class="grad-t">${S.money(tot)}</div></div>
        ${METODOS.map(k => `<div class="stat-line"><span>${k}</span><span>${S.money(vs.filter(v => v.metodo === k).reduce((a2, v) => a2 + v.cobrado, 0))}</span></div>`).join('')}
        <div class="stat-line"><span>ITBMS a declarar</span><span>${S.money(vs.reduce((a2, v) => a2 + v.itbms, 0))}</span></div><div class="stat-line"><span>Propinas del equipo</span><span>${S.money(vs.reduce((a2, v) => a2 + (v.propina || 0), 0))}</span></div><div class="stat-line"><span>Gastos del día</span><span>-${S.money(gas)}</span></div>
        <h3 style="margin:14px 0 6px">Por profesional</h3>${S.staff(tid).map(m => `<div class="stat-line"><span>${esc(m.nombre)}</span><span>${S.money(vs.filter(v => v.staffId === m.id).reduce((a2, v) => a2 + v.sub, 0))}</span></div>`).join('')}
        <button class="btn w" style="margin-top:16px" onclick="window.print()">Imprimir resumen</button>`); }
  }
  const off = S.onChange(() => {
    if (!sessionStorage.getItem(key)) return;
    if (document.querySelector('.sheet') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || $('.ev.drag')) return;
    const y = scrollY; pintar(); scrollTo(0, y);
    const n = S.bookings(tid).filter(b => b.origen === 'app').sort((a, b) => b.creado.localeCompare(a.creado))[0];
    if (n && n.id !== window.__ultimaGlow && n.creado >= S.iso(new Date(Date.now() - 60000))) { window.__ultimaGlow = n.id; toast(`📱 Nueva reserva: ${S.client(n.cid)?.nombre} · ${h12(n.inicio.slice(11))}`, 'bell'); }
    const ll = S.outbox(tid).filter(m => m.canal === 'Panel' && !m.visto && m.tipo === 'Llegada').pop();
    if (ll && ll.id !== window.__ultimaLl) { window.__ultimaLl = ll.id; toast('🟢 ' + ll.texto, 'bell'); }
  });
  sessionStorage.getItem(key) ? pintar() : gate();
  return () => { off(); el.onclick = null; };
}
