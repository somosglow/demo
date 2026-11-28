import * as S from './store.js';
import { esc, ic, ini, setBrand, tilt, estrellas } from './ui.js';
import { mapa, CSS_MAPA, animarMapa } from './mapa.js';

export function render(el) {
  setBrand(null);
  const ts = S.tenants();
  const f = [
    ['cal', 'Reservas 24/7', 'Tus clientes reservan solos, en 3 toques, a cualquier hora.'],
    ['bell', 'Cero plantones', 'Recordatorios automáticos y confirmación con un toque.'],
    ['cash', 'Caja con ITBMS', 'Cobra con Yappy, tarjeta o efectivo y cierra el día en segundos.'],
    ['gift', 'Clientes que vuelven', 'Tarjeta de sellos, premios y campañas para los que no regresan.'],
    ['chart', 'Tus números claros', 'Ingresos, ocupación, servicios estrella y quién rinde más.'],
    ['spark', 'Con tu marca', 'Tu nombre, tus colores y tu link. Instalable como app.'],
  ];
  el.innerHTML = `
  <header class="top"><div class="wide in-top">
    <a class="logo" href="#/"><img src="img/glow-logo-dark.png" alt="Glow" style="height:28px;display:block"></a><div class="g"></div>
    <a class="btn ghost sm" href="#/guia">${ic('book', 17)} Guía</a>
    <a class="btn sm" href="#/glow">Panel Glow</a>
  </div></header>
  <main class="wide" style="padding-bottom:80px">
    <section class="c" style="padding:34px 0 10px">
      <div class="orb tilt in"><div class="ring"></div><div class="ring r2"></div><div class="core" style="background:radial-gradient(circle at 32% 28%,#fff 0,#FAF6EF 45%,#d9d2c6 100%);box-shadow:0 0 90px rgba(255,122,89,.55),inset -20px -30px 60px rgba(0,0,0,.25)"></div><div class="glyph"><img src="img/estrella.svg" alt="" style="width:46%;filter:drop-shadow(0 10px 30px rgba(255,107,74,.6))"></div></div>
      <span class="pill br in2" style="margin-top:6px">✦ La nueva forma de reservar en Panamá</span>
      <h1 class="in2" style="margin:14px auto 10px;max-width:720px">Tu negocio, en una app <span class="grad-t">que brilla.</span></h1>
      <p class="mut in3" style="max-width:520px;margin:0 auto 22px;font-size:16.5px">Reservas, recordatorios, caja, fidelidad y reportes en un solo lugar. Para barberías, salones, uñas, spas y estéticas.</p>
      <div class="row in4" style="justify-content:center;flex-wrap:wrap">
        <a class="btn" href="#/glow/nuevo">${ic('plus', 18)} Crear mi negocio</a>
        <a class="btn ghost" href="#/guia">${ic('play', 16)} Cómo funciona</a>
      </div>
    </section>

    <section style="margin-top:46px">
      <div class="row sp" style="margin-bottom:12px"><h2>Pruébalo en vivo</h2><span class="pill"><i class="dot"></i> Sincronizado</span></div>
      <p class="mut sm" style="margin:-4px 0 16px">Abre la app del cliente y reserva. Luego entra como dueño: la cita aparece al instante.</p>
      <div class="grid g3 stagger">
        ${ts.map(t => `
        <div class="card tilt glass" style="--brand:${t.color};--brand2:${t.color2};--grad:linear-gradient(135deg,${t.color2},${t.color})">
          <div class="row pop"><div class="av" style="--c:linear-gradient(135deg,${t.color2},${t.color})">${esc(ini(t.nombre))}</div>
            <div class="g"><h3>${esc(t.nombre)}</h3><div class="mut xs">${esc(S.TIPOS[t.tipo] || '')} · ${esc(t.zona)}</div></div>
            ${t.demo ? '<span class="pill warn">ejemplo</span>' : ''}</div>
          <div class="col" style="margin-top:16px;gap:8px">
            <a class="btn w sm" href="#/s/${t.slug}">${ic('user', 16)} App del cliente</a>
            <div class="row"><a class="btn ghost sm g" href="#/s/${t.slug}/equipo">${ic('scissors', 16)} Equipo</a><a class="btn ghost sm g" href="#/s/${t.slug}/panel">${ic('chart', 16)} Dueño</a></div>
          </div>
        </div>`).join('')}
      </div>
    </section>

    <section style="margin-top:46px">
      <div class="row sp wrapx" style="margin-bottom:12px"><div><h2>Negocios con Glow en Panamá</h2><p class="mut sm" style="margin:4px 0 0">Toca un pin para ver su app y reservar.</p></div><span class="pill"><i class="dot"></i> ${S.tenants().filter(t => t.estado === 'activo').length} negocios</span></div>
      <div id="mapa">${mapa({ vista: 'pais', alto: Math.min(520, Math.max(340, innerWidth * .5)) })}</div>
    </section>

    <section style="margin-top:46px">
      <h2 style="margin-bottom:16px">Todo lo que tu negocio necesita</h2>
      <div class="grid g3 stagger">
        ${f.map(([i, t, d]) => `<div class="card tilt flat"><div class="ico pop" style="background:var(--grad);color:var(--ink);border:0">${ic(i)}</div><h3 style="margin:14px 0 4px">${t}</h3><p class="mut sm" style="margin:0">${d}</p></div>`).join('')}
      </div>
    </section>

    <section style="margin-top:46px" id="planes">
      <h2>Planes</h2><p class="mut sm" style="margin:4px 0 16px">Precio fundador para los primeros 10 negocios: instalación a mitad de precio. Paga mensual o anual (2 meses gratis).</p>
      <div class="grid g3 rsp stagger">${[
        ['Esencial', 35, 350, 'Para empezar a llenar tu agenda', ['Tu app de reservas con tu marca y tu link', 'Recordatorios automáticos', 'Caja con ITBMS y cierre del día', 'Tarjeta de fidelidad y referidos', 'Fila sin cita, pase QR y pantalla TV', 'Clientes, servicios y precios por profesional', 'Hasta 3 profesionales']],
        ['Pro', 79, 350, 'El más elegido: vende más en automático', ['Todo lo de Esencial', 'Asistente con IA en WhatsApp que agenda', 'Depósitos con Yappy o tarjeta', 'Ofertas, cupones, regalos, paquetes y membresías', 'Campañas: te toca tu corte, cumpleaños, día flojo', 'Reportes completos y exportables', 'Hasta 10 profesionales']],
        ['Negocio', 149, 600, 'Para cadenas y varias sucursales', ['Todo lo de Pro', 'Varias sucursales en un solo panel', 'Profesionales ilimitados', 'Inventario por sucursal', 'Soporte prioritario y capacitación', 'Factura electrónica DGI integrada']],
      ].map(([n, p, ins, d, f], i) => `<div class="card ${i === 1 ? 'glass' : 'flat'} tilt" style="${i === 1 ? 'border:2px solid var(--brand)' : ''}"><div class="pop"><div class="row sp"><h3>${n}</h3>${i === 1 ? '<span class="pill br">Más elegido</span>' : ''}</div><p class="xs mut" style="margin:4px 0 10px">${d}</p>
        <div style="font-size:38px;font-weight:800;letter-spacing:-.03em">$${p}<span class="sm mut" style="font-weight:500">/mes</span></div><div class="xs mut">o $${p * 10}/año · instalación <s>$${ins}</s> <b style="color:var(--txt)">$${ins / 2}</b> precio fundador</div>
        <div class="col" style="gap:6px;margin:14px 0">${f.map(x => `<div class="row sm" style="gap:8px;align-items:flex-start"><span style="color:var(--ok)">${ic('check', 16)}</span>${x}</div>`).join('')}</div><a class="btn ${i === 1 ? '' : 'ghost'} w" href="#/glow/nuevo">Empezar</a></div></div>`).join('')}</div>
    </section>

    <section class="card glass c" style="margin-top:46px;padding:30px 20px">
      <h2>Tu app lista hoy mismo</h2>
      <p class="mut" style="margin:8px auto 18px;max-width:460px">Dinos el nombre, el tipo de negocio y tus colores. En un minuto tienes tu link para compartir.</p>
      <a class="btn" href="#/glow/nuevo">${ic('bolt', 18)} Crear mi negocio gratis</a>
    </section>
    <p class="c dim xs" style="margin-top:30px">Glow · Panamá · Versión demo: los datos se guardan solo en este navegador.</p>
  </main>`;
  tilt(el);
  if (!document.getElementById('css-mapa')) { const st = document.createElement('style'); st.id = 'css-mapa'; st.textContent = CSS_MAPA; document.head.append(st); }
  el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { el.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); el.querySelector('#mapa').innerHTML = mapa({ vista: b.dataset.v, alto: Math.min(520, Math.max(360, innerWidth * .55)) }); });
  return animarMapa(el.querySelector('#mapa'));
}
