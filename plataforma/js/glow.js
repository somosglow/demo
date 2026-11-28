import * as S from './store.js';
import { $, $$, esc, ic, ini, toast, tilt, setBrand, contar, confetti, vibrar, sheet, closeSheet } from './ui.js';

const PRECIO = { Esencial: 35, Pro: 79 };
const PALETAS = [['#FF7A59', '#FFB547'], ['#FF5C8A', '#FFB3C7'], ['#7C5CFF', '#B9A8FF'], ['#2EC5FF', '#9BE7FF'], ['#3DDC97', '#B8F5D9'], ['#E8C26E', '#F7E3B0'], ['#FFFFFF', '#9AA3B5'], ['#FF3B3B', '#FF9A6B']];

export function render(el, [sub]) {
  setBrand(null); document.title = 'Glow · Panel';
  if (sub === 'nuevo') return nuevo(el);
  const pintar = () => {
    const ts = S.tenants(); const act = ts.filter(t => t.estado === 'activo');
    const mrr = act.reduce((a, t) => a + (PRECIO[t.plan] || 0), 0);
    const mes = S.ymd(new Date()).slice(0, 7);
    const citasMes = ts.reduce((a, t) => a + S.bookings(t.id).filter(b => b.inicio.startsWith(mes)).length, 0);
    const app = ts.reduce((a, t) => a + S.bookings(t.id).filter(b => b.inicio.startsWith(mes) && b.origen === 'app').length, 0);
    el.innerHTML = `<header class="top"><div class="wide in-top"><a class="logo" href="#/"><img src="img/glow-logo.png" style="height:26px" alt="Glow"></a><span class="pill br">Panel maestro</span><div class="g"></div><a class="btn sm" href="#/glow/nuevo">${ic('plus', 16)} Nuevo negocio</a></div></header>
    <main class="wide" style="padding:22px 20px 80px">
      <h1 class="in" style="font-size:32px">Todos los negocios</h1><p class="mut in">Cada salón es un espacio separado dentro de Glow. Tú ves todo; cada dueño solo ve lo suyo.</p>
      <div class="grid g4 stagger" style="margin-top:16px">
        <div class="kpi"><div class="l">Ingreso mensual (MRR)</div><div class="v grad-t" data-n="${mrr}" data-pre="$">0</div><div class="xs mut">meta $20,000</div></div>
        <div class="kpi"><div class="l">Negocios activos</div><div class="v" data-n="${act.length}">0</div></div>
        <div class="kpi"><div class="l">Citas este mes</div><div class="v" data-n="${citasMes}">0</div></div>
        <div class="kpi"><div class="l">Reservas por app</div><div class="v" data-n="${app}">0</div><div class="xs mut">sin llamadas ni chats</div></div>
      </div>
      <div class="card flat in2" style="margin-top:12px"><div class="row sp"><div class="sm">Camino a $20,000/mes</div><div class="b sm">${Math.round(mrr / 200)}%</div></div><div style="height:10px;border-radius:9px;background:var(--line);margin-top:10px;overflow:hidden"><div style="height:100%;width:${Math.min(100, mrr / 200)}%;background:var(--grad);border-radius:9px;animation:grow 1.2s both"></div></div><div class="xs mut" style="margin-top:8px">≈ ${Math.ceil((20000 - mrr) / 79)} negocios más en plan Pro para llegar.</div></div>
      <div class="card flat pad0 in3" style="margin-top:12px"><table class="t"><thead><tr><th>Negocio</th><th class="hide-m">Plan</th><th>Citas</th><th>Estado</th><th></th></tr></thead><tbody>
        ${ts.map(t => `<tr><td><div class="row"><div class="av" style="--c:linear-gradient(135deg,${t.color2},${t.color});width:36px;height:36px;font-size:12px">${esc(ini(t.nombre))}</div><div><div class="b">${esc(t.nombre)} ${t.demo ? '<span class="pill warn">ejemplo</span>' : ''}</div><div class="xs mut">${esc(S.TIPOS[t.tipo] || '')} · ${esc(t.zona)}</div></div></div></td>
          <td class="hide-m"><span class="pill ${t.plan === 'Pro' ? 'br' : ''}">${t.plan} · $${PRECIO[t.plan]}</span></td><td>${S.bookings(t.id).filter(b => b.inicio.startsWith(mes)).length}</td>
          <td><button class="pill ${t.estado === 'activo' ? 'ok' : 'bad'}" data-est="${t.id}" style="cursor:pointer">${t.estado}</button></td>
          <td><div class="row"><a class="ico" title="App del cliente" href="#/s/${t.slug}">${ic('user', 17)}</a><a class="ico" title="Panel del dueño" href="#/s/${t.slug}/panel">${ic('chart', 17)}</a></div></td></tr>`).join('')}
      </tbody></table></div>
      <div class="row" style="margin-top:16px;justify-content:space-between;flex-wrap:wrap"><p class="xs dim">Versión demo: los negocios viven en este navegador. En la versión real, cada uno queda en la base de datos de Glow con seguridad por negocio.</p><button class="btn ghost sm" data-a="reset">Reiniciar datos de ejemplo</button></div>
    </main>`;
    tilt(el); contar(el);
  };
  el.onclick = e => {
    const x = e.target.closest('[data-est],[data-a]'); if (!x) return;
    if (x.dataset.est) { const t = S.tenant(x.dataset.est); S.saveTenant({ id: t.id, estado: t.estado === 'activo' ? 'suspendido' : 'activo' }); toast(t.estado === 'activo' ? 'Negocio suspendido' : 'Negocio activado'); }
    if (x.dataset.a === 'reset') { if (!x.dataset.ok) { x.dataset.ok = 1; x.textContent = 'Toca otra vez para borrar todo'; return; } S.reset(); toast('Datos de ejemplo reiniciados'); }
  };
  const off = S.onChange(pintar); pintar();
  return () => { off(); el.onclick = null; };
}

