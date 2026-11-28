import * as S from './store.js';
import { esc, ini } from './ui.js';

/* Mapa 3D de Panamá: plano inclinado con perspectiva, costa dibujada y un pin por negocio con sus estrellas. */
const COSTA = [[-82.56, 9.57], [-82.25, 9.38], [-82.0, 9.1], [-81.75, 9.0], [-81.5, 8.82], [-81.2, 8.78], [-80.85, 8.87], [-80.5, 9.05], [-80.15, 9.2], [-79.9, 9.36], [-79.6, 9.6], [-79.2, 9.58], [-78.9, 9.45], [-78.5, 9.4], [-78.15, 9.25], [-77.85, 9.0], [-77.55, 8.78], [-77.36, 8.67],
  [-77.25, 8.3], [-77.45, 7.95], [-77.75, 7.6], [-77.9, 7.25], [-78.2, 7.5], [-78.4, 8.05], [-78.15, 8.35], [-78.45, 8.45], [-78.75, 8.75], [-79.1, 9.0], [-79.52, 8.94], [-79.75, 8.75], [-79.95, 8.5], [-80.3, 8.3], [-80.45, 8.05], [-80.1, 7.6], [-80.35, 7.25], [-80.85, 7.22],
  [-81.0, 7.6], [-81.2, 7.9], [-81.6, 8.05], [-82.0, 8.15], [-82.3, 8.2], [-82.9, 8.03], [-82.85, 8.4], [-82.95, 8.9], [-82.75, 9.2], [-82.56, 9.57]];
const VISTAS = { ciudad: [-80.25, -79.15, 8.3, 9.45], pais: [-83.2, -77.1, 7.0, 9.8] };

export function mapa({ vista = 'ciudad', alto = 420, enlace = s => '#/s/' + s } = {}) {
  const [x0, x1, y0, y1] = VISTAS[vista]; const W = 1000, H = Math.round(W * (y1 - y0) / (x1 - x0) * 1.15);
  const P = ([lon, lat]) => [((lon - x0) / (x1 - x0)) * W, ((y1 - lat) / (y1 - y0)) * H];
  const costa = COSTA.map(P).map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
  const ts = S.tenants().filter(t => t.estado === 'activo');
  const vis = ts.map(t => { const [lat, lon] = S.geoDe(t); const [x, y] = P([lon, lat]); return { t, x, y }; }).filter(o => o.x > -20 && o.x < W + 20 && o.y > -20 && o.y < H + 20);
  const anclas = vis.map((o, i) => `<span class="manc" data-i="${i}" style="left:${o.x / W * 100}%;top:${o.y / H * 100}%;--c:${o.t.color}"></span>`).join('');
  const pins = vis.map((o, i) => { const t = o.t; const r = S.reviews(t.id); const pr = r.length ? (r.reduce((a, b) => a + b.estrellas, 0) / r.length).toFixed(1) : '—';
    return `<a class="mpin" data-p="${i}" href="${enlace(t.slug)}" style="--c:${t.color};--c2:${t.color2};--h:${34 + (i % 3) * 40}px"><span class="mpin-card">${t.logo ? `<i style="background:#fff url(${t.logo}) center/contain no-repeat"></i>` : `<i>${esc(ini(t.nombre))}</i>`}<span><b>${esc(t.nombre)}</b><small>★ ${pr} · ${esc(S.TIPOS[t.tipo] || '')}</small></span></span><span class="mpin-stem"></span></a>`; }).join('');
  const ciudades = [['Ciudad de Panamá', -79.52, 8.99], ['Coronado', -79.89, 8.53], ['Colón', -79.9, 9.36], ['David', -82.43, 8.43], ['Santiago', -80.98, 8.1], ['Chitré', -80.43, 7.96], ['La Chorrera', -79.78, 8.88], ['Bocas del Toro', -82.24, 9.34]].map(([n, lon, lat]) => { const [x, y] = P([lon, lat]); return x > 0 && x < W && y > 0 && y < H ? `<text x="${x}" y="${y + 26}" text-anchor="middle" class="mtxt">${n}</text><circle cx="${x}" cy="${y}" r="4" class="mcity"/>` : ''; }).join('');
  return `<div class="mapa3d" style="height:${alto}px"><div class="mplano" style="aspect-ratio:${W}/${H}">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="tierra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F3EFE8"/></linearGradient>
      <pattern id="rej" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(15,20,32,.05)"/></pattern><filter id="sombra"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0F1420" flood-opacity=".18"/></filter></defs>
      <rect width="${W}" height="${H}" fill="url(#rej)"/>
      <polygon points="${costa}" fill="url(#tierra)" stroke="color-mix(in srgb,var(--brand) 55%,#fff)" stroke-width="3" filter="url(#sombra)"/>
      <path d="${(() => { const a = P([-79.92, 9.36]), b = P([-79.6, 8.96]); return `M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2 + 30},${(a[1] + b[1]) / 2} ${b[0]},${b[1]}`; })()}" fill="none" stroke="#8EC9FF" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round" opacity=".9"><title>Canal de Panamá</title></path>
      ${ciudades}</svg>${anclas}</div><div class="mover">${pins}</div></div>`;
}

export const CSS_MAPA = `
.mapa3d{position:relative;perspective:1100px;overflow:hidden;border-radius:28px;background:radial-gradient(120% 90% at 50% 10%,#EAF4FF,#DCEBFA 55%,#CFE2F5);box-shadow:var(--sh)}
.mapa3d::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,transparent 70%,rgba(220,235,250,.9))}
.mplano{position:absolute;left:4%;right:4%;top:2%;transform-style:preserve-3d;transform:rotateX(48deg) rotateZ(-6deg) translateY(-6%);animation:mflot 9s ease-in-out infinite;transform-origin:50% 60%}
@keyframes mflot{50%{transform:rotateX(52deg) rotateZ(-3deg) translateY(-6%)}}
.mplano svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.mtxt{font:600 18px Poppins,sans-serif;fill:#5B6475}.mcity{fill:#0F1420;opacity:.35}
.manc{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:var(--c);box-shadow:0 0 0 6px color-mix(in srgb,var(--c) 25%,transparent);animation:mping 2.2s infinite}
@keyframes mping{50%{box-shadow:0 0 0 16px color-mix(in srgb,var(--c) 0%,transparent)}}
.mover{position:absolute;inset:0;pointer-events:none}
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
