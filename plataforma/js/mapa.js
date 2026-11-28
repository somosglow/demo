import * as S from './store.js';
import { esc, ini } from './ui.js';
import { AMERICA } from './america.js';

/* Mapa 3D de Panamá: plano inclinado con perspectiva, costa dibujada y un pin por negocio con sus estrellas. */
const VISTAS = { pais: [-83.2, -77.1, 7.0, 9.8], latam: [-118, -33, -56, 33] };
export const CIUDADES = {
  'Panamá': [['Ciudad de Panamá', 8.983, -79.519], ['San Francisco', 8.993, -79.505], ['Costa del Este', 9.012, -79.462], ['Vía España', 8.999, -79.522], ['Bella Vista', 8.983, -79.527], ['El Dorado', 9.007, -79.546], ['San Miguelito', 9.033, -79.5], ['Arraiján', 8.948, -79.66], ['La Chorrera', 8.88, -79.783], ['Coronado', 8.534, -79.893], ['Colón', 9.359, -79.9], ['Santiago', 8.1, -80.983], ['Chitré', 7.964, -80.429], ['David', 8.427, -82.431], ['Boquete', 8.78, -82.441], ['Bocas del Toro', 9.34, -82.241]],
  'México': [['Ciudad de México', 19.433, -99.133], ['Guadalajara', 20.659, -103.349], ['Monterrey', 25.686, -100.316], ['Cancún', 21.161, -86.851], ['Puebla', 19.041, -98.206]],
  'Colombia': [['Bogotá', 4.711, -74.072], ['Medellín', 6.244, -75.581], ['Cali', 3.451, -76.532], ['Barranquilla', 10.964, -74.796], ['Cartagena', 10.391, -75.479]],
  'Costa Rica': [['San José', 9.928, -84.091]], 'Guatemala': [['Ciudad de Guatemala', 14.634, -90.507]], 'El Salvador': [['San Salvador', 13.692, -89.218]], 'Honduras': [['Tegucigalpa', 14.072, -87.192], ['San Pedro Sula', 15.506, -88.025]], 'Nicaragua': [['Managua', 12.114, -86.236]],
  'República Dominicana': [['Santo Domingo', 18.486, -69.931], ['Santiago de los Caballeros', 19.451, -70.697]], 'Puerto Rico': [['San Juan', 18.466, -66.106]],
  'Venezuela': [['Caracas', 10.48, -66.904], ['Maracaibo', 10.642, -71.613]], 'Ecuador': [['Quito', -0.18, -78.468], ['Guayaquil', -2.17, -79.922]], 'Perú': [['Lima', -12.046, -77.043], ['Arequipa', -16.409, -71.537]],
  'Bolivia': [['La Paz', -16.49, -68.119], ['Santa Cruz', -17.783, -63.182]], 'Chile': [['Santiago', -33.449, -70.669], ['Viña del Mar', -33.025, -71.552]], 'Argentina': [['Buenos Aires', -34.604, -58.382], ['Córdoba', -31.42, -64.188], ['Rosario', -32.947, -60.639]],
  'Uruguay': [['Montevideo', -34.901, -56.165]], 'Paraguay': [['Asunción', -25.264, -57.576]], 'Brasil': [['São Paulo', -23.551, -46.633], ['Río de Janeiro', -22.907, -43.173]],
  'Estados Unidos': [['Miami', 25.762, -80.192], ['Houston', 29.76, -95.37], ['Nueva York', 40.713, -74.006]] };
const CAPITALES = [['Ciudad de México', -99.13, 19.43], ['Bogotá', -74.07, 4.71], ['Lima', -77.04, -12.05], ['Santiago', -70.67, -33.45], ['Buenos Aires', -58.38, -34.6], ['Caracas', -66.9, 10.48], ['Quito', -78.47, -0.18], ['São Paulo', -46.63, -23.55], ['Panamá', -79.52, 8.98], ['Santo Domingo', -69.93, 18.49], ['Guatemala', -90.51, 14.63], ['La Paz', -68.12, -16.49], ['Montevideo', -56.17, -34.9], ['Asunción', -57.58, -25.26]];

