import * as S from './store.js';
import { $, $$, esc, ic, ini, h12, fechaL, durL, DIAS, MESES, toast, sheet, closeSheet, confetti, tilt, setBrand, vibrar, ics, wa, estrellas, avatar } from './ui.js';
import qrcode from '../vendor/qrcode.mjs';

const PAISES = [['507', '🇵🇦'], ['1', '🇺🇸'], ['57', '🇨🇴'], ['58', '🇻🇪'], ['506', '🇨🇷'], ['52', '🇲🇽'], ['593', '🇪🇨'], ['51', '🇵🇪'], ['34', '🇪🇸'], ['53', '🇨🇺'], ['505', '🇳🇮'], ['54', '🇦🇷']];
const T_EN = { 'Reservar cita': 'Book now', 'Servicios': 'Services', 'Nuestro equipo': 'Our team', 'Ofertas': 'Deals', 'Lo que dicen': 'Reviews', 'Productos': 'Products', 'Regala': 'Gift', 'Sin cita': 'Walk-in', 'Mis citas': 'My bookings', '¿Con quién?': 'Who?', '¿Cuándo?': 'When?', 'Confirma tu cita': 'Confirm', 'Continuar': 'Continue', 'Todos': 'All', 'Elegir profesional': 'Choose professional', 'Elegir hora': 'Choose time', 'Confirmar reserva': 'Confirm booking', 'Horario y ubicación': 'Hours & location', 'Invita y gana': 'Invite & earn', 'Membresías': 'Memberships' };