function nuevo(el) {
  const d = { nombre: '', tipo: 'barberia', zona: '', tel: '', equipo: '', color: PALETAS[0][0], color2: PALETAS[0][1], plan: 'Pro' }; let paso = 0;
  const pasos = ['Tu negocio', 'Tu estilo', 'Tu equipo', 'Listo'];
  const pinta = () => {
    setBrand({ color: d.color, color2: d.color2 });
    el.innerHTML = `<header class="top"><div class="wrap in-top">${paso ? `<button class="ico" data-a="atras">${ic('back')}</button>` : `<a class="ico" href="#/">${ic('x')}</a>`}<div class="g"><div class="b">Crea tu app</div><div class="steps" style="margin-top:6px">${pasos.map((_, i) => `<i class="${i <= paso ? 'on' : ''}"></i>`).join('')}</div></div></div></header>
    <main class="wrap" style="padding-bottom:120px">${[p0, p1, p2][paso]()}</main>
    <div class="dock"><div style="max-width:560px;margin:0 auto"><button class="btn w" data-a="sig">${paso === 2 ? ic('bolt', 18) + ' Crear mi app' : 'Continuar ' + ic('next', 16)}</button></div></div>`;
    tilt(el);
  };
  const p0 = () => `<h1 class="in" style="font-size:32px;margin:22px 0 6px">¿Cómo se llama tu negocio?</h1><p class="mut in">En un minuto tienes tu app lista para compartir.</p>
    <div class="in2" style="margin-top:18px"><div class="field"><label>Nombre</label><input id="d-n" value="${esc(d.nombre)}" placeholder="Ej.: Barbería Los Reyes" autofocus></div>
    <label>Tipo de negocio</label><div class="grid g2" style="margin-bottom:14px">${Object.entries(S.TIPOS).map(([k, v]) => `<button class="chip ${d.tipo === k ? 'on' : ''}" data-tipo="${k}" style="justify-content:center;padding:12px">${v}</button>`).join('')}</div>
    <div class="field"><label>Zona</label><input id="d-z" value="${esc(d.zona)}" placeholder="Ej.: San Francisco, Panamá"></div><div class="field"><label>WhatsApp del negocio</label><input id="d-t" type="tel" value="${esc(d.tel)}" placeholder="6000-0000"></div></div>`;
  const p1 = () => `<h1 class="in" style="font-size:32px;margin:22px 0 6px">Elige tus colores</h1><p class="mut in">Así se verá tu app. Lo puedes cambiar cuando quieras.</p>
    <div class="grid in2" style="margin:18px 0;grid-template-columns:repeat(4,1fr)">${PALETAS.map(([a, b], i) => `<button class="card tilt" data-pal="${i}" style="aspect-ratio:1;padding:0;cursor:pointer;background:linear-gradient(135deg,${b},${a});border:${d.color === a ? '3px solid #fff' : '1px solid var(--line)'}"></button>`).join('')}</div>
    <div class="grid g2 in3"><div class="field"><label>Color principal</label><input id="d-c" type="color" value="${d.color}" style="height:50px;padding:6px"></div><div class="field"><label>Secundario</label><input id="d-c2" type="color" value="${d.color2}" style="height:50px;padding:6px"></div></div>
    <div class="card glass tilt in4" style="margin-top:8px"><div class="row pop"><div class="av r">${esc(ini(d.nombre || 'Tu negocio'))}</div><div class="g"><div class="b">${esc(d.nombre || 'Tu negocio')}</div><div class="xs mut">${esc(S.TIPOS[d.tipo])}</div></div><span class="btn sm">Reservar</span></div></div>`;
  const p2 = () => `<h1 class="in" style="font-size:32px;margin:22px 0 6px">¿Quién atiende?</h1><p class="mut in">Escribe los nombres separados por coma. Cada uno tendrá su acceso con PIN.</p>
    <div class="field in2" style="margin-top:18px"><label>Equipo</label><input id="d-e" value="${esc(d.equipo)}" placeholder="Ej.: Carlos, Andrés, María"></div>
    <label class="in3">Plan</label><div class="grid g2 in3">${['Esencial', 'Pro'].map(p => `<button class="card ${d.plan === p ? 'glass' : 'flat'}" data-plan="${p}" style="cursor:pointer;text-align:left;${d.plan === p ? 'border-color:var(--brand)' : ''}"><div class="b">${p}</div><div style="font-size:24px;font-weight:700">$${PRECIO[p]}<span class="xs mut">/mes</span></div><div class="xs mut">${p === 'Pro' ? 'IA en WhatsApp, depósitos, campañas, reportes' : 'App, recordatorios, caja y fidelidad'}</div></button>`).join('')}</div>
    <p class="xs dim in4" style="margin-top:12px">Los servicios se cargan con una plantilla de ${esc(S.TIPOS[d.tipo])} que puedes editar en tu panel.</p>`;
  const listo = t => {
    el.innerHTML = `<main class="wrap c" style="padding-top:50px"><div class="orb tilt in" style="width:200px"><div class="ring"></div><div class="core"></div><div class="glyph" style="font-size:44px">${esc(ini(t.nombre))}</div></div>
      <h1 class="in2" style="font-size:34px">¡${esc(t.nombre)} ya tiene su app!</h1><p class="mut in2">Servicios, equipo y horario cargados. PIN del dueño: <b>${S.staff(t.id)[0]?.pin}</b></p>
      <div class="col in3" style="margin-top:20px"><a class="btn w" href="#/s/${t.slug}">${ic('user', 18)} Ver la app de mis clientes</a><a class="btn ghost w" href="#/s/${t.slug}/panel">${ic('chart', 18)} Ir a mi panel</a><a class="btn ghost w" href="#/glow">Volver al panel Glow</a></div></main>`;
    tilt(el); confetti([t.color2, t.color, '#fff']);
  };
  const leer = () => { const v = k => $(k)?.value; if (paso === 0) { d.nombre = v('#d-n').trim(); d.zona = v('#d-z'); d.tel = v('#d-t'); } if (paso === 1) { d.color = v('#d-c'); d.color2 = v('#d-c2'); } if (paso === 2) d.equipo = v('#d-e'); };
  el.onclick = e => {
    const x = e.target.closest('[data-a],[data-tipo],[data-pal],[data-plan]'); if (!x) return; vibrar(8); leer();
    if (x.dataset.tipo) { d.tipo = x.dataset.tipo; return pinta(); }
    if (x.dataset.pal) { [d.color, d.color2] = PALETAS[+x.dataset.pal]; return pinta(); }
    if (x.dataset.plan) { d.plan = x.dataset.plan; return pinta(); }
    if (x.dataset.a === 'atras') { paso--; return pinta(); }
    if (x.dataset.a === 'sig') {
      if (paso === 0 && d.nombre.length < 2) return toast('Escribe el nombre del negocio', 'store');
      if (paso < 2) { paso++; return pinta(); }
      const eq = d.equipo.split(',').map(s => s.trim()).filter(Boolean);
      const t = S.crearNegocio({ ...d, equipo: eq.length ? eq : ['Dueño'] }); listo(t);
    }
  };
  el.oninput = e => { if (e.target.id === 'd-c' || e.target.id === 'd-c2') { leer(); setBrand({ color: d.color, color2: d.color2 }); } };
  pinta();
  return () => { el.onclick = null; el.oninput = null; };
}