export function mapa({ vista = 'latam', alto = 420, enlace = s => '#/s/' + s, centro = null, radio = 10, ids = null } = {}) {
  let caja = VISTAS[vista];
  if (centro) { const dLa = radio * 1.25 / 111, dLo = radio * 1.25 / (111 * Math.cos(centro[0] * Math.PI / 180)); caja = [centro[1] - dLo, centro[1] + dLo, centro[0] - dLa * .8, centro[0] + dLa * .8]; }
  const [x0, x1, y0, y1] = caja; const W = 1000, H = Math.round(W * (y1 - y0) / (x1 - x0) * 1.15);
  const P = ([lon, lat]) => [((lon - x0) / (x1 - x0)) * W, ((y1 - lat) / (y1 - y0)) * H];
  const tierra = AMERICA.map(([n, rings]) => `<path d="${rings.map(r => { const q = r.map(P); if (q.every(([x, y]) => x < -50 || x > W + 50 || y < -50 || y > H + 50)) return ''; return 'M' + q.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join('L') + 'Z'; }).join('')}"><title>${esc(n)}</title></path>`).join('');
  const ts = S.tenants().filter(t => t.estado === 'activo' && (!ids || ids.includes(t.id)));
  let vis = ts.map(t => { const [lat, lon] = S.geoDe(t); const [x, y] = P([lon, lat]); return { t, x, y }; }).filter(o => o.x > -20 && o.x < W + 20 && o.y > -20 && o.y < H + 20);
  if (!centro) { const grupos = []; vis.forEach(o => { const g = grupos.find(g => Math.hypot(g.x - o.x, g.y - o.y) < 45); if (g) g.ts.push(o.t); else grupos.push({ x: o.x, y: o.y, ts: [o.t], t: o.t }); }); vis = grupos; }
  const anclas = vis.map((o, i) => `<span class="manc" data-i="${i}" style="left:${o.x / W * 100}%;top:${o.y / H * 100}%;--c:${o.ts && o.ts.length > 1 ? '#0F1420' : o.t.color}"></span>`).join('');
  const pins = vis.map((o, i) => { const t = o.t; const grupo = o.ts && o.ts.length > 1;
    const rs = (grupo ? o.ts : [t]).flatMap(x => S.reviews(x.id)); const pr = rs.length ? (rs.reduce((a, b) => a + b.estrellas, 0) / rs.length).toFixed(1) : '—';
    if (grupo) return `<a class="mpin" data-p="${i}" href="#cerca" onclick="document.getElementById('cerca')?.scrollIntoView({behavior:'smooth'});return false" style="--c:#0F1420;--c2:#5B6475;--h:40px"><span class="mpin-card"><i>${o.ts.length}</i><span><b>${o.ts.length} negocios aquí</b><small>★ ${pr} · toca para ver los cercanos</small></span></span><span class="mpin-stem"></span></a>`;
    return `<a class="mpin" data-p="${i}" href="${enlace(t.slug)}" style="--c:${t.color};--c2:${t.color2};--h:${34 + (i % 3) * 40}px"><span class="mpin-card">${t.logo ? `<i style="background:#fff url(${t.logo}) center/contain no-repeat"></i>` : `<i>${esc(ini(t.nombre))}</i>`}<span><b>${esc(t.nombre)}</b><small>★ ${pr} · ${esc(S.TIPOS[t.tipo] || '')}</small></span></span><span class="mpin-stem"></span></a>`; }).join('');
  const ciudades = (vista === 'latam' && !centro ? CAPITALES : []).map(([n, lon, lat]) => { const [x, y] = P([lon, lat]); return `<circle cx="${x}" cy="${y}" r="4" class="mcity"/><text x="${x}" y="${y + 24}" text-anchor="middle" class="mtxt">${n}</text>`; }).join('');
  const ancho = H / W > 0.75 ? `width:min(92%, ${Math.round(alto * 1.15 * W / H)}px);left:0;right:0;margin:0 auto` : 'left:4%;right:4%';
  return `<div class="mapa3d" style="height:${alto}px"><div class="mplano" style="aspect-ratio:${W}/${H};${ancho}">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="tierra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F3EFE8"/></linearGradient>
      <pattern id="rej" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(15,20,32,.05)"/></pattern><filter id="sombra"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0F1420" flood-opacity=".18"/></filter></defs>
      <rect width="${W}" height="${H}" fill="url(#rej)"/>
      <g fill="url(#tierra)" stroke="color-mix(in srgb,var(--brand) 45%,#c9c3b8)" stroke-width="${centro ? 2.5 : 1.4}" stroke-linejoin="round" filter="url(#sombra)">${tierra}</g>
      ${centro ? (() => { const [cx, cy] = P([centro[1], centro[0]]); const rr = radio / ((x1 - x0) * 111 * Math.cos(centro[0] * Math.PI / 180)) * W; return `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="color-mix(in srgb,var(--brand) 8%,transparent)" stroke="var(--brand)" stroke-width="2" stroke-dasharray="8 8"/>`; })() : ciudades}</svg>${anclas}${centro ? (() => { const [cx, cy] = P([centro[1], centro[0]]); return `<span class="myo" style="left:${cx / W * 100}%;top:${cy / H * 100}%"></span>`; })() : ''}</div><div class="mover">${pins}</div></div>`;
}

