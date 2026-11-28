import * as S from './store.js';
import { esc, ic, ini, setBrand, tilt, estrellas, toast, h12 } from './ui.js';
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
      <div class="row sp" style="margin-bottom:12px"><h2>¿Tienes un negocio? Pruébalo en vivo</h2><span class="pill"><i class="dot"></i> Sincronizado</span></div>
      <p class="mut sm" style="margin:-4px 0 16px">Abre la app del cliente y reserva. Luego entra como dueño: la cita aparece al instante.</p>
      <div class="grid g3 stagger">
        ${ts.filter(t => t.demo).map(t => `
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

    <section style="margin-top:46px" id="cerca"></section>

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
  const zona = el.querySelector('#cerca'); let radio = +(sessionStorage.getItem('glow.radio') || 10);
  const ubic = () => { try { return JSON.parse(sessionStorage.getItem('glow.ubic')); } catch (e) { return null; } };
  const pintaCerca = () => {
    const u = ubic();
    if (!u) { zona.innerHTML = `<div class="card glass c" style="padding:28px 20px"><div class="ico" style="margin:0 auto;width:60px;height:60px;border-radius:20px;background:var(--grad);color:var(--ink);border:0">${ic('globe', 28)}</div>
      <h2 style="margin:14px 0 6px">Negocios cerca de ti</h2><p class="mut" style="max-width:420px;margin:0 auto 16px">Te mostramos solo las barberías, salones y spas que tienes cerca, con sus estrellas y su próxima hora libre.</p>
      <button class="btn" data-a="gps">${ic('globe', 18)} Usar mi ubicación</button>
      <div class="row" style="max-width:420px;margin:14px auto 0"><select id="zona-sel"><option value="">…o elige tu zona</option>${Object.keys(S.ZONAS).filter((k, i, a) => !/[áéíóú]/.test(k) || !a.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))).filter(k => k !== 'panama').map(k => `<option value="${k}">${k.replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('')}</select></div>
      <p class="xs dim" style="margin-top:10px">Tu ubicación solo se usa en este celular para ordenar los negocios. No se guarda.</p></div>`;
      zona.querySelector('#zona-sel').onchange = e => { const z = S.ZONAS[e.target.value]; if (z) { sessionStorage.setItem('glow.ubic', JSON.stringify({ lat: z[0], lng: z[1], nombre: e.target.selectedOptions[0].text })); pintaCerca(); } };
      return; }
    const yo = [u.lat, u.lng];
    const lista = S.tenants().filter(t => t.estado === 'activo').map(t => ({ t, d: S.km(yo, S.geoDe(t)) })).filter(x => x.d <= radio).sort((a, b) => a.d - b.d);
    const rt = t => { const r = S.reviews(t.id); return r.length ? r.reduce((a, x) => a + x.estrellas, 0) / r.length : 0; };
    const prox = t => { const s0 = S.services(t.id)[0]; if (!s0) return ''; for (let i = 0; i < 3; i++) { const d = S.addDays(new Date(), i); const sl = S.slots(t.id, [s0.id], null, d)[0]; if (sl) return (i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : 'Pasado mañana') + ' ' + h12(sl.hora); } return ''; };
    zona.innerHTML = `<div class="row sp wrapx" style="margin-bottom:12px"><div><h2>Cerca de ti</h2><p class="mut sm" style="margin:4px 0 0">${esc(u.nombre || 'Tu ubicación')} · ${lista.length} negocio${lista.length === 1 ? '' : 's'} a menos de ${radio} km</p></div>
      <div class="row"><div class="seg">${[3, 5, 10, 25].map(r => `<button class="${r === radio ? 'on' : ''}" data-r="${r}">${r} km</button>`).join('')}</div><button class="ico" data-a="cambiar" title="Cambiar ubicación">${ic('edit', 16)}</button></div></div>
      ${lista.length ? `<div id="mapa">${mapa({ centro: yo, radio, ids: lista.map(x => x.t.id), alto: Math.min(460, Math.max(320, innerWidth * .5)) })}</div>
      <div class="grid g3 rsp stagger" style="margin-top:14px">${lista.map(({ t, d }) => { const r = rt(t); const p = prox(t); return `<a class="card flat tilt" href="#/s/${t.slug}" style="text-decoration:none;--brand:${t.color};--brand2:${t.color2};--grad:linear-gradient(135deg,${t.color2},${t.color})">
        <div class="pop">${t.portada ? `<div style="height:110px;border-radius:16px;background:url(${t.portada}) center/cover;margin-bottom:12px"></div>` : `<div style="height:70px;border-radius:16px;background:linear-gradient(135deg,${t.color2},${t.color});margin-bottom:12px"></div>`}
        <div class="row"><div class="av" style="--c:linear-gradient(135deg,${t.color2},${t.color})${t.logo ? `;background:#fff url(${t.logo}) center/contain no-repeat` : ''}">${t.logo ? '' : esc(ini(t.nombre))}</div><div class="g"><div class="b">${esc(t.nombre)}</div><div class="xs mut">${esc(S.TIPOS[t.tipo] || '')} · ${d < 1 ? Math.round(d * 1000) + ' m' : d.toFixed(1) + ' km'}</div></div></div>
        <div class="row sp" style="margin-top:10px">${r ? `<span class="sm">${estrellas(r, 13)} <b>${r.toFixed(1)}</b></span>` : '<span class="xs mut">Nuevo</span>'}${p ? `<span class="pill ok">${p}</span>` : ''}</div></div></a>`; }).join('')}</div>`
      : `<div class="card flat c" style="padding:30px"><h3>Aún no hay negocios con Glow a menos de ${radio} km</h3><p class="mut sm">Prueba con un radio más grande.</p><button class="btn ghost sm" data-r="25">Ver hasta 25 km</button></div>`}`;
    tilt(zona); if (lista.length) parar = animarMapa(zona.querySelector('#mapa'));
  };
  let parar = null;
  zona.onclick = e => { const x = e.target.closest('[data-a],[data-r]'); if (!x) return;
    if (x.dataset.r) { radio = +x.dataset.r; sessionStorage.setItem('glow.radio', radio); parar && parar(); return pintaCerca(); }
    if (x.dataset.a === 'cambiar') { sessionStorage.removeItem('glow.ubic'); parar && parar(); return pintaCerca(); }
    if (x.dataset.a === 'gps') { if (!navigator.geolocation) return toast('Tu navegador no comparte ubicación: elige tu zona', 'globe'); x.textContent = 'Buscando…';
      navigator.geolocation.getCurrentPosition(p => { sessionStorage.setItem('glow.ubic', JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude, nombre: 'Tu ubicación' })); pintaCerca(); },
        () => { toast('No pudimos ver tu ubicación: elige tu zona', 'globe'); pintaCerca(); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }); } };
  pintaCerca();
  return () => { parar && parar(); };
}