export function render(el, [slug]) {
  const t0 = S.tenant(slug); if (!t0) { el.innerHTML = `<div class="wrap empty"><h2>No encontramos este negocio</h2><p><a class="btn" href="#/">Ir a Glow</a></p></div>`; return; }
  const tid = t0.id; const T = () => S.tenant(tid);
  setBrand(t0); document.title = t0.nombre + ' · Reservas';
  if (T().estado !== 'activo') { el.innerHTML = `<div class="wrap empty"><h2>${esc(t0.nombre)}</h2><p>Las reservas en línea están en pausa. Escríbenos por WhatsApp.</p></div>`; return; }
  S.procesarAvisos(tid);
  const yoKey = 'glow.yo.' + tid;
  const yo = () => { try { return JSON.parse(localStorage.getItem(yoKey)) || {}; } catch (e) { return {}; } };
  let lang = localStorage.getItem('glow.lang') || 'es'; const L = s => lang === 'en' ? (T_EN[s] || s) : s;
  const qs = new URLSearchParams(location.hash.split('?')[1] || '');
  const ref = qs.get('ref') || sessionStorage.getItem('glow.ref.' + tid) || '';
  if (ref) sessionStorage.setItem('glow.ref.' + tid, ref);
  const st = { paso: 0, items: [], extras: [], staffId: null, fecha: null, hora: null, asignado: null, cat: null, reag: null, suc: T().sucursales?.[0]?.id || 'principal', cupon: ref && S.cuponValido(tid, 'AMIGO-' + ref) ? 'AMIGO-' + ref : '' };
  const pasos = ['Servicios', 'Profesional', 'Día y hora', 'Confirmar'];
  const suc = () => (T().sucursales || []).find(s => s.id === st.suc) || T().sucursales?.[0];
  const prosSuc = () => S.staff(tid).filter(m => !T().sucursales || T().sucursales.length < 2 || (m.sucursal || 'principal') === st.suc);
  const miCliente = () => { const y = yo(); if (!y.tel) return null; const d = String(y.tel).replace(/\D/g, '').slice(-8); return S.clients(tid).find(x => x.tel.replace(/\D/g, '').slice(-8) === d); };

  function abierto() {
    const t = T(); const d = new Date(), m = d.getHours() * 60 + d.getMinutes(); const h = (t.horario[d.getDay()] || []).map(([a, b]) => [S.toMin(a), S.toMin(b)]);
    const cz = (t.cierres || []).find(c => c.fecha === S.ymd(d)); if (cz) return `<span class="pill">Hoy cerrado · ${esc(cz.motivo)}</span>`;
    const ab = h.find(([a, b]) => m >= a && m < b); if (ab) return `<span class="pill"><i class="dot"></i> Abierto · cierra ${h12(S.fromMin(ab[1]))}</span>`;
    for (let i = 0; i < 7; i++) { const dd = S.addDays(d, i); const hh = t.horario[dd.getDay()] || []; const nx = hh.find(([a]) => i > 0 || S.toMin(a) > m); if (nx) return `<span class="pill">Cerrado · abre ${i === 0 ? 'hoy' : i === 1 ? 'mañana' : DIAS[dd.getDay()]} ${h12(nx[0])}</span>`; }
    return '';
  }
  const rating = sid => { const r = S.reviews(tid).filter(x => !sid || x.staffId === sid); return r.length ? [(r.reduce((a, x) => a + x.estrellas, 0) / r.length).toFixed(1), r.length] : null; };
  const q = () => S.cotizar(tid, { items: st.items, extras: st.extras, staffId: st.asignado || st.staffId, cupon: st.cupon });
  const precioTxt = s => { const ps = Object.values(s.precios || {}).map(Number).filter(n => !isNaN(n)); const min = Math.min(s.precio, ...ps), max = Math.max(s.precio, ...ps); return (s.desde || min !== max ? 'desde ' : '') + S.money(min); };

  function shell(body, dock = '', conChat = true) {
    el.innerHTML = `
    <header class="top"><div class="wrap in-top">
      ${st.paso > 0 && st.paso < 5 ? `<button class="ico" data-a="atras" aria-label="Atrás">${ic('back')}</button>` : `<div class="av r" style="width:38px;height:38px;font-size:13px">${esc(ini(T().nombre))}</div>`}
      <div class="g"><div class="b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(T().nombre)}</div>${st.paso > 0 && st.paso < 5 ? `<div class="steps" style="margin-top:6px">${pasos.map((_, i) => `<i class="${i < st.paso ? 'on' : ''}"></i>`).join('')}</div>` : `<div class="xs mut">${esc(suc()?.nombre || T().zona)}</div>`}</div>
      ${st.paso === 0 ? `<button class="ico" data-a="lang" title="Idioma" style="font-size:12px;font-weight:700">${lang === 'es' ? 'EN' : 'ES'}</button>` : ''}
      <button class="ico" data-a="mis" aria-label="${L('Mis citas')}">${ic('cal')}</button>
    </div></header>
    <main class="wrap pb">${body}</main>${dock}${conChat && st.paso === 0 && !st.items.length ? `<button class="chat" data-a="chat" aria-label="Asistente">${ic('spark', 24)}</button>` : ''}`;
    tilt(el);
  }

  /* ================= PÁGINA DEL SALÓN + SERVICIOS ================= */
  function inicio() {
    st.paso = 0; const t = T();
    const svs = S.services(tid); const cats = [...new Set(svs.map(s => s.cat))];
    const lista = svs.filter(s => !s.oculto && (!st.cat || s.cat === st.cat) && (!st.q || s.nombre.toLowerCase().includes(st.q.toLowerCase())));
    const c = miCliente(); const ahora = S.iso(new Date());
    const prox = c ? S.activas(tid).filter(b => b.cid === c.id && ['confirmada', 'llegó'].includes(b.estado) && b.inicio.slice(0, 10) >= ahora.slice(0, 10)).sort((a, b) => a.inicio.localeCompare(b.inicio))[0] : null;
    const ofs = S.offers(tid).filter(o => o.activa && (!o.vence || o.vence >= S.ymd(new Date())));
    const rt = rating(); const fila = S.esperaFila(tid); const ps = S.products(tid).filter(p => p.stock > 0).slice(0, 8); const pk = S.packages(tid).filter(k => k.activo);
    const mem = (t.membresias || []).filter(m => m.activa); const rs = S.reviews(tid);
    const mes0 = S.ymd(new Date()).slice(0, 7); const top = Object.entries(S.bookings(tid).filter(b => b.inicio.startsWith(mes0) && b.estado !== 'cancelada').flatMap(b => b.items).reduce((o, k) => (o[k] = (o[k] || 0) + 1, o), {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const pop = new Set(top.slice(0, 3).map(x => x[0]));
    shell(`
      <section class="cover in" style="margin-top:14px;${t.portada ? `background:linear-gradient(180deg,rgba(10,12,18,.15),rgba(10,12,18,.78)),url(${t.portada}) center/cover;min-height:330px;display:flex;flex-direction:column;justify-content:flex-end` : ''}">
        <div style="position:relative;z-index:1"><div class="row">${t.logo ? `<div class="av lg" style="background:#fff url(${t.logo}) center/contain no-repeat;box-shadow:0 8px 20px -8px rgba(0,0,0,.5)"></div>` : `<div class="av lg" style="--c:#fff;color:var(--brand)">${esc(ini(t.nombre))}</div>`}<div class="g"><div class="b" style="font-size:18px">${esc(t.nombre)}</div>${rt ? `<div class="row" style="gap:6px">${estrellas(+rt[0], 15)}<span class="sm b">${rt[0]}</span><span class="xs" style="opacity:.85">(${rt[1]} reseñas)</span></div>` : ''}</div></div>
        <div class="row wrapx" style="gap:6px;margin-top:12px">${abierto()}</div>
        <h1 style="font-size:30px;margin:12px 0 4px">${esc(t.lema || 'Reserva en segundos.')}</h1><div class="mut sm">${esc(S.TIPOS[t.tipo] || '')} · ${esc(suc()?.dir || t.zona)}</div>
        ${(t.sucursales || []).length > 1 ? `<div class="seg" style="margin-top:14px;background:rgba(255,255,255,.18)">${t.sucursales.map(s => `<button class="${st.suc === s.id ? 'on' : ''}" data-suc="${s.id}" style="${st.suc === s.id ? '' : 'color:#fff'}">${esc(s.nombre)}</button>`).join('')}</div>` : ''}
        <div class="row" style="margin-top:16px"><button class="btn g" data-a="scrollsvc" style="background:#fff;color:#0F1420">${ic('cal', 18)} ${L('Reservar cita')}</button>${t.fila ? `<button class="btn ghost" data-a="fila" style="background:rgba(255,255,255,.16);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)">${ic('users', 17)} ${L('Sin cita')}</button>` : ''}</div>
        ${t.fila && fila.length ? `<div class="xs" style="margin-top:10px;opacity:.9">${fila.length} persona${fila.length > 1 ? 's' : ''} en fila · espera aprox. ${fila[fila.length - 1].min + 15} min</div>` : ''}</div>
      </section>
      ${(t.galeria || []).length ? `<div class="scroll-x in2" style="margin-top:12px">${t.galeria.map((g, i) => `<div data-gal="${i}" style="flex:none;width:${i === 0 ? 220 : 140}px;height:140px;border-radius:18px;background:url(${g}) center/cover;cursor:pointer;box-shadow:var(--sh)"></div>`).join('')}</div>` : ''}
      ${prox ? `<div class="card glass in2" style="margin-top:14px;cursor:pointer" data-a="pase" data-b="${prox.id}"><div class="row"><div class="ico" style="background:var(--grad);color:var(--ink);border:0">${ic('qr')}</div><div class="g"><div class="xs mut">Tu próxima cita</div><div class="b">${fechaL(S.parse(prox.inicio))} · ${h12(prox.inicio.slice(11))}</div></div><span class="btn sm">Ver pase</span></div></div>` : ''}
      <nav class="seg" style="position:sticky;top:70px;z-index:20;margin-top:14px;width:100%;justify-content:space-between;box-shadow:0 6px 20px -12px rgba(15,20,32,.3)">${[['svcs', L('Servicios')], ['equipo', 'Equipo'], ['resenas', 'Reseñas'], ['info', 'Info']].map(([k, l]) => `<button data-ir="${k}" style="flex:1">${l}</button>`).join('')}</nav>
      ${top.length ? `<div class="in2" style="margin-top:22px"><div class="row sp"><h2>Lo más pedido</h2><span class="xs mut">este mes</span></div><div class="scroll-x" style="margin-top:12px">${top.map(([sid, n], i) => { const sv = S.service(sid); return sv ? `<div class="card flat" style="min-width:210px"><div class="row sp"><span class="pill ${i === 0 ? 'br' : ''}">N.º ${i + 1} en reservas</span></div><div class="b" style="margin-top:10px">${esc(sv.nombre)}</div><div class="xs mut">${durL(sv.dur)} · ${n} clientes este mes</div><div class="row sp" style="margin-top:10px"><b>${precioTxt(sv)}</b><button class="btn sm" data-svc="${sv.id}" data-go="1">Reservar</button></div></div>` : ''; }).join('')}</div></div>` : ''}
      ${ofs.length ? `<div class="in2" style="margin-top:22px"><h2>${L('Ofertas')}</h2><div class="scroll-x" style="margin-top:12px">${ofs.map(o => `<div class="offer" data-of="${o.id}" style="cursor:pointer"><span class="tag">${o.tipo === 'pct' ? '-' + o.valor + '%' : '-' + S.money(o.valor)}</span><div class="b" style="padding-right:60px">${esc(o.titulo)}</div><p class="sm mut" style="margin:6px 0 10px">${esc(o.desc)}</p><span class="xs mut">${o.vence ? 'Hasta el ' + S.parse(o.vence + 'T00:00').getDate() + ' ' + MESES[S.parse(o.vence + 'T00:00').getMonth()] : 'Por tiempo limitado'}</span></div>`).join('')}</div></div>` : ''}
      <div class="in3" style="margin-top:24px" id="svcs"><h2>${L('Servicios')}</h2>
        <div style="position:relative;margin-top:12px"><input id="buscar" placeholder="Buscar servicio" value="${esc(st.q || '')}" style="padding-left:42px"><span style="position:absolute;left:14px;top:13px;color:var(--mut)">${ic('search', 18)}</span></div>
        <div class="scroll-x" style="margin:12px -18px 14px"><button class="chip ${!st.cat ? 'on' : ''}" data-cat="">${L('Todos')}</button>${cats.map(k => `<button class="chip ${st.cat === k ? 'on' : ''}" data-cat="${esc(k)}">${esc(k)}</button>`).join('')}</div>
        <div class="col stagger">${lista.map(s => { const of = S.ofertaActiva(tid, s.id); return `
          <div class="svc ${st.items.includes(s.id) ? 'on' : ''}" data-svc="${s.id}">
            <div class="g"><div class="b">${esc(s.nombre)}${pop.has(s.id) ? ' <span class="pill br" style="font-size:10px;padding:1px 7px">Popular</span>' : ''}</div><div class="xs mut">${durL(s.dur)}${of ? ` · <span style="color:var(--brand);font-weight:600">${of.tipo === 'pct' ? '-' + of.valor + '%' : '-' + S.money(of.valor)}</span>` : ''}</div>${s.desc ? `<div class="xs dim">${esc(s.desc)}</div>` : ''}</div>
            <div class="b" style="text-align:right;white-space:nowrap">${precioTxt(s)}</div><div class="chk">${st.items.includes(s.id) ? ic('check', 15) : ''}</div>
          </div>`; }).join('')}</div>
      </div>
      <div style="margin-top:26px" id="equipo"><h2>${L('Nuestro equipo')}</h2><div class="scroll-x" style="margin-top:12px"><div class="card flat c" style="min-width:160px;cursor:pointer" data-cual="1"><div class="av lg r" style="margin:0 auto;--c:var(--grad)">${ic('bolt', 26)}</div><div class="b" style="margin-top:10px">Cualquiera</div><div class="xs mut">El más pronto</div><span class="btn sm" style="margin-top:10px">Reservar</span></div>${prosSuc().map(m => { const r = rating(m.id); return `<div class="card tilt c" style="min-width:170px;cursor:pointer" data-verpro="${m.id}"><div class="pop">${avatar(m, 'lg r', 'margin:0 auto')}<div class="b" style="margin-top:10px">${esc(m.nombre)}</div><div class="xs mut">${esc(m.rol.split('·')[0])}</div>${r ? `<div class="xs" style="margin-top:4px">${estrellas(+r[0], 12)} <span class="mut">${r[0]}</span></div>` : ''}<span class="btn ghost sm" style="margin-top:10px">Ver perfil</span></div></div>`; }).join('')}</div></div>
      <div class="card glass" style="margin-top:22px"><div class="row sp"><div><div class="xs mut">Programa de fidelidad</div><h3>${esc(t.fidelidad?.premio || 'Premio')} al completar ${t.fidelidad?.meta || 10} visitas</h3></div><div style="font-size:30px">🎁</div></div>
        <div class="grid g2" style="margin-top:10px"><div class="sm"><b>Cómo ganas:</b> 1 sello por cada visita.</div><div class="sm"><b>Cómo canjeas:</b> al llenar tu tarjeta, tu premio se aplica solo en tu próxima cita.</div></div>
        <div class="row" style="margin-top:12px"><button class="btn sm g" data-a="tarjeta">${ic('gift', 15)} Ver mi tarjeta</button><button class="btn dark sm g" data-a="wallet"> Apple Wallet</button></div></div>
      ${mem.length ? `<div style="margin-top:24px"><h2>${L('Membresías')}</h2><p class="mut sm" style="margin:4px 0 12px">Paga al mes y ven cuando quieras. Cancela cuando quieras.</p><div class="scroll-x">${mem.map((m, i) => `<div class="card ${i === 1 ? 'glass' : 'flat'}" style="min-width:230px"><div class="row sp"><div class="b">${esc(m.nombre)}</div>${i === 1 ? '<span class="pill br">Popular</span>' : ''}</div><div style="font-size:28px;font-weight:800;margin:6px 0">${S.money(m.precio)}<span class="xs mut">/mes</span></div><div class="sm mut">${esc(m.incluye)}</div><button class="btn sm w" style="margin-top:12px" data-mem="${m.id}">Quiero esta</button></div>`).join('')}</div></div>` : ''}
      <div class="grid g2" style="margin-top:22px">
        <div class="card flat tilt" data-a="regalo" style="cursor:pointer"><div class="pop"><div style="font-size:28px">🎁</div><div class="b" style="margin-top:6px">${L('Regala')} ${esc(t.nombre)}</div><div class="xs mut">Tarjeta de regalo digital</div></div></div>
        <div class="card flat tilt" data-a="invita" style="cursor:pointer"><div class="pop"><div style="font-size:28px">💌</div><div class="b" style="margin-top:6px">${L('Invita y gana')}</div><div class="xs mut">${t.referidos?.pct || 10}% para tu amigo, sello para ti</div></div></div>
        ${pk.map(k => `<div class="card flat" style="grid-column:1/-1"><div class="row"><div style="font-size:26px">🎟️</div><div class="g"><div class="b">${esc(k.nombre)}</div><div class="xs mut">${k.sesiones} visitas · válido ${k.dias} días · ahorras ${S.money(Math.max(0, (S.service(k.servicio)?.precio || 0) * k.sesiones - k.precio))}</div></div><div class="b">${S.money(k.precio)}</div></div></div>`).join('')}</div>
      ${ps.length ? `<div style="margin-top:24px"><div class="row sp"><h2>${L('Productos')}</h2><span class="xs mut">Pídelos en tu cita</span></div><div class="scroll-x" style="margin-top:12px">${ps.map(p => `<div class="card flat" style="min-width:150px"><div style="height:70px;border-radius:14px;background:var(--soft);display:grid;place-items:center;font-size:30px">${p.emoji || '🧴'}</div><div class="sm b" style="margin-top:8px">${esc(p.nombre)}</div><div class="sm">${S.money(p.precio)}</div></div>`).join('')}</div></div>` : ''}
      ${rs.length ? `<div style="margin-top:26px" id="resenas"><div class="row sp"><h2>${L('Lo que dicen')}</h2></div>
        <div class="card flat" style="margin-top:12px"><div class="row" style="gap:20px"><div class="c"><div style="font-size:44px;font-weight:800;line-height:1">${rt[0]}</div>${estrellas(+rt[0], 14)}<div class="xs mut">${rt[1]} reseñas</div></div><div class="g">${[5, 4, 3, 2, 1].map(n => { const k = rs.filter(r => r.estrellas === n).length; return `<div class="row" style="gap:8px;margin:3px 0"><span class="xs" style="width:22px">${n}★</span><div class="g" style="height:7px;border-radius:9px;background:var(--card2);overflow:hidden"><div style="height:100%;width:${k / rs.length * 100}%;background:#F5A623;border-radius:9px"></div></div><span class="xs mut" style="width:22px;text-align:right">${k}</span></div>`; }).join('')}</div></div></div><div class="scroll-x" style="margin-top:10px">${rs.slice(-8).reverse().map(r => `<div class="card flat" style="min-width:240px"><div style="color:var(--warn)">${'★'.repeat(r.estrellas)}</div><p class="sm" style="margin:6px 0">${esc(r.texto)}</p><div class="xs mut">${esc(S.client(r.cid)?.nombre?.split(' ')[0] || 'Cliente')}${r.staffId ? ' · con ' + esc(S.member(r.staffId)?.nombre || '') : ''}</div></div>`).join('')}</div></div>` : ''}
      <div class="card flat pad0" style="margin-top:22px" id="info"><iframe title="Mapa" loading="lazy" style="width:100%;height:200px;border:0;display:block" src="https://www.openstreetmap.org/export/embed.html?bbox=${(S.geoDe(t)[1] - .008).toFixed(4)},${(S.geoDe(t)[0] - .005).toFixed(4)},${(S.geoDe(t)[1] + .008).toFixed(4)},${(S.geoDe(t)[0] + .005).toFixed(4)}&layer=mapnik&marker=${S.geoDe(t)[0].toFixed(5)},${S.geoDe(t)[1].toFixed(5)}"></iframe><div style="padding:16px"><h3>${L('Horario y ubicación')}</h3><div class="sm" style="margin-top:10px">${horarioTxt()}</div><hr><div class="row">${ic('globe')}<div class="g sm">${esc(suc()?.dir || t.zona)}</div><a class="btn ghost sm" target="_blank" href="https://maps.google.com/?q=${encodeURIComponent(t.nombre + ' ' + (suc()?.dir || t.zona))}">Cómo llegar</a></div><hr><div class="sm mut">${esc(t.politica)}</div>
        ${t.tel ? `<a class="btn ghost w sm" style="margin-top:12px" href="${wa(t.tel, 'Hola ' + t.nombre + ', tengo una pregunta.')}" target="_blank">${ic('wa', 16)} WhatsApp</a>` : ''}</div></div>
      <p class="c xs dim" style="margin-top:22px">Reservas con <img src="img/glow-logo-dark.png" alt="Glow" style="height:13px;vertical-align:-2px"></p>
    `, st.items.length ? dockHtml(L('Elegir profesional')) : '');
    const bq = $('#buscar', el); if (bq) bq.oninput = () => { st.q = bq.value; const y = scrollY, p = bq.selectionStart; inicio(); scrollTo(0, y); const n = $('#buscar', el); n.focus(); n.setSelectionRange(p, p); };
  }
  function horarioTxt() { const t = T(); return [1, 2, 3, 4, 5, 6, 0].map(d => { const h = t.horario[d] || []; const hoy = new Date().getDay() === d; return `<div class="row sp" style="padding:3px 0;${hoy ? 'font-weight:600' : ''}"><span class="${hoy ? '' : 'mut'}">${DIAS[d]}${hoy ? ' · hoy' : ''}</span><span>${h.length ? h.map(([a, b]) => h12(a) + ' – ' + h12(b)).join(', ') : 'Cerrado'}</span></div>`; }).join('') + ((t.cierres || []).filter(c => c.fecha >= S.ymd(new Date())).slice(0, 3).map(c => `<div class="xs" style="color:var(--bad);margin-top:6px">Cerrado el ${S.parse(c.fecha + 'T00:00').getDate()} ${MESES[S.parse(c.fecha + 'T00:00').getMonth()]} · ${esc(c.motivo)}</div>`).join('')); }
  const dockHtml = (txt) => { const c = q(); return `<div class="dock"><div class="card glass"><div class="g"><div class="b">${S.money(c.total)}${c.descuento ? ` <s class="xs dim">${S.money(c.sub)}</s>` : ''} <span class="mut xs">· ${durL(c.dur)}</span></div><div class="xs mut">${st.items.length} servicio${st.items.length > 1 ? 's' : ''}${st.extras.length ? ' + ' + st.extras.length + ' extra' : ''}</div></div><button class="btn" data-a="sig">${txt} ${ic('next', 16)}</button></div></div>`; };

  /* ================= PROFESIONAL + EXTRAS ================= */
  function profesional() {
    st.paso = 1;
    const pros = prosSuc().filter(m => S.puede(m, st.items)); const ids = pros.map(m => m.id);
    const exd = S.extrasDe(tid).filter(e => st.extras.includes(e.id)).reduce((a, e) => a + (e.dur || 0), 0);
    const prox = m => { for (let i = 0; i < 14; i++) { const d = S.addDays(new Date(), i); const s = S.slots(tid, st.items, m, d, 15, exd).filter(x => ids.includes(x.staffId))[0]; if (s) return (i === 0 ? 'hoy' : i === 1 ? 'mañana' : DIAS[d.getDay()] + ' ' + d.getDate()) + ' ' + h12(s.hora); } return 'sin espacios'; };
    const precioCon = m => S.money(st.items.reduce((a, i) => a + S.precio(i, m), 0));
    const exs = S.extrasDe(tid);
    shell(`<h2 class="in" style="margin:18px 0 4px">${L('¿Con quién?')}</h2><p class="mut sm in">Elige a tu profesional o el primer espacio libre.</p>
      <div class="col stagger" style="margin-top:14px">
        <div class="svc ${st.staffId === null ? 'on' : ''}" data-pro=""><div class="av r" style="--c:var(--grad)">${ic('bolt', 20)}</div><div class="g"><div class="b">Cualquiera</div><div class="xs mut">El más pronto: ${prox(null)}</div></div><div class="chk">${st.staffId === null ? ic('check', 15) : ''}</div></div>
        ${pros.map(m => { const r = rating(m.id); return `<div class="svc ${st.staffId === m.id ? 'on' : ''}" data-pro="${m.id}">${avatar(m, 'r')}<div class="g"><div class="b">${esc(m.nombre)} ${r ? `<span class="xs" style="color:var(--warn)">★ ${r[0]}</span>` : ''}</div><div class="xs mut">${esc(m.rol)} · próximo: ${prox(m.id)}</div></div><div class="b sm">${precioCon(m.id)}</div><div class="chk">${st.staffId === m.id ? ic('check', 15) : ''}</div></div>`; }).join('')}
      </div>
      ${exs.length ? `<h3 style="margin:24px 0 4px">¿Agregas algo?</h3><p class="mut xs" style="margin:0 0 10px">Extras opcionales</p><div class="row wrapx">${exs.map(e => `<button class="chip ${st.extras.includes(e.id) ? 'on' : ''}" data-ex="${e.id}">${st.extras.includes(e.id) ? '✓ ' : '+ '}${esc(e.nombre)} · ${S.money(e.precio)}</button>`).join('')}</div>` : ''}`, dockHtml(L('Elegir hora')));
  }

  /* ================= DÍA Y HORA ================= */
  function hora() {
    st.paso = 2; const hoy = new Date(); const exd = S.extrasDe(tid).filter(e => st.extras.includes(e.id)).reduce((a, e) => a + (e.dur || 0), 0);
    const pros = prosSuc().map(m => m.id);
    const sl = d => S.slots(tid, st.items, st.staffId, d, 15, exd).filter(x => pros.includes(x.staffId));
    const dias = Array.from({ length: 28 }, (_, i) => S.addDays(hoy, i));
    if (!st.fecha) st.fecha = S.ymd(dias.find(d => sl(d).length) || hoy);
    const ss = sl(S.parse(st.fecha + 'T00:00'));
    const grupos = [['Mañana', 0, 720], ['Tarde', 720, 1080], ['Noche', 1080, 1440]].map(([n, a, b]) => [n, ss.filter(s => S.toMin(s.hora) >= a && S.toMin(s.hora) < b)]).filter(g => g[1].length);
    const f0 = S.parse(st.fecha + 'T00:00');
    shell(`<h2 class="in" style="margin:18px 0 12px">${L('¿Cuándo?')}</h2>
      <div class="xs mut" style="margin-bottom:6px;text-transform:capitalize">${MESES[f0.getMonth()]} ${f0.getFullYear()}</div>
      <div class="days in2">${dias.map(d => { const k = S.ymd(d); const n = sl(d).length; return `<div class="day ${k === st.fecha ? 'on' : ''} ${n ? '' : 'off'}" data-dia="${k}"><small>${DIAS[d.getDay()]}</small><b>${d.getDate()}</b>${n ? `<i class="lv" style="${n < 6 ? 'background:var(--warn)' : ''}"></i>` : ''}</div>`; }).join('')}</div>
      ${grupos.length ? grupos.map(([n, g]) => `<div class="in3" style="margin-top:16px"><div class="row sp"><h3>${n}</h3><span class="xs mut">${g.length} libres</span></div><div class="slots stagger" style="margin-top:10px">${g.map(s => `<div class="slot ${st.hora === s.hora ? 'on' : ''}" data-hora="${s.hora}|${s.staffId}">${h12(s.hora)}</div>`).join('')}</div></div>`).join('')
        : `<div class="card c" style="margin-top:20px"><h3>Este día está lleno</h3><p class="mut sm">Únete a la lista de espera y te avisamos si se libera un espacio.</p><button class="btn ghost" data-a="espera">${ic('bell', 16)} Avisarme si se libera</button></div>`}
      <p class="xs dim c" style="margin-top:16px">Punto verde: muchos espacios · amarillo: quedan pocos</p>
    `, st.hora ? `<div class="dock"><div class="card glass"><div class="g"><div class="b">${fechaL(f0)}</div><div class="xs mut">${h12(st.hora)} · con ${esc(S.member(st.asignado).nombre)}</div></div><button class="btn" data-a="sig">${L('Continuar')} ${ic('next', 16)}</button></div></div>` : '');
    const on = $('.day.on', el); on && on.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  /* ================= CONFIRMAR ================= */
  function confirmar() {
    st.paso = 3; const y = yo(); const t = T(); const c = q(); const m = S.member(st.asignado);
    const dep = t.deposito?.activo ? Math.ceil(c.total * (t.deposito.pct || 20) / 100) : 0;
    const pais = y.pais || '507';
    shell(`<h2 class="in" style="margin:18px 0 14px">${L('Confirma tu cita')}</h2>
      <div class="card glass tilt in2"><div class="row pop"><div class="av r" style="--c:${m.color}">${esc(ini(m.nombre))}</div><div class="g"><div class="b">${fechaL(S.parse(st.fecha + 'T00:00'))}</div><div class="mut sm">${h12(st.hora)} · ${durL(c.dur)} · con ${esc(m.nombre)}</div><div class="xs mut">${esc(suc()?.nombre || '')}</div></div></div>
        <hr>${c.lineas.map(l => `<div class="row sp sm" style="margin:6px 0"><span>${esc(l.nombre)}${l.oferta ? ` <span class="pill br" style="font-size:10px">${esc(l.oferta)}</span>` : ''}</span><span>${S.money(l.base)}</span></div>`).join('')}
        ${c.extras.map(e => `<div class="row sp sm" style="margin:6px 0"><span class="mut">+ ${esc(e.nombre)}</span><span>${S.money(e.precio)}</span></div>`).join('')}
        ${c.descuento ? `<div class="row sp sm" style="margin:6px 0;color:var(--ok)"><span>Descuentos${c.cupon ? ' · ' + esc(c.cupon.codigo) : ''}</span><span>-${S.money(c.descuento)}</span></div>` : ''}
        <div class="row sp" style="margin-top:10px"><span class="b">Total</span><span class="b" style="font-size:22px">${S.money(c.total)}</span></div><div class="xs dim">+ ITBMS 7% al pagar en el local</div></div>
      <div class="row in3" style="margin-top:12px"><input id="f-cup" placeholder="¿Tienes un cupón?" value="${esc(st.cupon)}" style="text-transform:uppercase"><button class="btn ghost" data-a="cupon">Aplicar</button></div>
      <div class="in3" style="margin-top:14px">
        <div class="field"><label>Tu nombre</label><input id="f-nom" autocomplete="name" value="${esc(y.nombre || '')}" placeholder="Nombre y apellido"></div>
        <div class="field"><label>WhatsApp</label><div class="row"><select id="f-pais" style="width:112px;flex:none">${PAISES.map(([k, f]) => `<option value="${k}" ${k === pais ? 'selected' : ''}>${f} +${k}</option>`).join('')}</select><input id="f-tel" type="tel" inputmode="tel" autocomplete="tel" value="${esc(y.telLocal || '')}" placeholder="6000-0000"></div></div>
        <div class="field"><label>Nota (opcional)</label><input id="f-nota" placeholder="Ej.: es mi primera vez"></div>
      </div>
      ${dep ? `<div class="card flat in4"><div class="row"><div class="ico">${ic('lock')}</div><div class="g"><div class="b">Depósito para apartar: ${S.money(dep)}</div><div class="xs mut">Se descuenta del total. ${esc(t.politica)}</div></div></div></div>` : `<p class="xs mut in4">${esc(t.politica)}</p>`}
      <p class="xs dim" style="margin-top:10px">Te enviaremos la confirmación y recordatorios por WhatsApp. Al confirmar aceptas que ${esc(t.nombre)} te contacte por tu cita.</p>
    `, `<div class="dock"><div style="max-width:560px;margin:0 auto"><button class="btn w" data-a="reservar">${dep ? ic('lock', 17) + ' Pagar ' + S.money(dep) + ' y reservar' : ic('check', 18) + ' ' + L('Confirmar reserva')}</button></div></div>`);
  }
  function reservar() {
    const nombre = $('#f-nom').value.trim(), local = $('#f-tel').value.trim(), pais = $('#f-pais').value, nota = $('#f-nota').value.trim();
    if (nombre.length < 2) return toast('Escribe tu nombre', 'user'); if (local.replace(/\D/g, '').length < 7) return toast('Revisa tu WhatsApp', 'wa');
    const tel = '+' + pais + ' ' + local; localStorage.setItem(yoKey, JSON.stringify({ nombre, tel, telLocal: local, pais }));
    const t = T(); const c = q(); const dep = t.deposito?.activo ? Math.ceil(c.total * (t.deposito.pct || 20) / 100) : 0;
    const hacer = (metodo) => {
      try {
        if (st.reag) S.estado(st.reag, 'cancelada', { nota: 'Reagendada por el cliente' });
        const b = S.crearCita(tid, { items: st.items, extras: st.extras, staffId: st.asignado, inicio: `${st.fecha}T${st.hora}`, cliente: { nombre, tel }, nota, deposito: dep, metodo, origen: 'app', cupon: st.cupon, sucursal: st.suc });
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

  /* ================= LISTO + PASE QR ================= */
  function qrSvg(txt, px = 180) { const qq = qrcode(0, 'M'); qq.addData(txt); qq.make(); return qq.createSvgTag({ cellSize: 5, margin: 1, scalable: true }).replace('<svg ', `<svg style="width:${px}px;height:${px}px" `); }
  function listo(b) {
    st.paso = 5; const t = T(); const c = S.client(b.cid); const meta = t.fidelidad?.meta || 10;
    shell(`<section class="c" style="padding-top:22px">
      <div class="ico in" style="margin:0 auto;width:72px;height:72px;border-radius:24px;background:var(--grad);color:var(--ink);border:0;box-shadow:0 20px 50px -16px var(--brand)">${ic('check', 36)}</div>
      <h1 class="in2" style="font-size:32px;margin-top:14px">¡Listo, ${esc(c.nombre.split(' ')[0])}!</h1><p class="mut in2">Tu cita quedó confirmada. Te llegará un recordatorio.</p></section>
      ${pase(b)}
      <div class="grid g2 in4" style="margin-top:12px"><button class="btn ghost sm" data-a="ics" data-b="${b.id}">${ic('cal', 16)} A mi calendario</button><a class="btn ghost sm" target="_blank" href="${wa('', `Reservé en ${t.nombre} ✨ ${location.href.split('#')[0]}#/s/${t.slug}`)}">${ic('wa', 16)} Compartir</a></div>
      <div class="card flat in4" style="margin-top:14px"><div class="row sp"><h3>${ic('gift', 18)} Tu tarjeta de sellos</h3><span class="xs mut">${c.sellos || 0}/${meta}</span></div>
        <div class="stamps" style="margin-top:12px">${Array.from({ length: meta }, (_, i) => `<div class="stamp ${i < (c.sellos || 0) ? 'on' : ''}" style="animation-delay:${i * .05}s">${i < (c.sellos || 0) ? '✦' : i === meta - 1 ? '🎁' : ''}</div>`).join('')}</div>
        <p class="xs mut" style="margin:10px 0 0">Al completar ${meta} visitas: ${esc(t.fidelidad?.premio || 'premio')}.</p></div>
      <button class="btn w in4" style="margin-top:16px" data-a="inicio">Volver al inicio</button>`, '', false);
    confetti([t.color2, t.color, '#0F1420']);
  }
  function pase(b) {
    const t = T(); const m = S.member(b.staffId); const f = S.parse(b.inicio); const hoy = b.inicio.slice(0, 10) === S.ymd(new Date());
    return `<div class="pass tilt in3" style="margin-top:16px"><div class="hd pop"><div class="row sp"><span class="b">${esc(t.nombre)}</span><span class="pill">${esc(b.estado)}</span></div>
      <div style="font-size:24px;font-weight:700;margin-top:10px">${fechaL(f)}</div><div style="font-size:36px;font-weight:800;line-height:1.05">${h12(b.inicio.slice(11))}</div></div>
      <div class="cut"></div><div style="padding:16px" class="c"><div class="sm">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}${(b.extras || []).length ? ' + extras' : ''} · con ${esc(m?.nombre)}</div>
      <div class="qr" style="margin:12px auto 6px;padding:8px;border:1px solid var(--line)">${qrSvg(location.href.split('#')[0] + '#/s/' + t.slug + '?cita=' + b.codigo, 150)}</div><div class="b" style="letter-spacing:.12em">${esc(b.codigo)}</div><div class="xs mut">Muestra este pase al llegar</div>
      ${hoy && b.estado === 'confirmada' ? `<button class="btn w" style="margin-top:12px" data-a="llegue" data-b="${b.id}">${ic('check', 18)} Ya llegué</button>` : ''}</div></div>`;
  }

  /* ================= MIS CITAS ================= */
  function mis() {
    const y = yo();
    if (!y.tel) { sheet(`<h2>${L('Mis citas')}</h2><p class="mut sm">Escribe el WhatsApp con el que reservaste.</p><div class="field"><input id="m-tel" type="tel" placeholder="6000-0000" autofocus></div><button class="btn w" id="m-ok">Ver mis citas</button>`); $('#m-ok').onclick = () => { const v = $('#m-tel').value; if (v.replace(/\D/g, '').length < 7) return; localStorage.setItem(yoKey, JSON.stringify({ ...y, tel: v, telLocal: v })); closeSheet(); mis(); }; return; }
    const t = T(); const c = miCliente();
    const bs = c ? S.bookings(tid).filter(b => b.cid === c.id).sort((a, b) => b.inicio.localeCompare(a.inicio)) : [];
    const hoyS = S.ymd(new Date()); const fut = bs.filter(b => b.inicio.slice(0, 10) >= hoyS && ['confirmada', 'llegó'].includes(b.estado)).reverse(); const pas = bs.filter(b => !fut.includes(b)).slice(0, 10);
    const rv = S.reviews(tid); const paqs = c ? S.cpackages(tid).filter(k => k.cid === c.id && k.restantes > 0) : [];
    sheet(`<div class="row sp"><h2>${L('Mis citas')}</h2><button class="btn ghost sm" id="m-salir">Cambiar número</button></div>
      ${c ? `<div class="card glass" style="margin-top:12px"><div class="row"><div class="ico" style="background:var(--grad);color:var(--ink);border:0">${ic('gift')}</div><div class="g"><div class="b">${c.sellos || 0} de ${t.fidelidad?.meta || 10} sellos</div><div class="xs mut">${c.premios ? `🎁 Tienes ${c.premios} premio(s) para usar` : 'Sigue sumando para tu premio'}</div></div></div>
        <div class="xs mut" style="margin-top:10px">Tu código para invitar: <b style="color:var(--txt)">${refCode(c)}</b></div>${c.membresia ? `<div class="xs" style="margin-top:6px">💎 Membresía ${esc(c.membresia)}</div>` : ''}${paqs.map(k => `<div class="xs" style="margin-top:6px">🎟️ ${esc(k.nombre)}: te quedan <b>${k.restantes}</b></div>`).join('')}</div>` : ''}
      <h3 style="margin:18px 0 8px">Próximas</h3>
      ${fut.length ? fut.map(b => `<div class="card flat" style="margin-bottom:10px"><div class="b">${fechaL(S.parse(b.inicio))} · ${h12(b.inicio.slice(11))}</div><div class="sm mut">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')} · ${esc(S.member(b.staffId)?.nombre)}</div>
        <div class="row" style="margin-top:10px"><button class="btn sm g" data-pase="${b.id}">${ic('qr', 15)} Pase</button><button class="btn ghost sm g" data-reag="${b.id}">Cambiar</button><button class="btn danger sm" data-can="${b.id}">Cancelar</button></div></div>`).join('') : '<p class="mut sm">No tienes citas próximas.</p>'}
      <h3 style="margin:18px 0 8px">Historial</h3>
      ${pas.length ? pas.map(b => `<div class="li"><div class="g"><div class="sm b">${b.items.map(i => esc(S.service(i)?.nombre)).join(' + ')}</div><div class="xs mut">${S.parse(b.inicio).toLocaleDateString('es-PA')} · ${b.estado}</div></div>
        ${b.estado === 'completada' && !rv.find(r => r.bid === b.id) ? `<button class="btn sm" data-res="${b.id}">${ic('star', 14)} Calificar</button>` : `<button class="btn ghost sm" data-rep="${b.id}">Repetir</button>`}</div>`).join('') : '<p class="mut sm">Aún no hay historial.</p>'}`);
    $('#m-salir').onclick = () => { localStorage.removeItem(yoKey); closeSheet(); mis(); };
    $$('[data-can]').forEach(x => x.onclick = () => { if (!dosToques(x, '¿Seguro? Toca otra vez')) return; S.estado(x.dataset.can, 'cancelada', { nota: 'Cancelada por el cliente' }); toast('Cita cancelada'); closeSheet(); mis(); });
    $$('[data-reag]').forEach(x => x.onclick = () => { const b = S.booking(x.dataset.reag); Object.assign(st, { items: b.items, extras: b.extras || [], staffId: b.staffId, fecha: null, hora: null, reag: b.id }); closeSheet(); hora(); toast('Elige la nueva hora', 'cal'); });
    $$('[data-rep]').forEach(x => x.onclick = () => { const b = S.booking(x.dataset.rep); Object.assign(st, { items: b.items.filter(S.service), extras: [], staffId: b.staffId, fecha: null, hora: null }); closeSheet(); hora(); });
    $$('[data-pase]').forEach(x => x.onclick = () => { closeSheet(); verPase(x.dataset.pase); });
    $$('[data-res]').forEach(x => x.onclick = () => resena(x.dataset.res, c));
  }
  const refCode = c => (c.nombre.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().slice(0, 5) + c.id.slice(-3).toUpperCase());
  function verPase(bid) { sheet(pase(S.booking(bid))); tilt(document.querySelector('.sheet')); const ll = $('.sheet [data-a=llegue]'); if (ll) ll.onclick = () => llegue(bid); }
  function llegue(bid) { const b = S.booking(bid); S.estado(bid, 'llegó'); S.msg(tid, { cid: b.cid, bid, tipo: 'Llegada', canal: 'Panel', texto: `${S.client(b.cid)?.nombre} llegó a su cita (${b.inicio.slice(11)}).` }); closeSheet(); confetti(); toast('¡Bienvenido! Ya le avisamos a tu profesional'); inicio(); }
  function dosToques(btn, txt) { if (btn.dataset.ok) return true; btn.dataset.ok = 1; btn.textContent = txt; setTimeout(() => { delete btn.dataset.ok; }, 3000); return false; }
  function resena(bid, c) {
    let n = 5; const b = S.booking(bid);
    sheet(`<h2>¿Cómo te fue con ${esc(S.member(b.staffId)?.nombre || '')}?</h2><div class="row" style="justify-content:center;gap:6px;margin:18px 0;font-size:40px;cursor:pointer">${[1, 2, 3, 4, 5].map(i => `<span data-st="${i}" style="color:var(--warn)">★</span>`).join('')}</div>
      <textarea id="r-txt" rows="3" placeholder="Cuéntanos (opcional)"></textarea><button class="btn w" id="r-ok" style="margin-top:12px">Enviar</button>`);
    $$('[data-st]').forEach(s => s.onclick = () => { n = +s.dataset.st; $$('[data-st]').forEach(x => x.style.opacity = +x.dataset.st <= n ? 1 : .25); vibrar(); });
    $('#r-ok').onclick = () => { S.addReview({ tid, cid: c.id, bid, staffId: b.staffId, estrellas: n, texto: $('#r-txt').value.trim() || '⭐'.repeat(n) });
      closeSheet(); if (n >= 4) sheet(`<div class="c"><h2>¡Gracias! 💛</h2><p class="mut">¿Nos ayudas con tu reseña en Google? A otros les sirve mucho.</p><a class="btn w" target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(T().nombre + ' ' + T().zona)}">${ic('star', 16)} Dejar reseña en Google</a></div>`); else toast('Gracias, lo vamos a mejorar'); };
  }

  /* ================= FILA SIN CITA ================= */
  function fila(mia = sessionStorage.getItem('glow.fila.' + tid)) {
    const w = S.esperaFila(tid); const yoq = mia && S.queue(tid).find(x => x.id === mia);
    if (yoq && !['listo', 'cancelado'].includes(yoq.estado)) { const pos = w.find(x => x.id === mia);
      sheet(`<div class="c"><div class="xs mut">Tu turno</div><div style="font-size:72px;font-weight:800;line-height:1" class="grad-t">#${yoq.numero}</div>
        ${yoq.estado === 'atendiendo' ? `<h2 style="margin-top:10px">¡Es tu turno! 🎉</h2><p class="mut">Pasa con ${esc(S.member(yoq.staffId)?.nombre || 'tu profesional')}.</p>` : `<h2 style="margin-top:10px">${pos ? pos.pos === 1 ? 'Eres el siguiente' : `Hay ${pos.pos - 1} antes que tú` : 'En fila'}</h2><p class="mut">Espera aproximada: <b>${pos ? pos.min : 0} min</b>. Puedes salir a dar una vuelta: te avisamos por WhatsApp.</p>`}
        <button class="btn ghost w" id="f-salir" style="margin-top:12px">Salir de la fila</button></div>`);
      $('#f-salir').onclick = () => { S.guardar('queue', { id: mia, estado: 'cancelado' }); sessionStorage.removeItem('glow.fila.' + tid); closeSheet(); toast('Saliste de la fila'); inicio(); }; return; }
    const y = yo();
    sheet(`<h2>Fila sin cita</h2><p class="mut sm">${w.length ? `${w.length} persona${w.length > 1 ? 's' : ''} esperando · aprox. ${(w[w.length - 1]?.min || 0) + 15} min` : '¡No hay fila! Pasa ahora.'}</p>
      <div class="field"><label>Servicio</label><select id="q-s">${S.services(tid).map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join('')}</select></div>
      <div class="field"><label>Nombre</label><input id="q-n" value="${esc(y.nombre || '')}"></div><div class="field"><label>WhatsApp</label><input id="q-t" type="tel" value="${esc(y.telLocal || '')}"></div>
      <button class="btn w" id="q-ok">${ic('users', 17)} Tomar mi turno</button>`);
    $('#q-ok').onclick = () => { const n = $('#q-n').value.trim(); if (!n) return toast('Escribe tu nombre', 'user'); const qq = S.unirseFila(tid, { nombre: n, tel: $('#q-t').value, servicio: $('#q-s').value }); sessionStorage.setItem('glow.fila.' + tid, qq.id); confetti(); fila(qq.id); };
  }

  /* ================= REGALO / INVITA / PROFESIONAL / MEMBRESÍA ================= */
  function regalo() {
    let monto = 25;
    sheet(`<div class="c"><div style="font-size:44px">🎁</div><h2>Tarjeta de regalo</h2><p class="mut sm">Se envía por WhatsApp con un código para usar en ${esc(T().nombre)}.</p></div>
      <div class="row" style="justify-content:center;margin:14px 0">${[15, 25, 50, 100].map(v => `<button class="chip ${v === monto ? 'on' : ''}" data-m="${v}">${S.money(v)}</button>`).join('')}</div>
      <div class="field"><label>De</label><input id="g-de" value="${esc(yo().nombre || '')}"></div><div class="field"><label>Para</label><input id="g-para" placeholder="Nombre de quien lo recibe"></div><div class="field"><label>WhatsApp de quien lo recibe</label><input id="g-tel" type="tel"></div>
      <button class="btn w" id="g-ok">Pagar y enviar</button><p class="xs dim c">Demo: no se cobra.</p>`);
    $$('.sheet [data-m]').forEach(x => x.onclick = () => { monto = +x.dataset.m; $$('.sheet [data-m]').forEach(y => y.classList.toggle('on', y === x)); });
    $('#g-ok').onclick = () => { const para = $('#g-para').value.trim(); if (!para) return toast('¿Para quién es?', 'gift'); const tel = $('#g-tel').value;
      const g = S.venderRegalo(tid, { monto, de: $('#g-de').value, para, tel, metodo: 'Yappy' });
      sheet(`<div class="c"><div style="font-size:44px">🎉</div><h2>¡Regalo listo!</h2><div class="pass" style="margin:14px 0"><div class="hd"><div class="b">${esc(T().nombre)}</div><div style="font-size:40px;font-weight:800">${S.money(g.monto)}</div><div class="sm">Para ${esc(para)}</div></div><div style="padding:14px"><div class="b" style="letter-spacing:.1em">${g.codigo}</div></div></div>
        <a class="btn w" target="_blank" href="${wa(tel, `🎁 ${g.de || 'Alguien especial'} te regaló ${S.money(g.monto)} en ${T().nombre}. Código: ${g.codigo}. Reserva aquí 👉 ${location.href.split('#')[0]}#/s/${T().slug}`)}">${ic('wa', 17)} Enviar por WhatsApp</a></div>`); confetti(); };
  }
  function invita() {
    const c = miCliente(); const t = T();
    if (!c) return sheet(`<div class="c"><div style="font-size:44px">💌</div><h2>Invita y gana</h2><p class="mut">Reserva tu primera cita para obtener tu código. Tus amigos reciben ${t.referidos?.pct || 10}% y tú un sello extra.</p></div>`);
    const code = refCode(c); const link = `${location.href.split('#')[0]}#/s/${t.slug}?ref=${code}`;
    if (!S.coupons(tid).find(x => x.codigo === 'AMIGO-' + code)) S.guardar('coupons', { tid, codigo: 'AMIGO-' + code, tipo: 'pct', valor: t.referidos?.pct || 10, activo: true, usos: 0, max: 20, vence: '', nota: 'Referido de ' + c.nombre, refDe: c.id });
    sheet(`<div class="c"><div style="font-size:44px">💌</div><h2>Invita y gana</h2><p class="mut">Tus amigos reciben <b>${t.referidos?.pct || 10}% de descuento</b> en su primera cita y tú ganas un sello cuando vengan.</p>
      <div class="qr" style="margin:12px auto;border:1px solid var(--line)">${qrSvg(link, 160)}</div><div class="b" style="letter-spacing:.1em">${code}</div>
      <a class="btn w" style="margin-top:12px" target="_blank" href="${wa('', `Te regalo ${t.referidos?.pct || 10}% en ${t.nombre} ✨ Reserva con mi link 👉 ${link}`)}">${ic('wa', 17)} Compartir mi link</a></div>`);
  }
  function verPro(id) {
    const m = S.member(id); const r = rating(id); const rs = S.reviews(tid).filter(x => x.staffId === id).slice(-4).reverse();
    sheet(`<div class="c">${avatar(m, 'lg r', 'margin:0 auto;width:96px;height:96px;font-size:30px')}<h2 style="margin-top:10px">${esc(m.nombre)}</h2><div class="mut sm">${esc(m.rol)}</div>${r ? `<div style="color:var(--warn);margin-top:4px">★ ${r[0]} <span class="mut sm">· ${r[1]} reseñas</span></div>` : ''}</div>
      ${m.bio ? `<p class="c" style="margin:14px 0">${esc(m.bio)}</p>` : ''}
      ${(m.galeria || []).length ? `<div class="grid g3" style="margin-bottom:12px">${m.galeria.map(g => `<div style="aspect-ratio:1;border-radius:14px;background:url(${g}) center/cover"></div>`).join('')}</div>` : ''}
      ${rs.map(x => `<div class="card flat" style="margin-bottom:8px"><div style="color:var(--warn)">${'★'.repeat(x.estrellas)}</div><div class="sm">${esc(x.texto)}</div></div>`).join('')}
      <button class="btn w" id="p-ok" style="margin-top:10px">${ic('cal', 17)} Reservar con ${esc(m.nombre)}</button>`);
    $('#p-ok').onclick = () => { st.staffId = id; closeSheet(); if (st.items.length) hora(); else { $('#svcs')?.scrollIntoView({ behavior: 'smooth' }); toast('Elige tu servicio', 'scissors'); } };
  }
  function membresia(id) {
    const m = (T().membresias || []).find(x => x.id === id); const y = yo();
    sheet(`<div class="c"><div style="font-size:44px">💎</div><h2>${esc(m.nombre)}</h2><div style="font-size:34px;font-weight:800">${S.money(m.precio)}<span class="sm mut">/mes</span></div><p class="mut">${esc(m.incluye)}</p></div>
      <div class="field"><label>Nombre</label><input id="mb-n" value="${esc(y.nombre || '')}"></div><div class="field"><label>WhatsApp</label><input id="mb-t" type="tel" value="${esc(y.telLocal || '')}"></div>
      <button class="btn w" id="mb-ok">Activar con pago mensual</button><p class="xs dim c">Se cobra cada mes con tarjeta o Yappy. Cancelas cuando quieras. Demo: no se cobra.</p>`);
    $('#mb-ok').onclick = () => { const n = $('#mb-n').value.trim(), tel = $('#mb-t').value.trim(); if (!n || tel.replace(/\D/g, '').length < 7) return toast('Completa tus datos', 'user');
      localStorage.setItem(yoKey, JSON.stringify({ ...y, nombre: n, tel, telLocal: tel })); const c = S.upsertClient(tid, { nombre: n, tel }); S.saveClient({ id: c.id, membresia: m.nombre, membresiaDesde: S.ymd(new Date()) });
      S.guardar('sales', { tid, bid: null, cid: c.id, fecha: S.iso(new Date()), sub: m.precio, servicios: m.precio, productos: [], itbms: +(m.precio * S.ITBMS).toFixed(2), propina: 0, total: +(m.precio * (1 + S.ITBMS)).toFixed(2), cobrado: +(m.precio * (1 + S.ITBMS)).toFixed(2), metodo: 'Tarjeta', concepto: 'Membresía ' + m.nombre });
      closeSheet(); confetti(); toast('¡Bienvenido al club! 💎'); };
  }

  /* ================= TARJETA DE FIDELIDAD + WALLET ================= */
  function tarjeta() {
    const c = miCliente(); const t = T(); const meta = t.fidelidad?.meta || 10; const n = c?.sellos || 0;
    sheet(`<div class="pass tilt"><div class="hd pop" style="padding:22px"><div class="row sp"><span class="b">${esc(t.nombre)}</span><span style="font-size:22px">🎁</span></div><div class="xs" style="opacity:.9;margin-top:14px">TARJETA DE FIDELIDAD</div><div style="font-size:26px;font-weight:800">${c ? esc(c.nombre) : 'Tu nombre aquí'}</div></div>
      <div style="padding:18px"><div class="stamps">${Array.from({ length: meta }, (_, i) => `<div class="stamp ${i < n ? 'on' : ''}" style="animation-delay:${i * .05}s">${i < n ? '✦' : i === meta - 1 ? '🎁' : ''}</div>`).join('')}</div><div class="row sp" style="margin-top:12px"><span class="sm">${n}/${meta} sellos</span><span class="sm b">${meta - n} para ${esc(t.fidelidad?.premio || 'tu premio')}</span></div>
      ${c ? `<div class="qr" style="margin:14px auto 0;border:1px solid var(--line)">${qrSvg('GLOW-FID-' + c.id, 120)}</div><div class="xs mut c">Muéstralo en caja para sumar tu sello</div>` : '<p class="sm mut c">Reserva tu primera cita para activar tu tarjeta.</p>'}</div></div>
      <div class="grid g2" style="margin-top:12px"><button class="btn dark" data-w> Apple Wallet</button><button class="btn ghost" data-gw>Google Wallet</button></div>`);
    tilt(document.querySelector('.sheet')); $('.sheet [data-w]').onclick = wallet; $('.sheet [data-gw]').onclick = wallet;
  }
  function wallet() {
    sheet(`<div class="c"><div style="font-size:44px">📲</div><h2>Tu tarjeta en la Wallet</h2><p class="mut">Con un toque, tu tarjeta de sellos y tu próxima cita quedan en Apple Wallet o Google Wallet, con aviso en la pantalla bloqueada cuando estés cerca del local.</p>
      <div class="card flat" style="text-align:left"><div class="sm"><b>En esta demo</b> todavía no se genera el archivo de Wallet: Apple exige que cada tarjeta vaya firmada con el certificado de Glow (cuenta de Apple Developer), y eso se activa en la versión real.</div></div>
      <button class="btn w" style="margin-top:12px" data-cl>Entendido</button></div>`); $('.sheet [data-cl]').onclick = closeSheet;
  }

  /* ================= ASISTENTE 24/7 ================= */
  function chat() {
    const t = T(); const hist = [['ia', `¡Hola! Soy el asistente virtual de ${esc(t.nombre)} ✨ Pregúntame precios, horarios, ofertas o cómo reservar.`]];
    const norm = x => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const responder = txt => { const s = norm(txt);
      const sv = S.services(tid).find(x => norm(x.nombre).split(/\s+/).some(w => w.length > 3 && s.includes(w)));
      if (/hora|abre|cierra|horario|abierto/.test(s)) return 'Nuestro horario: ' + [1, 2, 3, 4, 5, 6, 0].map(d => `${DIAS[d]} ${(t.horario[d] || []).map(([a, b]) => h12(a) + '–' + h12(b)).join(', ') || 'cerrado'}`).join(' · ');
      if (sv) return `${sv.nombre}: ${precioTxt(sv)} (+ITBMS), dura ${durL(sv.dur)}. Tócalo en la lista de servicios y elige tu hora 👇`;
      if (/precio|cuanto|cuesta|vale|costo/.test(s)) return 'Algunos precios: ' + S.services(tid).slice(0, 5).map(x => `${x.nombre} ${precioTxt(x)}`).join(' · ') + '. Todos están en la lista de servicios.';
      if (/oferta|promo|descuento|cupon/.test(s)) { const o = S.offers(tid).filter(o => o.activa); return o.length ? 'Ofertas activas: ' + o.map(x => `${x.titulo} (${x.desc})`).join(' · ') : 'Ahora no hay ofertas, pero si invitas a un amigo ambos ganan 💌'; }
      if (/membres|club|mensual/.test(s)) { const m = (t.membresias || []).filter(x => x.activa); return m.length ? 'Membresías: ' + m.map(x => `${x.nombre} ${S.money(x.precio)}/mes (${x.incluye})`).join(' · ') : 'Por ahora no tenemos membresías.'; }
      if (/donde|ubicacion|direccion|llegar/.test(s)) return 'Estamos en ' + (suc()?.dir || t.zona) + '. Toca "Cómo llegar" al final de la página.';
      if (/cancel|cambiar|mover|reagend/.test(s)) return 'Puedes cambiar o cancelar en el botón del calendario de arriba (Mis citas). ' + t.politica;
      if (/pago|yappy|tarjeta|efectivo|transfer/.test(s)) return 'Aceptamos Yappy, tarjeta, efectivo y transferencia.' + (t.deposito?.activo ? ` Para apartar pedimos un depósito de ${t.deposito.pct}%.` : '');
      if (/fila|sin cita|walk|ahora/.test(s)) return 'Sí atendemos sin cita: toca "Sin cita" arriba y toma tu turno desde el celular.';
      if (/regalo|gift/.test(s)) return 'Tenemos tarjetas de regalo desde $15. Toca "Regala" en la página 🎁';
      if (/hola|buenas|hey|saludos/.test(s)) return '¡Hola! ¿Qué servicio te interesa?';
      return null; };
    const pinta = () => { const m = $('.sheet .msgs'); if (m) { m.innerHTML = hist.map(([k, x]) => `<div class="bub ${k}">${x}</div>`).join(''); m.scrollTop = 1e6; } };
    sheet(`<div class="row"><div class="av r" style="--c:var(--grad)">${ic('spark', 20)}</div><div class="g"><div class="b">Asistente de ${esc(t.nombre)}</div><div class="xs mut">Asistente virtual · responde 24/7</div></div></div>
      <div class="msgs" style="margin:14px 0"></div>
      <div class="row wrapx" style="margin-bottom:10px">${['Precios', 'Horario', 'Ofertas', '¿Dónde están?'].map(x => `<button class="chip" data-qq="${x}">${x}</button>`).join('')}</div>
      <div class="row"><input id="c-in" placeholder="Escribe tu pregunta…"><button class="btn" id="c-go">${ic('next', 18)}</button></div>`);
    pinta();
    const enviar = txt => { if (!txt.trim()) return; hist.push(['yo', esc(txt)]); const r = responder(txt); hist.push(['ia', r ? esc(r) : `No estoy seguro 🙈 Te paso con el equipo: <a href="${wa(t.tel, txt)}" target="_blank"><b>escribir por WhatsApp</b></a>`]); pinta(); $('#c-in').value = ''; };
    $('#c-go').onclick = () => enviar($('#c-in').value); $('#c-in').onkeydown = e => e.key === 'Enter' && enviar(e.target.value);
    $$('.sheet [data-qq]').forEach(b => b.onclick = () => enviar(b.dataset.qq));
  }

  /* ================= EVENTOS ================= */
  el.onclick = e => {
    const a = e.target.closest('[data-ir],[data-cual],[data-a],[data-svc],[data-cat],[data-pro],[data-dia],[data-hora],[data-ex],[data-suc],[data-of],[data-verpro],[data-mem],[data-gal]'); if (!a) return; vibrar(8);
    if (a.dataset.ir) return document.getElementById(a.dataset.ir)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (a.dataset.cual) { st.staffId = null; if (st.items.length) return hora(); $('#svcs')?.scrollIntoView({ behavior: 'smooth' }); return toast('Elige tu servicio', 'scissors'); }
    if (a.dataset.go && a.dataset.svc) { if (!st.items.includes(a.dataset.svc)) st.items.push(a.dataset.svc); return profesional(); }
    if (a.dataset.gal) return sheet(`<div class="col">${T().galeria.map(g => `<img src="${g}" style="width:100%;border-radius:18px">`).join('')}</div>`);
    const keep = f => { const y = scrollY; f(); scrollTo(0, y); };
    if (a.dataset.svc) { const i = st.items.indexOf(a.dataset.svc); i >= 0 ? st.items.splice(i, 1) : st.items.push(a.dataset.svc); st.hora = null; st.fecha = null; return keep(inicio); }
    if (a.dataset.cat !== undefined) { st.cat = a.dataset.cat || null; return keep(inicio); }
    if (a.dataset.suc) { st.suc = a.dataset.suc; st.staffId = null; return keep(inicio); }
    if (a.dataset.of) { const o = S.offers(tid).find(x => x.id === a.dataset.of); (o.servicios || []).forEach(s => !st.items.includes(s) && st.items.push(s)); toast('Oferta agregada ✦', 'gift'); return keep(inicio); }
    if (a.dataset.verpro) return verPro(a.dataset.verpro);
    if (a.dataset.mem) return membresia(a.dataset.mem);
    if (a.dataset.pro !== undefined) { st.staffId = a.dataset.pro || null; st.fecha = null; st.hora = null; return keep(profesional); }
    if (a.dataset.ex) { const i = st.extras.indexOf(a.dataset.ex); i >= 0 ? st.extras.splice(i, 1) : st.extras.push(a.dataset.ex); st.hora = null; return keep(profesional); }
    if (a.dataset.dia) { st.fecha = a.dataset.dia; st.hora = null; return keep(hora); }
    if (a.dataset.hora) { const [h, sid] = a.dataset.hora.split('|'); st.hora = h; st.asignado = sid; return keep(hora); }
    const k = a.dataset.a;
    if (k === 'sig') { if (st.paso === 0) profesional(); else if (st.paso === 1) hora(); else if (st.paso === 2) confirmar(); }
    if (k === 'atras') { if (st.paso === 1) inicio(); else if (st.paso === 2) profesional(); else if (st.paso === 3) hora(); }
    if (k === 'reservar') reservar();
    if (k === 'cupon') { const v = $('#f-cup').value.trim().toUpperCase(); if (!v) return; if (S.cuponValido(tid, v)) { st.cupon = v; toast('Cupón aplicado ✦', 'gift'); keep(confirmar); } else toast('Cupón no válido o vencido', 'x'); }
    if (k === 'mis') mis();
    if (k === 'pase') verPase(a.dataset.b);
    if (k === 'llegue') llegue(a.dataset.b);
    if (k === 'ics') { const b = S.booking(a.dataset.b); ics({ titulo: `${T().nombre}: ${b.items.map(i => S.service(i).nombre).join(' + ')}`, inicio: S.parse(b.inicio), dur: b.dur, lugar: suc()?.dir || T().zona }); }
    if (k === 'inicio') { Object.assign(st, { items: [], extras: [], staffId: null, fecha: null, hora: null }); inicio(); }
    if (k === 'scrollsvc') { $('#svcs')?.scrollIntoView({ behavior: 'smooth' }); toast('Elige uno o varios servicios', 'scissors'); }
    if (k === 'lang') { lang = lang === 'es' ? 'en' : 'es'; localStorage.setItem('glow.lang', lang); inicio(); }
    if (k === 'tarjeta') tarjeta(); if (k === 'wallet') wallet();
    if (k === 'fila') fila(); if (k === 'regalo') regalo(); if (k === 'invita') invita(); if (k === 'chat') chat();
    if (k === 'espera') { const y = yo(); sheet(`<h2>Lista de espera</h2><p class="mut sm">Te avisamos por WhatsApp si se libera un espacio el ${fechaL(S.parse(st.fecha + 'T00:00'))}.</p><div class="field"><label>Nombre</label><input id="w-n" value="${esc(y.nombre || '')}"></div><div class="field"><label>WhatsApp</label><input id="w-t" type="tel" value="${esc(y.telLocal || '')}"></div><button class="btn w" id="w-ok">Avisarme</button>`);
      $('#w-ok').onclick = () => { S.addWait({ tid, fecha: st.fecha, items: st.items, nombre: $('#w-n').value, tel: $('#w-t').value }); closeSheet(); toast('Listo, te avisamos'); }; }
  };
  const off = S.onChange(() => {
    if (document.querySelector('.sheet .msgs')) return;
    const f = sessionStorage.getItem('glow.fila.' + tid); const sh = document.querySelector('.sheet');
    if (f && sh && sh.textContent.includes('Tu turno')) return fila(f);
    if (sh || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const y = scrollY; if (st.paso === 2) hora(); else if (st.paso === 0) inicio(); scrollTo(0, y);
  });
  inicio();
  const cita = qs.get('cita'); if (cita) { const b = S.bookings(tid).find(x => x.codigo === cita); b && verPase(b.id); }
  return () => { off(); el.onclick = null; };
}