export const CSS_MAPA = `
.mapa3d{position:relative;perspective:1100px;overflow:hidden;border-radius:28px;background:radial-gradient(120% 90% at 50% 10%,#EAF4FF,#DCEBFA 55%,#CFE2F5);box-shadow:var(--sh)}
.mapa3d::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,transparent 70%,rgba(220,235,250,.9))}
.mplano{position:absolute;top:2%;transform-style:preserve-3d;transform:rotateX(48deg) rotateZ(-6deg) translateY(-6%);animation:mflot 9s ease-in-out infinite;transform-origin:50% 60%}
@keyframes mflot{50%{transform:rotateX(52deg) rotateZ(-3deg) translateY(-6%)}}
.mplano svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.mtxt{font:600 18px Poppins,sans-serif;fill:#5B6475}.mcity{fill:#0F1420;opacity:.35}
.manc{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:var(--c);box-shadow:0 0 0 6px color-mix(in srgb,var(--c) 25%,transparent);animation:mping 2.2s infinite}
@keyframes mping{50%{box-shadow:0 0 0 16px color-mix(in srgb,var(--c) 0%,transparent)}}
.mover{position:absolute;inset:0;pointer-events:none}
.myo{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#2F8CFF;border:4px solid #fff;box-shadow:0 0 0 10px rgba(47,140,255,.25),0 6px 14px rgba(0,0,0,.25);animation:mping2 2s infinite}
@keyframes mping2{50%{box-shadow:0 0 0 20px rgba(47,140,255,0),0 6px 14px rgba(0,0,0,.25)}}
.mpin{position:absolute;left:0;top:0;pointer-events:auto;text-decoration:none;color:var(--txt);display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);will-change:left,top;z-index:2}
.mpin-card{display:flex;gap:8px;align-items:center;background:#fff;padding:6px 12px 6px 6px;border-radius:999px;box-shadow:0 14px 30px -10px rgba(15,20,32,.45);white-space:nowrap;animation:mbote 3s ease-in-out infinite;border:2px solid var(--c)}
.mpin-card i{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:12px;color:#fff;background:linear-gradient(135deg,var(--c2),var(--c));flex:none}
.mpin-card b{display:block;font-size:13px;line-height:1.1}.mpin-card small{font-size:11px;color:#B76E00;font-weight:600}
.mpin-stem{width:3px;height:var(--h);background:linear-gradient(var(--c),color-mix(in srgb,var(--c) 10%,transparent));border-radius:3px}
@keyframes mbote{50%{transform:translateY(-6px)}}
.mpin:hover{z-index:5}.mpin:hover .mpin-card{transform:scale(1.06)}
@media(max-width:600px){.mpin-card b{font-size:11px}.mpin-card small{font-size:10px}.mpin-card i{width:26px;height:26px}.mtxt{font-size:26px}}
`;

/* coloca los pines (planos, siempre legibles) sobre su punto del mapa inclinado, cuadro a cuadro */
export function animarMapa(root) {
  let vivo = true;
  const paso = () => { if (!vivo || !document.body.contains(root)) return; const box = root.querySelector('.mapa3d')?.getBoundingClientRect(); if (box) root.querySelectorAll('.manc').forEach(a => { const r = a.getBoundingClientRect(); const p = root.querySelector(`[data-p="${a.dataset.i}"]`); if (p) { p.style.left = (r.left + r.width / 2 - box.left) + 'px'; p.style.top = (r.top + r.height / 2 - box.top) + 'px'; } }); requestAnimationFrame(paso); };
  requestAnimationFrame(paso); return () => { vivo = false; };
}
