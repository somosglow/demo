import * as S from './store.js';
import { $, $$, esc, ic, tilt, setBrand } from './ui.js';

const G = {
  cliente: { t: 'Tus clientes', i: 'user', d: 'Reservan solos, a cualquier hora, desde tu link.', p: [
    ['Abren tu link', 'Desde tu bio de Instagram, tu WhatsApp, Google o el QR del local. Pueden instalarla como app (Compartir → Agregar a inicio).', 'link'],
    ['Eligen servicios', 'Pueden elegir varios a la vez (ej.: corte + barba). Ven precio y duración al instante.', 'scissors'],
    ['Eligen con quién', '"Cualquiera" les da el espacio más pronto; o escogen a su profesional favorito.', 'users'],
    ['Eligen día y hora', 'Solo ven horas realmente libres: Glow cuida horarios, duraciones y bloqueos. Si el día está lleno, se anotan en lista de espera.', 'cal'],
    ['Confirman', 'Nombre y WhatsApp. Si activaste depósito, lo pagan con Yappy o tarjeta para apartar.', 'lock'],
    ['Listo ✦', 'Reciben su pase con QR, lo agregan a su calendario y suman sellos. En "Mis citas" pueden cambiar la hora, cancelar, repetir o calificar.', 'gift'],
    ['Ya llegué', 'El día de la cita, al llegar tocan "Ya llegué" en su pase: tu equipo y la pantalla TV se enteran al instante.', 'check'],
    ['Sin cita', 'Si llegan sin reservar, toman su turno desde el celular y ven en vivo cuántos faltan y cuánto esperan.', 'users'],
    ['Ofertas, cupones y regalos', 'Ven tus ofertas arriba, usan cupones o el código de un amigo, compran tarjetas de regalo, paquetes y membresías.', 'spark'],
    ['Asistente 24/7', 'El botón ✦ responde precios, horarios, ofertas y ubicación a cualquier hora. Si no sabe, los pasa a tu WhatsApp.', 'bolt'],
  ] },
  equipo: { t: 'Tu equipo', i: 'scissors', d: 'Cada barbero o estilista con su propia app y su PIN.', p: [
    ['Entran con su PIN', 'Abren el link del equipo, tocan su foto y escriben su PIN de 4 números.', 'lock'],
    ['Ven su día', 'Su próxima cita en grande con cuenta regresiva, notas del cliente y todas sus citas del día.', 'cal'],
    ['Marcan el avance', 'Llegó → Empezar → Terminar y cobrar. O "No vino" si es un plantón.', 'check'],
    ['Cliente sin cita', 'Registran a quien llega sin reservar para que cuente en caja y en sus sellos.', 'plus'],
    ['Bloquean tiempo', 'Almuerzo o diligencias: ese rango deja de aparecer para reservar.', 'clock'],
    ['Sus números', 'Servicios del mes, lo que vendieron, su comisión y propinas. Y sus clientes fieles para escribirles.', 'chart'],
  ] },
  dueno: { t: 'Tú, el dueño', i: 'chart', d: 'Todo tu negocio en un panel, en el celular o la computadora.', p: [
    ['Inicio', 'Lo vendido hoy y en el mes, citas, plantones, ocupación, servicios estrella, ranking del equipo y las reservas nuevas en vivo.', 'home'],
    ['Agenda', 'Todas las citas por profesional (y por sucursal). Arrastra una cita para moverla, toca un espacio vacío para crear una, toca una cita para cobrar, recordar o cancelar.', 'cal'],
    ['Caja', 'Cobra con Yappy, tarjeta, efectivo o transferencia; suma productos, descuentos, propinas, tarjetas de regalo y paquetes. Glow calcula el ITBMS 7%. Registra gastos y haz el cierre del día.', 'cash'],
    ['Clientes', 'Agrégalos a mano o importa tu lista; exporta cuando quieras. Ficha con historial, gasto, favorito, plantones, sellos, paquetes y notas. Filtros: VIP, miembros, no vuelven, cumpleaños, nuevos, plantones.', 'users'],
    ['Marketing', 'Campañas listas: «te toca tu corte», recuperar a los que no vuelven, cumpleaños, llenar el día flojo y pedir reseñas en Google. Se envían por WhatsApp una por una (sin spam).', 'spark'],
    ['Fila sin cita y pantalla TV', 'Ve quién espera, asígnalo a un profesional y cóbralo. Pon la Pantalla TV en recepción: muestra próximas citas, la fila y el QR para reservar.', 'play'],
    ['Servicios y productos', 'Tus servicios con tus precios (y precio distinto por profesional), extras, productos con inventario, paquetes prepago y membresías mensuales.', 'scissors'],
    ['Ofertas y regalos', 'Ofertas con vencimiento que se aplican solas, cupones, programa de referidos y tarjetas de regalo con saldo.', 'gift'],
    ['Mensajes y reportes', 'Mira cada confirmación y recordatorio que se envió. Reportes por periodo: ventas, gastos, ganancia, comisiones, servicios, canales y métodos de pago; exporta a Excel.', 'chart'],
    ['Equipo y ajustes', 'Fotos y galería de cada profesional, PIN, comisión y sucursal. Portada, logo y galería del local, horario, feriados, sucursales, depósito, política, fila y fidelidad.', 'gear'],
  ] },
  glow: { t: 'Glow (nosotros)', i: 'store', d: 'El panel maestro para dar de alta y cobrar a los negocios.', p: [
    ['Nuevo negocio en minutos', 'Nombre, tipo, colores, logo y portada; sus servicios con SUS precios; su equipo y plan; y su lista de clientes. Sale con su link listo.', 'bolt'],
    ['Mapa de Panamá', 'En la portada de Glow, un mapa 3D muestra cada negocio con sus estrellas. Un toque y entras a su app.', 'globe'],
    ['Todos los negocios', 'Plan, citas del mes y estado. Se puede suspender a quien no paga.', 'store'],
    ['Meta $20k', 'Ingreso mensual (MRR) y cuánto falta para la meta.', 'chart'],
  ] },
};

