import * as S from './store.js';
import { esc, ic, ini, setBrand, toast } from './ui.js';
import qrcode from '../vendor/qrcode.mjs';

/* Accesos de un negocio: las 5 caras del mismo sistema, cada una con su link y su QR */
export function render(el, [slug]) {
  const t = S.tenant(slug); if (!t) { location.hash = '#/'; return; } setBrand(t); document.title = t.nombre + ' · Accesos';
  const base = location.href.split('#')[0] + '#/s/' + t.slug;
  const V = [
    ['', 'heart', 'Clientes', 'Reservan, compran promos, ven su tarjeta de fidelidad y sus citas. Es el link que va en Instagram, Google y WhatsApp.', 'Sin contraseña'],
    ['/recepcion', 'bell', 'Recepción', 'El mostrador: quién llegó, quién está en silla, la fila sin cita, citas rápidas, cobros y cupones.', 'PIN de recepción'],
    ['/equipo', 'scissors', 'Equipo', 'Cada barbero o estilista ve su día, sus clientes con sus notas, sus comisiones y pide días libres.', 'PIN de cada uno'],
    ['/panel', 'chart', 'Dueño', 'Todo el negocio: agenda, caja, clientes, servicios y precios, promos, marketing, reportes y ajustes.', 'PIN del dueño'],
    ['/tv', 'play', 'Pantalla TV', 'Para el televisor del local: próximas citas, la fila con números y el QR para reservar.', 'Sin contraseña'],
  ];
  const qr = u => { const q = qrcode(0, 'M'); q.addData(u); q.make(); return q.createSvgTag({ cellSize: 4, margin: 1, scalable: true }).replace('<svg ', '<svg style="width:96px;height:96px" '); };
  el.innerHTML = `<main class="wide" style="padding-top:28px;padding-bottom:60px">
    <div class="row in">${t.logo ? `<div class="av lg" style="background:#fff url(${t.logo}) center/contain no-repeat;border:1px solid var(--line)"></div>` : `<div class="av lg">${esc(ini(t.nombre))}</div>`}<div class="g"><div class="xs mut">Un solo sistema, cinco pantallas</div><h1 style="font-size:clamp(28px,5vw,40px)">${esc(t.nombre)}</h1></div></div>
    <p class="mut in2" style="max-width:640px">Todo está conectado: lo que reserva un cliente aparece al instante en recepción, en el celular del profesional, en el panel del dueño y en la TV.</p>
    <div class="grid g3 rsp stagger" style="margin-top:18px">${V.map(([r, i, n, d, a]) => `<div class="card tilt" style="display:flex;flex-direction:column"><div class="pop" style="display:flex;flex-direction:column;height:100%"><div class="row sp"><div class="ico" style="background:var(--grad);color:var(--ink);border:0;width:48px;height:48px">${ic(i, 22)}</div><div class="qr" style="padding:6px;border:1px solid var(--line)">${qr(base + r)}</div></div>
      <h2 style="margin-top:12px">${n}</h2><p class="sm mut" style="margin:6px 0 10px">${d}</p><div class="xs dim" style="margin-top:auto">${ic('lock', 12)} ${a}</div>
      <div class="row" style="margin-top:12px"><a class="btn sm g" href="#/s/${t.slug}${r}">Abrir</a><button class="btn ghost sm" data-copy="${base + r}">${ic('copy', 15)}</button></div></div></div>`).join('')}</div>
    <p class="c xs dim" style="margin-top:24px">Demo: dueño 1111 · recepción ${t.pinRecepcion || '0000'} · equipo 2222, 3333</p></main>`;
  el.onclick = e => { const c = e.target.closest('[data-copy]'); if (!c) return; navigator.clipboard?.writeText(c.dataset.copy).then(() => toast('Link copiado'), () => toast('No se pudo copiar', 'x')); };
}