export function render(el) {
  setBrand(null); document.title = 'Glow · Guía';
  let k = 'cliente', i = 0; const t = S.tenants()[0];
  const pinta = () => {
    const g = G[k]; const p = g.p[i];
    el.innerHTML = `<header class="top"><div class="wrap in-top"><a class="ico" href="#/">${ic('back')}</a><div class="g b">Guía de uso</div><img src="img/glow-logo-dark.png" style="height:22px" alt="Glow"></div></header>
    <main class="wrap" style="padding-bottom:60px">
      <div class="scroll-x" style="margin:16px -18px">${Object.entries(G).map(([kk, v]) => `<button class="chip ${k === kk ? 'on' : ''}" data-k="${kk}">${ic(v.i, 15)} ${v.t}</button>`).join('')}</div>
      <p class="mut">${g.d}</p>
      <div class="card glass tilt in" style="margin-top:14px;min-height:300px;display:flex;flex-direction:column">
        <div class="pop"><div class="row sp"><span class="pill br">Paso ${i + 1} de ${g.p.length}</span><div class="steps" style="width:120px">${g.p.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div></div>
        <div class="ico" style="width:74px;height:74px;border-radius:24px;margin:26px 0 16px;background:var(--grad);color:var(--ink);border:0;box-shadow:0 20px 40px -14px var(--brand)">${ic(p[2], 34)}</div>
        <h2>${p[0]}</h2><p class="mut" style="font-size:16px">${p[1]}</p></div><div class="g"></div>
        <div class="row" style="margin-top:16px"><button class="btn ghost" data-m="-1" ${i ? '' : 'disabled'}>${ic('back', 16)}</button><button class="btn g" data-m="1">${i < g.p.length - 1 ? 'Siguiente ' + ic('next', 16) : '¡Pruébalo! ' + ic('play', 14)}</button></div>
      </div>
      <div class="card flat" style="margin-top:14px"><h3>Pruébalo con el negocio de ejemplo</h3><div class="grid g2" style="margin-top:12px">
        <a class="btn sm" href="#/s/${t.slug}">${ic('user', 15)} App del cliente</a><a class="btn ghost sm" href="#/s/${t.slug}/equipo">${ic('scissors', 15)} Equipo · PIN ${S.staff(t.id)[1]?.pin || S.staff(t.id)[0].pin}</a>
        <a class="btn ghost sm" href="#/s/${t.slug}/panel">${ic('chart', 15)} Dueño · PIN ${S.staff(t.id)[0].pin}</a><a class="btn ghost sm" href="#/glow">${ic('store', 15)} Panel Glow</a></div>
        <p class="xs dim" style="margin:12px 0 0">Truco: abre la app del cliente en una pestaña y el panel del dueño en otra. Reserva y mira cómo aparece al instante.</p></div>
      <div class="card flat" style="margin-top:14px"><h3>Preguntas rápidas</h3>
        ${[['¿Mis clientes tienen que descargar algo?', 'No. Es un link. Si quieren, la instalan como app en un toque.'], ['¿Qué pasa si dos personas eligen la misma hora?', 'Glow revisa al confirmar: si alguien la tomó primero, le pide elegir otra. Nunca hay citas encimadas.'], ['¿Se cobra ITBMS?', 'Sí: los precios se guardan sin ITBMS y la caja suma el 7% al cobrar.'], ['¿Los mensajes de WhatsApp se envían solos?', 'Los recordatorios automáticos se activan con el número oficial de WhatsApp del negocio (plan Pro). Las campañas las envías tú, una por una, para cuidar tu número.'], ['¿Dónde se guardan los datos?', 'En esta demo, solo en este navegador. En la versión real, en la base de datos de Glow, separada por negocio y con respaldo.']].map(([q, a]) => `<details style="border-bottom:1px solid var(--line);padding:12px 0"><summary class="b sm" style="cursor:pointer">${q}</summary><p class="mut sm" style="margin:8px 0 0">${a}</p></details>`).join('')}</div>
    </main>`;
    tilt(el);
  };
  el.onclick = e => { const x = e.target.closest('[data-k],[data-m]'); if (!x) return;
    if (x.dataset.k) { k = x.dataset.k; i = 0; return pinta(); }
    const n = i + +x.dataset.m; if (n >= G[k].p.length) { location.hash = k === 'cliente' ? '#/s/' + t.slug : k === 'equipo' ? '#/s/' + t.slug + '/equipo' : k === 'dueno' ? '#/s/' + t.slug + '/panel' : '#/glow'; return; }
    i = Math.max(0, n); pinta(); };
  pinta();
  return () => { el.onclick = null; };
}
